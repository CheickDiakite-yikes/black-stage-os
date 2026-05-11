# Codex Proof Index Slice

Date: 2026-05-10

## Why this slice

The runner now writes local run proof packets, but there was no read-only way to inspect them through the runner service. This slice makes proof evidence discoverable without exposing raw workspace files or granting browser mutation rights.

## Prompt

Continue toward the active Blackstage goal by improving visible, auditable background labor without turning on live Codex by default.

## What changed

- Added a proof index reader for prepared `.blackstage/workspaces/*/blackstage-run.json` packets.
- Added `GET /api/blackstage/harness/proofs`.
- Returns sanitized proof summaries: task id, run id, adapter, status, summary, event count, proof path, and written timestamp.
- Extended temp-directory tests to verify proof summaries after a prepared dry-run task.

## Validation

- `pnpm --filter @blackstage/stage-runner typecheck`: passed.
- `pnpm --filter @blackstage/stage-runner test`: passed with 11 subtests.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed.
- `pnpm build`: passed.
- `pnpm test:e2e`: not rerun for this server-only proof-index slice; the Stage Web surface did not change after the previous e2e pass.

## Product insight

Auditable labor needs a quiet inspection path. The proof index gives Blackstage something it can later render as calm evidence instead of forcing the user to trust hidden background state.

## AI-building insight

Proof summaries let future review UI consume evidence without reading arbitrary workspace contents. That keeps the audit surface narrow and easier to secure.
