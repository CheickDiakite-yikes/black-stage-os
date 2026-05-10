# AGENTS.md

This file defines how Codex should work inside the Black Stage OS repository.

## Mission

Build Black Stage OS, codename Blackstage: a voice-native, text-capable, agentic interface where a calm black living render field turns human intent into dynamic workspaces, visible agent labor, and approved artifacts.

The product must feel like a new category, not a chatbot skin.

## Founding collaboration

- Cheick is the founder, product owner, taste lead, and final decision-maker.
- GPT-5.5 Pro is the strategy, research, architecture, critique, and documentation partner.
- Codex is the engineering agent and implementation partner.

Treat this repository as both:
1. A product build.
2. A research lab studying AI-assisted product creation.

## Non-negotiable product principles

1. The black surface is a living render field, not a blank chat screen.
2. The interface is organized around intent threads, not files, apps, or tabs.
3. Voice is native, but text must remain available for precision.
4. The agent's work must be visible, auditable, and interruptible.
5. High-impact actions require explicit human approval.
6. Every serious output should become an artifact.
7. The system must feel calm, powerful, cinematic, and trustworthy.
8. Avoid clutter, dashboards, generic SaaS chrome, and cartoonish assistant tropes.
9. The first prototype must optimize for "I just saw the future," not feature count.
10. Instrument the product and build process from day one.

## Expected repository structure

Use this target structure unless Cheick explicitly changes it:

```text
apps/
  stage-web/              # Browser prototype of the Black Stage interface
  stage-desktop/          # Optional later Electron/Tauri wrapper
packages/
  stage-core/             # Domain models, event schemas, intent thread state
  stage-ui/               # Visual components for the living render field
  agent-runtime/          # Agent activity, task orchestration, approvals
  voice-core/             # Voice input/output and realtime event handling
  memory-core/            # User/project memory models and retrieval
docs/
  *.md                    # Product, architecture, research, operating docs
research/
  logs/                   # Experiment logs and build observations
templates/
  *.md                    # Reusable templates
```

If this structure does not exist yet, create it during bootstrap.

## Engineering defaults

- Prefer TypeScript for frontend and shared packages.
- Prefer a browser-based Stage Shell first. Add desktop wrapper later.
- Keep the first visual prototype lightweight. Use DOM/CSS/framer-style animation before introducing heavy 3D.
- Use current stable package versions at install time.
- Keep core domain models separate from UI components.
- Prefer explicit event schemas for everything that happens on the stage.
- Make state serializable so sessions can be saved, replayed, and studied.
- Use a minimal design system before building many screens.
- Every major feature should have a fixture/demo scenario.

## Required commands

Once the repo is bootstrapped, maintain these commands:

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm typecheck
pnpm format
```

If a command is not available yet, add it or document why it is intentionally deferred.

## Definition of done

A task is done only when:

- The implementation matches the relevant doc/spec.
- The code builds.
- Lint and typecheck pass.
- Relevant tests or fixture demos pass.
- The UI still preserves the Black Stage feeling.
- The change is documented if it changes behavior.
- Any research instrumentation impact is noted.
- The task can be explained in a concise PR summary.

## Research logging requirement

For meaningful tasks, add a short entry to `research/logs/` or the tracker workbook capturing:

- What was attempted.
- Prompt/task given to Codex.
- What Codex did well.
- What failed or needed human intervention.
- Time or iteration count if known.
- Product insight, AI-building insight, or both.
- Evidence link if available.

## Code review guidelines

When reviewing code, check:

- Does this preserve the living render field thesis?
- Is the UX calmer and more powerful, or noisier?
- Are agent actions visible and auditable?
- Are risky actions gated by approval?
- Are domain models explicit and testable?
- Are event names clear?
- Are privacy and memory boundaries respected?
- Are errors handled gracefully?
- Did we add complexity before proving value?

Treat generic, overbuilt, cluttered UI as a serious product bug.

## Codex behavior preferences

Before large tasks:

- Read the relevant docs.
- Restate the target outcome briefly.
- Identify risky assumptions.
- Make the smallest coherent implementation plan.
- Implement in vertical slices.
- Run verification commands.
- Summarize what changed and what remains.

For difficult reviews, use subagents when explicitly requested by Cheick. Good subagent roles include:

- UX taste reviewer.
- Security/privacy reviewer.
- Architecture reviewer.
- Test coverage reviewer.
- Research instrumentation reviewer.

## Do not do

- Do not turn Blackstage into a normal chatbot.
- Do not hide agent action behind a spinner.
- Do not add destructive actions without approval gates.
- Do not build a broad OS before proving Stage Shell v0.
- Do not add production dependencies without a reason.
- Do not store secrets, personal data, or user files casually.
- Do not fake research results. Simulated demos are allowed only when labeled as simulation.
- Do not optimize for enterprise dashboard aesthetics.
