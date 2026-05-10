# Prompt 01: Bootstrap the Blackstage Repository

Context:
We are building Black Stage OS, codename Blackstage. It is a voice-native, text-capable, agentic interface where a calm black living render field turns human intent into dynamic workspaces, visible agent labor, approval rituals, and usable artifacts. This repo is both a product build and a research lab for AI-assisted product development.

Read first:
- README.md
- AGENTS.md
- docs/00_document_index.md
- docs/01_product_manifesto.md
- docs/05_system_architecture.md
- docs/06_mvp_stage_shell_spec.md

Task:
Bootstrap the repository into a working monorepo for Stage Shell v0.

Requirements:
1. Create the target directory structure described in AGENTS.md.
2. Use TypeScript.
3. Create a browser-based `apps/stage-web` app.
4. Create shared packages:
   - `packages/stage-core`
   - `packages/stage-ui`
   - `packages/agent-runtime`
   - `packages/voice-core`
   - `packages/memory-core`
5. Add workspace/package configuration.
6. Add commands:
   - install
   - dev
   - build
   - lint
   - test
   - typecheck
   - format
7. Add basic placeholder exports for each package.
8. Add initial domain model files for IntentThread, StageObject, AgentEvent, ApprovalRequest, Artifact, and ResearchEvent.
9. Add a simple Stage Shell landing page that shows a full-screen black stage with a subtle center presence and text input placeholder.

Constraints:
- Do not build the full product in this task.
- Do not add unnecessary dependencies.
- Do not make the UI look like a generic chatbot.
- Do not implement real external actions.
- Keep the first scaffold clean and easy to extend.

Acceptance criteria:
- `pnpm install` works.
- `pnpm dev` starts the stage web app.
- `pnpm build` succeeds.
- `pnpm typecheck` succeeds.
- The page renders a black stage with a center presence.
- Domain model files exist.
- README or docs are updated if commands differ.

Verification:
Run:
- `pnpm install`
- `pnpm build`
- `pnpm typecheck`
- `pnpm test` if test setup exists

Research log:
Create `research/logs/YYYY-MM-DD-bootstrap-repo.md` with:
- What you built.
- Any assumptions.
- Any dependency choices.
- Any problems.
- What should be built next.
