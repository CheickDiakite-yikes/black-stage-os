# First Long-Running Goal: Stage Shell v0 After Prompt 1

## 2026-05-15 Goal Amendment: Render Field First

The active `/goal` remains open, but the success bar is now explicitly
rendering-first. Stage Shell v0 is not done merely because intent, events,
approvals, artifacts, and live voice hooks exist. It must prove the core
Blackstage thesis: the black field itself organizes intelligence.

Current priority order:

1. The startup state is an empty, living, voice-first field: one orb, one calm
   instruction, no demo buttons, no dashboard chrome.
2. After intent, the field must form a cinematic scene graph: one dominant focal
   work object, supporting evidence orbiting it, visible relationships, depth,
   floor/ring anchoring, and calm telemetry.
3. Approval must feel like a central ritual object, not just a sidebar card.
4. Agent labor must become an inspectable geometric/progress field that can
   expand into the audit feed.
5. The UI fails if it reads as a dark dashboard, card collage, or demo scenario
   picker even when the backend loop works.

Use `docs/28_cinematic_rendering_system.md` as the current rendering north star.
Validate visual slices with the Browser plugin against the attached reference
video vocabulary: black material field, central orb, focal artifact,
relationship geometry, reflective stage floor, and progressive object
materialization.

## 2026-05-16 Checkpoint: Scene Field Interaction Slice

Shipped a verified rendering slice toward the goal:

- The visible stage now includes a manifest-driven `StageSceneField` with
  cluster halos, focal floor/horizon cues, relationship vectors, and dense
  constellation mode.
- Startup remains orb-first with no visible demo scenario buttons.
- The Build BlackStage scenario can be loaded through hidden QA parameters for
  Browser validation without adding product chrome.
- Object focus and direct dragging remain replayable after the cinematic
  placement changes.
- Voice startup works from the orb/Speak affordance for local browser speech,
  while explicitly configured live Realtime still routes through visible
  approval before the live edge opens.
- The command dock geometry is stable; hover/focus no longer moves the Speak
  target during active work.
- The artifact workbench chooses the newest artifact by timestamp so approved
  artifacts stay active even if old draft events arrive late.
- Validation passed: `pnpm typecheck`, `pnpm lint`, `pnpm test`,
  `pnpm build`, `pnpm test:e2e` (28/28), `pnpm scan:secrets`, and Browser
  plugin geometry QA for initial and approved active states.

## 2026-05-16 Checkpoint: Render Organization Intelligence Slice

Continued the rendering-first goal after the scene-field slice:

- `StageSceneManifest` now emits active semantic zones for intent ingress, work
  focus, evidence orbit, approval threshold, and artifact output.
- `StageSceneField` renders those zones plus a quiet zone-flow spine behind the
  object layer so the field communicates organization before the user reads the
  individual cards.
- Desktop Browser QA found the next concrete bug: approved-scene secondary
  objects could still graze the focal plan card at a wide viewport.
- Retuned intent, primary-work, and artifact anchors so the startup scene and
  full approved scene both preserve clear space around the focal plan.
- Added e2e coverage for zone metadata/flow and post-approval all-object
  overlap checks, including command-dock clearance.

## 2026-05-16 Checkpoint: Approval Ritual And Labor Field Slice

Continued the rendering-first goal by moving approval/labor meaning into the
field instead of leaving it only as rail content:

- Added `StageRitualField`, a central non-interactive layer above
  `StageSceneField`.
- Recent agent events now render as a geometric labor orbit in the field.
- The latest approval renders as an approval threshold in the field, while the
  right rail remains the only explicit approve/reject/ask-why control surface.
- Added e2e and Browser-plugin geometry checks so the threshold does not cover
  the focal plan object or command dock in pending or approved states.
- Preserved the orb-first startup contract and kept hidden QA parameters as the
  only scenario entrypoint for repeat visual validation.

## 2026-05-16 Checkpoint: Approval Focus Pull Slice

Pushed approval closer to an object-bound ritual:

- Pending approvals now derive one approval-focus object from the current
  `IntentThread` and `StageSceneManifest`.
- The focused object remains full strength while surrounding objects dim.
- `StageRitualField` draws a visible tether from the focused object to the
  approval threshold.
