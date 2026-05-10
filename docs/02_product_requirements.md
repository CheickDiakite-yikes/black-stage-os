# 02 Product Requirements Document

## Product name

Working name: **Black Stage OS**  
Short name: **Blackstage**  
First build: **Stage Shell v0**

## One-line description

A voice-native, text-capable, agentic interface where a black living render field turns intent into dynamic workspaces, visible agent work, and approved artifacts.

## Primary users

### Founder/operator

Needs to think, research, write, plan, delegate, review, and decide across many domains.

### AI researcher/builder

Needs to run experiments, compare outputs, track prompts, evaluate agent behavior, and publish findings.

### Knowledge worker/power user

Needs to coordinate files, emails, meetings, documents, dashboards, and web research without manually operating many apps.

## Initial wedge

Stage Shell v0 is a cinematic browser-based prototype focused on proving the interaction paradigm.

It should not try to replace the OS yet. It should demonstrate that the user can speak or type a complex intention and watch a workspace assemble around it.

## Core user stories

### Intent capture

As a user, I can speak or type an intention into the stage so that the system can create an intent thread.

Acceptance criteria:

- Voice input and text input are both available.
- The captured intent appears as a first-class object.
- The system can ask clarifying questions when the intent is ambiguous.
- The system can generate a structured plan from the intent.

### Living render field

As a user, I can see the black stage render relevant objects around my task.

Acceptance criteria:

- The stage starts visually calm.
- Objects appear only when useful.
- Cards/portals can represent documents, charts, agent activity, timelines, maps, decisions, approvals, and artifacts.
- Layout adapts to the task.

### Intent threads

As a user, I can return to an ongoing goal and see its context, history, artifacts, decisions, and next actions.

Acceptance criteria:

- Every goal has a persistent thread.
- Threads contain messages, rendered objects, agent events, artifacts, approvals, and memory notes.
- The user can rename, archive, and resume threads.
- The thread can be serialized for replay and research.

### Agent activity feed

As a user, I can see what the agent is doing without being overwhelmed.

Acceptance criteria:

- The feed shows planned, running, completed, blocked, and approval-needed steps.
- Each step has a status, timestamp, summary, and optional evidence.
- The user can expand a step for details.
- The user can stop or redirect a running task.

### Approval rituals

As a user, I can approve or reject meaningful actions before they affect the real world.

Acceptance criteria:

- Risky actions never happen silently.
- Approval cards include the action, scope, consequence, and undo path when available.
- The user can approve, reject, edit, or ask why.
- All approvals are logged.

### Artifact layer

As a user, I receive useful outputs, not only chat answers.

Acceptance criteria:

- Artifacts can include memos, plans, tables, models, diagrams, code snippets, documents, and research briefs.
- Artifacts can be opened, revised, exported, and attached to an intent thread.
- Artifact provenance is visible.

### Research instrumentation

As the founding team, we can study how Blackstage is built and how users experience it.

Acceptance criteria:

- Important product events are logged.
- Build tasks are recorded.
- Prompt/task inputs and agent outcomes can be compared.
- Experiments can be linked to product sessions.
- Research logs do not store sensitive user data by default.

## Functional requirements

### Stage shell

- Render a full-screen black stage.
- Provide a centered voice/text input presence.
- Render dynamic cards and portals.
- Support persistent intent threads.
- Support demo scenarios.
- Support at least one artifact editor/preview.
- Support an agent activity panel.
- Support approval cards.
- Support event logging.

### Voice and conversation

- Support push-to-talk and/or continuous listening mode.
- Support interruption/barge-in in later versions.
- Support transcript display.
- Support assistant speech output in later versions.
- Support graceful fallback to text.

### Agent runtime

- Define agent tasks as structured objects.
- Support task statuses: planned, running, completed, failed, blocked, approval_needed.
- Support simulated agent activity in v0.
- Support real model/tool-backed agent actions in later versions.
- Support cancellation and redirection.

### Memory

- Store project-level memory in early versions.
- Distinguish user memory, project memory, thread memory, and temporary context.
- Allow users to inspect and delete memory.
- Avoid implicit permanent memory without explicit consent.

### Approvals

Required approval categories:

- External communication.
- Purchases or financial transactions.
- Account/login use.
- File deletion or irreversible edits.
- Data sharing.
- Calendar scheduling.
- Use of personal/private data outside the current scope.
- Running code with elevated permissions.

## Non-functional requirements

### Performance

- The stage should feel responsive even when agents are working.
- User input should be accepted immediately.
- Long tasks should stream progress.
- UI animations should not interfere with usability.

### Reliability

- Intent threads should be recoverable after reload.
- Event logs should remain consistent.
- Failed agent steps should degrade gracefully.

### Security

- Never store secrets in frontend local state.
- Never expose private files in logs by default.
- Treat approvals and auditability as core product features.
- Add sandboxing for external tool use when implemented.

### Accessibility

- Text fallback for voice.
- Keyboard navigation for major actions.
- Captions/transcripts for audio.
- Sufficient visual contrast.
- No critical information conveyed only through animation.

## Initial demo scenarios

### Scenario 1: Build Blackstage with Blackstage

User says:

> "Help me turn this idea into an engineering plan and give Codex the next three tasks."

The stage renders:

- Product thesis card.
- Roadmap card.
- Codex task cards.
- Agent activity feed.
- Research logging prompt.
- Artifact: Codex task brief.

### Scenario 2: Startup acquisition analysis

User says:

> "Help me evaluate whether we should acquire this company."

The stage renders:

- Financial model placeholder.
- Diligence checklist.
- Risk matrix.
- Memo outline.
- Open questions.
- Approval to search external data.

### Scenario 3: Research synthesis

User says:

> "Help me turn today's build session into a research note."

The stage renders:

- Session summary.
- Prompt/action timeline.
- Findings.
- Limitations.
- Artifact: publishable research note draft.

## Success criteria for Stage Shell v0

Stage Shell v0 succeeds if:

- A viewer immediately understands that this is not a chatbot.
- The black stage feels alive and purposeful.
- Intent threads feel like a new primitive.
- Agent activity visibility creates trust.
- Artifacts feel useful.
- The team can use the prototype to plan the next build step.
- Research logging is built in from day one.
