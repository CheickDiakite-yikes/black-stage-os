# Prompt 03: Add Research Instrumentation

Context:
Blackstage is both a product and a research program. We need to study the product experience and the AI-assisted build process.

Read first:
- AGENTS.md
- docs/14_research_protocol.md
- docs/15_metrics_and_instrumentation.md
- docs/13_checklists.md

Task:
Add v0 research instrumentation to Stage Shell.

Build:
1. Define ResearchEvent types if not already complete.
2. Implement a local event logger.
3. Log:
   - intent_submitted
   - thread_created
   - render_object_created
   - agent_event
   - approval_requested
   - approval_resolved
   - artifact_created
   - user_intervention
4. Add a collapsible ResearchCapture panel.
5. Add export button for session events as JSON.
6. Add "Create research note" action that summarizes the current session into markdown.
7. Make sure private full user content can be redacted or excluded.

Constraints:
- Do not send logs to a server.
- Do not store secrets or private user data by default.
- Do not make research UI clutter the stage.
- Keep research controls available but secondary.

Acceptance criteria:
- Events are logged for the main demo flow.
- User can export session JSON.
- User can generate a research note draft.
- Research events contain timestamps and session ids.
- The system can run without research panel visible.
- Typecheck/build pass.

Verification:
Run:
- `pnpm build`
- `pnpm typecheck`
- relevant tests

Research log:
Create `research/logs/YYYY-MM-DD-research-instrumentation.md` with:
- Instrumentation added.
- Events captured.
- Privacy decisions.
- Remaining instrumentation gaps.
