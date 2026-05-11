import {
  createIdleIntentThread,
  stageShellScenarios,
  type AgentEvent,
  type ApprovalRequest,
  type Artifact,
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
  rankMemoryRecords,
  type RankedMemoryResult,
  rejectMemoryRecord,
  type MemoryVaultRecord
} from "@blackstage/memory-core";
import { stageTheme } from "@blackstage/stage-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { StageShell } from "../components/StageShell";
import { researchEventFromStageEvent } from "../instrumentation/researchLogger";
import {
  checkStageWebRealtimeBrokerProofs,
  checkStageWebRealtimeBrokerReadiness,
  createDefaultStageWebBrokerReadiness,
  createDefaultStageWebRealtimeBrokerProofs,
  createStageWebBrokerCheckingReadiness,
  createStageWebRealtimeBrokerProofsChecking,
  resolveStageWebRealtimeBrokerRouteUrl
} from "../voice/realtimeBrokerReadiness";
import {
  createDefaultStageWebRealtimeBridgeState,
  createStageWebRealtimeBridgeConnectingState,
  readStageWebRealtimeApprovalPhrase,
  shouldStartStageWebRealtimeBridge,
  startStageWebRealtimeBridge
} from "../voice/realtimeWebrtcBridge";
import {
  checkStageWebRealtimeMicPreflight,
  createDefaultStageWebRealtimeMicPreflight
} from "../voice/realtimeMicPreflight";
import {
  checkStageWebHarnessRunnerProofs,
  checkStageWebHarnessRunnerSnapshot,
  checkStageWebHarnessRunnerReadiness,
  createDefaultStageWebHarnessProofs,
  createDefaultStageWebHarnessReadiness,
  createDefaultStageWebHarnessSnapshot,
  createStageWebHarnessProofsChecking,
  createStageWebHarnessSnapshotChecking,
  createStageWebHarnessCheckingReadiness,
  resolveStageWebHarnessRunnerRouteUrl
} from "../harness/harnessRunnerReadiness";
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

type StageCommandAction =
  | "focus"
  | "pin"
  | "unpin"
  | "collapse"
  | "expand"
  | "rename"
  | "set_url"
  | "set_map"
  | "set_model"
  | "run_simulation"
  | "annotate_object"
  | "update_summary"
  | "add_document_note"
  | "add_timeline_milestone";
type IntentSubmissionSource = "scenario" | "text" | "voice";

