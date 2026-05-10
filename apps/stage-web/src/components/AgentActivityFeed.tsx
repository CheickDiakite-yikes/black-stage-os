import type { AgentEvent, IntentThread } from "@blackstage/stage-core";

type AgentActivityFeedProps = {
  canResume: boolean;
  canStartHarness: boolean;
  events: AgentEvent[];
  isRunning: boolean;
  onResume: () => void;
  onStartHarness: () => void;
  onStop: () => void;
  threadStatus: IntentThread["status"];
};

export function AgentActivityFeed({
  canResume,
  canStartHarness,
  events,
  isRunning,
  onResume,
  onStartHarness,
  onStop,
  threadStatus
}: AgentActivityFeedProps) {
  const wasStopped = threadStatus === "paused" && events.length > 0 && !isRunning;

  return (
    <section className="agent-feed" aria-label="Agent activity" data-testid="agent-activity-feed">
      <div className="panel-heading">
        <span>Visible labor</span>
        <strong>{events.length}</strong>
        {isRunning ? (
          <button className="agent-stop" type="button" onClick={onStop}>
            Stop
          </button>
        ) : null}
        {!isRunning && canResume ? (
          <button className="agent-stop" type="button" onClick={onResume}>
            Resume
          </button>
        ) : null}
        {canStartHarness ? (
          <button className="agent-stop" type="button" onClick={onStartHarness}>
            Run harness
          </button>
        ) : null}
      </div>
      {wasStopped ? (
        <p className="agent-feed-status">{canResume ? "Paused by user." : "Stopped by user."}</p>
      ) : null}
      <ol>
        {events.map((event) => (
          <li key={event.id} className={`agent-event agent-event-${event.type}`}>
            <span className="agent-event-type">{event.type.replace("_", " ")}</span>
            <div>
              <h3>{event.summary}</h3>
              {event.details ? <p>{event.details}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
