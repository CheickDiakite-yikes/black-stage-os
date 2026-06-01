# 2026-06-01 Morphology Hypothesis Loop

## Attempted

Turned the 20-step morphology plan into a falsifiable review loop and device
guardrail for Stage Shell v0.

## Prompt / task

Cheick asked to execute the 20-step GenUI direction properly and
systematically, including research, hypothesis testing, design, commits,
pushes, and laptop/phone quality.

## Hypotheses under test

1. A user should describe the main experience as a living generated field, not a
   dashboard.
2. Dense work is acceptable only after nucleus, orbit, digest, sockets, patches,
   approval, and workbench reveal have appeared in order.
3. Audit cards are useful only when explicitly summoned through inspect mode.
4. Phone and laptop must preserve the same black-field hierarchy, even when
   phone inspect mode shows fewer audit surfaces.
5. The research export should prove morphology state without storing raw private
   prompt text.

## Review script

Run the local demo, submit `Build BlackStage`, and watch the first five seconds
without touching anything.

Ask the reviewer:

- What did you feel the system was doing before words appeared?
- Did the output feel generated from the conversation or dumped as a static
  card?
- When approval appeared, was it central enough to understand the risk?
- Did the final workbench feel earned or cluttered?
- Could you find the audit/debug view without it polluting the main surface?
- On phone, did the field remain calm and operable?

## Failure signals

- The first active viewport reads as panels, cards, or admin chrome.
- Approval becomes a side-panel notification instead of a ritual object.
- The generated stream has no stable sockets before content arrives.
- Phone view requires horizontal scrolling or hides the command dock.
- Inspect mode becomes the default visual language.
- Research export cannot reconstruct phase, mode, sockets, patches, approval
  state, and workbench state.

## Evidence added in this slice

- `morphology_frame_captured` research events record phase, mode, voice cadence,
  socket count, patch count, approval status, camera metrics, and workbench
  state.
- The visible research trace hides morphology spam while JSON export keeps the
  evidence.
- Desktop e2e verifies approval-gated artifact emergence and saved morphology
  telemetry.
- Phone e2e verifies generated morphology, command dock bounds, approval action
  bounds, no horizontal overflow, and sparse inspect mode.

## Commands

```bash
pnpm --filter @blackstage/stage-core test
pnpm --filter @blackstage/stage-web typecheck
pnpm --filter @blackstage/stage-web test:e2e --grep "streams intent into approval-gated artifacts"
pnpm --filter @blackstage/stage-web test:e2e --grep "preserves generated morphology on phone viewport"
```

## Product insight

The useful line is now sharper: the main stage should be generative morphology;
the old cards are a deliberately hidden audit layer. The phone version should
not try to show every audit surface. It should preserve the field first, then
offer a reduced inspect layer.

## AI-building insight

Telemetry has to describe the generated UI contract, not just app clicks. The
agent/research loop becomes better when each frame can say: current phase,
semantic mode, allocated sockets, active patches, approval state, and whether a
workbench has genuinely been revealed.
