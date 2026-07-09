# 2026-07-04 Magic Rendering Field Pass

## Attempt

Use Fable 5 as a bounded creative implementation partner for one more morphology pass after the third-pass cleanup. The goal was to push Blackstage away from "UI on a black background" and toward a black render field that visibly creates work: intent pressure, allocated sockets, packets, condensation, and readable surfaces grown from the substrate.

Codex guided the run with a narrow prompt and then interrupted once Fable stalled on broad/diff-heavy reads. A second prompt constrained the model to targeted slices and a small implementation surface.

## Prompt Shape

- Preserve the existing dirty tree and Codex's test cleanup.
- Do not revert the 5/5 `pnpm test:morphology` baseline.
- Take one bounded "Magic Rendering Field" slice.
- Prefer `StageGeneratedStream.tsx`, `global.css`, and focused morphology tests/logs.
- No new dependencies, no broad architecture rewrite, no commit.
- Keep phone, reduced motion, readability, and audit-hidden default view intact.

## What Changed

- `StageGeneratedStream.tsx`
  - Exposes camera focus as CSS custom properties for field deformation.
  - Adds packet origin/angle variables so packet wakes can point back toward the core.
- `global.css`
  - Adds a pressure well under the morph nucleus so the substrate appears dented by intent.
  - Retargets the density veil/grid around the morph focus point.
  - Adds a condensation tether from the lifted nucleus into the generated surface.
  - Adds packet matter trails so work packets read as flow rather than teleportation.
  - Adds a materialization mask and creation sweep so workbench content reads as condensed out of the field.
  - Fixed one Fable selector drift from `.stage-morph-workbench-revealed` to `.stage-morph-workbench_revealed`.
- Screenshot artifacts were refreshed by the morphology test run:
  - `artifacts/screenshots/stage-shell-v0.png`
  - `artifacts/screenshots/stage-shell-phone-v0.png`

## What Fable Did Well

- Found a high-leverage visual language without changing product architecture.
- Used existing morph data rather than inventing a second rendering system.
- Produced the strongest product insight of the pass: field creation is more convincing when the nucleus, sockets, packets, and generated surface share one visible material channel.

## What Needed Human Intervention

- The first run got stuck reading a large/diff-heavy state and had to be stopped.
- The second run kept asking for small `grep`/`sed` reads; Codex allowed safe reads one at a time.
- Fable stopped after creative edits and did not complete the validation/logging requirement.
- Codex fixed the workbench selector typo, ran formatting, reran validation, and wrote this log.

## Validation

- `corepack pnpm --filter @blackstage/stage-web typecheck` passed.
- `corepack pnpm exec eslint apps/stage-web/src/components/StageGeneratedStream.tsx apps/stage-web/tests/stage-shell.spec.ts` passed.
- `corepack pnpm exec prettier --check apps/stage-web/src/components/StageGeneratedStream.tsx apps/stage-web/src/styles/global.css apps/stage-web/tests/stage-shell.spec.ts` passed.
- `git diff --check` passed.
- `pnpm test:morphology` passed 5/5 using the repo pnpm 8 wrapper:
  - startup-intent morphology demo URL
  - research/planning morphology adaptation
  - reduced-motion legibility
  - approval-gated artifacts
  - phone viewport preservation

## Product Insight

The field feels most alive when geometry is causal. A label or glow is not enough; the user needs to see work travel from intent pressure to allocation to materialized surface. The nucleus-to-surface tether and packet wakes are more effective than extra decorative particles because they imply an actual production channel.

## Continuation: Persistent Matter And The Infinite Window

Cheick re-anchored the pass mid-run with the product vision: a voice-native
render playground where the screen behaves like a quantum field — matter on
screen morphs while the conversation continues, and the viewport is a window
onto an unbounded field. That reframing exposed the two biggest remaining
"UI placed on top" tells, and the second leg of the pass removed them:

- **Persistent surface matter.** The generated surface container previously
  remounted on every stage event (`key={frame.id}`), blinking all content out
  and condensing it back — a slideshow, not a field. The container is now
  never remounted; only content that actually changed re-condenses (title and
  summary are keyed by their own text). The reduced-motion proof now holds a
  reference to the surface DOM node early in the stream and asserts the same
  node is still on stage at the approval ritual, so morph-not-remount is a
  tested contract, not a styling accident.
- **Camera dolly across an unbounded field.** The whole substrate now pans
  toward the existing `camera.focusX/focusY` contract data and pushes in with
  `camera.depth` (`--morph-dolly-pan` / `--morph-dolly-gain`), so phase
  changes read as the window drifting over a larger field instead of states
  toggling in place. The dolly is gentler on phone, and the phone phase rail
  moved to `11rem` so reveal-depth drift cannot push it into the intent dock.
- **Completed the tether/creation keyframes** (`generated-tether-flow`,
  `generated-creation-band`) and gave the persistent surface's children their
  own condensation, with the title materializing downward from the tether
  point.
- **Contract hardening.** Reduced-motion evidence now asserts: tether pseudo
  present and visible at the approval ritual, camera focus custom property
  set from frame data, and a fully materialized title without animation
  dependence. The phone proof asserts the tether exists and polls its
  opacity (a single sample can land mid transition).

Continuation validation (repo pnpm 8.15.7): typecheck, targeted eslint,
prettier check, `git diff --check`, and `pnpm test:morphology` 5/5 all passed
after the changes; tracked desktop/phone screenshot artifacts were refreshed
by the suite, and staged 1440x900 / 390x844 captures across
orbit/digest/approval/workbench were reviewed for taste.

One capture-harness note: during the approval ritual the visible approval
card intercepts pointer events over the generated stream's duplicate
approve row. The e2e suite clicks the card itself so tests are unaffected,
but the duplicated approve affordance is worth a design decision in the
approval-ritual rework.

## Continuation Product Insight

Persistence is what makes generation believable. When the surface is torn
down and rebuilt for every patch, the field reads as a renderer playing
clips; when the same matter stays on stage and only the changed parts
re-condense, the field reads as a medium that is thinking. The cheapest
"magic" in this pass was deleting one React key.

## Remaining Risk

- Phone approval is readable but visually dense; it needs a naive-user/taste review before further embellishment.
- This remains fixture-backed morphology proof, not live model-patch validation.
- The pass improved generation feel but did not add new interaction semantics; the next useful slice should connect field morphology to interruptible/approvable agent labor.
- The approval ritual currently shows two approve rows (central card plus the
  generated stream's actions behind it); one of them should own the ritual.
- Voice envelope data still only drives the nucleus/pressure well; live mic
  amplitude perturbing the field remains future work.
