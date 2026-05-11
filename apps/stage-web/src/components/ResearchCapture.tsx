import type { ResearchEvent } from "@blackstage/stage-core";
import type { StageWebRealtimeDebugSummary } from "../voice/realtimeWebrtcBridge";

type ResearchCaptureProps = {
  events: ResearchEvent[];
  stageEventCount: number;
  isReplaying: boolean;
  realtimeDebugSummary?: StageWebRealtimeDebugSummary;
  onExport: () => void;
  onExportRealtimeDebug: () => void;
  onReplay: () => void;
  onReset: () => void;
};

export function ResearchCapture({
  events,
  stageEventCount,
  isReplaying,
  realtimeDebugSummary,
  onExport,
  onExportRealtimeDebug,
  onReplay,
  onReset
}: ResearchCaptureProps) {
  const latestEvent = events.at(-1);
  const latestEvents = events.slice(-4).reverse();

  return (
    <aside
      className="research-capture"
      aria-label="Research capture"
      data-testid="research-capture"
    >
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
      {realtimeDebugSummary ? (
        <div className="realtime-debug-summary" data-testid="realtime-debug-summary">
          <div className="panel-heading">
            <span>Realtime debug</span>
            <strong>{realtimeDebugSummary.eventCount}</strong>
          </div>
          <div className="trace-metrics trace-metrics-compact">
            <span>
              <strong>{realtimeDebugSummary.toolNames.length}</strong>
              <small>tools</small>
            </span>
            <span>
              <strong>{realtimeDebugSummary.maxElapsedMs}</strong>
              <small>ms max</small>
            </span>
            <span>
              <strong>{realtimeDebugSummary.audioEventCount}</strong>
              <small>audio</small>
            </span>
          </div>
          <p>
            {realtimeDebugSummary.toolCallObserved
              ? "tool call observed"
              : "events only"}
            {realtimeDebugSummary.toolOutputReturned ? " · output returned" : ""}
          </p>
          <button type="button" onClick={onExportRealtimeDebug}>
            Export debug
          </button>
        </div>
      ) : null}
      <div className="research-actions">
        <button
          type="button"
          disabled={stageEventCount === 0 || isReplaying}
          onClick={onReplay}
        >
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
