# 2026-06-01 Void Thread Active Render Slice

## Attempted

Shifted the active Stage Shell away from a card/control-room layout toward a sparse void-thread render: one focal response forms in the black field, while rails, artifact workbench, approval sidebar, thread map, and research chrome are hidden from the first viewport.

Follow-up pass converted the active state from a centered legacy object into a generated stream surface. The surface now compiles the latest `StageEvent` payload into a topic-specific render: headings, summaries, structured fields/lists, and generated approval controls.

## Prompt / task

Cheick rejected the busy card wall and clarified that after the idle void, conversation should render one topic at a time from the black surface rather than opening a dashboard.

## What Codex did well

- Verified the previous active state with screenshots.
- Preserved the strong idle screen.
- Hid the dashboard chrome in active mode.
- Centered the focal stage object and reduced secondary objects to subtle markers.
- Added mobile/narrow active overrides to avoid stacked cards.
- Added `StageGeneratedStream`, driven by the stage event log rather than accumulated visible cards.
- Rendered artifact/object payloads as generated fields and lists, including objective, files, acceptance criteria, sections, and nodes.
- Moved approval actions into the generated surface so the old approval card can disappear without breaking the approval gate.
- Updated the active e2e coverage to assert the generated stream, hidden legacy constellation, approval resolution, artifact creation, and research-event persistence.

## What failed / needed human intervention

The first pass still showed visible labor, list rows, and an approval panel. Cheick corrected the product direction: this is not a card restyle problem; it is a temporal emergence problem.

The second pass exposed a functional regression: hiding the old approval card also hid the approval action. That forced the better product answer: approval should be generated in the stream, not preserved as a side card.

## Product insight

The active stage must remain a black void with one generated conversational artifact forming at a time. Inspectable structure can exist later, but the first viewport should not expose rails, dashboards, or dense workbench controls.

Approval belongs inside the generated surface when it is the next required action. This keeps human control visible without restoring a dashboard rail.

## AI-building insight

GenUI for Blackstage should not mean generating more component panels. It should mean generating a focused render event: topic, focal object, supporting glints, risk threshold, and timing.

The near-term contract should become `StageEvent -> generated frame -> validated render blocks`, where the model/runtime can propose content but the app owns the renderer, action registry, and approval policy.

## Evidence

- Typecheck: `pnpm --filter @blackstage/stage-web typecheck`
- Lint: `pnpm --filter @blackstage/stage-web lint`
- Build: `pnpm --filter @blackstage/stage-web build`
- Targeted e2e: `pnpm --filter @blackstage/stage-web test:e2e --grep "streams intent into approval-gated artifacts"`
- Screenshot artifacts generated outside the repo:
  - `/tmp/blackstage-01-idle.png`
  - `/tmp/blackstage-02-active-desktop.png`
  - `/tmp/blackstage-03-active-narrow.png`
