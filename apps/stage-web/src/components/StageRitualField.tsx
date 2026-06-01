import type {
  AgentEvent,
  ApprovalRequest,
  StageSceneNode
} from "@blackstage/stage-core";
import type { CSSProperties } from "react";

type StageRitualFieldProps = {
  approval?: ApprovalRequest;
  approvalFocusNode?: StageSceneNode;
  events: AgentEvent[];
  isRunning: boolean;
};

const laborEventLimit = 7;
const laborPositions = [
  { x: "17%", y: "58%" },
  { x: "29%", y: "31%" },
  { x: "44%", y: "68%" },
  { x: "56%", y: "36%" },
  { x: "69%", y: "64%" },
  { x: "82%", y: "38%" },
  { x: "91%", y: "58%" }
];

export function StageRitualField({
  approval,
  approvalFocusNode,
  events,
  isRunning
}: StageRitualFieldProps) {
  const visibleEvents = events.slice(-laborEventLimit);
  const status = approval?.status ?? (isRunning ? "working" : "listening");
  const shouldRenderApprovalTether =
    approval?.status === "pending" && approvalFocusNode;

  return (
    <section
      className={`stage-ritual-field stage-ritual-field-${status}`}
      aria-label="Central approval and visible labor field"
      data-event-count={events.length}
      data-has-approval={approval ? "true" : "false"}
      data-testid="stage-ritual-field"
    >
      {shouldRenderApprovalTether ? (
        <svg
          className="stage-approval-tether"
          aria-hidden="true"
          focusable="false"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <path
            className="stage-approval-tether__line"
            d={drawApprovalTether(approvalFocusNode)}
            pathLength="1"
          />
          <circle
            className="stage-approval-tether__target"
            cx={approvalFocusNode.transform.x}
            cy={approvalFocusNode.transform.y}
            r="1.1"
          />
          <circle className="stage-approval-tether__gate" cx="94" cy="42" r="1.2" />
        </svg>
      ) : null}
      <div className="stage-labor-orbit" data-testid="stage-labor-orbit">
        <div className="stage-labor-orbit__spine" />
        {visibleEvents.map((event, index) => (
          <div
            key={event.id}
            className={`stage-labor-node stage-labor-node-${event.type}`}
            data-event-type={event.type}
            data-testid="stage-labor-node"
            style={
              {
                "--labor-x": laborPositions[index]?.x ?? "50%",
                "--labor-y": laborPositions[index]?.y ?? "50%"
              } as CSSProperties
            }
          >
            <span>{event.type.replace("_", " ")}</span>
          </div>
        ))}
      </div>
      {approval ? (
        <div
          className={`stage-approval-threshold stage-approval-threshold-${approval.status}`}
          data-approval-risk={approval.riskLevel}
          data-approval-status={approval.status}
          data-testid="stage-approval-threshold"
        >
          <div className="stage-approval-threshold__rings" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="stage-approval-threshold__copy">
            <div className="threshold-kicker">
              <span>Approval threshold</span>
              <strong>{approval.riskLevel}</strong>
            </div>
            <h2>{approval.title}</h2>
            <p>{approval.summary}</p>
            <small>{approval.actionType.replace("_", " ")}</small>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function drawApprovalTether(focusNode: StageSceneNode): string {
  const startX = focusNode.transform.x;
  const startY = focusNode.transform.y;
  const endX = 94;
  const endY = 42;
  const midpointX = (startX + endX) / 2;

  return [
    `M ${startX.toFixed(2)} ${startY.toFixed(2)}`,
    `C ${midpointX.toFixed(2)} ${(startY - 10).toFixed(2)}`,
    `${midpointX.toFixed(2)} ${(endY + 10).toFixed(2)}`,
    `${endX.toFixed(2)} ${endY.toFixed(2)}`
  ].join(" ");
}
