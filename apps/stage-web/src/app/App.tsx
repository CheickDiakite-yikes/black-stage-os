import {
  createIdleIntentThread,
  stageShellScenarios,
  type AgentEvent,
  type ResearchEvent,
  type StageEvent,
  type StageObject,
  type StageShellScenario,
  type StageShellScenarioId,
  type TimedStageEvent
} from "@blackstage/stage-core";
import {
  createBuildBlackstageHarnessStageEvents,
  createSimulatedApprovalContinuation,
  createSimulatedStageRun
} from "@blackstage/agent-runtime";
import {
  approveMemoryRecord,
  createMemoryWriteDraft,
  deleteMemoryRecord,
  findMemoryRecordByText,
  rejectMemoryRecord,
  type MemoryVaultRecord
} from "@blackstage/memory-core";
import { stageTheme } from "@blackstage/stage-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { StageShell } from "../components/StageShell";
import { researchEventFromStageEvent } from "../instrumentation/researchLogger";
import {
  applyStageEventToThread,
  clearStageSession,
  createStageSession,
  loadStageSession,
  saveStageSession
} from "../state/stageSession";
import {
  artifactToMarkdown,
  artifactWithEditedText
} from "../state/artifactSerialization";

const idleThread = createIdleIntentThread();
const loadedSession = loadStageSession();

type StageCommandAction = "focus" | "pin" | "unpin" | "collapse" | "expand";

type StageCommand = {
  action: StageCommandAction;
  target: StageObject;
};

const commandFillerWords = new Set([
  "a",
  "an",
  "card",
  "me",
  "object",
  "please",
  "that",
  "the",
  "this",
  "to"
]);

const TEXT_CONTEXT_LIMIT = 720;
const MEMORY_COMMAND_PREFIX = "remember ";
const FORGET_COMMAND_PREFIXES = ["forget ", "delete memory "];

type BlackstageTestWindow = Window & {
  __blackstageTestDelayMultiplier?: number;
};

