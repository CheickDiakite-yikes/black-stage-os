# Stage Web Harness Snapshot Slice

Date: 2026-05-10

## Why this slice

The local harness runner now exposes a snapshot route, but Stage Web only knew whether the runner was mounted. This slice keeps the browser read-only while letting the stage report the queue shape when a local runner URL is explicitly configured.

## Prompt

Continue the `/goal` loop after adding the local runner service. Keep the agentic harness in the background and preserve the Blackstage stage as the visible control surface.

## What changed

- Added a Stage Web snapshot probe for `GET /api/blackstage/harness/snapshot`.
- Kept the probe disabled unless `VITE_BLACKSTAGE_HARNESS_RUNNER_URL` is configured.
- Updated the `Harness edge` status to show open/review counts when a runner snapshot loads.
- Preserved browser mutation blocking: the browser still cannot enqueue work, run Codex, or receive provider credentials.

## Validation

- `pnpm --filter @blackstage/stage-web typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed.
- `pnpm typecheck`: passed.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with 9 browser tests.

## Product insight

Queue counts are enough for the first live edge hint. The user sees the existence and shape of background labor without turning the lower capture surface into a task dashboard.

## AI-building insight

The browser can become a read-only witness to orchestration before it becomes a controller. That makes it easier to prove auditability and calm visible labor before allowing live workers.
