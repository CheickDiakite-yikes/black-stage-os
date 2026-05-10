# Local Codex Runner Boundary Slice

Date: 2026-05-10
Run type: `/goal` implementation slice

## Prompt

Continue the Blackstage goal loop after adding Codex, Symphony, and Realtime provider contracts. Keep committing and pushing as we go.

## What Was Attempted

- Add a disabled-by-default local Codex runner seam.
- Convert approved Codex tasks into an explicit `codex exec` command plan.
- Keep execution limited to `.blackstage/workspaces/*`.
- Require an injected executor before anything can run.
- Preserve human review, validation, no-push, and no hidden side-effect defaults.

## What Codex Did Well

- Used the local `codex exec --help` surface to ground the command plan.
- Kept live execution off by default and testable through an injected fake executor.
- Added scheduler support for blocked runs so disabled workers do not look like generic failures.
- Preserved the provider boundary: Stage events and harness events stay as the product record.

## What Failed Or Needed Human Intervention

- No live Codex subprocess was launched.
- No App Server, remote control, GitHub PR creation, or external tracker integration was attempted.
- Future live execution still needs explicit local configuration and a user-approved workspace creation flow.

## Product Insight

The stage can show a precise "I am ready to run this worker" proof before actually running it. That proof is valuable in its own right because it makes invisible agent labor inspectable.

## AI-Building Insight

The right next unit is not "turn on Codex"; it is "make a command plan that refuses unsafe state." That keeps the product moving toward real labor without skipping the trust layer.

## Evidence

- `packages/agent-runtime/src/harness/codexLocalRunner.ts`
- `packages/agent-runtime/src/harness/inMemoryHarnessScheduler.ts`
- `packages/agent-runtime/test/inMemoryHarnessScheduler.test.mjs`