export function App() {
  const [sessionId, setSessionId] = useState(
    () => loadedSession?.sessionId ?? createStageSession().sessionId
  );
  const [thread, setThread] = useState(() => loadedSession?.currentThread ?? idleThread);
  const [activeScenario, setActiveScenario] = useState<StageShellScenario | undefined>(() =>
    loadedSession?.activeScenarioId
      ? stageShellScenarios.find((scenario) => scenario.id === loadedSession.activeScenarioId)
      : undefined
  );
  const [researchEvents, setResearchEvents] = useState<ResearchEvent[]>(
    () => loadedSession?.researchEvents ?? []
  );
  const [stageEvents, setStageEvents] = useState<StageEvent[]>(
    () => loadedSession?.stageEvents ?? []
  );
  const [memoryRecords, setMemoryRecords] = useState<MemoryVaultRecord[]>(
    () => loadedSession?.memoryRecords ?? []
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [pausedEvents, setPausedEvents] = useState<TimedStageEvent[]>([]);
  const [approvalExplanationVisible, setApprovalExplanationVisible] = useState(false);
  const [stageVoiceEnabled, setStageVoiceEnabled] = useState(false);
  const [assistantSpeechText, setAssistantSpeechText] = useState<string | undefined>();
  const activeRunStartedAtRef = useRef<number | undefined>(undefined);
  const activeTimedEventsRef = useRef<TimedStageEvent[]>([]);
  const timerRefs = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timerRefs.current.forEach((timer) => {
      clearTimeout(timer);
    });
    timerRefs.current = [];
  }, []);

  const emitStageEvent = useCallback(
    (stageEvent: StageEvent) => {
      setThread((currentThread) => applyStageEventToThread(currentThread, stageEvent));
      setStageEvents((currentEvents) => [...currentEvents, stageEvent]);

      const researchEvent = researchEventFromStageEvent(sessionId, stageEvent);

      if (researchEvent) {
        setResearchEvents((currentEvents) => [...currentEvents, researchEvent]);
      }
    },
    [sessionId]
  );

  const emitAssistantSpeech = useCallback(
    (
      text: string,
      options: {
        forceSpeak?: boolean;
        threadId?: string;
      } = {}
    ) => {
      const spokenAt = new Date().toISOString();

      setAssistantSpeechText(text);
      emitStageEvent({
        type: "assistant.speech",
        payload: {
          speechId: `speech_${Date.now().toString(36)}`,
          threadId: options.threadId ?? thread.id,
          text,
          spokenAt,
          source: "stage_status"
        }
      });

      if (stageVoiceEnabled || options.forceSpeak) {
        speakStageReply(text);
      }
    },
    [emitStageEvent, stageVoiceEnabled, thread.id]
  );

  const toggleStageVoice = useCallback(() => {
    if (stageVoiceEnabled) {
      cancelStageSpeech();
      setStageVoiceEnabled(false);
      setAssistantSpeechText("Stage voice muted.");
      return;
    }

    setStageVoiceEnabled(true);
    emitAssistantSpeech("Stage voice ready. I will speak only the key turns.", {
      forceSpeak: true
    });
  }, [emitAssistantSpeech, stageVoiceEnabled]);

  const scheduleTimedEvents = useCallback(
    (
      events: TimedStageEvent[],
      options: {
        scaleDelays?: boolean;
      } = {}
    ) => {
      const shouldScaleDelays = options.scaleDelays ?? true;
      const scaledEvents = shouldScaleDelays
        ? events.map((event) => ({
            ...event,
            delayMs: scaleStageEventDelay(event.delayMs)
          }))
        : events;

      clearTimers();
      activeRunStartedAtRef.current = performance.now();
      activeTimedEventsRef.current = scaledEvents;
      setPausedEvents([]);
      setIsRunning(true);

      scaledEvents.forEach((timedEvent) => {
        const timer = window.setTimeout(() => {
          emitStageEvent(timedEvent.event);
        }, timedEvent.delayMs);
        timerRefs.current.push(timer);
      });

      const finalDelay = Math.max(...scaledEvents.map((event) => event.delayMs), 0) + 180;
      const completionTimer = window.setTimeout(() => {
        activeRunStartedAtRef.current = undefined;
        activeTimedEventsRef.current = [];
        setIsRunning(false);
      }, finalDelay);
      timerRefs.current.push(completionTimer);
    },
    [clearTimers, emitStageEvent]
  );

  const applyStageCommand = useCallback(
    (intentText: string) => {
      const command = parseStageCommand(intentText, thread.renderObjects);

      if (!command) {
        return false;
      }

      const timestamp = new Date().toISOString();

      emitStageEvent({
        type: "user.intervention",
        payload: {
          interventionId: `intervention_stage_command_${Date.now().toString(36)}`,
          threadId: command.target.threadId,
          interventionType: "redirect",
          commandAction: command.action,
          commandText: intentText,
          targetObjectId: command.target.id,
          timestamp
        }
      });
      emitStageEvent({
        type: "object.updated",
        payload: {
          ...applyStageCommandToObject(command.target, command.action),
          updatedAt: timestamp
        }
      });

      return true;
    },
    [emitStageEvent, thread.renderObjects]
  );

  const requestMemoryWrite = useCallback(
    (intentText: string) => {
      const memoryText = parseMemoryWriteCommand(intentText);

      if (!memoryText) {
        return false;
      }

      const createdAt = new Date().toISOString();
      const draft = createMemoryWriteDraft({
        id: `memory_${Date.now().toString(36)}`,
        threadId: thread.id,
        summary: memoryText,
        createdAt
      });
      const nextRecords = [...memoryRecords, draft];

      setMemoryRecords(nextRecords);
      emitStageEvent({
        type: "object.created",
        payload: createMemoryVaultObject(thread.id, nextRecords, createdAt)
      });
      emitStageEvent({
        type: "approval.requested",
        payload: {
          id: `approval_memory_write_${draft.id}`,
          threadId: thread.id,
          actionType: "memory_write",
          title: "Save local memory",
          summary: draft.redactedSummary,
          riskLevel: "medium",
          proposedBy: "Blackstage memory vault",
          scope: "Local thread memory",
          consequence: "The redacted summary will persist in the local Stage Shell snapshot.",
          undoPath: "Use a forget command to request deletion.",
          status: "pending",
          createdAt
        }
      });

      return true;
    },
    [emitStageEvent, memoryRecords, thread.id]
  );

  const requestMemoryDelete = useCallback(
    (intentText: string) => {
      const targetText = parseMemoryDeleteCommand(intentText);

      if (!targetText) {
        return false;
      }

      const targetRecord = findMemoryRecordByText(memoryRecords, targetText);

      if (!targetRecord) {
        return false;
      }

      const createdAt = new Date().toISOString();

      emitStageEvent({
        type: "approval.requested",
        payload: {
          id: `approval_memory_delete_${targetRecord.id}`,
          threadId: thread.id,
          actionType: "memory_delete",
          title: "Delete local memory",
          summary: targetRecord.redactedSummary,
          riskLevel: "medium",
          proposedBy: "Blackstage memory vault",
          scope: "Local thread memory",
          consequence: "The memory record will be marked deleted in the local vault.",
          undoPath: "Re-submit the remembered fact if deletion was a mistake.",
          status: "pending",
          createdAt
        }
      });

      return true;
    },
    [emitStageEvent, memoryRecords, thread.id]
  );

  const runIntent = useCallback(
    (intentText: string, scenarioId?: StageShellScenarioId) => {
      if (!scenarioId && requestMemoryWrite(intentText)) {
        return;
      }

      if (!scenarioId && requestMemoryDelete(intentText)) {
        return;
      }

      if (!scenarioId && applyStageCommand(intentText)) {
        return;
      }

      const nextSessionId = sessionId || createStageSession().sessionId;
      const run = createSimulatedStageRun({
        intentText,
        scenarioId,
        sessionId: nextSessionId
      });

      setSessionId(nextSessionId);
      setThread(run.thread);
      setActiveScenario(run.scenario);
      setResearchEvents([]);
      setStageEvents([]);
      setIsReplaying(false);
      setApprovalExplanationVisible(false);
      scheduleTimedEvents(run.steps);

      if (stageVoiceEnabled) {
        emitAssistantSpeech("Intent received. I am shaping the stage.", {
          threadId: run.thread.id
        });
      }
    },
    [
      applyStageCommand,
      emitAssistantSpeech,
      requestMemoryDelete,
      requestMemoryWrite,
      scheduleTimedEvents,
      sessionId,
      stageVoiceEnabled
    ]
  );

  const approveCurrentRequest = useCallback(() => {
    const pendingApproval = thread.approvals
      .filter((candidate) => candidate.status === "pending")
      .at(-1);

    if (pendingApproval?.actionType === "memory_write") {
      const recordId = pendingApproval.id.replace("approval_memory_write_", "");
      const approvedAt = new Date().toISOString();
      const nextRecords = memoryRecords.map((record) =>
        record.id === recordId ? approveMemoryRecord(record, approvedAt) : record
      );

      setMemoryRecords(nextRecords);
      emitStageEvent({
        type: "approval.resolved",
        payload: {
          approvalId: pendingApproval.id,
          threadId: pendingApproval.threadId,
          status: "approved",
          resolvedAt: approvedAt,
          userRequestedExplanation: false
        }
      });
      emitStageEvent({
        type: "object.updated",
        payload: createMemoryVaultObject(pendingApproval.threadId, nextRecords, approvedAt)
      });
      setApprovalExplanationVisible(false);

      if (stageVoiceEnabled) {
        emitAssistantSpeech("Approved. I saved that memory locally.", {
          threadId: pendingApproval.threadId
        });
      }
      return;
    }

    if (pendingApproval?.actionType === "memory_delete") {
      const recordId = pendingApproval.id.replace("approval_memory_delete_", "");
      const deletedAt = new Date().toISOString();
      const nextRecords = memoryRecords.map((record) =>
        record.id === recordId ? deleteMemoryRecord(record, deletedAt) : record
      );

      setMemoryRecords(nextRecords);
      emitStageEvent({
        type: "approval.resolved",
        payload: {
          approvalId: pendingApproval.id,
          threadId: pendingApproval.threadId,
          status: "approved",
          resolvedAt: deletedAt,
          userRequestedExplanation: false
        }
      });
      emitStageEvent({
        type: "object.updated",
        payload: createMemoryVaultObject(pendingApproval.threadId, nextRecords, deletedAt)
      });
      setApprovalExplanationVisible(false);

      if (stageVoiceEnabled) {
        emitAssistantSpeech("Approved. I deleted that local memory.", {
          threadId: pendingApproval.threadId
        });
      }
      return;
    }

    if (!activeScenario) {
      return;
    }

    const [resolutionEvent, ...continuation] = createSimulatedApprovalContinuation(activeScenario);

    if (resolutionEvent) {
      emitStageEvent(resolutionEvent.event);
    }

    setApprovalExplanationVisible(false);
    scheduleTimedEvents(continuation);

    if (stageVoiceEnabled) {
      emitAssistantSpeech("Approved. I am creating the next objects and proof.", {
        threadId: activeScenario.threadId
      });
    }
  }, [
    activeScenario,
    emitAssistantSpeech,
    emitStageEvent,
    memoryRecords,
    scheduleTimedEvents,
    stageVoiceEnabled,
    thread.approvals
  ]);

  const rejectCurrentRequest = useCallback(() => {
    const approval = thread.approvals.filter((candidate) => candidate.status === "pending").at(-1);

    if (!approval) {
      return;
    }

    const rejectedAt = new Date().toISOString();

    emitStageEvent({
      type: "approval.resolved",
      payload: {
        approvalId: approval.id,
        threadId: approval.threadId,
        status: "rejected",
        resolvedAt: rejectedAt,
        userRequestedExplanation: false
      }
    });

    if (approval.actionType === "memory_write") {
      const recordId = approval.id.replace("approval_memory_write_", "");
      const nextRecords = memoryRecords.map((record) =>
        record.id === recordId ? rejectMemoryRecord(record, rejectedAt) : record
      );

      setMemoryRecords(nextRecords);
      emitStageEvent({
        type: "object.updated",
        payload: createMemoryVaultObject(approval.threadId, nextRecords, rejectedAt)
      });
    }

    if (stageVoiceEnabled) {
      emitAssistantSpeech("Rejected. I will hold that action.", {
        threadId: approval.threadId
      });
    }
  }, [emitAssistantSpeech, emitStageEvent, memoryRecords, stageVoiceEnabled, thread.approvals]);

  const askWhy = useCallback(() => {
    const approval = thread.approvals.find((candidate) => candidate.status === "pending");

    if (!approval) {
      return;
    }

    setApprovalExplanationVisible(true);
    emitStageEvent({
      type: "user.intervention",
      payload: {
        interventionId: `intervention_${approval.id}_${Date.now().toString(36)}`,
        threadId: approval.threadId,
        interventionType: "ask_why",
        targetObjectId: approval.id,
        timestamp: new Date().toISOString()
      }
    });
  }, [emitStageEvent, thread.approvals]);

  const stopAgentWork = useCallback(() => {
    const elapsedMs =
      activeRunStartedAtRef.current === undefined
        ? 0
        : performance.now() - activeRunStartedAtRef.current;
    const remainingEvents = activeTimedEventsRef.current
      .filter((timedEvent) => timedEvent.delayMs > elapsedMs)
      .map((timedEvent, index) => ({
        ...timedEvent,
        id: `${timedEvent.id}_resumable_${index}`,
        delayMs: Math.max(120, Math.round(timedEvent.delayMs - elapsedMs))
      }));

    clearTimers();
    activeRunStartedAtRef.current = undefined;
    activeTimedEventsRef.current = [];
    setPausedEvents(remainingEvents);
    setIsRunning(false);

    const stoppedAt = new Date().toISOString();
    const stoppedEvent: AgentEvent = {
      id: `agent_stop_${Date.now().toString(36)}`,
      threadId: thread.id,
      taskId: activeScenario ? `${activeScenario.id}_task` : undefined,
      agentName: "Blackstage simulated operator",
      type: "cancelled",
      summary: "Stopped by user.",
      details: "Pending simulated work was cancelled and the existing work trace was preserved.",
      timestamp: stoppedAt
    };

    emitStageEvent({
      type: "user.intervention",
      payload: {
        interventionId: `intervention_stop_${Date.now().toString(36)}`,
        threadId: thread.id,
        interventionType: "stop",
        timestamp: stoppedAt
      }
    });
    emitStageEvent({
      type: "agent.progress",
      payload: stoppedEvent
    });
    emitStageEvent({
      type: "thread.status_updated",
      payload: {
        threadId: thread.id,
        status: "paused",
        updatedAt: stoppedAt,
        reason: "user_stop"
      }
    });
  }, [activeScenario, clearTimers, emitStageEvent, thread.id]);

  const resumeAgentWork = useCallback(() => {
    if (pausedEvents.length === 0) {
      return;
    }

    const resumedAt = new Date().toISOString();
    const resumedEvent: AgentEvent = {
      id: `agent_resume_${Date.now().toString(36)}`,
      threadId: thread.id,
      taskId: activeScenario ? `${activeScenario.id}_task` : undefined,
      agentName: "Blackstage simulated operator",
      type: "started",
      summary: "Resumed by user.",
      details: "Pending simulated work is continuing from the preserved event queue.",
      timestamp: resumedAt
    };

    emitStageEvent({
      type: "user.intervention",
      payload: {
        interventionId: `intervention_resume_${Date.now().toString(36)}`,
        threadId: thread.id,
        interventionType: "resume",
        timestamp: resumedAt
      }
    });
    emitStageEvent({
      type: "thread.status_updated",
      payload: {
        threadId: thread.id,
        status: "active",
        updatedAt: resumedAt,
        reason: "user_resume"
      }
    });
    emitStageEvent({
      type: "agent.progress",
      payload: resumedEvent
    });
    scheduleTimedEvents(pausedEvents, {
      scaleDelays: false
    });
  }, [activeScenario, emitStageEvent, pausedEvents, scheduleTimedEvents, thread.id]);

  const startLocalHarnessRun = useCallback(() => {
    const startedAt = new Date().toISOString();
    const runId = Date.now().toString(36);

    scheduleTimedEvents(
      createBuildBlackstageHarnessStageEvents(
        thread.id,
        startedAt,
        120,
        `live_harness_${runId}`,
        "Live harness recorder"
      )
    );

    if (stageVoiceEnabled) {
      emitAssistantSpeech("Starting the local harness. No external systems are touched.", {
        threadId: thread.id
      });
    }
  }, [emitAssistantSpeech, scheduleTimedEvents, stageVoiceEnabled, thread.id]);

  const exportSession = useCallback(() => {
    const exportedAt = new Date().toISOString();
    const exportEvent: StageEvent = {
      type: "session.exported",
      payload: {
        sessionId,
        threadId: thread.id,
        exportedAt,
        eventCount: stageEvents.length + 1
      }
    };
    const nextStageEvents = [...stageEvents, exportEvent];
    const exportResearchEvent = researchEventFromStageEvent(sessionId, exportEvent);
    const nextResearchEvents = exportResearchEvent
      ? [...researchEvents, exportResearchEvent]
      : researchEvents;
    const snapshot = {
      sessionId,
      activeScenarioId: activeScenario?.id,
      currentThread: thread,
      stageEvents: nextStageEvents,
      researchEvents: nextResearchEvents,
      memoryRecords,
      exportedAt
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json"
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = `blackstage-stage-shell-${exportedAt.slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
    setStageEvents(nextStageEvents);
    setResearchEvents(nextResearchEvents);
  }, [activeScenario?.id, memoryRecords, researchEvents, sessionId, stageEvents, thread]);

  const updateStageObject = useCallback(
    (objectId: string, updater: (object: StageObject) => StageObject) => {
      const object = thread.renderObjects.find((candidate) => candidate.id === objectId);

      if (!object) {
        return;
      }

      emitStageEvent({
        type: "object.updated",
        payload: {
          ...updater(object),
          updatedAt: new Date().toISOString()
        }
      });
    },
    [emitStageEvent, thread.renderObjects]
  );

  const focusStageObject = useCallback(
    (objectId: string) => {
      updateStageObject(objectId, (object) => ({
        ...object,
        state: "focused"
      }));
    },
    [updateStageObject]
  );

  const toggleStageObjectPin = useCallback(
    (objectId: string) => {
      updateStageObject(objectId, (object) => ({
        ...object,
        pinned: !object.pinned
      }));
    },
    [updateStageObject]
  );

  const toggleStageObjectCollapse = useCallback(
    (objectId: string) => {
      updateStageObject(objectId, (object) => ({
        ...object,
        state: object.state === "collapsed" ? "expanded" : "collapsed"
      }));
    },
    [updateStageObject]
  );

  const moveStageObject = useCallback(
    (
      objectId: string,
      position: {
        x: number;
        y: number;
        z?: number;
      }
    ) => {
      updateStageObject(objectId, (object) => ({
        ...object,
        position
      }));
    },
    [updateStageObject]
  );

  const saveArtifactRevision = useCallback(
    (artifactId: string, body: string) => {
      const artifact = thread.artifacts.find((candidate) => candidate.id === artifactId);

      if (!artifact) {
        return;
      }

      emitStageEvent({
        type: "artifact.updated",
        payload: artifactWithEditedText(artifact, body)
      });
    },
    [emitStageEvent, thread.artifacts]
  );

  const approveArtifact = useCallback(
    (artifactId: string) => {
      const artifact = thread.artifacts.find((candidate) => candidate.id === artifactId);

      if (!artifact) {
        return;
      }

      const approvedAt = new Date().toISOString();

      emitStageEvent({
        type: "artifact.updated",
        payload: {
          ...artifact,
          status: "approved",
          updatedAt: approvedAt,
          provenance: [
            ...artifact.provenance,
            {
              id: `artifact_approval_${Date.now().toString(36)}`,
              label: "Human artifact approval",
              sourceType: "user_note"
            }
          ]
        }
      });
    },
    [emitStageEvent, thread.artifacts]
  );

  const exportArtifact = useCallback(
    (artifactId: string) => {
      const artifact = thread.artifacts.find((candidate) => candidate.id === artifactId);

      if (!artifact) {
        return;
      }

      const exportedAt = new Date().toISOString();
      const blob = new Blob([artifactToMarkdown(artifact)], {
        type: "text/markdown"
      });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = objectUrl;
      anchor.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);

      emitStageEvent({
        type: "artifact.exported",
        payload: {
          artifactId: artifact.id,
          threadId: artifact.threadId,
          exportedAt,
          format: "markdown",
          title: artifact.title
        }
      });
    },
    [emitStageEvent, thread.artifacts]
  );

  const attachContext = useCallback(
    async (file: File) => {
      const attachedAt = new Date().toISOString();
      const attachmentId = `context_${Date.now().toString(36)}`;
      const modality = readContextModality(file);
      const excerpt = await readContextExcerpt(file);
      const documentObject: StageObject = {
        id: `${attachmentId}_document`,
        threadId: thread.id,
        type: "document_portal",
        title: `Context: ${file.name}`,
        summary: "Local context attached to the current stage without upload.",
        payload: {
          documentTitle: file.name,
          status: "local",
          modality,
          sections: [
            {
              label: "File",
              value: file.name
            },
            {
              label: "Type",
              value: file.type || "unknown"
            },
            {
              label: "Boundary",
              value: "Local-only context object. No external upload."
            },
            ...(excerpt
              ? [
                  {
                    label: "Excerpt",
                    value: excerpt
                  }
                ]
              : [])
          ]
        },
        position: {
          x: (thread.renderObjects.length % 3) * 34,
          y: Math.floor(thread.renderObjects.length / 3) * 28,
          z: thread.renderObjects.length
        },
        state: "focused",
        pinned: true,
        createdAt: attachedAt,
        updatedAt: attachedAt
      };

      emitStageEvent({
        type: "object.created",
        payload: documentObject
      });
      emitStageEvent({
        type: "context.attached",
        payload: {
          attachmentId,
          threadId: thread.id,
          fileName: file.name,
          mimeType: file.type || "unknown",
          fileSize: file.size,
          modality,
          attachedAt,
          localOnly: true
        }
      });
    },
    [emitStageEvent, thread.id, thread.renderObjects.length]
  );

  const replayStageEvents = useCallback(() => {
    if (stageEvents.length === 0) {
      return;
    }

    const eventsToReplay = [...stageEvents];

    clearTimers();
    setIsRunning(false);
    setPausedEvents([]);
    setApprovalExplanationVisible(false);
    setIsReplaying(true);
    setThread(createIdleIntentThread());

    eventsToReplay.forEach((stageEvent, index) => {
      const timer = window.setTimeout(() => {
        setThread((currentThread) => applyStageEventToThread(currentThread, stageEvent));
      }, 120 + index * 110);
      timerRefs.current.push(timer);
    });

    const completionTimer = window.setTimeout(() => {
      setIsReplaying(false);
      timerRefs.current = [];
    }, 180 + eventsToReplay.length * 110);
    timerRefs.current.push(completionTimer);
  }, [clearTimers, stageEvents]);

  const resetSession = useCallback(() => {
    clearTimers();
    clearStageSession();
    const nextSession = createStageSession();

    setSessionId(nextSession.sessionId);
    setThread(createIdleIntentThread());
    setActiveScenario(undefined);
    setResearchEvents([]);
    setStageEvents([]);
    setMemoryRecords([]);
    setPausedEvents([]);
    setIsRunning(false);
    setIsReplaying(false);
    setApprovalExplanationVisible(false);
    setAssistantSpeechText(undefined);
    cancelStageSpeech();
  }, [clearTimers]);

  useEffect(() => {
    saveStageSession({
      sessionId,
      activeScenarioId: activeScenario?.id,
      currentThread: thread,
      stageEvents,
      researchEvents,
      memoryRecords,
      savedAt: new Date().toISOString()
    });
  }, [activeScenario?.id, memoryRecords, researchEvents, sessionId, stageEvents, thread]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <StageShell
      accentColor={stageTheme.accent}
      activeScenario={activeScenario}
      approvalExplanationVisible={approvalExplanationVisible}
      assistantSpeechText={assistantSpeechText}
      isReplaying={isReplaying}
      isRunning={isRunning}
      researchEvents={researchEvents}
      scenarios={stageShellScenarios}
      stageVoiceEnabled={stageVoiceEnabled}
      stageEventCount={stageEvents.length}
      thread={thread}
      onApprove={approveCurrentRequest}
      onAskWhy={askWhy}
      onAttachContext={attachContext}
      onExport={exportSession}
      onReject={rejectCurrentRequest}
      onReset={resetSession}
      onApproveArtifact={approveArtifact}
      onCollapseObject={toggleStageObjectCollapse}
      onExportArtifact={exportArtifact}
      onFocusObject={focusStageObject}
      onMoveObject={moveStageObject}
      onPinObject={toggleStageObjectPin}
      onReplayTrace={replayStageEvents}
      onResumeAgent={resumeAgentWork}
      onSaveArtifact={saveArtifactRevision}
      onStartHarness={startLocalHarnessRun}
      onStopAgent={stopAgentWork}
      onSubmitIntent={runIntent}
      onToggleStageVoice={toggleStageVoice}
      resumableEventCount={pausedEvents.length}
    />
  );
}

function parseMemoryWriteCommand(intentText: string): string | undefined {
  const normalizedIntent = intentText.trim();

  if (!normalizedIntent.toLowerCase().startsWith(MEMORY_COMMAND_PREFIX)) {
    return undefined;
  }

  const memoryText = normalizedIntent.slice(MEMORY_COMMAND_PREFIX.length).trim();

  return memoryText.length > 0 ? memoryText : undefined;
}

function parseMemoryDeleteCommand(intentText: string): string | undefined {
  const normalizedIntent = intentText.trim();
  const lowerIntent = normalizedIntent.toLowerCase();
  const prefix = FORGET_COMMAND_PREFIXES.find((candidate) => lowerIntent.startsWith(candidate));

  if (!prefix) {
    return undefined;
  }

  const targetText = normalizedIntent.slice(prefix.length).trim();

  return targetText.length > 0 ? targetText : undefined;
}

function createMemoryVaultObject(
  threadId: string,
  records: MemoryVaultRecord[],
  timestamp: string
): StageObject {
  const visibleRecords = records.filter((record) => record.threadId === threadId);
  const approvedCount = visibleRecords.filter((record) => record.status === "approved").length;
  const proposedCount = visibleRecords.filter((record) => record.status === "proposed").length;
  const deletedCount = visibleRecords.filter((record) => record.status === "deleted").length;

  return {
    id: "local_memory_vault",
    threadId,
    type: "memory_card",
    title: "Local memory vault",
    summary: "Inspectable local memory records with approval-gated writes and deletion.",
    payload: {
      policy: "approval-gated local memory",
      status: "private",
      approvedCount,
      proposedCount,
      deletedCount,
      records: visibleRecords.map((record) => ({
        id: record.id,
        status: record.status,
        scope: record.scope,
        summary: record.redactedSummary,
        updatedAt: record.updatedAt
      })),
      notes: [
        "Memory writes require approval.",
        "Memory deletes require approval.",
        "Inspection uses redacted summaries."
      ]
    },
    position: {
      x: 64,
      y: 28,
      z: 18
    },
    state: "focused",
    pinned: true,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function parseStageCommand(intentText: string, objects: StageObject[]): StageCommand | undefined {
  if (objects.length === 0) {
    return undefined;
  }

  const words = normalizeCommandText(intentText).split(" ").filter(Boolean);
  const firstWord = words[0];
  const action = commandActionFromWord(firstWord);

  if (!action) {
    return undefined;
  }

  const targetWords = words
    .slice(firstWord === "show" && words[1] === "me" ? 2 : 1)
    .filter((word) => !commandFillerWords.has(word));
  const targetText = targetWords.join(" ");
  const target = findStageCommandTarget(objects, targetText);

  if (!target) {
    return undefined;
  }

  return {
    action,
    target
  };
}

function commandActionFromWord(word: string | undefined): StageCommandAction | undefined {
  switch (word) {
    case "focus":
    case "zoom":
      return "focus";
    case "pin":
      return "pin";
    case "unpin":
      return "unpin";
    case "collapse":
    case "hide":
      return "collapse";
    case "expand":
    case "open":
    case "show":
      return "expand";
    default:
      return undefined;
  }
}

function findStageCommandTarget(objects: StageObject[], targetText: string): StageObject | undefined {
  if (!targetText || targetText === "current") {
    return objects.find((object) => object.state === "focused") ?? objects.at(0);
  }

  let bestMatch:
    | {
        object: StageObject;
        score: number;
      }
    | undefined;

  for (const object of objects) {
    const score = scoreObjectTargetMatch(object, targetText);

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        object,
        score
      };
    }
  }

  return bestMatch && bestMatch.score > 0 ? bestMatch.object : undefined;
}

function scoreObjectTargetMatch(object: StageObject, targetText: string): number {
  const normalizedTitle = normalizeCommandText(object.title);
  const aliases = getStageObjectAliases(object).map(normalizeCommandText);
  const haystack = [normalizedTitle, object.type.replace(/_/g, " "), ...aliases].join(" ");

  if (normalizedTitle === targetText || aliases.includes(targetText)) {
    return 4;
  }

  if (normalizedTitle.includes(targetText) || targetText.includes(normalizedTitle)) {
    return 3;
  }

  if (aliases.some((alias) => alias.includes(targetText) || targetText.includes(alias))) {
    return 2;
  }

  const targetParts = targetText.split(" ").filter((part) => part.length > 2);

  return targetParts.length > 0 && targetParts.every((part) => haystack.includes(part)) ? 1 : 0;
}

function getStageObjectAliases(object: StageObject): string[] {
  switch (object.type) {
    case "browser_portal":
      return ["browser", "portal", "validation browser"];
    case "document_portal":
      return ["document", "spec", "spec portal"];
    case "map_portal":
      return ["map", "object map", "market map", "investor map"];
    case "memory_card":
      return ["memory", "memory boundary", "privacy"];
    case "model_card":
      return ["model", "working model", "interface model", "valuation model"];
    case "plan_card":
      return ["plan", "roadmap"];
    case "research_note":
      return ["research", "research note"];
    case "simulation_card":
      return ["simulation", "simulator", "demo simulator"];
    case "codex_task_card":
      return ["task", "codex task", "prompt"];
    case "intent_card":
      return ["intent"];
    case "risk_matrix":
      return ["risk", "risks"];
    case "timeline":
      return ["timeline", "cadence"];
    case "artifact_card":
      return ["artifact"];
    case "agent_feed":
      return ["agent", "labor"];
    default:
      return [object.type.replace(/_/g, " ")];
  }
}

function applyStageCommandToObject(object: StageObject, action: StageCommandAction): StageObject {
  switch (action) {
    case "focus":
      return {
        ...object,
        state: "focused"
      };
    case "pin":
      return {
        ...object,
        pinned: true
      };
    case "unpin":
      return {
        ...object,
        pinned: false
      };
    case "collapse":
      return {
        ...object,
        state: "collapsed"
      };
    case "expand":
      return {
        ...object,
        state: "expanded"
      };
  }
}

function readContextModality(file: File): "text" | "image" | "file" {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (isTextContext(file)) {
    return "text";
  }

  return "file";
}

async function readContextExcerpt(file: File): Promise<string | undefined> {
  if (!isTextContext(file) || file.size > 1_000_000) {
    return undefined;
  }

  try {
    const text = await file.text();
    const normalized = text.trim().replace(/\s+/g, " ");

    return normalized.length > TEXT_CONTEXT_LIMIT
      ? `${normalized.slice(0, TEXT_CONTEXT_LIMIT)}...`
      : normalized;
  } catch {
    return undefined;
  }
}

function isTextContext(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase();

  return (
    file.type.startsWith("text/") ||
    file.type === "application/json" ||
    extension === "md" ||
    extension === "txt" ||
    extension === "csv" ||
    extension === "json"
  );
}

function speakStageReply(text: string): void {
  if (
    typeof window === "undefined" ||
    !window.speechSynthesis ||
    typeof window.SpeechSynthesisUtterance === "undefined"
  ) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new window.SpeechSynthesisUtterance(text);

  utterance.rate = 0.92;
  utterance.pitch = 0.86;
  utterance.volume = 0.82;
  window.speechSynthesis.speak(utterance);
}

function cancelStageSpeech(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function normalizeCommandText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scaleStageEventDelay(delayMs: number): number {
  const multiplier = (window as BlackstageTestWindow).__blackstageTestDelayMultiplier;

  if (!multiplier || multiplier <= 0 || !Number.isFinite(multiplier)) {
    return delayMs;
  }

  return Math.round(delayMs * multiplier);
}
