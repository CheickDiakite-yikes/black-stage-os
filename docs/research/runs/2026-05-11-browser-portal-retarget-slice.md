# Browser Portal Retarget Slice

Date: 2026-05-11

## What Was Attempted

Make the simulated browser portal a little more controllable without turning on live browsing or external automation.

## Prompt Given To Codex

Continue the Blackstage `/goal` loop after aligning the background harness with open-source Codex, Symphony-style orchestration, the Agents SDK manager path, and `gpt-realtime-2`; keep external actions gated and auditable.

## What Codex Did Well

- Added a bounded `set browser portal to ...` command.
- Normalized safe local portal targets while rejecting unsupported URL protocols.
- Updated the browser portal surface as a local target and recorded the command as `user.intervention`.
- Added Playwright proof that no external browsing is implied by the URL retarget.

## What Failed Or Needed Human Intervention

No human intervention was needed. No browser automation or external network navigation was added.

## Product Insight

A portal that can be pointed by command feels more like living workspace material than a static demo card, even before it controls a real browser.

## AI-Building Insight

For high-impact integrations, local target state is a useful intermediate contract. It lets the stage learn how to represent intent and proof before granting real external control.

## Evidence

- `pnpm --filter @blackstage/stage-core typecheck`
- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "browser portal"`
- `pnpm lint`
- `pnpm scan:secrets`
