# Render Field Reference Analysis

Date: 2026-05-15

## What Was Attempted

Inspected `/Users/cheickdiakite/Downloads/Create_a_cinematic_futuristic (1).mp4`
frame by frame to correct the active goal toward the core Blackstage rendering
problem: the living field, not merely the runtime loop.

## Prompt Given To Codex

The user noted that the build was focusing on everything except the key element:
rendering field design and animation. They supplied a second cinematic reference
video and asked to inspect it in granular frame detail and potentially update
the goal.

## Reference Read

- The clip is 8 seconds, 1280x720, 24fps.
- `00:00-00:02`: empty black field, central listening orb, small instruction,
  constellation geometry, orbit rings, and privacy text.
- `00:02-00:03`: a single luminous document artifact materializes on a
  reflective stage floor with quiet agent telemetry.
- `00:03-00:04`: supporting intelligence instruments grow around the focal
  artifact: map, list, gauges, charts, and table.
- `00:04-00:05`: the focal surface becomes a dense analytical workbench while
  the surrounding instruments remain subordinate.
- `00:05-00:06`: a high-impact action appears as a central approval ritual and
  dims the field behind it.
- `00:06-00:08`: the action resolves into a geometric labor field with orbit
  rings, progress dots, small agent labels, and lit polyhedral forms.

## What Codex Did Well

- Extracted all 192 frames plus two-second contact sheets before making design
  claims.
- Converted the reference into engineering requirements instead of copying it
  as a static background.
- Updated the goal prompt and render-system spec so future slices remain
  rendering-first.
- Redirected the Stage Web implementation from grid placement toward semantic
  stage coordinates, focal depth, and floor anchoring.

## What Failed Or Needed Human Intervention

The previous Stage Shell progress had too much dashboard/card thinking. The
reference makes clear that organization intelligence must be spatial,
hierarchical, and materialized in the field itself.

## Product Insight

The future-feeling moment is not "many things on screen." It is one focal object
being surrounded by the right work objects at the right distance, with approval
and agent labor becoming visible material states.

## AI-Building Insight

Visual reference should be treated as evidence. Sampling frames before editing
helped prevent vague taste language from turning into arbitrary CSS polish.

## Evidence

- Contact sheets: `/private/tmp/blackstage_render_ref_1_frames/sheets/`
- Full frame extraction: `/private/tmp/blackstage_render_ref_1_frames/full/`
- Updated spec: `docs/28_cinematic_rendering_system.md`
- Updated goal prompt: `codex/goals/first_long_run_stage_shell_v0_after_prompt1.md`
