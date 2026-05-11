# 10 Prompt Library

This document contains prompt patterns for assigning work to Codex.

Additional full prompts live in `codex/prompts/`.

## Prompt 1: Bootstrap repository

See `codex/prompts/01_bootstrap_repo.md`.

## Prompt 2: Build Stage Shell v0

See `codex/prompts/02_build_stage_shell_v0.md`.

## Prompt 3: Add research instrumentation

See `codex/prompts/03_add_research_instrumentation.md`.

## Prompt 4: UX/taste review

```text
Read AGENTS.md, docs/01_product_manifesto.md, docs/03_ux_interaction_model.md, and docs/04_visual_design_system.md.

Review the current app for whether it feels like Blackstage or like a generic chatbot/dashboard.

Return:
1. What feels correct.
2. What violates the thesis.
3. The top 10 improvements ranked by product impact.
4. Specific files/components likely involved.
5. A proposed small PR plan.
Do not implement until asked.
```

## Prompt 5: Architecture review

```text
Read AGENTS.md and docs/05_system_architecture.md.

Review the current codebase architecture against the target event-driven cognitive interface.

Return:
1. Current architecture summary.
2. Deviations from the target model.
3. State/event risks.
4. Testability risks.
5. Recommended next refactors.
6. What should not be refactored yet.
Do not implement until asked.
```

## Prompt 6: Research log synthesis

```text
Read research/logs/ and the latest merged changes.

Create a research note that summarizes:
1. What we tried.
2. What Codex did well.
3. Where Codex needed human correction.
4. Product insights.
5. AI-assisted building insights.
6. Open questions.
7. Evidence links or file references.

Save the note under research/logs/YYYY-MM-DD-session-summary.md.
```

## Prompt 7: Security and approval review

```text
Read docs/11_security_privacy_and_approvals.md and inspect the current implementation.

Review whether any user action, agent event, memory write, external call, file operation, or artifact export should require approval.

Return:
1. Current approval coverage.
2. Missing approval gates.
3. Data/privacy risks.
4. Suggested policy changes.
5. Test cases to add.
Do not implement until asked.
```

## Prompt 8: Build a demo fixture

```text
Create a new demo fixture for the scenario: [SCENARIO].

The fixture should include:
- Original user intent.
- Thread title.
- Render objects.
- Agent event sequence.
- Approval request.
- Artifact.
- Research events.

Acceptance criteria:
- The fixture can be selected only through the development fixture harness, not the startup UI.
- The fixture makes the Blackstage thesis obvious.
- It does not use real private data.
- It includes at least one visible approval moment.
```
