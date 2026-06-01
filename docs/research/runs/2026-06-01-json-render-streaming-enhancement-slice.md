# 2026-06-01 JSON Render Streaming Enhancement Slice

## Attempted

Studied the json-render playground/docs/examples as untrusted research input, then translated the useful mechanics into Blackstage's own stage-native generated stream.

## Prompt / task

Cheick asked to inspect json-render frame by frame, understand realtime/streaming GenUI more deeply, plan the next ten enhancements, and implement them systematically with laptop and phone verification.

## Ten enhancements implemented

1. Extracted the generated stream compiler from the React component.
2. Added a `GeneratedFrame` model with kind, source, sequence, blocks, patches, and signals.
3. Derived the frame sequence from renderable `StageEvent`s.
4. Compiled payloads into typed generated blocks instead of ad hoc JSX sections.
5. Added block weights so important fields can render with stronger hierarchy.
6. Added a patch clock with progress derived from event type.
7. Added a patch trail that reads as timing ticks instead of a code console.
8. Kept approval controls inside the generated surface.
9. Tuned laptop and phone layouts so clock, title, body, approval, and command dock do not collide.
10. Updated e2e coverage to assert stream sequence, patch clock, patch trail, generated body, approval resolution, artifact creation, and research persistence.

## What Codex did well

- Treated json-render as a contract pattern rather than a visual style to copy.
- Preserved the black void as the product surface.
- Moved from static generated cards toward frame/block/patch semantics.
- Committed and pushed the compiler extraction separately from the responsive visual tuning.

## What failed / needed human intervention

The live json-render playground did not run full generation in the browser session; the useful evidence came from docs, accessible snapshots, and the visible playground controls. The Blackstage implementation should continue with local deterministic fixtures before wiring real model-generated UI patches.

## Product insight

The right Blackstage GenUI primitive is not a "card" or even a "component." It is a stage-owned generated frame that receives validated patches over time.

## AI-building insight

json-render's strongest lesson is separation of authority: the agent proposes structured UI deltas, while the app owns catalog, validation, rendering, actions, and policy. Blackstage should keep that split, but render it as cinematic stage emergence.

## Evidence

- Typecheck/lint: `pnpm --filter @blackstage/stage-web typecheck`, `pnpm --filter @blackstage/stage-web lint`
- Responsive screenshots generated outside the repo:
  - `/tmp/blackstage-04-laptop.png`
  - `/tmp/blackstage-05-phone.png`
- External research URLs:
  - `https://json-render.dev/playground`
  - `https://json-render.dev/examples`
  - `https://json-render.dev/docs`
