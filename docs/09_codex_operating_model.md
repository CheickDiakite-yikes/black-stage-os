# 09 Codex Operating Model

## Role of Codex

Codex is the engineering agent. It should transform product intent into code, tests, demos, and documentation.

The founding team should treat Codex like a tireless junior-to-senior engineering teammate that is strongest when given:

- Clear product intent.
- Specific acceptance criteria.
- Repo-level instructions.
- Good tests.
- Small coherent tasks.
- Reviewable diffs.
- Feedback loops.
- Research logging.

## Why AGENTS.md matters

Codex should always receive project instructions through `AGENTS.md`. The repo-level file should stay concise and practical. Deeper subdirectory instructions can be added later if packages need specialized rules.

## Work cycle

### 1. Define task

Each task should include:

- Objective.
- Why it matters.
- Files or packages likely involved.
- Acceptance criteria.
- Verification commands.
- Research logging requirement.
- What not to do.

### 2. Assign to Codex

Use a prompt from `codex/prompts/` or write a task-specific prompt.

### 3. Review output

Review for:

- Product fit.
- Code quality.
- Visual taste.
- Test coverage.
- State/event correctness.
- Security and approval behavior.
- Research instrumentation.

### 4. Record learning

Every meaningful task should produce at least one of:

- Product insight.
- Codex workflow insight.
- Prompting insight.
- Architecture insight.
- User/research insight.

### 5. Update instructions

When Codex repeats a mistake, update `AGENTS.md` or a task-specific doc.

## Recommended Codex modes

### Ask mode

Use for:

- Understanding repo.
- Generating plans.
- Architecture review.
- Debugging strategy.
- Research synthesis.

### Code mode

Use for:

- Implementing features.
- Refactoring.
- Adding tests.
- Creating fixtures.
- Updating docs.

### Review mode

Use for:

- Pull request review.
- Security review.
- UX consistency review.
- Test coverage review.

## Subagent usage

Use subagents for complex reviews or parallel analysis, not for every task.

Good subagent roles:

- Security reviewer.
- UX/taste reviewer.
- Architecture reviewer.
- Test coverage reviewer.
- Research instrumentation reviewer.
- Performance reviewer.

Example instruction:

```text
Spawn one subagent for each review dimension: UX taste, architecture, security/privacy, and research instrumentation. Wait for all results and return a consolidated punch list ranked by severity.
```

## Prompt pattern

Use this structure:

```text
Context:
What Blackstage is and why this task matters.

Task:
Specific implementation request.

Inputs:
Relevant docs/files.

Constraints:
What not to do.

Acceptance criteria:
Observable completion standard.

Verification:
Commands to run.

Research log:
What to record.
```

## Codex task quality scale

### Level 1: Mechanical

Codex completes simple code changes.

### Level 2: Feature

Codex implements a contained feature with tests.

### Level 3: Product-aware

Codex preserves the Blackstage design thesis while implementing.

### Level 4: Research-aware

Codex implements and logs evidence about the build process.

### Level 5: Founding-engineer quality

Codex proposes better architecture, catches product risks, writes tests, updates docs, and improves research instrumentation without losing the thesis.

The goal is to move Codex toward Level 5 through better docs, prompts, and feedback loops.

## Common failure modes to watch

- Generic UI.
- Too much implementation before product feel.
- Overcomplicated architecture.
- Missing tests.
- Missing research logs.
- Hidden agent activity.
- Weak approval flow.
- Treating artifacts like chat messages.
- Excessive dependencies.
- Not running verification commands.
- Silent data/privacy assumptions.

## Review checklist for Codex output

- Does it compile?
- Does it match the spec?
- Does it feel like Blackstage?
- Does it preserve calm?
- Does it show agent labor?
- Does it produce or improve artifacts?
- Are risky actions gated?
- Is state serializable?
- Are research events logged?
- Are docs updated?
- Did the task teach us anything?

## First three Codex assignments

1. Bootstrap monorepo and core structure.
2. Build Stage Shell v0 visual prototype with simulated agent events.
3. Add research instrumentation and exportable event logs.
