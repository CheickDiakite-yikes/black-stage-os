# 2026-07-09 Typed Journey And Ritual Ownership

## Attempted

Prove the render field works voice-free, then push two more bounded slices
toward the quantum-field vision, committing and pushing each validated state
on `codex/void-thread-rendering`.

## No-voice proof

A Playwright script drove the real input dock (typed `Build BlackStage`,
clicked Send — no `stageIntent` URL shortcut, no speech APIs) at 1440x900 and
390x844: idle field -> wake/orbit -> digest/allocate -> approval ritual ->
card approve -> growth -> `workbench_revealed`, with zero console or page
errors on both viewports. Staged screenshots reviewed at each beat.

## Slices

1. **Snapshot commit `489b36f` — Grow the render field from the substrate.**
   Committed the shared WIP magic-field state (persistent surface matter,
   camera dolly, pressure well, tether, trails, materialization, third-pass
   foundations, test cleanup) after the typed proof.

2. **Commit `6227f5b` — Give the approval ritual one owner grown from the
   field.** The pending approval card now condenses downward from the tether
   point (materialization mask + heat-blur settle) instead of appearing as a
   dialog placed over the stage; while it holds the decision, the generated
   stream's duplicate action row recedes to a ghost echo (interactive, but
   clearly secondary). Contracts: the artifact proof asserts the ghosted row;
   the default-view debug-pane checks now treat only a *non-pending* approval
   card as a leak, because the pending card is the deliberate ritual surface.
   This also structurally fixed a sampling race where those checks could land
   inside the pending window (reproduced pre-slice: the same two tests failed
   transiently earlier in the day, and the startup test passed alone
   unchanged).

3. **Slice B — Intent presses into the field; the field never freezes.**
   On wake/orbit the pressure well stamps in once (small and bright, settling
   into its resting dent, driven by nucleus energy), and the density veil
   keeps a slow 14s breath. The veil keyframes restate its `blur(22px)`
   because `filter` is a single property; the field ellipse was left alone —
   the liquid-shear WIP animation already owns its motion, and stacking a
   second filter animation would fight it.

## Validation

- `pnpm test:morphology`: 5/5 after each slice (multiple runs; ~12s a run).
- Typed no-voice journey rerun after each slice: clean on both viewports.
- `corepack pnpm --filter @blackstage/stage-web typecheck`, targeted eslint,
  prettier checks, `git diff --check`: passed.
- Loose local images and `.claude/` were kept out of all commits.

## Product insight

Ownership is a rendering property. Two identical approve rows made the ritual
feel like UI duplication; dimming one to a ghost made the same DOM read as a
single ritual with an echo — hierarchy did the work that deleting would have
done, without losing the audit surface.

## Remaining risk

- GitHub reports 2 Dependabot vulnerabilities (1 high) on the default
  branch — unrelated to this pass but should be triaged.
- The ghost action row is still real DOM under the card; if the ritual card
  ever moves off-center, the force-clicked Why path in the artifact proof
  should be revisited.
- Voice remains the missing perturbation source: mic amplitude driving the
  pressure well and tether is the natural next slice.
