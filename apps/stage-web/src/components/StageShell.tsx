import type { HarnessRunnerClientReadiness } from "@blackstage/agent-runtime";
import type {
  IntentThread,
  ResearchEvent,
  StageShellScenario,
  StageShellScenarioId
} from "@blackstage/stage-core";
import {
  createTranscriptState,
  type RealtimeBrokerClientReadiness,
  type TranscriptState,
  type VoiceCapturePreflight,
  type VoiceCaptureState
} from "@blackstage/voice-core";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AgentActivityFeed } from "./AgentActivityFeed";
import { ApprovalCard } from "./ApprovalCard";
import { ArtifactCard } from "./ArtifactCard";
import { ResearchCapture } from "./ResearchCapture";
import { StageObjectCard } from "./StageObjectCard";
import type {
  StageWebHarnessRunnerProofs,
  StageWebHarnessRunnerSnapshot
} from "../harness/harnessRunnerReadiness";
import type { StageWebRealtimeBrokerProofs } from "../voice/realtimeBrokerReadiness";
import type { StageWebRealtimeBridgeState } from "../voice/realtimeWebrtcBridge";

type StageShellProps = {
  thread: IntentThread;
  accentColor: string;
  activeScenario?: StageShellScenario;
  assistantSpeechText?: string;
  harnessRunnerProofs: StageWebHarnessRunnerProofs;
  harnessRunnerReadiness: HarnessRunnerClientReadiness;
  harnessRunnerSnapshot: StageWebHarnessRunnerSnapshot;
  researchEvents: ResearchEvent[];
  realtimeBridge: StageWebRealtimeBridgeState;
  realtimeArmAvailable: boolean;
  realtimeArmPending: boolean;
  realtimeArmVisible: boolean;
  realtimeBrokerReadiness: RealtimeBrokerClientReadiness;
  realtimeBrokerProofs: StageWebRealtimeBrokerProofs;
  realtimeMicPreflight: VoiceCapturePreflight;
  stageEventCount: number;
  stageVoiceEnabled: boolean;
  isRunning: boolean;
  isReplaying: boolean;
  approvalExplanationVisible: boolean;
  onSubmitIntent: (
    intentText: string,
    scenarioId?: StageShellScenarioId,
    options?: {
      source?: "scenario" | "text" | "voice";
    }
  ) => void;
  onApprove: () => void;
  onArmRealtime: () => void;
  onReject: () => void;
  onAskWhy: () => void;
  onAttachContext: (file: File) => void;
  onExport: () => void;
  onReset: () => void;
  onApproveArtifact: (artifactId: string) => void;
  onCollapseObject: (objectId: string) => void;
  onExportArtifact: (artifactId: string) => void;
  onFocusObject: (objectId: string) => void;
  onMoveObject: (
    objectId: string,
    position: {
      x: number;
      y: number;
      z?: number;
    }
  ) => void;
  onPinObject: (objectId: string) => void;
  onPrepareArtifactAction: (artifactId: string) => void;
  onReplayTrace: () => void;
  onResumeAgent: () => void;
  onSaveArtifact: (artifactId: string, body: string) => void;
  onStartHarness: () => void;
  onStopAgent: () => void;
  resumableEventCount: number;
  onToggleStageVoice: () => void;
};

