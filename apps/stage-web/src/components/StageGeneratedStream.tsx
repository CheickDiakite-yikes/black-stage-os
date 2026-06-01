import type { ApprovalRequest, IntentThread, StageEvent } from "@blackstage/stage-core";
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
  const pendingApproval = thread.approvals.find(
    (approval) => approval.status === "pending"
  );
  const clockStyle = {
    "--stream-progress": frame.sequence.progress.toString()
  } as CSSProperties;

  return (
    <section
      className={`stage-generated-stream stage-generated-stream-${frame.kind}`}
      aria-label="Streaming generated interface"
      data-frame-kind={frame.kind}
      data-frame-sequence={frame.sequence.index}
      data-frame-source={frame.source}
      data-testid="stage-generated-stream"
    >
      <div className="generated-stream-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="generated-stream-meta">
        <span>{frame.label}</span>
        <strong>{frame.source}</strong>
      </div>
      <div
        className="generated-stream-clock"
        style={clockStyle}
      >
        <span>{frame.sequence.label}</span>
        <i aria-hidden="true" />
      </div>
      <div className="generated-stream-surface" key={frame.id}>
        <h2>{frame.title}</h2>
        <p>{frame.summary}</p>
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
