# Codex Workspace Preparation Slice

Date: 2026-05-10

## Why this slice

The Stage Runner could now describe and gate a Codex subprocess, but live execution still lacked a prepared workspace and task manifest. This slice adds the file-system boundary needed before any real worker should run.

## Prompt

Continue the active Blackstage goal. Avoid repeating completed Realtime and runner work, and choose the next concrete action toward a visible, auditable agentic harness.

## What changed

- Added a Stage Runner workspace manager.
- Generates deterministic `.blackstage/workspaces/*` paths for Codex tasks.
- Writes `blackstage-task.json` manifest packets with task, policy, and validation state.
- Enables workspace preparation only when explicitly configured or when the Codex subprocess mode is explicitly enabled.
- Rejects workspace escape attempts.
- Ignores `.blackstage/` in git so prepared workspaces stay local.

## Validation

- `pnpm --filter @blackstage/stage-runner test`: passed with 11 subtests.
- `pnpm --filter @blackstage/stage-runner typecheck`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm lint`: passed after preserving the caught workspace-preparation error cause.
- `pnpm build`: passed.
- `pnpm test:e2e`: not rerun for this server-only workspace slice; the Stage Web surface did not change after the previous e2e pass.

## Product insight

The runner is becoming a real backstage area. The user should see the stage and proof, while each worker gets a bounded local room with an explicit manifest.

## AI-building insight

Workspace preparation is a better live-execution gate than a boolean alone. It gives future Codex runs a place to record intent, policy, and validation status before they touch code.
