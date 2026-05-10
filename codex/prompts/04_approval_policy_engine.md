# Prompt 04: Implement Approval Policy Engine

Context:
Trust is a core product surface. Blackstage must never let agents take high-impact action silently.

Read first:
- AGENTS.md
- docs/11_security_privacy_and_approvals.md
- docs/05_system_architecture.md
- docs/03_ux_interaction_model.md

Task:
Implement a v0 approval policy engine.

Build:
1. Approval risk categories.
2. A function that classifies proposed actions by risk.
3. ApprovalRequest creation helpers.
4. Approval history in thread state.
5. Tests for action classification.
6. UI integration with ApprovalCard if not already connected.

Acceptance criteria:
- External communication always requires approval.
- Financial actions always require approval.
- Credential/account use always requires approval.
- File deletion requires approval.
- Simulated actions are labeled.
- Approval outcomes are logged.
- Tests cover each category.

Verification:
Run:
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`

Research log:
Record where approval policy was clear and where product judgment was needed.