- Browser-plugin QA confirmed the Build BlackStage pending state has one
  approval button, one focused plan object, one tether, dimmed surrounding
  objects, and no threshold overlap with the plan or command dock.
- The e2e render gate now asserts the same pending approval focus/dimming
  behavior before resolving the approval.

Paste this into Codex CLI after installing the goal-mode add-on, running `/status`, and reviewing the pre-goal `/plan`.

```text
/goal Continue from the current Prompt 1 bootstrapped BlackStage repo state and implement Stage Shell v0 without stopping until the verifiable end state is reached.

Context:
Prompt 1 (`codex/prompts/01_bootstrap_repo.md`) was already started or completed. Do not rerun bootstrap from scratch. Inspect the current repo state first. Preserve the existing package manager, app structure, framework choices, and conventions unless a concrete blocker requires a minimal deviation. If the repo is only partially bootstrapped, complete only the smallest missing pieces required to ship Stage Shell v0.

Read first:
- AGENTS.md
- START_HERE.md
- docs/01_product_manifesto.md
- docs/03_ux_interaction_model.md
- docs/04_visual_design_system.md
- docs/05_system_architecture.md
- docs/06_mvp_stage_shell_spec.md
- docs/11_security_privacy_and_approvals.md
- docs/12_quality_bar_and_demo_readiness.md
- docs/14_research_protocol.md
- docs/15_metrics_and_instrumentation.md
- docs/20_codex_goal_mode_runbook.md

Objective:
Build a working Stage Shell v0 prototype on top of the existing repo: a black living render field where the user can enter intent, see the surface organize itself into render objects, watch simulated agent activity, approve simulated risky actions, and receive usable artifacts.

Experience thesis:
The prototype must prove this loop:
intent → living render field → visible agent work → approval ritual → artifact

The prototype fails if it merely feels like a dark chatbot.

Scope:
- Use the current repo stack and structure created by Prompt 1.
- Build or complete the app shell, core domain model, demo state machine, and UI components.
- Include at least three demo scenarios:
  1. "Analyze an acquisition target"
  2. "Plan a seed round"
  3. "Build BlackStage"
- Include simulated agent activity events for reading, searching, comparing, drafting, and waiting for approval.
- Include approval cards for simulated actions such as sending an email, booking something, purchasing something, or sharing a file.
- Include artifact previews such as memo, model, plan, or research brief.
- Add event instrumentation for intent_submitted, render_object_created, agent_event_emitted, approval_requested, approval_decisioned, artifact_created, and session_exported.
- Add a session export or research log mechanism.
- Save at least one screenshot or visual artifact under artifacts/screenshots/.
- Create a research log and scorecard under docs/research/runs/.

Do not implement:
- real external computer/browser control;
- real email sending;
- real payments or purchases;
- real file deletion;
- OAuth/auth flows;
- production deployment;
- hidden background actions;
- storage of sensitive user data;
- unnecessary repo rewrites;
- a framework switch unless the current scaffold is genuinely unusable.

Validation loop:
- After each meaningful checkpoint, run the relevant validation command.
- Prefer typecheck, lint, tests, and build.
- If a command does not exist yet, add the smallest useful version of it.
- Add a smoke test that launches the app and verifies the core Stage Shell elements exist.
- Keep changes focused and reviewable.
- Record validation outcomes in the research log.

Research logging:
Create docs/research/runs/<YYYY-MM-DD>-stage-shell-v0.md with:
- the exact goal text;
- repo state after Prompt 1;
- checkpoints completed;
- validation commands and outcomes;
- design decisions;
- failures and recoveries;
- things Codex did well;
- things Codex struggled with;
- product insights about the agentic interface.

Create docs/research/runs/<YYYY-MM-DD>-stage-shell-v0-scorecard.md with the 1-to-5 rubric from docs/20_codex_goal_mode_runbook.md.

Stopping condition:
Stop only when:
- the app runs locally;
- build passes;
- typecheck passes if configured;
- lint passes if configured;
- tests pass;
- smoke test verifies the primary interface;
- screenshot exists;
- research log exists;
- scorecard exists;
- no prohibited scope was implemented;
- the demo clearly feels like a living render field, not a normal chatbot.

If blocked:
- Record the blocker in the research log.
- Make the smallest safe fallback that preserves the interface thesis.
- Pause only if the blocker requires product, legal, security, credential, or destructive-action guidance.
```
