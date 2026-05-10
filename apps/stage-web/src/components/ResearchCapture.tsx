import type { ResearchEvent } from "@blackstage/stage-core";

type ResearchCaptureProps = {
  events: ResearchEvent[];
  onExport: () => void;
  onReset: () => void;
};

export function ResearchCapture({ events, onExport, onReset }: ResearchCaptureProps) {
  const latestEvent = events.at(-1);

  return (
    <aside className="research-capture" aria-label="Research capture" data-testid="research-capture">
      <div className="panel-heading">
        <span>Research trace</span>
        <strong>{events.length}</strong>
      </div>
      <p>{latestEvent ? latestEvent.eventType.replaceAll("_", " ") : "waiting for first event"}</p>
      <div className="research-actions">
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
