import {
  createStageMorphFrame,
  type ApprovalRequest,
  type IntentThread,
  type StageEvent,
  type StageMorphCollapseVector,
  type StageMorphFrame,
  type StageMorphOrbitObject,
  type StageMorphPacket,
  type StageMorphSocket
} from "@blackstage/stage-core";
import type { CSSProperties } from "react";
import {
  createGeneratedFrame,
  type GeneratedBlock,
  type GeneratedPatch
} from "./stageGeneratedStreamModel";

type StageGeneratedStreamProps = {
  onApprove: (approvalId: string) => void;
  onAskWhy: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
  stageEvents: StageEvent[];
  thread: IntentThread;
};

export function StageGeneratedStream({
  onApprove,
  onAskWhy,
  onReject,
  stageEvents,
  thread
}: StageGeneratedStreamProps) {
  if (!thread.originalIntent) {
    return null;
  }

  const frame = createGeneratedFrame(stageEvents, thread);
  const morphFrame = createStageMorphFrame(stageEvents, thread);
  const pendingApproval = thread.approvals.find(
    (approval) => approval.status === "pending"
  );
  const clockStyle = {
    "--stream-progress": frame.sequence.progress.toString(),
    "--morph-depth": morphFrame.camera.depth.toString(),
    "--morph-density": morphFrame.density.density.toString(),
    "--morph-energy": morphFrame.nucleus.energy.toString(),
    "--morph-focus-x": `${morphFrame.camera.focusX}%`,
    "--morph-focus-y": `${morphFrame.camera.focusY}%`,
    "--morph-phase-progress": morphFrame.transition.phaseProgress.toString(),
    "--morph-tilt": `${morphFrame.camera.tilt}deg`
  } as CSSProperties;

  return (
    <section
      className={`stage-generated-stream stage-generated-stream-${frame.kind} stage-morph-${morphFrame.activePhaseId} stage-morph-mode-${morphFrame.mode} stage-morph-workbench-${morphFrame.workbench.state}`}
      aria-label="Streaming generated interface"
      data-frame-kind={frame.kind}
      data-frame-sequence={frame.sequence.index}
      data-frame-source={frame.source}
      data-morph-mode={morphFrame.mode}
      data-morph-packet-count={morphFrame.packets.length}
      data-morph-phase={morphFrame.activePhaseId}
      data-morph-phase-index={morphFrame.transition.phaseIndex}
      data-morph-phase-progress={morphFrame.transition.phaseProgress}
      data-morph-completion-ratio={morphFrame.transition.completionRatio}
      data-morph-density={morphFrame.density.density}
      data-morph-clutter-risk={morphFrame.density.clutterRisk}
      data-morph-vector-count={morphFrame.collapseVectors.length}
      data-morph-voice-cadence={morphFrame.nucleus.voice.cadence}
      data-workbench-state={morphFrame.workbench.state}
      data-testid="stage-generated-stream"
      style={clockStyle}
    >
      <GeneratedMorphologyField morphFrame={morphFrame} />
      <div className="generated-stream-meta">
        <span>{morphFrame.phases.find((phase) => phase.active)?.label}</span>
        <strong>{morphFrame.mode}</strong>
      </div>
      <div className="generated-stream-clock">
        <span>{frame.sequence.label}</span>
        <i aria-hidden="true" />
      </div>
      {/* The surface is persistent field matter: the container never remounts,
          only content that actually changed re-condenses. */}
      <div className="generated-stream-surface">
        <h2 key={frame.title}>{frame.title}</h2>
        <p key={frame.summary}>{frame.summary}</p>
        {frame.blocks.length > 0 ? (
          <div className="generated-stream-body" aria-label="Generated UI body">
            {frame.blocks.slice(0, 4).map((block, index) => (
              <GeneratedBlockView block={block} index={index} key={block.id} />
            ))}
          </div>
        ) : null}
        {frame.blocks.length === 0 && frame.signals.length > 0 ? (
          <div className="generated-stream-signals" aria-label="Generated UI signals">
            {frame.signals.slice(0, 3).map((signal) => (
              <span key={signal}>{signal}</span>
            ))}
          </div>
        ) : null}
        {pendingApproval ? (
          <GeneratedApprovalActions
            approval={pendingApproval}
            onApprove={onApprove}
            onAskWhy={onAskWhy}
            onReject={onReject}
          />
        ) : null}
        <GeneratedPatchTrail patches={frame.patches} />
      </div>
    </section>
  );
}

