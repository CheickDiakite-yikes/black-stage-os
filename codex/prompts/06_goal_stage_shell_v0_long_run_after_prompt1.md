# Prompt 06: Goal Mode Long-Running Stage Shell v0 Push After Prompt 1

Use this after `codex/prompts/01_bootstrap_repo.md` has already been started or completed.

## Pre-goal planning prompt

```text
/plan You are continuing after Prompt 1 (`codex/prompts/01_bootstrap_repo.md`) was started or completed. Do not rerun the bootstrap from scratch. Inspect the current repo state, then read AGENTS.md, START_HERE.md, docs/06_mvp_stage_shell_spec.md, docs/05_system_architecture.md, docs/15_metrics_and_instrumentation.md, docs/20_codex_goal_mode_runbook.md, and codex/goals/first_long_run_stage_shell_v0_after_prompt1.md. Do not change files yet. Produce a checkpointed implementation plan for the first `/goal` run that builds Stage Shell v0 on top of the existing repo. Include stack assumptions, validation commands, risks, and the exact files you expect to create or modify.
```

## Goal prompt

Use the full prompt in:

```text
codex/goals/first_long_run_stage_shell_v0_after_prompt1.md
```

## Mid-run status prompt

```text
/goal
```

Expected answer:

- current checkpoint;
- files changed;
- validation run;
- next action;
- blocker status.

## If Codex drifts

```text
/goal pause
```

Then send:

```text
You are drifting from the first-run contract. Re-read docs/20_codex_goal_mode_runbook.md and codex/goals/first_long_run_stage_shell_v0_after_prompt1.md. Resume only the smallest path to Stage Shell v0 on top of the existing Prompt 1 repo. Do not rebuild the repo from scratch. Do not add real integrations, auth, payments, email sending, browser control, or deployment.
```

Then:

```text
/goal resume
```

## If Codex tries to rebuild the repo

```text
/goal pause
```

Then send:

```text
Prompt 1 has already created the repo scaffold. Preserve the current structure and continue from the existing files. Only create missing pieces required for Stage Shell v0. Do not switch frameworks or package managers unless the current scaffold cannot run, and if so, document the blocker first.
```

Then:

```text
/goal resume
```

## Final review prompt

```text
Review the final diff against AGENTS.md, docs/06_mvp_stage_shell_spec.md, docs/11_security_privacy_and_approvals.md, docs/12_quality_bar_and_demo_readiness.md, docs/15_metrics_and_instrumentation.md, and docs/20_codex_goal_mode_runbook.md. Identify bugs, product misses, safety risks, missing tests, missing research logs, and anything that makes the demo feel like a normal chatbot instead of a black living render field. Do not make changes until you present the review.
```

## Taste reminder

The first long run should not optimize for feature count. It should optimize for the first undeniable moment of the new interface:

```text
The black field is empty.
The user expresses intent.
The field organizes itself.
Agent labor becomes visible.
A risky action asks permission.
A usable artifact appears.
```
