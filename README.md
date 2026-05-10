# Black Stage OS

**Codename:** Blackstage  
**Status:** early Stage Shell v0 prototype  
**Thesis:** the next human-computer interface is not a chatbot, desktop, or app launcher. It is a living render field for human intent.

Black Stage OS is a voice-native, text-capable, agentic interface where a calm black stage turns human intent into dynamic workspaces, visible agent labor, approval rituals, and usable artifacts.

This repository is both a product build and a research lab for AI-assisted product development.

## What This Is

Blackstage starts as a browser-based Stage Shell: an ambient black render field with a center presence, intent capture, and a visual language for agentic work. The long-term system is organized around intent threads, stage objects, agent events, approvals, artifacts, memory policy, and research instrumentation.

The first product test is simple:

> A first-time viewer should feel that intent can become a world.

## Current Prototype

The current app renders an idle Stage Shell with:

- A full-screen black cinematic field.
- A subtle luminous center presence.
- Softly animated star and constellation layers.
- A voice-native prompt: `Speak when ready`.
- A quiet text fallback.
- A privacy/status line: `memory on · private`.

No real external actions are wired yet. Agent activity, approval flows, artifact creation, and research instrumentation are intentionally staged for the next slices.

## Monorepo Layout

```text
apps/
  stage-web/              # Browser prototype of the Black Stage interface
packages/
  stage-core/             # Domain models, events, fixtures, render manifest types
  stage-ui/               # Stage visual tokens and UI primitives
  agent-runtime/          # Agent tasks, simulators, approval drafts, tool adapters
  voice-core/             # Voice capture, transcript, realtime event types
  memory-core/            # Memory stores, retrieval types, write policies
docs/                     # Product, architecture, research, operating docs
research/logs/            # Build observations and design/research notes
templates/                # Reusable contribution, PR, research, and decision templates
codex/prompts/            # Reusable Codex task prompts
```

## Getting Started

Requirements:

- Node.js 22+
- pnpm 8+

Install dependencies:

```bash
pnpm install
```

Start the browser Stage Shell:

```bash
pnpm dev
```

Open the local Vite URL, usually:

```text
http://127.0.0.1:5173/
```

## Commands

```bash
pnpm install      # install workspace dependencies
pnpm dev          # start apps/stage-web
pnpm build        # build every package and the web app
pnpm lint         # lint the workspace
pnpm scan:secrets # scan tracked files for high-confidence secret patterns
pnpm test         # run package test commands
pnpm typecheck    # typecheck every package
pnpm format       # format with Prettier
```

`pnpm test` currently runs placeholder test commands. Real unit, component, and browser tests should be added as the Stage Shell behavior becomes interactive.

## Architecture

Blackstage is intended to be an event-driven cognitive interface.

```text
User voice/text
   -> Intent capture
   -> Intent parser / planner
   -> Intent thread state
   -> Stage render manifest
   -> Living render field UI
   -> Agent runtime + artifacts + approvals
   -> Event log + research instrumentation
```

Core domain concepts live in `packages/stage-core`:

- `IntentThread`
- `StageObject`
- `AgentEvent`
- `ApprovalRequest`
- `Artifact`
- `ResearchEvent`
- `StageEvent`
- `StageRenderManifest`

The UI should render from structured state and events rather than hardcoded app screens.

## Product Principles

- The black surface is a living render field, not a blank chat screen.
- The interface is organized around intent threads, not files, apps, or tabs.
- Voice is native, with text available for precision.
- Agent labor must be visible, auditable, and interruptible.
- High-impact actions require explicit human approval.
- Serious outputs should become artifacts.
- The experience should feel calm, powerful, cinematic, and trustworthy.
- Generic chatbot chrome, SaaS clutter, and hidden spinners are product bugs.

## Research Practice

Meaningful build tasks should create or update a log in `research/logs/` with:

- What was attempted.
- What changed.
- Assumptions.
- Problems or human intervention.
- Product or AI-building insight.
- What should be built next.

This keeps the product build and the AI-assisted building research connected.

## Contributing

Black Stage OS is open source and welcomes thoughtful contributions.

Good first contributions include:

- Improving domain model tests.
- Turning Stage Shell visual elements into reusable `stage-ui` primitives.
- Adding fixture scenarios for intent threads.
- Building simulated agent events and approval flows.
- Improving accessibility and reduced-motion behavior.
- Adding research instrumentation that avoids sensitive content.

Before contributing:

1. Read [AGENTS.md](./AGENTS.md).
2. Read [docs/00_document_index.md](./docs/00_document_index.md).
3. Run `pnpm install`.
4. Make a focused change.
5. Run `pnpm build`, `pnpm typecheck`, `pnpm lint`, and relevant tests.
6. Open a pull request with a clear summary and validation notes.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contribution guide.

## Security And Privacy

Blackstage is designed around user agency, privacy boundaries, and approval gates. Do not add integrations that send data outside the local/browser prototype without an explicit policy, visible user control, and approval flow.

Do not commit secrets. The repo ignores common secret file patterns, but contributors are still responsible for checking their changes before opening a pull request.

Run the local secret check before pushing:

```bash
pnpm scan:secrets
```

Report security concerns privately using the process in [SECURITY.md](./SECURITY.md).

## Roadmap

Near-term Stage Shell work:

- Submit intent and create a persistent intent thread.
- Render dynamic stage objects.
- Stream simulated agent events.
- Show approval requests before risky/external actions.
- Create usable artifacts from demo fixtures.
- Add local research event logging.
- Add browser tests and visual regression checks for the black stage.

Longer term:

- Voice capture and speech output.
- Local-first memory with policy controls.
- Replayable event logs.
- Tool-backed agents.
- Desktop wrapper after the browser Stage Shell proves the core experience.

## License

MIT. See [LICENSE](./LICENSE).
