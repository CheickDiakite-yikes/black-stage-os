# Stage Runner Local Service Slice

Date: 2026-05-10

## Why this slice

The user asked to keep pushing the `/goal` loop and specifically pointed toward a real agentic harness using Codex, Symphony-style orchestration, and Realtime voice. Realtime already had a local broker mount; the background labor side still needed a mounted local service boundary instead of only in-process contracts and UI fixtures.

## Prompt

Continue the Blackstage goal loop, commit and push as we go, and explore leveraging open-source Codex, OpenAI Symphony-style orchestration, and the newer OpenAI realtime voice stack for the background harness.

## What changed

- Added a browser-safe harness runner readiness contract in `agent-runtime`.
- Added `apps/stage-runner`, a localhost HTTP service with readiness, snapshot, enqueue, and run-next routes.
- Mounted dry-run Codex, dry-run Agents SDK, simulated voice, and Symphony-style snapshot projection behind the service.
- Blocked browser-origin mutations so Stage Web can inspect readiness without being allowed to enqueue or run workers.
- Added Stage Web `Harness edge` readiness display, defaulting to simulation unless `VITE_BLACKSTAGE_HARNESS_RUNNER_URL` is configured.
- Added root `pnpm dev:runner`.

## Validation

- `pnpm --filter @blackstage/stage-runner test`: passed with 7 server subtests.
- `pnpm --filter @blackstage/agent-runtime test`: passed with 15 harness subtests.
- `pnpm --filter @blackstage/stage-web typecheck`: passed.

Full repo validation is expected before commit.

## Product insight

The runner should feel like background labor infrastructure, not another panel or dashboard. A small `Harness edge` status is enough for v0: it tells the user the private worker edge exists while keeping the stage focused on intent and visible labor.

## AI-building insight

Mounting the queue and dry-run worker adapters as a local service creates a safer migration path to live Codex/Agents SDK work than jumping directly from UI fixtures to subprocess execution. The service contract can now be replayed, tested, and audited before real agents are allowed to write or call networks.
