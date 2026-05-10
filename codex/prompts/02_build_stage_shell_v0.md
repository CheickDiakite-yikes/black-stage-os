# Prompt 02: Build Stage Shell v0

Context:
We are building the first functional prototype of Blackstage. The goal is to prove the living render field. The app should feel like intent becoming a world, not a chatbot.

Read first:
- AGENTS.md
- docs/01_product_manifesto.md
- docs/03_ux_interaction_model.md
- docs/04_visual_design_system.md
- docs/06_mvp_stage_shell_spec.md
- docs/12_quality_bar_and_demo_readiness.md

Task:
Implement Stage Shell v0 with a simulated agent runtime and demo fixtures.

Build:
1. Full-screen black stage.
2. Center PresenceCore with text input.
3. Intent submission flow.
4. IntentThread creation.
5. Dynamic render objects:
   - IntentCard
   - PlanCard
   - AgentActivityFeed
   - ApprovalCard
   - ArtifactCard
   - CodexTaskCard
   - ResearchNoteCard
6. Simulated agent event stream.
7. Approval flow.
8. Artifact creation after approval.
9. Demo fixture selector with at least:
   - Build Blackstage
   - Acquisition analysis
   - Research synthesis
10. Local persistence for threads.

Constraints:
- Do not implement real external actions.
- Simulated actions must be labeled as simulation when appropriate.
- Avoid generic chat bubbles and dashboard clutter.
- Keep the interface cinematic, calm, and minimal.
- Use typed domain models from `packages/stage-core`.

Acceptance criteria:
- User can submit text intent.
- The stage creates a thread.
- Objects appear dynamically.
- Agent activity feed streams steps.
- ApprovalCard appears before task brief creation.
- Approving creates artifact/Codex task cards.
- Rejecting logs rejection and does not create the approved artifact.
- Demo fixtures can be selected.
- The UI looks and feels like Blackstage.
- Typecheck/build pass.

Verification:
Run:
- `pnpm build`
- `pnpm typecheck`
- `pnpm lint`
- relevant tests

Research log:
Create `research/logs/YYYY-MM-DD-stage-shell-v0.md` with:
- Implementation summary.
- UX choices.
- Where simulation is used.
- What felt difficult.
- Any ways AGENTS.md should be improved.
