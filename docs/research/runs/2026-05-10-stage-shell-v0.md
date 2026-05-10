# Stage Shell v0 Long Run

Date: 2026-05-10

## Objective

Continue from the Prompt 1 bootstrapped BlackStage repo state and implement Stage Shell v0 without restarting the bootstrap.

Goal text used:

```text
/goal Continue from the current Prompt 1 bootstrapped BlackStage repo state and implement Stage Shell v0 without stopping until the verifiable end state is reached.
```

## Repo State After Prompt 1

- Existing stack: pnpm monorepo, TypeScript, React, Vite.
- Existing packages: `stage-core`, `stage-ui`, `agent-runtime`, `voice-core`, `memory-core`.
- Existing app: `apps/stage-web` with a strong idle black stage, center presence, ambient motion, and text input.
- Missing before this run: intent submission behavior, streamed render objects, simulated runtime, approval resolution, artifacts after approval, research event export, e2e smoke test, screenshot, run log, and scorecard.
- Baseline checks before implementation: `pnpm typecheck`, `pnpm lint`, and `pnpm test` passed; tests were placeholder echoes.

## Checkpoints Completed

1. Added deterministic Stage Shell scenarios for acquisition analysis, seed round planning, BlackStage build planning, and research synthesis.
2. Added simulated runtime helpers that emit timed stage events and approval continuations.
3. Extended stage/research event types for approval resolution, user intervention, session export, and thread creation.
4. Rebuilt `apps/stage-web` into an interactive Stage Shell with text intent, scenario launch buttons, local persistence, visible agent activity, approval cards, artifacts, Codex task cards, and local research trace export.
5. Added Playwright e2e coverage and screenshot capture under `artifacts/screenshots/stage-shell-v0.png`.
6. Fixed a layout bug caught by e2e where artifact content could intercept the approval button.
7. Fixed active-stage layering so the center presence remains atmospheric without text colliding with render objects.

## Validation Outcomes

- `pnpm typecheck`: passed during checkpoint validation.
- `pnpm lint`: passed during checkpoint validation.
- `pnpm test:e2e`: passed after layout fixes.
- Browser/devtools smoke: loaded `http://127.0.0.1:5174/`, launched Build BlackStage, observed object stream, approved action, and verified approved task/artifact state.
- Screenshot: `artifacts/screenshots/stage-shell-v0.png`.

Final full-gate outcomes:

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed; package tests are still placeholder echoes except e2e.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed; verified intent submission, streamed agent activity, approval resolution, approved artifact visibility, session export, screenshot capture, and no browser console/page errors.
- `pnpm scan:secrets`: passed; no high-confidence secrets found.

## Design Decisions

- Kept the existing React/Vite/pnpm stack.
- Kept v0 browser-only; no desktop wrapper.
- Used DOM/CSS motion and translucent stage objects rather than heavy 3D.
- Kept all consequence-bearing actions simulated and approval-gated.
- Used localStorage for v0 persistence and local research event storage.
- Reversed artifact display order so the approved artifact is the visible primary artifact after approval.

## Failures and Recoveries

- First e2e run failed because the Playwright web server command inherited an extra `--`; fixed by calling `pnpm exec vite` directly.
- Second e2e run caught a real click-interception bug where artifact layout overlapped the approval card; fixed with explicit CSS grid areas.
- Screenshot review showed active presence copy and research trace could visually collide with work objects; fixed active-stage layering and research trace placement.

## Codex Build Observations

- Did well: preserved the scaffold, used typed domain events, and converted product docs into a compact simulated runtime.
- Needed correction: the first visual layout passed static checks but failed real click/screenshot review, confirming that browser evidence is necessary for this product.
- Product insight: approval clarity reads better when it remains embedded in the stage rather than appearing as a generic modal.
- Product insight: the BlackStage self-build scenario is a strong demo because it makes the system's own labor visible.

## Scope Safety

- No real email, payment, browser control, file deletion, OAuth, deployment, or external agent action was implemented.
- All external-facing actions are labeled as simulated and gated by approval.
- Research logs store event metadata and redacted intent text only.
