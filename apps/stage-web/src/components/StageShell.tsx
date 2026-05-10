import type {
  IntentThread,
  ResearchEvent,
  StageShellScenario,
  StageShellScenarioId
} from "@blackstage/stage-core";
import {
  createTranscriptState,
  type TranscriptState,
  type VoiceCaptureState
} from "@blackstage/voice-core";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AgentActivityFeed } from "./AgentActivityFeed";
import { ApprovalCard } from "./ApprovalCard";
import { ArtifactCard } from "./ArtifactCard";
import { ResearchCapture } from "./ResearchCapture";
import { StageObjectCard } from "./StageObjectCard";

type StageShellProps = {
  thread: IntentThread;
  accentColor: string;
  scenarios: StageShellScenario[];
  activeScenario?: StageShellScenario;
  researchEvents: ResearchEvent[];
  stageEventCount: number;
  isRunning: boolean;
  isReplaying: boolean;
  approvalExplanationVisible: boolean;
  onSubmitIntent: (intentText: string, scenarioId?: StageShellScenarioId) => void;
  onApprove: () => void;
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
  onReplayTrace: () => void;
  onResumeAgent: () => void;
  onSaveArtifact: (artifactId: string, body: string) => void;
  onStartHarness: () => void;
  onStopAgent: () => void;
  resumableEventCount: number;
};

export function StageShell({
  thread,
  accentColor,
  scenarios,
  activeScenario,
  researchEvents,
  stageEventCount,
  isRunning,
  isReplaying,
  approvalExplanationVisible,
  onSubmitIntent,
  onApprove,
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
  onReplayTrace,
  onResumeAgent,
  onSaveArtifact,
  onStartHarness,
  onStopAgent,
  resumableEventCount
}: StageShellProps) {
  const [intentText, setIntentText] = useState("");
  const [voiceCapture, setVoiceCapture] = useState<VoiceCaptureState>(() => ({
    status: getSpeechRecognitionConstructor() ? "idle" : "unavailable"
  }));
  const [transcript, setTranscript] = useState<TranscriptState>(() => createTranscriptState());
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | undefined>();
  const recognitionRef = useRef<BrowserSpeechRecognition | undefined>(undefined);
  const stageStyle = {
    "--stage-accent": accentColor
  } as CSSProperties;
  const latestApproval = thread.approvals.at(-1);
  const visibleObjects = useMemo(
    () =>
      thread.renderObjects.filter(
        (object) => object.type !== "artifact_card" && object.type !== "approval_card"
      ),
    [thread.renderObjects]
  );

  function submitIntent(nextIntent = intentText, scenarioId?: StageShellScenarioId) {
    const normalizedIntent = nextIntent.trim();

    if (!normalizedIntent) {
      return;
    }

    onSubmitIntent(normalizedIntent, scenarioId);
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
          submitIntent(finalText);
        }, 220);
      }
    };
    recognition.onerror = (event) => {
      setVoiceError(event.error ? `Speech capture stopped: ${event.error}` : "Speech capture stopped.");
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

  return (
    <main
      className={`stage-shell ${thread.status === "paused" ? "stage-idle" : "stage-active"} ${
        voiceCapture.status === "listening" ? "stage-listening" : ""
      }`}
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
      <section className="stage-presence" aria-labelledby="stage-title" data-testid="stage-presence">
        <div className="presence-orbit" aria-hidden="true">
          <div className="presence-core" />
        </div>
        <div className="stage-copy">
          <h1 id="stage-title">{thread.status === "paused" ? "Speak when ready" : thread.title}</h1>
          <div className="prompt-rule" aria-hidden="true" />
          <p className="thread-objective">{thread.currentObjective}</p>
        </div>
      </section>
      <section className="thread-console" aria-label="Intent thread">
        <div className="thread-meta">
          <span>{activeScenario?.label ?? "idle field"}</span>
          <strong>{isRunning ? "working" : thread.status}</strong>
        </div>
        <p>{thread.originalIntent || "The stage is dormant until intent gives it shape."}</p>
      </section>
      <section className="scenario-rail" aria-label="Demo scenarios">
        {scenarios.slice(0, 4).map((scenario) => (
          <button
            key={scenario.id}
            className={activeScenario?.id === scenario.id ? "scenario-active" : undefined}
            type="button"
            onClick={() => submitIntent(scenario.intent, scenario.id)}
          >
            {scenario.label}
          </button>
        ))}
      </section>
      <section className="stage-workspace" aria-label="Dynamic render objects" data-testid="stage-workspace">
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
        <div className="voice-transcript" aria-live="polite" data-testid="voice-transcript">
          {voiceCapture.status === "listening"
            ? interimTranscript || "listening for intent"
            : finalTranscript || voiceError || "voice-native when available"}
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

function getSpeechRecognitionConstructor(): BrowserSpeechRecognitionConstructor | undefined {
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
