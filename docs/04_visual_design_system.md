# 04 Visual Design System

## Visual thesis

Blackstage should feel like a black stage where intent becomes visible.

The design language is cinematic, minimal, and alive. It should be closer to a private intelligence chamber than a software dashboard.

## Core visual attributes

- Deep black background.
- Subtle glow and depth.
- Sparse UI until intent appears.
- Soft motion.
- High contrast.
- No heavy borders unless needed.
- No generic dashboard cards.
- No rainbow gradient overload.
- No cartoon assistant.
- No default SaaS blue-and-white layout.

## Stage layers

### 1. Void layer

The base background.

Characteristics:

- Near-black.
- Subtle vignette.
- Optional very faint noise/grain.
- Optional slow radial light around center presence.

### 2. Presence layer

The center voice/conversation presence.

Characteristics:

- Minimal waveform, orb, cursor, or breathing light.
- Should not become a mascot.
- Should respond to listening, thinking, speaking, and idle states.

States:

- Idle.
- Listening.
- Thinking.
- Speaking.
- Working.
- Waiting for approval.
- Error/retry.

### 3. Render layer

The dynamic workspace objects.

Objects:

- Cards.
- Portals.
- Timelines.
- Tables.
- Documents.
- Approval modules.
- Activity feeds.
- Artifact previews.

### 4. Agent layer

Visible agent work.

Characteristics:

- Can be docked, floating, or collapsible.
- Must not overwhelm the stage.
- Should show progress as meaningful steps, not spinners.

### 5. Artifact layer

Usable outputs.

Characteristics:

- Higher solidity than transient cards.
- Clear title, status, provenance, and actions.
- Opens into editor/preview when selected.

## Color guidance

Use restrained color.

Default palette:

- Background: near-black.
- Primary text: off-white.
- Secondary text: gray.
- Surfaces: translucent black/charcoal.
- Accent: subtle luminous white, silver, violet, blue, or teal.
- Warning/approval: amber or red only when meaningful.
- Success: restrained green, never confetti.

## Typography

- Use a clean modern sans-serif.
- Prefer generous spacing.
- Avoid dense paragraphs in the stage.
- Long-form writing should open in artifact mode.

## Motion

Motion should communicate cognition.

Use motion for:

- Objects emerging from intent.
- Cards grouping or reorganizing.
- Agent step progression.
- Approval emphasis.
- Artifact completion.

Avoid:

- Constant animation.
- Decorative motion with no meaning.
- Fast motion that makes the system feel nervous.

## Layout principles

### Intent-centered layout

The original intent should remain accessible. The stage is organized around it.

### Progressive disclosure

Show summary first. Allow expansion.

### Spatial memory

Objects should not teleport arbitrarily. Users should feel that the workspace has continuity.

### Focus over completeness

The stage should not show every possible object. It should show the most useful objects now.

## Component inventory for v0

### StageRoot

Full-screen black canvas.

### PresenceCore

Voice/text center presence.

### IntentCard

Shows original intent, parsed objective, thread status.

### AgentActivityFeed

Shows visible agent labor.

### RenderCard

Generic card for plans, questions, metrics, risks, etc.

### ApprovalCard

Structured human approval ritual.

### ArtifactCard

Preview of created output.

### ThreadRail

Optional list of intent threads.

### CommandBar

Text fallback and exact command entry.

### ResearchCapture

Small hidden or collapsible instrument panel for build/product research notes.

## "Do not ship" visual failures

- Looks like ChatGPT with a black background.
- Looks like Linear/Jira dashboard.
- Looks like a sci-fi game HUD.
- Uses too many glowing neon elements.
- Everything is visible at once.
- Agent activity is hidden behind "thinking..."
- Approval is a generic modal with no consequence explanation.
- Artifacts look like chat bubbles.

## Visual acceptance test

A screenshot should communicate the thesis without explanation:

- A living black canvas.
- A clear human intent.
- Objects summoned by that intent.
- Visible agent work.
- A useful artifact.
- A pending approval or control point.