export function StageShell({
  thread,
  accentColor,
  activeScenario,
  assistantSpeechText,
  harnessRunnerProofs,
  harnessRunnerReadiness,
  harnessRunnerSnapshot,
  researchEvents,
  realtimeBridge,
  realtimeArmAvailable,
  realtimeArmPending,
  realtimeArmVisible,
  realtimeBrokerReadiness,
  realtimeBrokerProofs,
  realtimeMicPreflight,
  stageEventCount,
  stageVoiceEnabled,
  isRunning,
  isReplaying,
  approvalExplanationVisible,
  onSubmitIntent,
  onApprove,
  onArmRealtime,
  onReject,
  onAskWhy,
  onAttachContext,
  onExport,
  onReset,
  onApproveArtifact,
  onCollapseObject,
  onExportArtifact,
  onFocusObject,
  onMoveObject,
  onPinObject,
  onPrepareArtifactAction,
  onReplayTrace,
  onResumeAgent,
  onSaveArtifact,
  onStartHarness,
  onStopAgent,
  resumableEventCount,
  onToggleStageVoice
}: StageShellProps) {
  const [intentText, setIntentText] = useState("");
  const [voiceCapture, setVoiceCapture] = useState<VoiceCaptureState>(() => ({
    status: getSpeechRecognitionConstructor() ? "idle" : "unavailable"
  }));
  const [transcript, setTranscript] = useState<TranscriptState>(() =>
    createTranscriptState()
  );
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | undefined>();
  const recognitionRef = useRef<BrowserSpeechRecognition | undefined>(undefined);
  const presenceOrbPointerStartedRef = useRef(false);
  const stageStyle = {
    "--stage-accent": accentColor
  } as CSSProperties;
  const latestApproval = thread.approvals.at(-1);
  const isIdleStage = thread.status === "paused" && !thread.originalIntent;
  const visibleObjects = useMemo(
    () =>
      thread.renderObjects.filter(
        (object) => object.type !== "artifact_card" && object.type !== "approval_card"
      ),
    [thread.renderObjects]
  );

  function submitIntent(
    nextIntent = intentText,
    scenarioId?: StageShellScenarioId,
    source: "scenario" | "text" | "voice" = scenarioId ? "scenario" : "text"
  ) {
    const normalizedIntent = nextIntent.trim();

    if (!normalizedIntent) {
      return;
    }

    onSubmitIntent(normalizedIntent, scenarioId, {
      source
    });
    setIntentText(normalizedIntent);
  }

  function startVoiceCapture() {
    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition || voiceCapture.status === "unavailable") {
      setVoiceError("Speech capture is not available in this browser.");
      return;
    }

    if (voiceCapture.status === "listening") {
      recognitionRef.current?.stop();
      setVoiceCapture({ status: "idle" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onstart = () => {
      setVoiceError(undefined);
      setInterimTranscript("");
      setVoiceCapture({ status: "listening" });
    };
    recognition.onresult = (event) => {
      const { finalText, interimText } = readSpeechResult(event);

      if (interimText) {
        setInterimTranscript(interimText);
        setIntentText(interimText);
      }

      if (finalText) {
        const createdAt = new Date().toISOString();

        setTranscript((currentTranscript) => ({
          segments: [
            ...currentTranscript.segments,
            {
              id: `voice_segment_${Date.now().toString(36)}`,
              text: finalText,
              isFinal: true,
              createdAt
            }
          ]
        }));
        setInterimTranscript("");
        setIntentText(finalText);
        window.setTimeout(() => {
          submitIntent(finalText, undefined, "voice");
        }, 220);
      }
    };
    recognition.onerror = (event) => {
      setVoiceError(
        event.error
          ? `Speech capture stopped: ${event.error}`
          : "Speech capture stopped."
      );
      setVoiceCapture({ status: "idle" });
    };
    recognition.onend = () => {
      setVoiceCapture((currentCapture) =>
        currentCapture.status === "unavailable" ? currentCapture : { status: "idle" }
      );
    };
    recognitionRef.current = recognition;
    setVoiceError(undefined);
    setInterimTranscript("");
    setVoiceCapture({ status: "listening" });
    recognition.start();
  }

  function activatePresenceOrb(event?: ReactPointerEvent<HTMLButtonElement>) {
    event?.preventDefault();
    presenceOrbPointerStartedRef.current = Boolean(event);
    startVoiceCapture();
  }

  function activatePresenceOrbFromClick() {
    if (presenceOrbPointerStartedRef.current) {
      presenceOrbPointerStartedRef.current = false;
      return;
    }

    startVoiceCapture();
  }

  function attachContextFile(fileList: FileList | null) {
    const [file] = Array.from(fileList ?? []);

    if (file) {
      onAttachContext(file);
    }
  }

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
    },
    []
  );

  const finalTranscript = transcript.segments.at(-1)?.text;
  const voiceButtonLabel =
    voiceCapture.status === "listening"
      ? "Listening"
      : voiceCapture.status === "unavailable"
        ? "Voice standby"
        : "Speak";
  const presenceOrbLabel =
    voiceCapture.status === "listening"
      ? "Listening for intent"
      : voiceCapture.status === "unavailable"
        ? "Voice unavailable"
        : "Start voice input";
  const assistantSpeechStatus =
    assistantSpeechText ??
    (stageVoiceEnabled ? "Stage voice ready for key turns." : "Stage voice muted.");
  const harnessRunnerStatus = formatHarnessRunnerReadiness(
    harnessRunnerReadiness,
    harnessRunnerSnapshot,
    harnessRunnerProofs
  );
  const harnessRunnerPolicyStatus = formatHarnessRunnerPolicy(harnessRunnerReadiness);
  const realtimeBrokerStatus = formatRealtimeBrokerReadiness(
    realtimeBrokerReadiness,
    realtimeBridge,
    realtimeBrokerProofs
  );
  const realtimeArmLabel = formatRealtimeArmLabel(
    realtimeBridge,
    realtimeArmAvailable,
    realtimeArmPending
  );
  const realtimeMicPreflightStatus = formatRealtimeMicPreflight(realtimeMicPreflight);
  const presenceTitle =
    voiceCapture.status === "listening"
      ? "Listening"
      : isIdleStage
        ? "Speak when ready"
        : thread.title;
  const presenceObjective =
    voiceCapture.status === "listening"
      ? interimTranscript || "Say the intent. The stage will shape itself around it."
      : voiceError && isIdleStage
        ? voiceError
        : thread.currentObjective;

  return (
    <main
      className={`stage-shell ${isIdleStage ? "stage-idle" : "stage-active"} ${
        thread.status === "paused" && !isIdleStage ? "stage-paused" : ""
      } ${voiceCapture.status === "listening" ? "stage-listening" : ""} ${
        stageVoiceEnabled ? "stage-voice-enabled" : ""
      }`}
      data-testid="stage-shell"
      style={stageStyle}
    >
      <div className="stage-fluid-field" aria-hidden="true" />
      <div className="stage-stars stage-stars-slow" aria-hidden="true" />
      <div className="stage-stars stage-stars-near" aria-hidden="true" />
      <div className="stage-map" aria-hidden="true">
        <svg className="constellation constellation-nw" viewBox="0 0 320 260">
          <path d="M12 144 L74 178 L112 128 L168 112 L236 38 L306 92" />
          <path d="M112 128 L132 218 L196 244" />
          <circle cx="12" cy="144" r="3" />
          <circle cx="74" cy="178" r="4" />
          <circle cx="112" cy="128" r="5" />
          <circle cx="168" cy="112" r="2" />
          <circle cx="236" cy="38" r="4" />
          <circle cx="306" cy="92" r="5" />
          <circle cx="132" cy="218" r="2" />
          <circle cx="196" cy="244" r="3" />
        </svg>
        <svg className="constellation constellation-sw" viewBox="0 0 340 300">
          <path d="M18 112 C78 92 126 126 164 182 S252 250 326 204" />
          <path d="M82 244 L142 208 L206 260 L278 228" />
          <circle cx="18" cy="112" r="2" />
          <circle cx="82" cy="244" r="4" />
          <circle cx="142" cy="208" r="2" />
          <circle cx="164" cy="182" r="5" />
          <circle cx="206" cy="260" r="3" />
          <circle cx="278" cy="228" r="4" />
          <circle cx="326" cy="204" r="2" />
        </svg>
        <svg className="constellation constellation-ne" viewBox="0 0 360 280">
          <path d="M42 42 C98 118 168 152 282 86" />
          <path d="M216 174 L268 112 L334 62" />
          <circle cx="42" cy="42" r="4" />
          <circle cx="98" cy="118" r="2" />
          <circle cx="168" cy="152" r="3" />
          <circle cx="216" cy="174" r="5" />
          <circle cx="268" cy="112" r="2" />
          <circle cx="282" cy="86" r="3" />
          <circle cx="334" cy="62" r="4" />
        </svg>
        <svg className="constellation constellation-se" viewBox="0 0 420 320">
          <path d="M20 244 C92 138 164 94 246 76 S372 44 410 18" />
          <path d="M214 190 L254 156 L306 196 L288 252 L230 246 Z" />
          <circle cx="20" cy="244" r="5" />
          <circle cx="214" cy="190" r="3" />
          <circle cx="230" cy="246" r="2" />
          <circle cx="246" cy="76" r="2" />
          <circle cx="254" cy="156" r="4" />
          <circle cx="288" cy="252" r="3" />
          <circle cx="306" cy="196" r="3" />
          <circle cx="410" cy="18" r="2" />
        </svg>
      </div>
      <div className="stage-depth" aria-hidden="true" />
      <section
        className="stage-presence"
        aria-labelledby="stage-title"
        data-testid="stage-presence"
      >
        <button
          className="presence-orbit"
          type="button"
          aria-label={presenceOrbLabel}
          aria-pressed={voiceCapture.status === "listening"}
          data-testid="presence-orb"
          disabled={voiceCapture.status === "unavailable"}
          onClick={activatePresenceOrbFromClick}
          onPointerDown={activatePresenceOrb}
        >
          <div className="presence-core" />
        </button>
        <div className="stage-copy" aria-live="polite">
          <h1 id="stage-title">{presenceTitle}</h1>
          <div className="prompt-rule" aria-hidden="true" />
          <p className="thread-objective">{presenceObjective}</p>
        </div>
      </section>
      <section className="thread-console" aria-label="Intent thread">
        <div className="thread-meta">
          <span>{activeScenario?.label ?? "idle field"}</span>
          <strong>{isRunning ? "working" : thread.status}</strong>
        </div>
        <p>
          {thread.originalIntent || "The stage is dormant until intent gives it shape."}
        </p>
      </section>
      <section
        className="stage-workspace"
        aria-label="Dynamic render objects"
        data-testid="stage-workspace"
      >
        <div className="stage-object-constellation">
          {visibleObjects.map((object) => (
            <StageObjectCard
              key={object.id}
              object={object}
              onCollapseToggle={onCollapseObject}
              onFocus={onFocusObject}
              onMove={onMoveObject}
              onPinToggle={onPinObject}
            />
          ))}
        </div>
        <AgentActivityFeed
          canResume={resumableEventCount > 0}
          canStartHarness={!isRunning && thread.originalIntent.length > 0}
          events={thread.agentEvents}
          isRunning={isRunning}
          threadStatus={thread.status}
          onResume={onResumeAgent}
          onStartHarness={onStartHarness}
          onStop={onStopAgent}
        />
        <ApprovalCard
          approval={latestApproval}
          explanationVisible={approvalExplanationVisible}
          onApprove={onApprove}
          onAskWhy={onAskWhy}
          onReject={onReject}
        />
        <ArtifactCard
          artifacts={thread.artifacts}
          onApproveArtifact={onApproveArtifact}
          onExportArtifact={onExportArtifact}
          onPrepareArtifactAction={onPrepareArtifactAction}
          onSaveArtifact={onSaveArtifact}
        />
      </section>
      <form
        className="intent-capture"
        aria-label="Intent capture"
        onSubmit={(event) => {
          event.preventDefault();
          submitIntent();
        }}
      >
        <label className="sr-only" htmlFor="intent-input">
          Speak intent, or type with precision.
        </label>
        <input
          id="intent-input"
          name="intent"
          autoComplete="off"
          aria-describedby="stage-status"
          data-testid="intent-input"
          placeholder="type intent"
          type="text"
          value={intentText}
          onChange={(event) => setIntentText(event.currentTarget.value)}
        />
        <label className="context-attach" htmlFor="context-file-input">
          Attach
        </label>
        <input
          className="sr-only"
          data-testid="context-file-input"
          id="context-file-input"
          type="file"
          accept=".txt,.md,.json,.csv,image/*"
          onChange={(event) => {
            attachContextFile(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />
        <button className="intent-submit" type="submit" data-testid="submit-intent">
          Send
        </button>
        <button
          className="voice-affordance"
          type="button"
          aria-pressed={voiceCapture.status === "listening"}
          disabled={voiceCapture.status === "unavailable"}
          onClick={startVoiceCapture}
        >
          {voiceButtonLabel}
        </button>
        <button
          className="voice-output-toggle"
          type="button"
          aria-pressed={stageVoiceEnabled}
          onClick={onToggleStageVoice}
        >
          Stage voice
        </button>
        {realtimeArmVisible ? (
          <button
            className="realtime-arm-toggle"
            type="button"
            aria-pressed={realtimeBridge.status === "connected"}
            data-testid="realtime-arm-button"
            disabled={!realtimeArmAvailable}
            onClick={onArmRealtime}
          >
            {realtimeArmLabel}
          </button>
        ) : null}
        <div
          className="voice-transcript"
          aria-live="polite"
          data-testid="voice-transcript"
        >
          {voiceCapture.status === "listening"
            ? interimTranscript || "listening for intent"
            : finalTranscript || voiceError || "voice-native when available"}
        </div>
        <div
          className="stage-voice-reply"
          aria-live="polite"
          data-testid="assistant-speech"
        >
          {assistantSpeechStatus}
        </div>
        <div
          className={`realtime-broker-status realtime-broker-status-${realtimeBrokerReadiness.status}`}
          aria-live="polite"
          data-testid="realtime-broker-status"
        >
          <span>Realtime edge</span>
          <strong>{realtimeBrokerStatus}</strong>
          {realtimeArmVisible ? (
            <em data-testid="realtime-mic-preflight">{realtimeMicPreflightStatus}</em>
          ) : null}
        </div>
        <div
          className={`harness-runner-status harness-runner-status-${harnessRunnerReadiness.status}`}
          aria-live="polite"
          data-testid="harness-runner-status"
        >
          <span>Harness edge</span>
          <strong>{harnessRunnerStatus}</strong>
          {harnessRunnerPolicyStatus ? <em>{harnessRunnerPolicyStatus}</em> : null}
        </div>
      </form>
      <p className="stage-memory-status">local memory · private</p>
      <ResearchCapture
        events={researchEvents}
        isReplaying={isReplaying}
        stageEventCount={stageEventCount}
        onExport={onExport}
        onReplay={onReplayTrace}
        onReset={onReset}
      />
      <p className="sr-only" id="stage-status">
        {thread.currentObjective}
      </p>
    </main>
  );
}

function formatRealtimeArmLabel(
  bridge: StageWebRealtimeBridgeState,
  available: boolean,
  pending: boolean
): string {
  if (bridge.status === "connecting") {
    return "Arming";
  }

  if (bridge.status === "connected") {
    return "Live armed";
  }

  if (pending) {
    return "Pending";
  }

  return available ? "Arm live" : "Locked";
}

function formatRealtimeBrokerReadiness(
  readiness: RealtimeBrokerClientReadiness,
  bridge: StageWebRealtimeBridgeState,
  proofs: StageWebRealtimeBrokerProofs
): string {
  const proofSuffix = formatRealtimeProofSuffix(proofs);

  switch (readiness.status) {
    case "checking":
      return "checking";
    case "reachable":
      if (readiness.liveModeEnabled) {
        if (readiness.liveApprovalConfigured !== true) {
          return "live locked";
        }

        switch (bridge.status) {
          case "connecting":
            return `SDP linking${proofSuffix}`;
          case "connected":
            return `live SDP${proofSuffix}`;
          case "failed":
            return `SDP failed${proofSuffix}`;
          case "blocked":
            return `SDP blocked${proofSuffix}`;
          case "disabled":
            return `live broker · SDP off${proofSuffix}`;
        }
      }

      return readiness.liveModeEnabled
        ? `live broker${proofSuffix}`
        : `broker mounted${proofSuffix}`;
    case "unreachable":
      return "offline";
    case "not_configured":
      return "standby";
  }
}

function formatRealtimeProofSuffix(proofs: StageWebRealtimeBrokerProofs): string {
  if (proofs.status !== "loaded") {
    return "";
  }

  const proofCount = proofs.proofCount ?? 0;
  const proofLabel = proofCount === 1 ? "proof" : "proofs";
  const latestProof = proofs.latestProof;

  if (!latestProof) {
    return ` · ${proofCount} ${proofLabel}`;
  }

  const networkLabel = latestProof.openAiNetworkCallAttempted
    ? "network"
    : "no network";
  const audioLabel = latestProof.browserSendsAudio ? "mic send" : "no mic send";
  const guardLabel = formatRealtimeProofGuardLabel(latestProof);

  return ` · ${latestProof.status} proof · ${networkLabel} · ${audioLabel}${guardLabel}`;
}

function formatRealtimeProofGuardLabel(
  latestProof: StageWebRealtimeBrokerProofs["latestProof"]
): string {
  const directions = latestProof?.cheapTestGuard?.offer?.audioDirections ?? [];

  if (directions.includes("recvonly")) {
    return " · recvonly";
  }

  return "";
}

function formatRealtimeMicPreflight(preflight: VoiceCapturePreflight): string {
  const suffix = "no stream";

  switch (preflight.status) {
    case "ready":
      return `mic ready · ${suffix}`;
    case "needs_permission":
      return preflight.permissionState === "granted"
        ? `approval locked · ${suffix}`
        : `mic permission · ${suffix}`;
    case "needs_user_gesture":
      return `mic gesture · ${suffix}`;
    case "blocked":
      return `mic blocked · ${suffix}`;
    case "unavailable":
      return `mic unavailable · ${suffix}`;
  }
}

function formatHarnessRunnerReadiness(
  readiness: HarnessRunnerClientReadiness,
  snapshot: StageWebHarnessRunnerSnapshot,
  proofs: StageWebHarnessRunnerProofs
): string {
  switch (readiness.status) {
    case "checking":
      return "checking";
    case "reachable":
      if (snapshot.status === "loaded") {
        const proofCount = proofs.status === "loaded" ? (proofs.proofCount ?? 0) : 0;
        const proofLabel = proofCount === 1 ? "proof" : "proofs";

        return `${snapshot.openWorkCount ?? 0} open · ${snapshot.reviewCount ?? 0} review · ${proofCount} ${proofLabel}`;
      }

      return readiness.codexMode === "local_exec" ? "runner live" : "runner mounted";
    case "unreachable":
      return "offline";
    case "not_configured":
      return "standby";
  }
}

function formatHarnessRunnerPolicy(
  readiness: HarnessRunnerClientReadiness
): string | undefined {
  const policy = readiness.workflowPolicy;

  if (readiness.status !== "reachable" || !policy) {
    return undefined;
  }

  const controlPlaneLabel =
    policy.controlPlane === "symphony_style_internal_queue"
      ? "Symphony queue"
      : policy.controlPlane;
  const codingWorkerLabel =
    policy.codingWorker === "openai_codex"
      ? formatCodexTransportLabel(policy.codexTransports)
      : policy.codingWorker;
  const agentWorkerLabel =
    policy.agentWorker === "openai_agents_sdk_manager"
      ? "Agents SDK manager"
      : policy.agentWorker;
  const memoryPolicyLabel =
    policy.agentMemoryAccessDefault === "stage_approval_required"
      ? "Memory approvals"
      : policy.agentMemoryAccessDefault;
  const upstreamPolicyLabel = formatHarnessUpstreamPolicyLabel(
    policy.upstreamIntegrations
  );

  return `${policy.source} · ${controlPlaneLabel} · ${codingWorkerLabel} · ${agentWorkerLabel} · ${memoryPolicyLabel} · ${upstreamPolicyLabel} · ${policy.voiceModel}`;
}

function formatCodexTransportLabel(transports: readonly string[]): string {
  const hasCli = transports.includes("cli");
  const hasAppServer = transports.includes("app_server");

  if (hasCli && hasAppServer) {
    return "Codex CLI/App Server";
  }

  if (hasAppServer) {
    return "Codex App Server";
  }

  if (hasCli) {
    return "Codex CLI";
  }

  return "Codex";
}

function formatHarnessUpstreamPolicyLabel(
  integrations: readonly { sourceUrl: string; openSourceUrl?: string }[]
): string {
  const pinnedCount = integrations.filter((integration) =>
    integration.sourceUrl.startsWith("https://")
  ).length;
  const openSourceCount = integrations.filter((integration) =>
    integration.openSourceUrl?.startsWith("https://github.com/openai/")
  ).length;

  return openSourceCount > 0
    ? `${pinnedCount} source-pinned · ${openSourceCount} open-source`
    : `${pinnedCount} source-pinned`;
}

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
};

type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
};

function getSpeechRecognitionConstructor():
  | BrowserSpeechRecognitionConstructor
  | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const speechWindow = window as SpeechRecognitionWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

function readSpeechResult(event: SpeechRecognitionEventLike): {
  finalText: string;
  interimText: string;
} {
  const finalParts: string[] = [];
  const interimParts: string[] = [];

  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    const transcriptText = result[0].transcript.trim();

    if (!transcriptText) {
      continue;
    }

    if (result.isFinal) {
      finalParts.push(transcriptText);
    } else {
      interimParts.push(transcriptText);
    }
  }

  return {
    finalText: finalParts.join(" "),
    interimText: interimParts.join(" ")
  };
}
