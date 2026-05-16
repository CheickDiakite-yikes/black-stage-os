import type { AgentEvent, ApprovalRequest } from "@blackstage/stage-core";
import type { CSSProperties } from "react";

type StageRitualFieldProps = {
  approval?: ApprovalRequest;
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
  events,
  isRunning
}: StageRitualFieldProps) {
  const visibleEvents = events.slice(-laborEventLimit);
  const status = approval?.status ?? (isRunning ? "working" : "listening");

  return (
    <section
      className={`stage-ritual-field stage-ritual-field-${status}`}
      aria-label="Central approval and visible labor field"
      data-event-count={events.length}
      data-has-approval={approval ? "true" : "false"}
      data-testid="stage-ritual-field"
    >
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