type StageCommand = {
  action: StageCommandAction;
  target: StageObject;
  value?: string;
  field?: string;
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
const RECALL_COMMAND_PREFIXES = ["recall ", "search memory ", "find memory "];
const REVIEW_MEMORY_COMMANDS = new Set([
  "review memory",
  "review memories",
  "show memory review",
  "show memories"
]);
const ARTIFACT_REVISION_PREFIXES = [
  "revise artifact to ",
  "update artifact to ",
  "replace artifact with ",
  "edit artifact to "
];
const REALTIME_LIVE_APPROVAL_PREFIX = "approval_realtime_live_";

type BlackstageTestWindow = Window & {
  __blackstageTestDelayMultiplier?: number;
};

export function App() {
  const [sessionId, setSessionId] = useState(
    () => loadedSession?.sessionId ?? createStageSession().sessionId
  );
  const [thread, setThread] = useState(
    () => loadedSession?.currentThread ?? idleThread
  );
  const [activeScenario, setActiveScenario] = useState<StageShellScenario | undefined>(
    () =>
      loadedSession?.activeScenarioId
        ? stageShellScenarios.find(
            (scenario) => scenario.id === loadedSession.activeScenarioId
          )
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
  const [realtimeBrokerReadiness, setRealtimeBrokerReadiness] = useState(
    createDefaultStageWebBrokerReadiness
  );
  const [realtimeBrokerProofs, setRealtimeBrokerProofs] = useState(
    createDefaultStageWebRealtimeBrokerProofs
  );
  const [realtimeBridge, setRealtimeBridge] = useState(
    createDefaultStageWebRealtimeBridgeState
  );
  const [realtimeMicPreflight, setRealtimeMicPreflight] = useState(
    createDefaultStageWebRealtimeMicPreflight
  );
  const [realtimeMicGestureObserved, setRealtimeMicGestureObserved] = useState(false);
  const [harnessRunnerReadiness, setHarnessRunnerReadiness] = useState(
    createDefaultStageWebHarnessReadiness
  );
  const [harnessRunnerSnapshot, setHarnessRunnerSnapshot] = useState(
    createDefaultStageWebHarnessSnapshot
  );
  const [harnessRunnerProofs, setHarnessRunnerProofs] = useState(
    createDefaultStageWebHarnessProofs
  );
  const activeRunStartedAtRef = useRef<number | undefined>(undefined);
  const activeTimedEventsRef = useRef<TimedStageEvent[]>([]);
  const realtimeBridgeStartedRef = useRef(false);
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

  const requestRealtimeArm = useCallback(() => {
    const timestamp = new Date().toISOString();
    const routeUrl =
      realtimeBrokerReadiness.status === "reachable"
        ? realtimeBrokerReadiness.routeUrl
        : undefined;
    const hasPendingRealtimeApproval = thread.approvals.some(
      isRealtimeLiveApprovalPending
    );

    setRealtimeMicGestureObserved(true);

    if (
      hasPendingRealtimeApproval ||
      realtimeBridge.status === "connecting" ||
      realtimeBridge.status === "connected"
    ) {
      return;
    }

    if (
      realtimeBrokerReadiness.status !== "reachable" ||
      realtimeBrokerReadiness.liveModeEnabled !== true ||
      realtimeBrokerReadiness.liveApprovalConfigured !== true ||
      !routeUrl
    ) {
      emitStageEvent({
        type: "agent.progress",
        payload: {
          id: `realtime_arm_blocked_${Date.now().toString(36)}`,
          threadId: thread.id,
          taskId: "realtime_sdp_bridge",
          agentName: "Realtime voice broker",
          type: "blocked",
          summary: "Realtime live edge is not ready to arm.",
          details:
            "The local broker must be reachable in live mode before Stage Web can request a session.",
          timestamp
        }
      });
      return;
    }

    if (!readStageWebRealtimeApprovalPhrase()) {
      emitStageEvent({
        type: "agent.progress",
        payload: {
          id: `realtime_arm_locked_${Date.now().toString(36)}`,
          threadId: thread.id,
          taskId: "realtime_sdp_bridge",
          agentName: "Realtime voice broker",
          type: "blocked",
          summary: "Realtime live edge is locked.",
          details:
            "Stage Web needs a local approval phrase before opening the SDP bridge.",
          timestamp
        }
      });
      return;
    }

    emitStageEvent({
      type: "approval.requested",
      payload: {
        id: `${REALTIME_LIVE_APPROVAL_PREFIX}${Date.now().toString(36)}`,
        threadId: thread.id,
        actionType: "network_access",
        title: "Open live Realtime voice edge",
        summary:
          "Open a server-mediated Realtime SDP exchange for this local stage session.",
        riskLevel: "high",
        proposedBy: "Stage Web",
        scope: routeUrl,
        consequence:
          "The browser will exchange SDP with the local broker; the broker may open a live Realtime session using its server-side OpenAI key.",
        undoPath:
          "Mute Stage voice or reset the session; no browser API key is stored.",
        status: "pending",
        createdAt: timestamp
      }
    });
  }, [
    emitStageEvent,
    realtimeBridge.status,
    realtimeBrokerReadiness,
    thread.approvals,
    thread.id
  ]);

  const startApprovedRealtimeBridge = useCallback(
    (threadId: string) => {
      const readiness = realtimeBrokerReadiness;

      if (
        !shouldStartStageWebRealtimeBridge(readiness, true) ||
        realtimeBridgeStartedRef.current
      ) {
        return;
      }

      realtimeBridgeStartedRef.current = true;

      if (readiness.routeUrl) {
        setRealtimeBridge(
          createStageWebRealtimeBridgeConnectingState(readiness.routeUrl)
        );
      }

      void startStageWebRealtimeBridge({
        readiness,
        threadId,
        sessionId,
        enabled: true,
        approvalPhrase: readStageWebRealtimeApprovalPhrase(),
        emitStageEvents: (events) => {
          events.forEach((event) => {
            emitStageEvent(event);
          });
        }
      }).then((bridge) => {
        setRealtimeBridge(bridge.state);
        bridge.stageEvents.forEach((event) => {
          emitStageEvent(event);
        });

        if (bridge.state.status !== "connected") {
          realtimeBridgeStartedRef.current = false;
        }
      });
    },
    [emitStageEvent, realtimeBrokerReadiness, sessionId]
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

      const finalDelay =
        Math.max(...scaledEvents.map((event) => event.delayMs), 0) + 180;
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
    (intentText: string, source: IntentSubmissionSource = "text") => {
      const command = parseStageCommand(intentText, thread.renderObjects);

      if (!command) {
        return undefined;
      }

      const timestamp = new Date().toISOString();

      emitStageEvent({
        type: "user.intervention",
        payload: {
          interventionId: `intervention_stage_command_${Date.now().toString(36)}`,
          threadId: command.target.threadId,
          interventionType: "redirect",
          commandAction: command.action,
          commandValue: formatStageCommandValue(command),
          commandInputMode: source === "voice" ? "voice" : "text",
          commandText: intentText,
          targetObjectId: command.target.id,
          timestamp
        }
      });
      emitStageEvent({
        type: "object.updated",
        payload: {
          ...applyStageCommandToObject(command.target, command),
          updatedAt: timestamp
        }
      });

      return command;
    },
    [emitStageEvent, thread.renderObjects]
  );

  const applyUndoLastObjectUpdate = useCallback(
    (intentText: string, source: IntentSubmissionSource = "text") => {
      if (!parseUndoLastObjectCommand(intentText)) {
        return undefined;
      }

      const undo = findLastObjectUpdateUndo(stageEvents);

      if (!undo) {
        return undefined;
      }

      const timestamp = new Date().toISOString();

      emitStageEvent({
        type: "user.intervention",
        payload: {
          interventionId: `intervention_object_undo_${Date.now().toString(36)}`,
          threadId: undo.previous.threadId,
          interventionType: "undo",
          commandAction: "undo_object",
          commandValue: undo.current.title,
          commandInputMode: source === "voice" ? "voice" : "text",
          commandText: intentText,
          targetObjectId: undo.previous.id,
          timestamp
        }
      });
      emitStageEvent({
        type: "object.updated",
        payload: {
          ...undo.previous,
          updatedAt: timestamp
        }
      });

      return undo.previous;
    },
    [emitStageEvent, stageEvents]
  );

  const applyArtifactRevisionCommand = useCallback(
    (intentText: string, source: IntentSubmissionSource = "text") => {
      const revisionText = parseArtifactRevisionCommand(intentText);
      const artifact = thread.artifacts.at(-1);

      if (!revisionText || !artifact) {
        return undefined;
      }

      const timestamp = new Date().toISOString();

      emitStageEvent({
        type: "user.intervention",
        payload: {
          interventionId: `intervention_artifact_revision_${Date.now().toString(36)}`,
          threadId: artifact.threadId,
          interventionType: "edit",
          commandInputMode: source === "voice" ? "voice" : "text",
          commandText: intentText,
          targetObjectId: artifact.id,
          timestamp
        }
      });
      emitStageEvent({
        type: "artifact.updated",
        payload: artifactWithEditedText(artifact, revisionText)
      });

      return artifact;
    },
    [emitStageEvent, thread.artifacts]
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
          consequence:
            "The redacted summary will persist in the local Stage Shell snapshot.",
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
          threadId: targetRecord.threadId,
          actionType: "memory_delete",
          title: "Delete local memory",
          summary: targetRecord.redactedSummary,
          riskLevel: "medium",
          proposedBy: "Blackstage memory vault",
          scope: `Local thread memory (${targetRecord.threadId})`,
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

  const requestMemoryRecall = useCallback(
    (intentText: string) => {
      const queryText = parseMemoryRecallCommand(intentText);

      if (!queryText) {
        return false;
      }

      const recalledAt = new Date().toISOString();
      const rankedResults = rankMemoryRecords(memoryRecords, {
        threadId: thread.id,
        text: queryText,
        limit: 5
      });

      emitStageEvent({
        type: "object.created",
        payload: createMemoryVaultObject(thread.id, memoryRecords, recalledAt, {
          query: queryText,
          results: rankedResults
        })
      });
      emitStageEvent({
        type: "agent.progress",
        payload: {
          id: `memory_recall_${Date.now().toString(36)}`,
          threadId: thread.id,
          agentName: "Local memory vault",
          type: "completed",
          summary:
            rankedResults.length > 0
              ? `Recalled ${rankedResults.length} local memory match.`
              : "No approved local memory matched.",
          details: "Recall inspects redacted approved memory records only.",
          timestamp: recalledAt
        }
      });

      if (stageVoiceEnabled) {
        emitAssistantSpeech(
          rankedResults.length > 0
            ? "I found matching approved local memory."
            : "I found no approved local memory for that.",
          {
            threadId: thread.id
          }
        );
      }

      return true;
    },
    [emitAssistantSpeech, emitStageEvent, memoryRecords, stageVoiceEnabled, thread.id]
  );

  const requestMemoryReview = useCallback(
    (intentText: string) => {
      if (!parseMemoryReviewCommand(intentText)) {
        return false;
      }

      const reviewedAt = new Date().toISOString();
      const approvedRecords = memoryRecords.filter(
        (record) => record.status === "approved"
      );

      emitStageEvent({
        type: "object.created",
        payload: createMemoryVaultObject(thread.id, memoryRecords, reviewedAt, {
          review: {
            records: approvedRecords
          }
        })
      });
      emitStageEvent({
        type: "agent.progress",
        payload: {
          id: `memory_review_${Date.now().toString(36)}`,
          threadId: thread.id,
          agentName: "Local memory vault",
          type: "completed",
          summary:
            approvedRecords.length > 0
              ? `Reviewed ${approvedRecords.length} approved local memories.`
              : "No approved local memories to review.",
          details: "Cross-thread review shows redacted approved memory records only.",
          timestamp: reviewedAt
        }
      });

      return true;
    },
    [emitStageEvent, memoryRecords, thread.id]
  );

  const startLocalHarnessRun = useCallback(
    (
      options: {
        source?: IntentSubmissionSource;
        commandText?: string;
      } = {}
    ) => {
      const startedAt = new Date().toISOString();
      const runId = Date.now().toString(36);
      const source = options.source ?? "text";

      emitStageEvent({
        type: "user.intervention",
        payload: {
          interventionId: `intervention_harness_run_${runId}`,
          threadId: thread.id,
          interventionType: "redirect",
          commandAction: "run_harness",
          commandValue: "local_harness",
          commandText: options.commandText ?? "Run harness",
          commandInputMode: source === "voice" ? "voice" : "text",
          timestamp: startedAt
        }
      });
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
        emitAssistantSpeech(
          "Starting the local harness. No external systems are touched.",
          {
            threadId: thread.id
          }
        );
      }
    },
    [
      emitAssistantSpeech,
      emitStageEvent,
      scheduleTimedEvents,
      stageVoiceEnabled,
      thread.id
    ]
  );

  const runIntent = useCallback(
    (
      intentText: string,
      scenarioId?: StageShellScenarioId,
      options: {
        source?: IntentSubmissionSource;
      } = {}
    ) => {
      const source = options.source ?? (scenarioId ? "scenario" : "text");

      if (!scenarioId && parseRunHarnessCommand(intentText)) {
        startLocalHarnessRun({
          source,
          commandText: intentText
        });
        return;
      }

      if (!scenarioId && requestMemoryWrite(intentText)) {
        return;
      }

      if (!scenarioId && requestMemoryDelete(intentText)) {
        return;
      }

      if (!scenarioId && requestMemoryRecall(intentText)) {
        return;
      }

      if (!scenarioId && requestMemoryReview(intentText)) {
        return;
      }

      const undoneObject = !scenarioId
        ? applyUndoLastObjectUpdate(intentText, source)
        : undefined;

      if (undoneObject) {
        emitAssistantSpeech(`Reverted ${undoneObject.title}.`, {
          threadId: undoneObject.threadId
        });
        return;
      }

      const revisedArtifact = !scenarioId
        ? applyArtifactRevisionCommand(intentText, source)
        : undefined;

      if (revisedArtifact) {
        emitAssistantSpeech(`Updated ${revisedArtifact.title}.`, {
          threadId: revisedArtifact.threadId
        });
        return;
      }

      const appliedCommand = !scenarioId
        ? applyStageCommand(intentText, source)
        : undefined;

      if (appliedCommand) {
        emitAssistantSpeech(formatStageCommandConfirmation(appliedCommand), {
          threadId: appliedCommand.target.threadId
        });
        return;
      }

      const nextSessionId = sessionId || createStageSession().sessionId;
      const run = createSimulatedStageRun({
        intentText,
        inputMode: source === "voice" ? "voice" : "text",
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
      applyArtifactRevisionCommand,
      applyUndoLastObjectUpdate,
      emitAssistantSpeech,
      requestMemoryDelete,
      requestMemoryRecall,
      requestMemoryReview,
      requestMemoryWrite,
      scheduleTimedEvents,
      sessionId,
      startLocalHarnessRun,
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
        payload: createMemoryVaultObject(
          pendingApproval.threadId,
          nextRecords,
          approvedAt
        )
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
        payload: createMemoryVaultObject(
          pendingApproval.threadId,
          nextRecords,
          deletedAt
        )
      });
      setApprovalExplanationVisible(false);

      if (stageVoiceEnabled) {
        emitAssistantSpeech("Approved. I deleted that local memory.", {
          threadId: pendingApproval.threadId
        });
      }
      return;
    }

    if (isRealtimeLiveApproval(pendingApproval)) {
      const approvedAt = new Date().toISOString();

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
        type: "agent.progress",
        payload: {
          id: `realtime_arm_approved_${Date.now().toString(36)}`,
          threadId: pendingApproval.threadId,
          taskId: "realtime_sdp_bridge",
          agentName: "Realtime voice broker",
          type: "started",
          summary: "Realtime live edge approved; opening SDP bridge.",
          details:
            "Stage Web will send an SDP offer to the configured local broker with the local approval header.",
          timestamp: approvedAt
        }
      });
      setApprovalExplanationVisible(false);
      realtimeBridgeStartedRef.current = false;
      startApprovedRealtimeBridge(pendingApproval.threadId);

      if (stageVoiceEnabled) {
        emitAssistantSpeech("Approved. Opening the live Realtime edge.", {
          threadId: pendingApproval.threadId
        });
      }
      return;
    }

    if (!activeScenario) {
      return;
    }

    const [resolutionEvent, ...continuation] =
      createSimulatedApprovalContinuation(activeScenario);

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
    startApprovedRealtimeBridge,
    thread.approvals
  ]);

  const rejectCurrentRequest = useCallback(() => {
    const approval = thread.approvals
      .filter((candidate) => candidate.status === "pending")
      .at(-1);

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
  }, [
    emitAssistantSpeech,
    emitStageEvent,
    memoryRecords,
    stageVoiceEnabled,
    thread.approvals
  ]);

  const askWhy = useCallback(() => {
    const approval = thread.approvals.find(
      (candidate) => candidate.status === "pending"
    );

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
      details:
        "Pending simulated work was cancelled and the existing work trace was preserved.",
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
  }, [
    activeScenario?.id,
    memoryRecords,
    researchEvents,
    sessionId,
    stageEvents,
    thread
  ]);

  const updateStageObject = useCallback(
    (objectId: string, updater: (object: StageObject) => StageObject) => {
      const object = thread.renderObjects.find(
        (candidate) => candidate.id === objectId
      );

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
      const artifact = thread.artifacts.find(
        (candidate) => candidate.id === artifactId
      );

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
      const artifact = thread.artifacts.find(
        (candidate) => candidate.id === artifactId
      );

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
      const artifact = thread.artifacts.find(
        (candidate) => candidate.id === artifactId
      );

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

  const prepareArtifactAction = useCallback(
    (artifactId: string) => {
      const artifact = thread.artifacts.find(
        (candidate) => candidate.id === artifactId
      );

      if (!artifact || artifact.status !== "approved") {
        return;
      }

      const preparedAt = new Date().toISOString();
      const actionId = `artifact_action_${Date.now().toString(36)}`;
      const handoffSteps = [
        {
          label: "Review artifact",
          value: "Human-approved content is the input."
        },
        {
          label: "Prepare harness packet",
          value: "Visible local task card and approval request only."
        },
        {
          label: "Hold for approval",
          value: "Execution remains blocked until the user approves a later live path."
        }
      ];
      const actionTaskObject: StageObject = {
        id: `${actionId}_task`,
        threadId: artifact.threadId,
        type: "codex_task_card",
        title: `Harness action packet: ${artifact.title}`,
        summary:
          "Approved artifact converted into a local, approval-gated harness task packet.",
        payload: {
          taskId: actionId,
          artifactId: artifact.id,
          artifactTitle: artifact.title,
          controlPlane: "Symphony queue",
          worker: "Agents SDK manager",
          status: "awaiting human approval",
          policy: "No browser-origin mutation. No external system touched.",
          steps: handoffSteps
        },
        position: {
          x: 22,
          y: 76,
          z: thread.renderObjects.length + 1
        },
        state: "focused",
        pinned: true,
        createdAt: preparedAt,
        updatedAt: preparedAt
      };
      const approvalRequest: ApprovalRequest = {
        id: `${actionId}_approval`,
        threadId: artifact.threadId,
        actionType: "tool_call",
        title: `Approve harness action for ${artifact.title}`,
        summary:
          "Prepare a local harness handoff from this artifact. This does not contact external systems.",
        riskLevel: "medium",
        proposedBy: "Blackstage harness",
        scope:
          "Local action packet only; no browser-origin mutation or provider credential exposure.",
        consequence:
          "If approved later, a live harness path could act on the artifact through a separately armed worker.",
        undoPath:
          "Rejecting keeps the artifact approved but leaves the prepared action packet inert.",
        status: "pending",
        createdAt: preparedAt
      };
      const actionPacketArtifact: Artifact = {
        id: `${actionId}_artifact`,
        threadId: artifact.threadId,
        type: "brief",
        title: `Harness Action Packet: ${artifact.title}`,
        status: "review",
        content: {
          actionId,
          artifactId: artifact.id,
          approvalId: approvalRequest.id,
          controlPlane: "Symphony queue",
          worker: "Agents SDK manager",
          policy: "No browser-origin mutation. No external system touched.",
          actions: handoffSteps.map((step) => `${step.label}: ${step.value}`)
        },
        provenance: [
          {
            id: `${actionId}_source_artifact`,
            label: artifact.title,
            sourceType: "artifact"
          }
        ],
        createdAt: preparedAt,
        updatedAt: preparedAt
      };

      emitStageEvent({
        type: "object.created",
        payload: actionTaskObject
      });
      emitStageEvent({
        type: "artifact.created",
        payload: actionPacketArtifact
      });
      emitStageEvent({
        type: "agent.progress",
        payload: {
          id: `${actionId}_agent_event`,
          threadId: artifact.threadId,
          taskId: actionId,
          agentName: "Harness edge",
          type: "approval_requested",
          summary: "Harness action packet prepared.",
          details:
            "The approved artifact is ready for a local handoff, but execution is blocked behind approval.",
          evidence: [
            {
              id: `${actionId}_artifact_ref`,
              label: artifact.title,
              sourceType: "artifact"
            }
          ],
          timestamp: preparedAt
        }
      });
      emitStageEvent({
        type: "approval.requested",
        payload: approvalRequest
      });
      emitAssistantSpeech(
        "Prepared a harness action packet. Approval is required before anything leaves the stage.",
        {
          threadId: artifact.threadId
        }
      );
    },
    [emitAssistantSpeech, emitStageEvent, thread.artifacts, thread.renderObjects.length]
  );

  const attachContext = useCallback(
    async (file: File) => {
      const attachedAt = new Date().toISOString();
      const attachmentId = `context_${Date.now().toString(36)}`;
      const modality = readContextModality(file);
      const excerpt = await readContextExcerpt(file);
      const imagePreview = await readImageContextPreview(file);
      const structuredPreview = await readStructuredContextPreview(file);
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
          previewUrl: imagePreview?.previewUrl,
          previewKind: imagePreview?.previewKind,
          imageDimensions: imagePreview?.dimensions,
          structuredPreview,
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
            ...(structuredPreview
              ? [
                  {
                    label: structuredPreview.label,
                    value: structuredPreview.summary
                  }
                ]
              : []),
            ...(imagePreview
              ? [
                  {
                    label: "Preview",
                    value: "Session-only local image preview. Not uploaded."
                  },
                  ...(imagePreview.dimensions
                    ? [
                        {
                          label: "Dimensions",
                          value: `${imagePreview.dimensions.width} x ${imagePreview.dimensions.height}`
                        }
                      ]
                    : [])
                ]
              : []),
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
          previewAvailable: Boolean(imagePreview),
          previewKind: imagePreview?.previewKind,
          imageDimensions: imagePreview?.dimensions,
          structuredKind: structuredPreview?.kind,
          structuredItemCount: structuredPreview?.itemCount,
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
      const timer = window.setTimeout(
        () => {
          setThread((currentThread) =>
            applyStageEventToThread(currentThread, stageEvent)
          );
        },
        120 + index * 110
      );
      timerRefs.current.push(timer);
    });

    const completionTimer = window.setTimeout(
      () => {
        setIsReplaying(false);
        timerRefs.current = [];
      },
      180 + eventsToReplay.length * 110
    );
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
    realtimeBridgeStartedRef.current = false;
    setRealtimeBridge(createDefaultStageWebRealtimeBridgeState());
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
  }, [
    activeScenario?.id,
    memoryRecords,
    researchEvents,
    sessionId,
    stageEvents,
    thread
  ]);

  useEffect(() => {
    const routeUrl = resolveStageWebRealtimeBrokerRouteUrl();
    let cancelled = false;

    if (!routeUrl) {
      realtimeBridgeStartedRef.current = false;
      setRealtimeBrokerReadiness(createDefaultStageWebBrokerReadiness());
      setRealtimeBrokerProofs(createDefaultStageWebRealtimeBrokerProofs());
      setRealtimeBridge(createDefaultStageWebRealtimeBridgeState());
      return;
    }

    if (realtimeBridgeStartedRef.current) {
      return;
    }

    setRealtimeBrokerReadiness(createStageWebBrokerCheckingReadiness(routeUrl));
    setRealtimeBrokerProofs(createStageWebRealtimeBrokerProofsChecking(routeUrl));
    setRealtimeBridge(createDefaultStageWebRealtimeBridgeState());

    void checkStageWebRealtimeBrokerReadiness({
      routeUrl
    }).then(async (readiness) => {
      if (cancelled) {
        return;
      }

      setRealtimeBrokerReadiness(readiness);

      if (readiness.status !== "reachable") {
        setRealtimeBrokerProofs({
          status: "unavailable",
          routeUrl,
          checkedAt: readiness.checkedAt,
          networkAttempted: readiness.networkAttempted,
          errors: readiness.errors
        });
        realtimeBridgeStartedRef.current = false;
        return;
      }

      const proofs = await checkStageWebRealtimeBrokerProofs({
        routeUrl
      });

      if (cancelled) {
        return;
      }

      setRealtimeBrokerProofs(proofs);

      realtimeBridgeStartedRef.current = false;
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const realtimeApprovalArmed =
      realtimeBrokerReadiness.status === "reachable" &&
      realtimeBrokerReadiness.liveModeEnabled === true &&
      realtimeBrokerReadiness.liveApprovalConfigured === true &&
      Boolean(readStageWebRealtimeApprovalPhrase());

    void checkStageWebRealtimeMicPreflight({
      explicitUserGesture: realtimeMicGestureObserved,
      realtimeApprovalArmed
    }).then((preflight) => {
      if (!cancelled) {
        setRealtimeMicPreflight(preflight);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    realtimeBrokerReadiness.liveApprovalConfigured,
    realtimeBrokerReadiness.liveModeEnabled,
    realtimeBrokerReadiness.status,
    realtimeMicGestureObserved
  ]);

  useEffect(() => {
    const routeUrl = resolveStageWebHarnessRunnerRouteUrl();
    let cancelled = false;

    if (!routeUrl) {
      setHarnessRunnerReadiness(createDefaultStageWebHarnessReadiness());
      setHarnessRunnerSnapshot(createDefaultStageWebHarnessSnapshot());
      setHarnessRunnerProofs(createDefaultStageWebHarnessProofs());
      return;
    }

    setHarnessRunnerReadiness(createStageWebHarnessCheckingReadiness(routeUrl));
    setHarnessRunnerSnapshot(createStageWebHarnessSnapshotChecking(routeUrl));
    setHarnessRunnerProofs(createStageWebHarnessProofsChecking(routeUrl));

    void checkStageWebHarnessRunnerReadiness({
      routeUrl
    }).then(async (readiness) => {
      if (!cancelled) {
        setHarnessRunnerReadiness(readiness);
      }

      if (readiness.status !== "reachable") {
        if (!cancelled) {
          setHarnessRunnerSnapshot({
            status: "unavailable",
            routeUrl,
            checkedAt: readiness.checkedAt,
            networkAttempted: readiness.networkAttempted,
            errors: readiness.errors
          });
          setHarnessRunnerProofs({
            status: "unavailable",
            routeUrl,
            checkedAt: readiness.checkedAt,
            networkAttempted: readiness.networkAttempted,
            errors: readiness.errors
          });
        }
        return;
      }

      const [snapshot, proofs] = await Promise.all([
        checkStageWebHarnessRunnerSnapshot({
          routeUrl
        }),
        checkStageWebHarnessRunnerProofs({
          routeUrl
        })
      ]);

      if (!cancelled) {
        setHarnessRunnerSnapshot(snapshot);
        setHarnessRunnerProofs(proofs);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const realtimeArmVisible =
    realtimeBrokerReadiness.status === "reachable" &&
    realtimeBrokerReadiness.liveModeEnabled === true;
  const realtimeArmPending = thread.approvals.some(isRealtimeLiveApprovalPending);
  const realtimeArmAvailable =
    realtimeArmVisible &&
    realtimeBrokerReadiness.liveApprovalConfigured === true &&
    Boolean(readStageWebRealtimeApprovalPhrase()) &&
    !realtimeArmPending &&
    realtimeBridge.status !== "connecting" &&
    realtimeBridge.status !== "connected";

  return (
    <StageShell
      accentColor={stageTheme.accent}
      activeScenario={activeScenario}
      approvalExplanationVisible={approvalExplanationVisible}
      assistantSpeechText={assistantSpeechText}
      harnessRunnerProofs={harnessRunnerProofs}
      harnessRunnerReadiness={harnessRunnerReadiness}
      harnessRunnerSnapshot={harnessRunnerSnapshot}
      isReplaying={isReplaying}
      isRunning={isRunning}
      researchEvents={researchEvents}
      realtimeBridge={realtimeBridge}
      realtimeArmAvailable={realtimeArmAvailable}
      realtimeArmPending={realtimeArmPending}
      realtimeArmVisible={realtimeArmVisible}
      realtimeBrokerReadiness={realtimeBrokerReadiness}
      realtimeBrokerProofs={realtimeBrokerProofs}
      realtimeMicPreflight={realtimeMicPreflight}
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
      onArmRealtime={requestRealtimeArm}
      onApproveArtifact={approveArtifact}
      onCollapseObject={toggleStageObjectCollapse}
      onExportArtifact={exportArtifact}
      onFocusObject={focusStageObject}
      onMoveObject={moveStageObject}
      onPinObject={toggleStageObjectPin}
      onPrepareArtifactAction={prepareArtifactAction}
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

function isRealtimeLiveApproval(
  approval?: ApprovalRequest
): approval is ApprovalRequest {
  return (
    approval?.actionType === "network_access" &&
    approval.id.startsWith(REALTIME_LIVE_APPROVAL_PREFIX)
  );
}

function isRealtimeLiveApprovalPending(approval: ApprovalRequest): boolean {
  return isRealtimeLiveApproval(approval) && approval.status === "pending";
}

function parseMemoryDeleteCommand(intentText: string): string | undefined {
  const normalizedIntent = intentText.trim();
  const lowerIntent = normalizedIntent.toLowerCase();
  const prefix = FORGET_COMMAND_PREFIXES.find((candidate) =>
    lowerIntent.startsWith(candidate)
  );

  if (!prefix) {
    return undefined;
  }

  const targetText = normalizedIntent.slice(prefix.length).trim();

  return targetText.length > 0 ? targetText : undefined;
}

function parseMemoryRecallCommand(intentText: string): string | undefined {
  const normalizedIntent = intentText.trim();
  const lowerIntent = normalizedIntent.toLowerCase();
  const prefix = RECALL_COMMAND_PREFIXES.find((candidate) =>
    lowerIntent.startsWith(candidate)
  );

  if (!prefix) {
    return undefined;
  }

  const queryText = normalizedIntent.slice(prefix.length).trim();

  return queryText.length > 0 ? queryText : undefined;
}

function parseMemoryReviewCommand(intentText: string): boolean {
  return REVIEW_MEMORY_COMMANDS.has(intentText.trim().toLowerCase());
}

function parseRunHarnessCommand(intentText: string): boolean {
  const normalizedIntent = normalizeCommandText(intentText);

  return (
    normalizedIntent === "run harness" ||
    normalizedIntent === "start harness" ||
    normalizedIntent === "run local harness" ||
    normalizedIntent === "start local harness" ||
    normalizedIntent === "run background harness" ||
    normalizedIntent === "start background harness"
  );
}

function parseArtifactRevisionCommand(intentText: string): string | undefined {
  const normalizedIntent = intentText.trim();
  const lowerIntent = normalizedIntent.toLowerCase();
  const prefix = ARTIFACT_REVISION_PREFIXES.find((candidate) =>
    lowerIntent.startsWith(candidate)
  );

  if (!prefix) {
    return undefined;
  }

  const revisionText = normalizedIntent.slice(prefix.length).trim();

  return revisionText.length > 0 ? revisionText : undefined;
}

function parseUndoLastObjectCommand(intentText: string): boolean {
  return /^\s*undo(?:\s+(?:the\s+)?)?(?:last\s+)?(?:object\s+)?(?:change|update|edit|command)?\s*$/i.test(
    intentText
  );
}

function findLastObjectUpdateUndo(
  events: StageEvent[]
): { current: StageObject; previous: StageObject } | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const currentEvent = events[index];

    if (currentEvent?.type !== "object.updated") {
      continue;
    }

    for (let previousIndex = index - 1; previousIndex >= 0; previousIndex -= 1) {
      const previousEvent = events[previousIndex];

      if (
        (previousEvent?.type === "object.updated" ||
          previousEvent?.type === "object.created") &&
        previousEvent.payload.id === currentEvent.payload.id
      ) {
        return {
          current: currentEvent.payload,
          previous: previousEvent.payload
        };
      }
    }
  }

  return undefined;
}

function createMemoryVaultObject(
  threadId: string,
  records: MemoryVaultRecord[],
  timestamp: string,
  memoryView?: {
    query?: string;
    results?: RankedMemoryResult[];
    review?: {
      records: MemoryVaultRecord[];
    };
  }
): StageObject {
  const visibleRecords = records.filter((record) => record.threadId === threadId);
  const approvedCount = visibleRecords.filter(
    (record) => record.status === "approved"
  ).length;
  const proposedCount = visibleRecords.filter(
    (record) => record.status === "proposed"
  ).length;
  const deletedCount = visibleRecords.filter(
    (record) => record.status === "deleted"
  ).length;

  return {
    id: "local_memory_vault",
    threadId,
    type: "memory_card",
    title: "Local memory vault",
    summary:
      "Inspectable local memory records with approval-gated writes and deletion.",
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
      retrieval: memoryView?.query
        ? {
            query: memoryView.query,
            resultCount: memoryView.results?.length ?? 0,
            results: (memoryView.results ?? []).map((result) => ({
              id: result.id,
              score: result.score,
              scope: result.scope,
              summary: result.redactedSummary,
              matchedTerms: result.matchedTerms,
              threadMatch: result.threadMatch,
              reason: result.reason
            }))
          }
        : undefined,
      review: memoryView?.review
        ? {
            recordCount: memoryView.review.records.length,
            threadCount: new Set(
              memoryView.review.records.map((record) => record.threadId)
            ).size,
            records: memoryView.review.records.map((record) => ({
              id: record.id,
              threadId: record.threadId,
              status: record.status,
              scope: record.scope,
              summary: record.redactedSummary,
              updatedAt: record.updatedAt
            }))
          }
        : undefined,
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

function parseStageCommand(
  intentText: string,
  objects: StageObject[]
): StageCommand | undefined {
  if (objects.length === 0) {
    return undefined;
  }

  const renameCommand = parseRenameStageCommand(intentText, objects);

  if (renameCommand) {
    return renameCommand;
  }

  const browserUrlCommand = parseBrowserPortalUrlCommand(intentText, objects);

  if (browserUrlCommand) {
    return browserUrlCommand;
  }

  const mapFocusCommand = parseMapPortalFocusCommand(intentText, objects);

  if (mapFocusCommand) {
    return mapFocusCommand;
  }

  const summaryCommand = parseObjectSummaryCommand(intentText, objects);

  if (summaryCommand) {
    return summaryCommand;
  }

  const modelScenarioCommand = parseModelScenarioCommand(intentText, objects);

  if (modelScenarioCommand) {
    return modelScenarioCommand;
  }

  const simulationRunCommand = parseSimulationRunCommand(intentText, objects);

  if (simulationRunCommand) {
    return simulationRunCommand;
  }

  const annotationCommand = parseObjectAnnotationCommand(intentText, objects);

  if (annotationCommand) {
    return annotationCommand;
  }

  const documentNoteCommand = parseDocumentNoteCommand(intentText, objects);

  if (documentNoteCommand) {
    return documentNoteCommand;
  }

  const timelineMilestoneCommand = parseTimelineMilestoneCommand(intentText, objects);

  if (timelineMilestoneCommand) {
    return timelineMilestoneCommand;
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

function parseRenameStageCommand(
  intentText: string,
  objects: StageObject[]
): StageCommand | undefined {
  const match = /^\s*(?:rename|retitle)\s+(.+?)\s+to\s+(.+?)\s*$/i.exec(intentText);

  if (!match) {
    return undefined;
  }

  const targetText = normalizeStageCommandTarget(match[1] ?? "");
  const target = findStageCommandTarget(objects, targetText);
  const nextTitle = sanitizeStageObjectTitle(match[2] ?? "");

  if (!target || !nextTitle) {
    return undefined;
  }

  return {
    action: "rename",
    target,
    value: nextTitle
  };
}

function parseBrowserPortalUrlCommand(
  intentText: string,
  objects: StageObject[]
): StageCommand | undefined {
  const match =
    /^\s*(?:set|point|route)\s+(?:the\s+)?(?:browser|browser portal|validation browser)(?:\s+portal)?\s+(?:to|at)\s+(.+?)\s*$/i.exec(
      intentText
    ) ??
    /^\s*(?:open|load)\s+(.+?)\s+(?:in|inside)\s+(?:the\s+)?(?:browser|browser portal|validation browser)(?:\s+portal)?\s*$/i.exec(
      intentText
    );

  if (!match) {
    return undefined;
  }

  const target = objects.find((object) => object.type === "browser_portal");
  const portalUrl = normalizeStagePortalUrl(match[1] ?? "");

  if (!target || !portalUrl) {
    return undefined;
  }

  return {
    action: "set_url",
    target,
    value: portalUrl
  };
}

function parseMapPortalFocusCommand(
  intentText: string,
  objects: StageObject[]
): StageCommand | undefined {
  const match =
    /^\s*(?:set|point|route|center)\s+(?:the\s+)?(?:map|object map|market map|investor map)(?:\s+portal)?\s+(?:to|at|on|around)\s+(.+?)\s*$/i.exec(
      intentText
    ) ??
    /^\s*(?:map|show)\s+(.+?)\s+(?:on|in|inside)\s+(?:the\s+)?(?:map|object map|market map|investor map)(?:\s+portal)?\s*$/i.exec(
      intentText
    );

  if (!match) {
    return undefined;
  }

  const target = objects.find((object) => object.type === "map_portal");
  const nextCenter = sanitizeStageObjectTitle(match[1] ?? "");

  if (!target || !nextCenter) {
    return undefined;
  }

  return {
    action: "set_map",
    target,
    value: nextCenter
  };
}

function parseModelScenarioCommand(
  intentText: string,
  objects: StageObject[]
): StageCommand | undefined {
  const match =
    /^\s*(?:set|update|change)\s+(?:the\s+)?(?:model|interface model|valuation model)(?:\s+(?:scenario|assumption))?\s+(.+?)\s+(?:to|=)\s+(.+?)\s*$/i.exec(
      intentText
    ) ?? /^\s*(?:model)\s+(.+?)\s+(?:as|at|to|=)\s+(.+?)\s*$/i.exec(intentText);

  if (!match) {
    return undefined;
  }

  const target = objects.find((object) => object.type === "model_card");
  const scenarioLabel = sanitizeStageObjectTitle(match[1] ?? "");
  const scenarioValue = sanitizeStageObjectTitle(match[2] ?? "");

  if (!target || !scenarioLabel || !scenarioValue) {
    return undefined;
  }

  return {
    action: "set_model",
    target,
    field: scenarioLabel,
    value: scenarioValue
  };
}

function parseSimulationRunCommand(
  intentText: string,
  objects: StageObject[]
): StageCommand | undefined {
  const match =
    /^\s*(?:simulate|run simulation|run the simulation|set simulation to)\s+(.+?)\s*$/i.exec(
      intentText
    ) ??
    /^\s*(?:show)\s+(.+?)\s+(?:in|inside)\s+(?:the\s+)?simulation(?:\s+card)?\s*$/i.exec(
      intentText
    );

  if (!match) {
    return undefined;
  }

  const target = objects.find((object) => object.type === "simulation_card");
  const simulationTitle = sanitizeStageObjectTitle(match[1] ?? "");

  if (!target || !simulationTitle) {
    return undefined;
  }

  return {
    action: "run_simulation",
    target,
    value: simulationTitle
  };
}

function parseDocumentNoteCommand(
  intentText: string,
  objects: StageObject[]
): StageCommand | undefined {
  const match =
    /^\s*(?:add|append)\s+(?:a\s+)?note\s+(?:to|on)\s+(?:the\s+)?(?:document|spec|spec portal|document portal)\s*[:,-]?\s+(.+?)\s*$/i.exec(
      intentText
    ) ??
    /^\s*(?:add|append)\s+(?:a\s+)?document\s+note\s*[:,-]?\s+(.+?)\s*$/i.exec(
      intentText
    );

  if (!match) {
    return undefined;
  }

  const target =
    objects.find(
      (object) => object.type === "document_portal" && object.state === "focused"
    ) ?? objects.find((object) => object.type === "document_portal");
  const noteText = sanitizeStageCommandText(match[1] ?? "");

  if (!target || !noteText) {
    return undefined;
  }

  return {
    action: "add_document_note",
    target,
    value: noteText
  };
}

function parseObjectAnnotationCommand(
  intentText: string,
  objects: StageObject[]
): StageCommand | undefined {
  const match =
    /^\s*(?:annotate|note)\s+(.+?)\s+(?:with|as|saying|that|:|-)\s+(.+?)\s*$/i.exec(
      intentText
    ) ??
    /^\s*(?:add|append)\s+(?:a\s+)?(?:note|annotation)\s+(?:to|on)\s+(.+?)\s+(?:with|as|saying|that|:|-)\s+(.+?)\s*$/i.exec(
      intentText
    );

  if (!match) {
    return undefined;
  }

  const targetText = normalizeStageCommandTarget(match[1] ?? "");
  const target = findStageCommandTarget(objects, targetText);
  const noteText = sanitizeStageCommandText(match[2] ?? "");

  if (!target || !noteText) {
    return undefined;
  }

  return {
    action: "annotate_object",
    target,
    value: noteText
  };
}

function parseObjectSummaryCommand(
  intentText: string,
  objects: StageObject[]
): StageCommand | undefined {
  const match =
    /^\s*(?:set|update|change|rewrite)\s+(.+?)\s+(?:summary|description)\s+(?:to|as|with|saying|that|:|-)\s+(.+?)\s*$/i.exec(
      intentText
    ) ??
    /^\s*(?:summarize|describe)\s+(.+?)\s+(?:as|with|saying|that|:|-)\s+(.+?)\s*$/i.exec(
      intentText
    );

  if (!match) {
    return undefined;
  }

  const targetText = normalizeStageCommandTarget(match[1] ?? "");
  const target = findStageCommandTarget(objects, targetText);
  const summaryText = sanitizeStageCommandText(match[2] ?? "");

  if (!target || !summaryText) {
    return undefined;
  }

  return {
    action: "update_summary",
    target,
    value: summaryText
  };
}

function parseTimelineMilestoneCommand(
  intentText: string,
  objects: StageObject[]
): StageCommand | undefined {
  const match =
    /^\s*(?:add|append)\s+(?:a\s+)?(?:timeline\s+)?(?:milestone|cadence item)\s+(?:to|on)\s+(?:the\s+)?(?:timeline|cadence)\s*[:,-]?\s+(.+?)\s*$/i.exec(
      intentText
    ) ??
    /^\s*(?:add|append)\s+(?:a\s+)?timeline\s+(?:milestone|item)\s*[:,-]?\s+(.+?)\s*$/i.exec(
      intentText
    );

  if (!match) {
    return undefined;
  }

  const target =
    objects.find(
      (object) => object.type === "timeline" && object.state === "focused"
    ) ?? objects.find((object) => object.type === "timeline");
  const milestoneText = sanitizeStageCommandText(match[1] ?? "");

  if (!target || !milestoneText) {
    return undefined;
  }

  return {
    action: "add_timeline_milestone",
    target,
    value: milestoneText
  };
}

function commandActionFromWord(
  word: string | undefined
): StageCommandAction | undefined {
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

function findStageCommandTarget(
  objects: StageObject[],
  targetText: string
): StageObject | undefined {
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

function normalizeStageCommandTarget(text: string): string {
  return normalizeCommandText(text)
    .split(" ")
    .filter((word) => !commandFillerWords.has(word))
    .join(" ");
}

function scoreObjectTargetMatch(object: StageObject, targetText: string): number {
  const normalizedTitle = normalizeCommandText(object.title);
  const aliases = getStageObjectAliases(object).map(normalizeCommandText);
  const haystack = [normalizedTitle, object.type.replace(/_/g, " "), ...aliases].join(
    " "
  );

  if (normalizedTitle === targetText || aliases.includes(targetText)) {
    return 4;
  }

  if (normalizedTitle.includes(targetText) || targetText.includes(normalizedTitle)) {
    return 3;
  }

  if (
    aliases.some((alias) => alias.includes(targetText) || targetText.includes(alias))
  ) {
    return 2;
  }

  const targetParts = targetText.split(" ").filter((part) => part.length > 2);

  return targetParts.length > 0 && targetParts.every((part) => haystack.includes(part))
    ? 1
    : 0;
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

function applyStageCommandToObject(
  object: StageObject,
  command: StageCommand
): StageObject {
  switch (command.action) {
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
    case "rename":
      return {
        ...object,
        title: command.value ?? object.title
      };
    case "set_url":
      return applyBrowserPortalUrlCommand(object, command.value);
    case "set_map":
      return applyMapPortalFocusCommand(object, command.value);
    case "set_model":
      return applyModelScenarioCommand(object, command.field, command.value);
    case "run_simulation":
      return applySimulationRunCommand(object, command.value);
    case "annotate_object":
      return applyObjectAnnotationCommand(object, command.value);
    case "update_summary":
      return applyObjectSummaryCommand(object, command.value);
    case "add_document_note":
      return applyDocumentNoteCommand(object, command.value);
    case "add_timeline_milestone":
      return applyTimelineMilestoneCommand(object, command.value);
  }
}

function formatStageCommandConfirmation(command: StageCommand): string {
  const targetTitle = command.target.title;

  switch (command.action) {
    case "focus":
      return `Focused ${targetTitle}.`;
    case "pin":
      return `Pinned ${targetTitle}.`;
    case "unpin":
      return `Unpinned ${targetTitle}.`;
    case "collapse":
      return `Collapsed ${targetTitle}.`;
    case "expand":
      return `Opened ${targetTitle}.`;
    case "rename":
      return `Renamed ${targetTitle} to ${command.value ?? targetTitle}.`;
    case "set_url":
      return `Set ${targetTitle} to ${command.value ?? "the requested URL"}.`;
    case "set_map":
      return `Centered ${targetTitle} on ${command.value ?? "the requested focus"}.`;
    case "set_model":
      return `Updated ${targetTitle} ${command.field ?? "scenario"} to ${command.value ?? "the requested value"}.`;
    case "run_simulation":
      return `Ran ${targetTitle} for ${command.value ?? "the requested scenario"}.`;
    case "annotate_object":
      return `Annotated ${targetTitle}.`;
    case "update_summary":
      return `Updated ${targetTitle} summary.`;
    case "add_document_note":
      return `Added a note to ${targetTitle}.`;
    case "add_timeline_milestone":
      return `Added a milestone to ${targetTitle}.`;
  }
}

function formatStageCommandValue(command: StageCommand): string | undefined {
  if (command.field && command.value) {
    return `${command.field}: ${command.value}`;
  }

  return command.value;
}

function applyBrowserPortalUrlCommand(
  object: StageObject,
  portalUrl: string | undefined
): StageObject {
  if (object.type !== "browser_portal" || !portalUrl) {
    return object;
  }

  const payload = isObjectPayload(object.payload) ? object.payload : {};
  const observations = Array.isArray(payload.observations) ? payload.observations : [];

  return {
    ...object,
    state: "expanded",
    payload: {
      ...payload,
      url: portalUrl,
      status: "local target",
      observations: [
        "Portal target changed locally; no external browsing happened.",
        ...observations
      ].slice(0, 4),
      guardrail: "URL is stored as a local portal target only."
    }
  };
}

function normalizeStagePortalUrl(value: string): string | undefined {
  const trimmed = value.trim().replace(/^["'`]+|["'`.,;!?]+$/g, "");

  if (!trimmed) {
    return undefined;
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    const allowedProtocols = new Set(["https:", "http:", "blackstage:"]);

    if (!allowedProtocols.has(url.protocol)) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
}

function applyMapPortalFocusCommand(
  object: StageObject,
  mapCenter: string | undefined
): StageObject {
  if (object.type !== "map_portal" || !mapCenter) {
    return object;
  }

  const payload = isObjectPayload(object.payload) ? object.payload : {};
  const nodes = Array.isArray(payload.nodes) ? payload.nodes : [];

  return {
    ...object,
    state: "expanded",
    payload: {
      ...payload,
      center: mapCenter,
      status: "local target",
      nodes: [
        {
          label: "Requested focus",
          angle: 0,
          distance: 38
        },
        ...nodes
      ].slice(0, 5),
      guardrail: "Map focus is stored locally; no external map service was called."
    }
  };
}

function applyModelScenarioCommand(
  object: StageObject,
  scenarioLabel: string | undefined,
  scenarioValue: string | undefined
): StageObject {
  if (object.type !== "model_card" || !scenarioLabel || !scenarioValue) {
    return object;
  }

  const payload = isObjectPayload(object.payload) ? object.payload : {};
  const scenarios = Array.isArray(payload.scenarios)
    ? payload.scenarios.filter(isObjectPayload)
    : [];
  const normalizedLabel = normalizeCommandText(scenarioLabel);
  let scenarioWasUpdated = false;
  const nextScenarios = scenarios.map((scenario) => {
    const currentLabel = formatScenarioLabel(scenario.label);

    if (normalizeCommandText(currentLabel) !== normalizedLabel) {
      return scenario;
    }

    scenarioWasUpdated = true;

    return {
      ...scenario,
      value: scenarioValue,
      confidence: "user"
    };
  });

  if (!scenarioWasUpdated) {
    nextScenarios.unshift({
      label: scenarioLabel,
      value: scenarioValue,
      confidence: "user"
    });
  }

  return {
    ...object,
    state: "expanded",
    payload: {
      ...payload,
      status: "local target",
      scenarios: nextScenarios.slice(0, 5),
      guardrail:
        "Model scenario is stored locally; no external model provider was called."
    }
  };
}

function applySimulationRunCommand(
  object: StageObject,
  simulationTitle: string | undefined
): StageObject {
  if (object.type !== "simulation_card" || !simulationTitle) {
    return object;
  }

  const payload = isObjectPayload(object.payload) ? object.payload : {};
  const steps = Array.isArray(payload.steps) ? payload.steps : [];

  return {
    ...object,
    state: "expanded",
    payload: {
      ...payload,
      simulationTitle,
      status: "local run",
      steps: [
        {
          label: "Requested scenario",
          value: simulationTitle
        },
        {
          label: "Boundary",
          value: "Local stage simulation only; no external engine was called."
        },
        ...steps
      ].slice(0, 5),
      guardrail: "Simulation run is represented locally for audit and replay."
    }
  };
}

function applyDocumentNoteCommand(
  object: StageObject,
  noteText: string | undefined
): StageObject {
  if (object.type !== "document_portal" || !noteText) {
    return object;
  }

  const payload = isObjectPayload(object.payload) ? object.payload : {};
  const sections = Array.isArray(payload.sections)
    ? payload.sections.filter(isObjectPayload)
    : [];

  return {
    ...object,
    state: "expanded",
    payload: {
      ...payload,
      status: "local edit",
      sections: [
        {
          label: "User note",
          value: noteText
        },
        ...sections
      ].slice(0, 6),
      guardrail: "Document note is stored locally on the stage; no file write occurred."
    }
  };
}

function applyObjectSummaryCommand(
  object: StageObject,
  summaryText: string | undefined
): StageObject {
  if (!summaryText) {
    return object;
  }

  const payload = isObjectPayload(object.payload) ? object.payload : {};

  return {
    ...object,
    summary: summaryText,
    state: "expanded",
    payload: {
      ...payload,
      status: "local summary",
      userSummary: summaryText,
      guardrail:
        "Summary update is stored locally on the stage; no external system was called."
    }
  };
}

function applyObjectAnnotationCommand(
  object: StageObject,
  noteText: string | undefined
): StageObject {
  if (!noteText) {
    return object;
  }

  const payload = isObjectPayload(object.payload) ? object.payload : {};
  const annotations = Array.isArray(payload.annotations)
    ? payload.annotations.filter(isObjectPayload)
    : [];

  return {
    ...object,
    state: "expanded",
    payload: {
      ...payload,
      status: "local annotation",
      annotations: [
        {
          label: "User annotation",
          value: noteText
        },
        ...annotations
      ].slice(0, 5),
      guardrail:
        "Annotation is stored locally on the stage; no external system was called."
    }
  };
}

function applyTimelineMilestoneCommand(
  object: StageObject,
  milestoneText: string | undefined
): StageObject {
  if (object.type !== "timeline" || !milestoneText) {
    return object;
  }

  const payload = isObjectPayload(object.payload) ? object.payload : {};
  const weeks = Array.isArray(payload.weeks) ? payload.weeks : [];

  return {
    ...object,
    summary: "Local timeline edited on stage; no calendar event was created.",
    state: "expanded",
    payload: {
      ...payload,
      status: "local edit",
      weeks: [milestoneText, ...weeks].slice(0, 6),
      guardrail: "Timeline milestone is stored locally; no calendar event was created."
    }
  };
}

function formatScenarioLabel(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isObjectPayload(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeStageObjectTitle(title: string): string | undefined {
  const normalizedTitle = title.trim().replace(/\s+/g, " ");

  return normalizedTitle.length > 0 ? normalizedTitle.slice(0, 80) : undefined;
}

function sanitizeStageCommandText(value: string): string | undefined {
  const normalizedValue = value.trim().replace(/\s+/g, " ");

  return normalizedValue.length > 0 ? normalizedValue.slice(0, 180) : undefined;
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

type ImageContextPreview = {
  previewUrl: string;
  previewKind: "session_object_url";
  dimensions?: {
    width: number;
    height: number;
  };
};

type StructuredContextPreview = {
  kind: "csv" | "json" | "text";
  label: "CSV structure" | "JSON structure" | "Text structure";
  summary: string;
  itemCount: number;
};

async function readImageContextPreview(
  file: File
): Promise<ImageContextPreview | undefined> {
  if (!file.type.startsWith("image/") || file.size > 5_000_000) {
    return undefined;
  }

  const previewUrl = URL.createObjectURL(file);

  return {
    previewUrl,
    previewKind: "session_object_url",
    dimensions: await readImageDimensions(previewUrl)
  };
}

function readImageDimensions(
  imageUrl: string
): Promise<ImageContextPreview["dimensions"]> {
  return new Promise((resolve) => {
    const image = new Image();
    const timeout = window.setTimeout(() => resolve(undefined), 1_500);

    image.onload = () => {
      window.clearTimeout(timeout);
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      resolve(undefined);
    };
    image.src = imageUrl;
  });
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

async function readStructuredContextPreview(
  file: File
): Promise<StructuredContextPreview | undefined> {
  if (!isTextContext(file) || file.size > 1_000_000) {
    return undefined;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  try {
    const text = await file.text();

    if (extension === "csv" || file.type === "text/csv") {
      return createCsvContextPreview(text);
    }

    if (extension === "json" || file.type === "application/json") {
      return createJsonContextPreview(text);
    }

    return createTextContextPreview(text);
  } catch {
    return undefined;
  }
}

function createCsvContextPreview(text: string): StructuredContextPreview | undefined {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map(parseCsvRow)
    .filter((row) => row.some((cell) => cell.trim().length > 0));

  if (rows.length === 0) {
    return undefined;
  }

  const headers = rows[0].map((header) => header.trim()).filter(Boolean);
  const dataRowCount = Math.max(rows.length - 1, 0);
  const columnCount = headers.length || Math.max(...rows.map((row) => row.length));
  const visibleHeaders = headers.slice(0, 5).join(", ");
  const hiddenHeaderCount = Math.max(headers.length - 5, 0);
  const headerSuffix = hiddenHeaderCount > 0 ? `, +${hiddenHeaderCount} more` : "";

  return {
    kind: "csv",
    label: "CSV structure",
    itemCount: dataRowCount,
    summary: `${dataRowCount} rows · ${columnCount} columns${
      visibleHeaders ? ` · ${visibleHeaders}${headerSuffix}` : ""
    }`
  };
}

function createJsonContextPreview(text: string): StructuredContextPreview | undefined {
  const parsed = JSON.parse(text) as unknown;

  if (Array.isArray(parsed)) {
    const firstObject = parsed.find(isPlainObject);
    const keys = firstObject ? Object.keys(firstObject).slice(0, 5) : [];

    return {
      kind: "json",
      label: "JSON structure",
      itemCount: parsed.length,
      summary: `${parsed.length} array items${keys.length ? ` · keys: ${keys.join(", ")}` : ""}`
    };
  }

  if (isPlainObject(parsed)) {
    const keys = Object.keys(parsed);

    return {
      kind: "json",
      label: "JSON structure",
      itemCount: keys.length,
      summary: `${keys.length} top-level keys${keys.length ? ` · ${keys.slice(0, 5).join(", ")}` : ""}`
    };
  }

  return {
    kind: "json",
    label: "JSON structure",
    itemCount: 1,
    summary: `JSON ${typeof parsed}`
  };
}

function createTextContextPreview(text: string): StructuredContextPreview | undefined {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return undefined;
  }

  const nonEmptyLines = trimmedText
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const wordCount = trimmedText.match(/\b[\w'-]+\b/g)?.length ?? 0;
  const headingCount = nonEmptyLines.filter((line) =>
    /^#{1,6}\s+\S/.test(line.trim())
  ).length;
  const headingSuffix =
    headingCount > 0
      ? ` · ${headingCount} ${headingCount === 1 ? "heading" : "headings"}`
      : "";

  return {
    kind: "text",
    label: "Text structure",
    itemCount: wordCount,
    summary: `${wordCount} ${wordCount === 1 ? "word" : "words"} · ${
      nonEmptyLines.length
    } ${nonEmptyLines.length === 1 ? "line" : "lines"}${headingSuffix}`
  };
}

function parseCsvRow(line: string): string[] {
  const cells: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      currentCell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      cells.push(currentCell);
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  cells.push(currentCell);

  return cells;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
