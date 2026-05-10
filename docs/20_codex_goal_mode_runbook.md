# Codex Goal Mode Runbook: First Long-Running Push After Prompt 1

## Purpose

This runbook defines how to use Codex `/goal` mode for the first long-running BlackStage build push **after Prompt 1 has already bootstrapped or partially bootstrapped the repo**.

The goal is not to build the full Black Stage OS. The goal is to create a convincing, reviewable, instrumented **Stage Shell v0** that proves the interface thesis:

> A human speaks or types intent into a black living render field. The field organizes itself into workspaces, visible agent activity, approval rituals, and usable artifacts.

## Why use `/goal`

Use `/goal` for work that is larger than one prompt but smaller than an open-ended backlog. Our first push is a good fit because it has:

- one durable objective: ship Stage Shell v0;
- clear constraints: no real external agent actions, no risky integrations, no auth/payment/email/browser-control;
- a validation loop: typecheck, lint, tests, build, smoke test, screenshot, visual review, and research log;
- a stopping condition: the demo runs and the required artifacts exist.

Do **not** use `/goal` for vague instructions like "build BlackStage" or "make it amazing." That will drift.

## Prompt 1 continuity rule

Because Prompt 1 was already started, Codex must:

- inspect the current repo state before making changes;
- preserve the package manager, framework, and folder structure unless there is a concrete blocker;
- avoid deleting or replacing existing scaffold work;
- complete missing bootstrap pieces only when necessary for Stage Shell v0;
- log any deviation from the Prompt 1 structure in the research run log.

The correct behavior is **continue and deepen**, not restart.

## Recommended first-run workflow

### 1. Enable goal mode

Use either Codex `/experimental` or add this to Codex config:

```toml
[features]
goals = true
```

A sample config is included at `.codex/config.goal-mode.toml.example`.

### 2. Start from the repo root

Run Codex from the root of the BlackStage repository so it can read `AGENTS.md`, docs, prompt files, and the current app scaffold.

```bash
codex
```

Then check:

```text
/status
```

Confirm the working directory, sandbox, approval policy, writable roots, and model.

### 3. First ask for a plan, not code

Before starting the long-running goal, ask Codex to read the core docs and produce a concise implementation plan.

Recommended:

```text
/plan You are continuing after Prompt 1 (`codex/prompts/01_bootstrap_repo.md`) was started or completed. Do not rerun the bootstrap from scratch. Inspect the current repo state, then read AGENTS.md, START_HERE.md, docs/06_mvp_stage_shell_spec.md, docs/05_system_architecture.md, docs/15_metrics_and_instrumentation.md, docs/20_codex_goal_mode_runbook.md, and codex/goals/first_long_run_stage_shell_v0_after_prompt1.md. Do not change files yet. Produce a checkpointed implementation plan for the first `/goal` run that builds Stage Shell v0 on top of the existing repo. Include stack assumptions, validation commands, risks, and the exact files you expect to create or modify.
```

If the plan is coherent, start the goal.

### 4. Start the goal

Paste the command in:

```text
codex/goals/first_long_run_stage_shell_v0_after_prompt1.md
```

### 5. Inspect progress

Use:

```text
/goal
```

The status should name:

- current checkpoint;
- what changed;
- what passed or failed;
- what remains;
- whether Codex is blocked.

Use:

```text
/goal pause
```

if the implementation drifts, rebuilds the repo unnecessarily, or touches prohibited areas.

### 6. Review the final state

Before accepting the work, review:

- app launch;
- screenshot or exported visual artifact;
- tests, typecheck, lint, and build logs;
- event instrumentation;
- research run log;
- scorecard;
- diff quality;
- security/privacy boundaries;
- whether the Stage actually feels alive.

Do not accept a technically passing build if the experience feels like a normal chat app.

## First-push deliverables

Codex should produce:

1. A working local Stage Shell v0 web app.
2. A black living render field visual system.
3. An intent composer with text input and voice-native affordance placeholders.
4. A simulated agent activity timeline.
5. Approval cards for consequence-bearing actions.
6. Render objects: cards, panels, artifact previews, decision surfaces.
7. At least three scripted demo scenarios.
8. Event instrumentation for intent, render, agent activity, approval, and artifact events.
9. A session export or research log mechanism.
10. Passing validation commands.
11. A screenshot saved under `artifacts/screenshots/`.
12. A research run log and scorecard under `docs/research/runs/`.

## Prohibited in first goal run

Do not implement:

- real email sending;
- real payments;
- real browser/computer control;
- real file deletion or destructive actions;
- OAuth/auth flows;
- persistent storage of sensitive personal data;
- production deployment;
- real external agents acting on third-party websites;
- hidden background activity without visible status.

Everything risky should be simulated in v0.

## The stopping rule

Stop only when:

- the local app runs;
- build passes;
- typecheck passes, or there is a documented reason typecheck is not available;
- lint passes, or there is a documented reason lint is not available;
- tests pass;
- a smoke test opens the app and verifies core UI elements;
- at least one screenshot is saved to `artifacts/screenshots/`;
- `docs/research/runs/<YYYY-MM-DD>-stage-shell-v0.md` exists and records the build loop;
- `docs/research/runs/<YYYY-MM-DD>-stage-shell-v0-scorecard.md` exists and scores the demo against the rubric;
- no prohibited scope was implemented.

## Stage Shell v0 rubric

Score each category from 1 to 5.

| Category | Question | Target |
|---|---|---:|
| Living field | Does the black surface feel like a latent world rather than a static page? | 4+ |
| Intent clarity | Can a user tell what to do immediately? | 4+ |
| Render intelligence | Does the UI organize itself around intent? | 4+ |
| Agent visibility | Is machine labor visible without being noisy? | 4+ |
| Approval elegance | Do risky actions require clear, elegant confirmation? | 4+ |
| Artifact value | Does the output become something usable? | 4+ |
| Taste | Does it feel like the future rather than a SaaS dashboard? | 4+ |
| Safety | Are risky actions simulated or gated? | 5 |

The first run is a success if all deterministic checks pass and the average rubric score is at least 4.0 with no safety score below 5.

## Research capture

Every long-running Codex run should create a research log with:

- initial objective;
- exact prompt or goal text used;
- Prompt 1 repo state at the start;
- checkpoints;
- failures and recoveries;
- validation commands;
- artifacts generated;
- subjective quality observations;
- Codex behaviors worth studying;
- product insights about agentic interfaces;
- follow-up hypotheses.

This is not administrative busywork. This is the beginning of our paper trail for studying how to build complex AI-native products with AI agents.
