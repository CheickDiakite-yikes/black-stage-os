# 06 MVP: Stage Shell v0 Spec

## Goal

Build the smallest compelling version of Blackstage that makes someone believe the future interface has arrived.

Stage Shell v0 is not the full OS. It is the cinematic, functional proof of the interface paradigm.

## Success statement

A user can speak or type a complex intention, and the stage transforms from a calm black field into a structured workspace with visible agent progress, approval controls, and a usable artifact.

## Demo title

**"Intent becomes a world."**

## Demo flow

### Step 1: Idle stage

The viewer sees a black field with a subtle center presence.

Startup contract: no demo selector, fixture shortcut, or control dock is visible as
the first interaction. When the user is ready, they click the center orb and start
speaking. Text remains available for precision, but it is secondary to the orb on
the first frame.

### Step 2: User submits intent

Example:

> "Help me turn Black Stage OS into an engineering plan and give Codex the next three tasks."

### Step 3: Stage awakens

The system creates an intent thread and renders:

- Intent card.
- Plan card.
- Roadmap preview.
- Agent activity feed.
- Artifact preview.
- Approval card to create Codex task briefs.

### Step 4: Agent work becomes visible

Activity feed shows:

- Parsed intent.
- Created project structure.
- Drafted roadmap.
- Identified Codex tasks.
- Created research logging checklist.
- Waiting for approval.

### Step 5: Artifact appears

Artifact:

- "Codex Task Brief: Build Stage Shell v0"
- Includes objective, files to create, acceptance criteria, and tests.

### Step 6: Human approval

Approval card:

> "Create three Codex task prompts from this plan?"

User approves.

### Step 7: Output

Three Codex prompt cards are created.

## Required v0 features

### 1. Full-screen stage

- Black background.
- Center presence.
- Subtle ambient motion.
- Responsive layout.

### 2. Input

- Text input required.
- Voice input strongly preferred if feasible.
- Transcript display.
- Submit intent button or keyboard shortcut.

### 3. Intent thread

- Create new thread from submitted intent.
- Display thread title/status.
- Persist thread locally.
- Resume previous thread.

### 4. Dynamic render objects

At minimum:

- IntentCard.
- PlanCard.
- AgentActivityFeed.
- ApprovalCard.
- ArtifactCard.
- CodexTaskCard.
- ResearchNoteCard.

### 5. Simulated agent runtime

Given an intent, create plausible staged events:

- planned
- started
- progress
- completed
- approval_requested
- artifact_created

Events should stream over time to make the stage feel alive.

### 6. Artifact creation

Create at least one artifact from the demo intent.

Artifact types:

- Codex task brief.
- Product plan.
- Research note.

### 7. Approval flow

- Approval card appears before creating externalized task briefs.
- User can approve/reject.
- Approval outcome logged.

### 8. Research instrumentation

Log events:

- intent_submitted
- thread_created
- render_object_created
- agent_event
- approval_requested
- approval_resolved
- artifact_created
- user_intervention

### 9. Fixture scenarios

Include demo fixtures:

- Build Blackstage.
- Acquisition analysis.
- Research synthesis.

## Stretch features

- Voice input.
- Assistant speech output.
- Animated object constellation.
- Artifact editor.
- Export thread as markdown.
- Replay session from event log.
- Codex prompt export.
- Screenshot mode for sharing.

## Out of scope for v0

- Full desktop OS replacement.
- Real browser/computer use.
- Email/calendar/file integrations.
- Purchases or transactions.
- Persistent personal memory.
- Multi-user collaboration.
- Production authentication.
- Real autonomous external actions.

## Acceptance criteria

The v0 build is acceptable when:

- `pnpm dev` runs the app.
- The idle stage looks like Blackstage, not a generic chat app.
- User can submit an intent.
- A persistent intent thread is created.
- Render objects appear dynamically.
- Agent events stream visibly.
- Approval request appears.
- Artifact is created after approval.
- Research events are logged.
- At least three demo fixtures work.
- A short screen recording would communicate the product thesis.

## First Codex task

Use `codex/prompts/01_bootstrap_repo.md`.

## Second Codex task

Use `codex/prompts/02_build_stage_shell_v0.md`.

## Third Codex task

Use `codex/prompts/03_add_research_instrumentation.md`.
