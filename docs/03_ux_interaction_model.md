# 03 UX Interaction Model

## Core model

Blackstage interaction is built around five primitives:

1. **Intent** — what the user wants.
2. **Thread** — the persistent container for a goal.
3. **Render object** — the visual/cognitive object summoned by intent.
4. **Agent event** — visible work performed or proposed by the system.
5. **Artifact** — usable output that can be inspected, revised, exported, or approved.

## Default state

The default state is a calm black field.

It contains:

- A subtle center presence.
- Optional minimal hint text.
- No feed.
- No dashboard.
- No app chrome.
- No clutter.

The stage should feel dormant, not empty.

## Conversation modes

### Voice-native mode

The user speaks naturally. The stage captures intent, displays a transcript, and responds with voice and visual structure.

Design rules:

- Voice is best for intent and flow.
- Show transcript subtly, not like a chat transcript by default.
- Allow interruption.
- Allow "show me," "hide that," "stop," "why," "undo," "make it more conservative," and similar natural controls.

### Text precision mode

The user types when exactness matters.

Use text for:

- Names.
- Numbers.
- Code.
- Legal language.
- Addresses.
- Detailed prompts.
- Corrections.

### Visual manipulation mode

The user manipulates rendered objects directly.

Capabilities:

- Drag cards.
- Expand/collapse cards.
- Pin important objects.
- Compare two objects.
- Annotate.
- Convert an object into an artifact.
- Ask questions about a specific object.

### Agent supervision mode

The user monitors delegated work.

Capabilities:

- View plan.
- View progress.
- Expand evidence.
- Stop task.
- Redirect task.
- Approve/reject action.
- Ask why.
- Request alternate plan.

## Render objects

Render objects are cognitive UI units. They are not windows.

Types:

- Intent card.
- Plan card.
- Agent activity feed.
- Artifact preview.
- Approval card.
- Memory card.
- Decision card.
- Risk matrix.
- Research note.
- Timeline.
- Data table.
- Chart.
- Browser portal.
- File portal.
- Code diff.
- Prompt card.
- Simulation card.

## Intent thread anatomy

Each thread should have:

- Title.
- Original intent.
- Current objective.
- Status.
- Context summary.
- Render objects.
- Agent events.
- Artifacts.
- Decisions.
- Memory notes.
- Open questions.
- Approval history.
- Research metadata.

## User commands

Natural language controls that should eventually be supported:

### Stage controls

- "Clear the stage."
- "Bring back the roadmap."
- "Pin this."
- "Hide the activity feed."
- "Show me the thread history."
- "Split this into two views."
- "Compare these."
- "Zoom into the risks."

### Agent controls

- "Stop."
- "Pause."
- "Continue."
- "Show me what you're doing."
- "Why did you do that?"
- "Use a more conservative assumption."
- "Run a second pass."
- "Assign this to Codex."
- "Make three options."
- "Don't use that source."

### Artifact controls

- "Turn this into a memo."
- "Make it board-ready."
- "Export this."
- "Rewrite in my voice."
- "Add citations."
- "Make the recommendation sharper."
- "Keep the structure, change the tone."
- "Show me changes."

### Memory controls

- "Remember this preference."
- "Forget that."
- "Only use this for this thread."
- "Show me what you know about this project."
- "Do not store this."

## Approval rituals

Approval should feel elegant and serious.

Approval card anatomy:

- Action proposed.
- Why it matters.
- Scope.
- Data/tools involved.
- Risk level.
- Expected outcome.
- Undo/recovery path.
- Buttons: Approve, Reject, Edit, Ask why.

Example:

```text
Approval needed

Action: Send email to investor list
Scope: 14 recipients
Content: Seed round follow-up note
Risk: External communication
Undo: Cannot fully undo after sending

[Preview] [Edit] [Approve] [Reject]
```

## Error behavior

When the system fails, it should remain calm.

Bad:

> "Error 422: invalid payload."

Better:

> "I couldn't create that artifact because the model output was missing a title and body. I can retry or show the raw output."

## Emotional UX

Blackstage should feel:

- Calm.
- Intelligent.
- Deep.
- Responsive.
- Slightly mysterious.
- Trustworthy.
- Powerful under restraint.

It should not feel:

- Cute.
- Noisy.
- Overly corporate.
- Like a normal chat sidebar.
- Like a dashboard.
- Like a game UI.

## First five-second experience

The viewer sees a dark field. The user says something complex. The field awakens. Objects appear in a meaningful arrangement. The agent begins visibly working. Within seconds, the viewer understands that the interface is alive to intent.

That first five seconds is a product requirement.
