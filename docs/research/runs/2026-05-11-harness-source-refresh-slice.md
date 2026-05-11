# Harness Source Refresh Slice

Date: 2026-05-11

## What Was Attempted

Refresh the repo-backed rationale for using OpenAI Codex CLI, Symphony-style orchestration, the Agents SDK manager-agent pattern, and `gpt-realtime-2` in the background Blackstage harness.

## Prompt Given To Codex

Continue the `/goal` loop and respond to the founder's suggestion that the agentic harness should leverage open-source Codex, OpenAI Symphony orchestration, and the new Realtime voice model.

## What Codex Did Well

- Kept the already-pushed spoken-command slice intact before starting new work.
- Verified the harness stack against official OpenAI and OpenAI GitHub sources before editing.
- Added a source-refresh section to `docs/19_source_notes_codex.md`.
- Extended `pnpm check:workflow` so the source-backed stack decision is tested with the rest of the workflow policy.

## What Failed Or Needed Human Intervention

No human intervention was needed. The current implementation already had the right provider split; this slice made the rationale easier to audit.

## Product Insight

The upstream tools should power the backstage labor loop, not become the visible product metaphor. Blackstage still needs to feel like a living render field, with provider work translated into stage objects, approvals, proof, and replay.

## AI-Building Insight

Rapidly changing provider surfaces need a lightweight source-refresh loop. A small repo check is enough to catch accidental drift without overbuilding dependency detection.

## Evidence

Validation for this slice should include:

- `pnpm check:workflow`
- `pnpm exec prettier --check docs/19_source_notes_codex.md docs/research/runs/2026-05-11-harness-source-refresh-slice.md scripts/check-workflow-policy.mjs`
- `pnpm scan:secrets`
- `git diff --check`
