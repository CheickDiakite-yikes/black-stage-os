# Stage Web Harness Policy Visibility Slice

Date: 2026-05-11

## Why this slice

The background harness now has a root workflow policy and typed readiness contract, but the Stage Shell only showed queue counts. The operator should be able to see which policy and upstream worker posture governs the mounted harness.

## Prompt

Continue the Blackstage goal loop after aligning the harness with Codex, Symphony-style orchestration, and `gpt-realtime-2`; keep visible agent labor calm and auditable.

## What changed

- Stage Web can read a local harness runner URL from `window.__blackstageHarnessRunnerUrl` for browser-shaped tests and local embeds.
- The `Harness edge` status now renders a quiet policy line when the runner is reachable.
- The policy line names `WORKFLOW.md`, the Symphony-style queue, Codex CLI, and `gpt-realtime-2`.
- Added a focused Playwright e2e test with a mocked local runner readiness/snapshot/proofs response.

## Validation

- `pnpm build`: passed across the sorted workspace.
- `pnpm typecheck`: passed across 8 of 9 workspace projects.
- `pnpm lint`: passed.
- `pnpm test`: passed, including the workflow policy check plus 23 `voice-core` subtests, 4 `memory-core` subtests, 15 `agent-runtime` subtests, 9 `stage-broker` subtests, and 13 `stage-runner` subtests.
- `pnpm --filter @blackstage/stage-web typecheck`: passed.
- `pnpm --filter @blackstage/stage-web test:e2e -- tests/harness-policy.spec.ts`: passed with one browser test.
- Temporary Playwright visual smoke at `http://127.0.0.1:4191/`: passed with no console errors and screenshot saved outside the repo at `/tmp/blackstage-harness-policy.png`.
- `pnpm scan:secrets`: passed with no high-confidence secrets across 210 tracked files after staging.

## Product insight

Visible governance matters. The status line should not just say that a runner is mounted; it should quietly show the operator which policy and worker posture is in force.

## AI-building insight

Browser-shaped mocks are useful for policy surfaces: they prove the local UI can render control-plane metadata without requiring a live background worker.
