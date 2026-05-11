# Codex Subprocess Boundary Slice

Date: 2026-05-10

## Why this slice

The local Stage Runner service could enqueue and dry-run Codex work, but the live Codex boundary still stopped at a command plan. The next safe step was to add the actual subprocess executor shape behind an explicit environment flag, while proving it with a fake process instead of launching Codex.

## Prompt

Continue the `/goal` loop and keep leveraging open-source Codex/Symphony-style orchestration carefully, with commits and pushes after validated slices.

## What changed

- Added a Node `codex exec` subprocess executor for the Stage Runner.
- Kept shell execution disabled.
- Wrote the Codex worker prompt through stdin.
- Added timeout and output limits.
- Mounted the executor only when `BLACKSTAGE_CODEX_SUBPROCESS_ENABLED=1`.
- Kept browser-origin mutations blocked and provider credentials out of the browser.
- Added tests with a fake child process; no real Codex subprocess ran.

## Validation

- `pnpm --filter @blackstage/agent-runtime build`: passed.
- `pnpm --filter @blackstage/stage-web typecheck`: passed.
- `pnpm --filter @blackstage/stage-runner test`: passed with 9 subtests.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm lint`: passed after replacing an unsupported test global.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with 9 browser tests.

## Product insight

The live Codex path should exist as an explicit power mode, not a hidden default. Blackstage should make background labor feel available while keeping the user aware of when real execution is armed.

## AI-building insight

A fake-process test gives useful confidence in subprocess wiring without paying the risk cost of launching a live coding agent during routine validation. The next live step can now focus on workspace preparation, approval semantics, and proof collection.