function GeneratedMorphologyField({ morphFrame }: { morphFrame: StageMorphFrame }) {
  return (
    <div
      className="generated-morph-field"
      aria-hidden="true"
      data-morph-camera={morphFrame.camera.mode}
    >
      <div className="generated-morph-grid" />
      <div
        className="generated-morph-density-veil"
        data-clutter-risk={morphFrame.density.clutterRisk}
      />
      <div className="generated-morph-collapse-vectors">
        {morphFrame.collapseVectors.map((vector, index) => (
          <GeneratedMorphCollapseVector index={index} key={vector.id} vector={vector} />
        ))}
      </div>
      <div className="generated-morph-sockets">
        {morphFrame.sockets
          .filter((socket) => socket.role !== "nucleus")
          .map((socket, index) => (
            <GeneratedMorphSocket index={index} key={socket.id} socket={socket} />
          ))}
      </div>
      <div className="generated-morph-packets">
        {morphFrame.packets.map((packet, index) => (
          <GeneratedMorphPacket index={index} key={packet.id} packet={packet} />
        ))}
      </div>
      <div className="generated-morph-orbit">
        {morphFrame.orbit.map((orbitObject, index) => (
          <GeneratedMorphOrbitObject
            index={index}
            key={orbitObject.id}
            orbitObject={orbitObject}
          />
        ))}
      </div>
      <div
        className="generated-morph-nucleus"
        data-nucleus-status={morphFrame.nucleus.status}
      >
        <span />
        <i />
      </div>
      <div className="generated-morph-phase-rail">
        {morphFrame.phases.map((phase) => (
          <span
            data-phase-active={phase.active}
            data-phase-completed={phase.completed}
            key={phase.id}
            style={
              {
                "--phase-intensity": phase.intensity.toString()
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

function GeneratedMorphCollapseVector({
  index,
  vector
}: {
  index: number;
  vector: StageMorphCollapseVector;
}) {
  const dx = vector.toX - vector.fromX;
  const dy = vector.toY - vector.fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const style = {
    "--vector-angle": `${angle}deg`,
    "--vector-delay": `${index * 85}ms`,
    "--vector-intensity": vector.intensity.toString(),
    "--vector-left": `${vector.fromX}%`,
    "--vector-length": `${length}%`,
    "--vector-top": `${vector.fromY}%`
  } as CSSProperties;

  return (
    <span
      className="generated-morph-collapse-vector"
      data-vector-active={vector.active}
      data-vector-role={vector.role}
      style={style}
    />
  );
}

function GeneratedMorphPacket({
  index,
  packet
}: {
  index: number;
  packet: StageMorphPacket;
}) {
  const travelAngle = Math.atan2(packet.y - 47, packet.x - 50) * (180 / Math.PI);
  const style = {
    "--packet-angle": `${travelAngle.toFixed(2)}deg`,
    "--packet-delay": `${packet.delayMs + index * 18}ms`,
    "--packet-from-left": "50%",
    "--packet-from-top": "47%",
    "--packet-left": `${packet.x}%`,
    "--packet-progress": packet.progress.toString(),
    "--packet-top": `${packet.y}%`
  } as CSSProperties;

  return (
    <span
      className="generated-morph-packet"
      data-packet-lane={packet.lane}
      data-packet-op={packet.op}
      data-packet-phase={packet.phaseId}
      data-packet-status={packet.status}
      style={style}
    />
  );
}

function GeneratedMorphOrbitObject({
  index,
  orbitObject
}: {
  index: number;
  orbitObject: StageMorphOrbitObject;
}) {
  const style = {
    "--orbit-angle": `${orbitObject.angle}deg`,
    "--orbit-radius": `min(${(10 + orbitObject.distance * 28).toFixed(2)}rem, 40vw)`,
    "--orbit-weight": orbitObject.weight.toString(),
    "--orbit-delay": `${index * 90}ms`
  } as CSSProperties;

  return (
    <span
      className="generated-morph-orbit-object"
      data-orbit-label={formatOrbitLabel(orbitObject.label)}
      data-orbit-role={orbitObject.role}
      data-orbit-status={orbitObject.status}
      style={style}
    >
      <i />
    </span>
  );
}

function formatOrbitLabel(label: string): string {
  const compact = label.replace(/\s+/g, " ").trim();

  return compact.length > 18 ? `${compact.slice(0, 17).trimEnd()}…` : compact;
}

function GeneratedMorphSocket({
  index,
  socket
}: {
  index: number;
  socket: StageMorphSocket;
}) {
  const style = {
    "--socket-height": `${socket.height}%`,
    "--socket-left": `${socket.x}%`,
    "--socket-top": `${socket.y}%`,
    "--socket-width": `${socket.width}%`,
    "--socket-delay": `${index * 120}ms`
  } as CSSProperties;

  return (
    <span
      className="generated-morph-socket"
      data-socket-label={socket.label}
      data-socket-role={socket.role}
      data-socket-state={socket.state}
      style={style}
    >
      <i />
    </span>
  );
}

function GeneratedApprovalActions({
  approval,
  onApprove,
  onAskWhy,
  onReject
}: {
  approval: ApprovalRequest;
  onApprove: (approvalId: string) => void;
  onAskWhy: (approvalId: string) => void;
  onReject: (approvalId: string) => void;
}) {
  return (
    <div className="generated-stream-actions" aria-label="Approval actions">
      <span>{approval.riskLevel} approval</span>
      <button onClick={() => onReject(approval.id)} type="button">
        Reject
      </button>
      <button onClick={() => onAskWhy(approval.id)} type="button">
        Why
      </button>
      <button onClick={() => onApprove(approval.id)} type="button">
        Approve
      </button>
    </div>
  );
}

function GeneratedBlockView({
  block,
  index
}: {
  block: GeneratedBlock;
  index: number;
}) {
  const style = {
    animationDelay: `${index * 90}ms`
  };

  if (block.kind === "list") {
    return (
      <div
        className={`generated-stream-detail generated-stream-detail-${block.weight} generated-stream-detail-list`}
        data-block-kind={block.kind}
        style={style}
      >
        <span>{block.label}</span>
        <ul>
          {block.items.slice(0, 5).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      className={`generated-stream-detail generated-stream-detail-${block.weight}`}
      data-block-kind={block.kind}
      style={style}
    >
      <span>{block.label}</span>
      <strong>{block.value}</strong>
    </div>
  );
}

function GeneratedPatchTrail({ patches }: { patches: GeneratedPatch[] }) {
  if (patches.length === 0) {
    return null;
  }

  return (
    <div className="generated-stream-patches" aria-label="Generated patch trail">
      {patches.slice(-4).map((patch) => (
        <span data-patch-op={patch.op} key={patch.id}>
          {patch.op} {patch.label}
        </span>
      ))}
    </div>
  );
}
