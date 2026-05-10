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
  const [isRunning, setIsRunning] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [pausedEvents, setPausedEvents] = useState<TimedStageEvent[]>([]);
  const [approvalExplanationVisible, setApprovalExplanationVisible] = useState(false);
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

  const runIntent = useCallback(
    (intentText: string, scenarioId?: StageShellScenarioId) => {
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
    },
    [applyStageCommand, scheduleTimedEvents, sessionId]
  );

  const approveCurrentRequest = useCallback(() => {
    if (!activeScenario) {
      return;
    }

    const [resolutionEvent, ...continuation] = createSimulatedApprovalContinuation(activeScenario);

    if (resolutionEvent) {
      emitStageEvent(resolutionEvent.event);
    }

    setApprovalExplanationVisible(false);
    scheduleTimedEvents(continuation);
  }, [activeScenario, emitStageEvent, scheduleTimedEvents]);

  const rejectCurrentRequest = useCallback(() => {
    const approval = thread.approvals.find((candidate) => candidate.status === "pending");

    if (!approval) {
      return;
    }

    emitStageEvent({
      type: "approval.resolved",
      payload: {
        approvalId: approval.id,
        threadId: approval.threadId,
        status: "rejected",
        resolvedAt: new Date().toISOString(),
        userRequestedExplanation: false
      }
    });
  }, [emitStageEvent, thread.approvals]);

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
  }, [scheduleTimedEvents, thread.id]);

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
  }, [activeScenario?.id, researchEvents, sessionId, stageEvents, thread]);

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
    setPausedEvents([]);
    setIsRunning(false);
    setIsReplaying(false);
    setApprovalExplanationVisible(false);
  }, [clearTimers]);

  useEffect(() => {
    saveStageSession({
      sessionId,
      activeScenarioId: activeScenario?.id,
      currentThread: thread,
      stageEvents,
      researchEvents,
      savedAt: new Date().toISOString()
    });
  }, [activeScenario?.id, researchEvents, sessionId, stageEvents, thread]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <StageShell
      accentColor={stageTheme.accent}
      activeScenario={activeScenario}
      approvalExplanationVisible={approvalExplanationVisible}
      isReplaying={isReplaying}
      isRunning={isRunning}
      researchEvents={researchEvents}
      scenarios={stageShellScenarios}
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
      resumableEventCount={pausedEvents.length}
    />
  );
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
