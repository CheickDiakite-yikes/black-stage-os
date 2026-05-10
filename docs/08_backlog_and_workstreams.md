# 08 Backlog and Workstreams

## Workstreams

### W1 Product and UX

Owns product thesis, interaction model, design quality, demo flows, user research, and taste.

### W2 Stage frontend

Owns the black render field, components, animation, layout, and user interaction.

### W3 Core domain and state

Owns intent threads, event schemas, stage objects, artifacts, approvals, and persistence.

### W4 Agent runtime

Owns simulated and real agent work, task state, evidence, approvals, and cancellation.

### W5 Voice and conversation

Owns voice input/output, transcript handling, realtime interaction, and interruption.

### W6 Memory and context

Owns thread memory, project memory, retrieval, privacy policy, and memory inspection/deletion.

### W7 Research instrumentation

Owns product analytics, build logs, Codex task logs, experiments, and publication-ready evidence.

### W8 Security, privacy, and trust

Owns approval policy, audit logs, data boundaries, safe defaults, and risk reviews.

## Initial task backlog

### Foundation

- Initialize monorepo.
- Add AGENTS.md.
- Add docs.
- Add package manager and workspace config.
- Add lint/typecheck/test commands.
- Add basic CI if repository is connected to GitHub.
- Add design tokens.

### Stage Shell

- Build StageRoot.
- Build PresenceCore.
- Build text input.
- Add voice input experiment.
- Build IntentCard.
- Build PlanCard.
- Build AgentActivityFeed.
- Build ApprovalCard.
- Build ArtifactCard.
- Build CodexTaskCard.
- Add animations for object emergence.
- Add demo fixture selector.

### Core state

- Define IntentThread type.
- Define StageObject type.
- Define AgentEvent type.
- Define ApprovalRequest type.
- Define Artifact type.
- Implement event reducer.
- Implement render manifest generator.
- Implement local persistence.
- Implement thread replay.

### Agent runtime

- Build simulated agent runtime.
- Stream event steps.
- Add task cancellation.
- Add task redirection.
- Add approval-needed event.
- Add evidence references.
- Add future tool adapter interface.

### Artifact engine

- Define artifact model.
- Create artifact from fixture.
- Render artifact preview.
- Open artifact in focus mode.
- Export artifact as markdown.
- Attach artifact to thread.

### Research

- Define ResearchEvent.
- Log key product events.
- Add build task log template.
- Add experiment log template.
- Add dashboard export.
- Add session replay notes.

### Trust and safety

- Implement approval categories.
- Implement risk labels.
- Add approval history.
- Add data handling notes.
- Add memory policy UI placeholder.
- Add "why" explainer.

## Prioritization rule

Use this order:

1. Anything required to make the stage feel alive.
2. Anything required to make intent threads real.
3. Anything required to show agent labor.
4. Anything required to produce artifacts.
5. Anything required to preserve trust.
6. Everything else.

## PR sizing

Keep early PRs small and demoable.

Good PR:

- Adds one core component or one domain primitive.
- Includes fixture data.
- Includes tests where appropriate.
- Includes screenshots or short demo notes.
- Updates docs if needed.

Bad PR:

- Adds many dependencies.
- Rewrites architecture without a decision log.
- Hides product behavior inside generic components.
- Ships no visible improvement.
