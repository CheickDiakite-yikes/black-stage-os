# Cinematic Render System Study

Date: 2026-05-14

## What Was Attempted

Study the founder-provided render demo video and `vercel-labs/json-render` as
prior art for a dynamic, fluid, schema-guarded Blackstage rendering system.

## Prompt Given To Codex

Understand the attached video as the target screen feel, study
`https://github.com/vercel-labs/json-render`, and reason systematically about how
to engineer a new dynamic rendering system beyond current market examples.

## What Codex Did Well

- Extracted video metadata and a contact sheet from the provided MP4.
- Identified the core visual language: liquid black substrate, luminous object
  islands, depth, focus, progressive materialization, and quiet telemetry.
- Inspected `json-render` at commit
  `0bbe6ed6394b23b5aee25320d03c9b7ac717e5b7`.
- Mapped the useful prior-art pattern to Blackstage: guarded catalog,
  progressive JSON Patch compatible streams, state bindings, actions, and
  devtools.
- Added the first `StageSceneManifest` compiler so render intelligence becomes a
  real contract instead of scattered CSS.

## What Failed Or Needed Human Intervention

No live aesthetic validation was completed in this slice. The first code step is
structural. The next slice must visually prove the scene manifest through an
SVG/vector field and Browser-plugin screenshots.

## Product Insight

The demo is not asking for prettier cards. It is asking for a cognitive scene
system where hierarchy, approval, evidence, and output feel physically organized
inside a living material.

## AI-Building Insight

`json-render` is valuable because it separates generation from rendering through
a guarded spec and patch stream. Blackstage should adopt that discipline but aim
the spec at scene semantics: camera, substrate, material, motion, clusters, and
auditable edges.

## Evidence

- Video: `/Users/cheickdiakite/Downloads/Create_a_cinematic_futuristic.mp4`
- Contact sheet: `/tmp/blackstage-video-study/contact-sheet.jpg`
- Source: `https://github.com/vercel-labs/json-render`
- `docs/28_cinematic_rendering_system.md`
- `packages/stage-core/src/render/StageSceneManifest.ts`
