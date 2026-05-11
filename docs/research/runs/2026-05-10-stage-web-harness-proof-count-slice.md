# Stage Web Harness Proof Count Slice

Date: 2026-05-10

## Why this slice

The runner exposes proof summaries, but the stage only read runner readiness and queue shape. This slice keeps the browser read-only while allowing Stage Web to show whether proof evidence exists.

## Prompt

Continue the active goal by making background agent labor more visible and auditable without enabling browser mutation or live Codex by default.

## What changed

- Added Stage Web proof-index probing for `GET /api/blackstage/harness/proofs`.
- Added proof summary parsing with a narrow browser-safe shape.
- Updated `Harness edge` status to include proof count when a runner is configured and reachable.
- Kept the default unconfigured state as simulation.

## Validation

- `pnpm --filter @blackstage/stage-web typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with 9 browser tests.

## Product insight

The proof count is a quiet signal: enough to tell the user evidence exists without turning the capture surface into a task dashboard.

## AI-building insight

Reading proof summaries through the runner, rather than raw files, keeps the browser path narrow and prepares for later visible audit/replay UI.
