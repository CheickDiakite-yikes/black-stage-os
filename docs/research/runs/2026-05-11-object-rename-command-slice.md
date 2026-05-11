# Object Rename Command Slice

Date: 2026-05-11

## What Was Attempted

Broaden deterministic stage-object correction by adding a bounded text/voice rename command for render objects.

## Prompt Given To Codex

Continue the active Blackstage `/goal` loop and take a careful slice on the natural-language edit gap without pretending arbitrary object editing is solved.

## What Codex Did Well

- Added a narrow `rename ... to ...` parser that targets existing stage objects through the same alias matching layer as focus/collapse/pin.
- Preserved replayability by recording `user.intervention` and `object.updated` events.
- Added browser proof for both typed rename and spoken rename.

## What Failed Or Needed Human Intervention

No human intervention was needed.

## Product Insight

Renaming an object is a small but important sign that the stage is editable matter, not a static response. The user can shape the cognitive workspace directly.

## AI-Building Insight

Bounded grammar is the right intermediate layer before model-backed free-form edits. It gives reliable behavior and trace evidence while leaving room for richer natural language later.

## Evidence

- `pnpm --filter @blackstage/stage-core typecheck`
- `pnpm --filter @blackstage/stage-web typecheck`
- `pnpm --filter @blackstage/stage-web exec playwright test tests/stage-shell.spec.ts -g "stage-object manipulation|spoken correction"`
