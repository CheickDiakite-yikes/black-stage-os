import type { ResearchEvent } from "@blackstage/stage-core";

type ResearchCaptureProps = {
  events: ResearchEvent[];
  stageEventCount: number;
  isReplaying: boolean;
  onExport: () => void;
  onReplay: () => void;
  onReset: () => void;
};

export function ResearchCapture({
  events,
  stageEventCount,
  isReplaying,
  onExport,
  onReplay,
  onReset
}: ResearchCaptureProps) {
  const latestEvent = events.at(-1);
  const latestEvents = events.slice(-4).reverse();

  return (
    <aside className="research-capture" aria-label="Research capture" data-testid="research-capture">
      <div className="panel-heading">
        <span>Research trace</span>
        <strong>{events.length}</strong>
      </div>
      <div className="trace-metrics" aria-label="Trace counters">
        <span>
          <strong>{stageEventCount}</strong>
          <small>stage events</small>
        </span>
        <span>
          <strong>{events.length}</strong>
          <small>research events</small>
        </span>
      </div>
      <p>
        {isReplaying
          ? `replaying ${stageEventCount} local stage events`
          : latestEvent
            ? latestEvent.eventType.replaceAll("_", " ")
            : "waiting for first event"}
      </p>
      {latestEvents.length > 0 ? (
        <ol className="trace-list" aria-label="Latest research events">
          {latestEvents.map((event) => (
            <li key={event.id}>
              <span>{event.eventType.replaceAll("_", " ")}</span>
              <time dateTime={event.timestamp}>
                {new Date(event.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit"
                })}
              </time>
            </li>
          ))}
        </ol>
      ) : null}
      <div className="research-actions">
        <button type="button" disabled={stageEventCount === 0 || isReplaying} onClick={onReplay}>
          Replay trace
        </button>
        <button type="button" onClick={onExport}>
          Export JSON
        </button>
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>
    </aside>
  );
}
