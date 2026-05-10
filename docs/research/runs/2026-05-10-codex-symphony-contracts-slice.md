# Codex And Symphony Contracts Slice

Date: 2026-05-10
Run type: `/goal` implementation slice

## Prompt

Continue the Blackstage goal loop and explore Cheick's direction that the background harness should leverage open-source Codex, OpenAI Symphony-style orchestration, and `gpt-realtime-2`.

## What Was Attempted

- Add a local-only Codex worker adapter boundary without launching a Codex subprocess.
- Add workspace safety checks before any Codex worker envelope can be prepared.
- Add an internal Symphony-style control-plane projection from harness tasks.
- Keep Blackstage's event log, approvals, and stage projection as the product contract.

## What Codex Did Well

- Turned the provider strategy into typed contracts instead of jumping directly to live automation.
- Kept execution mode explicit as `dry_run`.
- Required approved `.blackstage/workspaces/*` task workspaces for Codex worker preparation.
- Preserved Symphony as an orchestration pattern while using `blackstage_internal_queue` as the first control plane.

## What Failed Or Needed Human Intervention

- No live Codex App Server, Codex CLI subprocess, Linear connector, or OpenAI API session was attempted.
- The next live step still needs a server/worker process boundary and human-reviewed execution policy.

## Product Insight

Blackstage can adopt Codex and Symphony without exposing a task tracker UI. The visible product remains the stage; provider mechanics stay behind render objects, proofs, and approvals.

## AI-Building Insight

The safest way to grow the harness is to make provider envelopes replayable first. Once the contract is inspectable, live execution can be added as a narrower change.

## Evidence

- `packages/agent-runtime/src/harness/codexWorkerAdapter.ts`
- `packages/agent-runtime/src/harness/symphonyControlPlane.ts`
- `packages/agent-runtime/test/inMemoryHarnessScheduler.test.mjs`
