# Browser Compact Render And Orb Entry Slice

Date: 2026-05-15

## What Was Attempted

Use the Browser plugin to validate the real in-app Stage Shell surface after the
render-field organization pass. The target was a demo-free idle screen, a more
organized active field, reachable live voice controls, and compact debug access
without card overlap.

## Prompt Given To Codex

Use the Browser plugin instead of Playwright for the local visual check, then
continue systematically toward a field where necessary objects render fluidly
and interactively instead of overlapping or looking like a demo dashboard.

## What Codex Did Well

- Confirmed the idle startup is orb-first, quiet, and free of old demo buttons.
- Used Browser screenshots and DOM geometry to catch short-viewport issues that
  shell tests did not expose.
- Kept the active intent, plan, evidence, visible-labor, approval, artifact,
  command, and research regions spatially separated in the compact in-app
  viewport.
- Restored always-reachable `Send`, `Speak`, `Stage voice`, and `Export JSON`
  controls in the compact active field.
- Fixed the orb disable logic so Realtime voice arming can remain the startup
  path even when browser speech recognition is unavailable.

## What Failed Or Needed Human Intervention

The first compact Browser pass hid the command dock and research trace entirely.
The second pass made them visible, but focus on the intent input expanded the
command dock into a tall panel that overlapped the document object. A final CSS
pass kept the focused compact dock to one row.

## Product Insight

Quiet chrome is only successful if it stays reachable. Blackstage can hide
secondary instrumentation, but the orb, voice path, approval state, and debug
trace must never disappear during live testing.

## AI-Building Insight

Browser-plugin validation adds a different failure mode than headless e2e:
it exposes the real Codex in-app viewport and catches UI that technically
exists in the DOM but cannot be used or trusted visually.

## Evidence

- `apps/stage-web/src/components/StageShell.tsx`
- `apps/stage-web/src/styles/global.css`
- `artifacts/screenshots/browser-idle-orb-2026-05-15.jpg`
- `artifacts/screenshots/browser-active-compact-field-2026-05-15.jpg`
- Browser plugin geometry check: 1095 x 760 viewport, zero console warnings,
  zero measured overlaps among intent, plan, document, feed, approval,
  artifacts, command, and research regions after the final pass.
- `pnpm --filter @blackstage/stage-core typecheck`
- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm lint`
- `pnpm test` (rerun outside the sandbox for local 127.0.0.1 server tests)
- `pnpm build`
- `pnpm scan:secrets`
