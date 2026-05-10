import type { ApprovalRequest } from "@blackstage/stage-core";

type ApprovalCardProps = {
  approval?: ApprovalRequest;
  explanationVisible: boolean;
  onApprove: () => void;
  onReject: () => void;
  onAskWhy: () => void;
};

export function ApprovalCard({
  approval,
  explanationVisible,
  onApprove,
  onReject,
  onAskWhy
}: ApprovalCardProps) {
  if (!approval) {
    return null;
  }

  const isPending = approval.status === "pending";

  return (
    <section className="approval-card" aria-label="Approval request" data-testid="approval-card">
      <div className="panel-heading">
        <span>{isPending ? "Approval needed" : "Approval resolved"}</span>
        <strong>{approval.riskLevel}</strong>
      </div>
      <h2>{approval.title}</h2>
      <p>{approval.summary}</p>
      <dl className="approval-grid">
        <div>
          <dt>Action</dt>
          <dd>{approval.actionType.replace("_", " ")}</dd>
        </div>
        <div>
          <dt>Scope</dt>
          <dd>{approval.scope}</dd>
        </div>
        <div>
          <dt>Consequence</dt>
          <dd>{approval.consequence}</dd>
        </div>
        <div>
          <dt>Undo</dt>
          <dd>{approval.undoPath ?? "No undo path declared."}</dd>
        </div>
      </dl>
      {explanationVisible ? (
        <p className="approval-explanation">
          This gate exists because the proposed action would matter outside the stage in a real
          deployment. V0 keeps it simulated and local.
        </p>
      ) : null}
      <div className="approval-actions">
        <button type="button" onClick={onAskWhy} disabled={!isPending}>
          Ask why
        </button>
        <button type="button" onClick={onReject} disabled={!isPending}>
          Reject
        </button>
        <button className="primary-action" type="button" onClick={onApprove} disabled={!isPending}>
          Approve
        </button>
      </div>
      <p className="approval-status">Status: {approval.status}</p>
    </section>
  );
}
