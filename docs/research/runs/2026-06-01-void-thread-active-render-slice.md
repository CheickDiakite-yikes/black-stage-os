# 2026-06-01 Void Thread Active Render Slice

## Attempted

Shifted the active Stage Shell away from a card/control-room layout toward a sparse void-thread render: one focal response forms in the black field, while rails, artifact workbench, approval sidebar, thread map, and research chrome are hidden from the first viewport.

## Prompt / task

Cheick rejected the busy card wall and clarified that after the idle void, conversation should render one topic at a time from the black surface rather than opening a dashboard.

## What Codex did well

- Verified the previous active state with screenshots.
- Preserved the strong idle screen.
- Hid the dashboard chrome in active mode.
- Centered the focal stage object and reduced secondary objects to subtle markers.
- Added mobile/narrow active overrides to avoid stacked cards.

## What failed / needed human intervention

The first pass still showed visible labor, list rows, and an approval panel. Cheick corrected the product direction: this is not a card restyle problem; it is a temporal emergence problem.

## Product insight

The active stage must remain a black void with one generated conversational artifact forming at a time. Inspectable structure can exist later, but the first viewport should not expose rails, dashboards, or dense workbench controls.

## AI-building insight

GenUI for Blackstage should not mean generating more component panels. It should mean generating a focused render event: topic, focal object, supporting glints, risk threshold, and timing.

## Evidence

- Typecheck: `pnpm --filter @blackstage/stage-web typecheck`
- Screenshot artifacts generated outside the repo:
  - `/tmp/blackstage-01-idle.png`
  - `/tmp/blackstage-02-active-desktop.png`
  - `/tmp/blackstage-03-active-narrow.png`
