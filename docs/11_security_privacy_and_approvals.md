# 11 Security, Privacy, and Approvals

## Trust thesis

Blackstage is an agentic interface. Trust is not optional. It is a core product surface.

Users will only delegate meaningful work if they can see, govern, and reverse the system's behavior.

## Principles

1. Human approval before high-impact action.
2. Visible agent labor.
3. Clear data boundaries.
4. Inspectable memory.
5. Reversible actions where possible.
6. Honest uncertainty.
7. No hidden external side effects.
8. Private by default.

## Approval categories

### External communication

Examples:

- Sending email.
- Sending Slack/Discord messages.
- Posting on social media.
- Contacting brokers, investors, customers, vendors.

Approval required: always.

### Financial action

Examples:

- Purchases.
- Subscription changes.
- Bank/card use.
- Invoices.
- Payroll.
- Investment actions.

Approval required: always.

### File/system action

Examples:

- File deletion.
- Irreversible edits.
- Moving files outside workspace.
- Running scripts that modify many files.

Approval required: medium/high risk actions.

### Calendar action

Examples:

- Creating meetings.
- Rescheduling.
- Cancelling events.
- Sending invites.

Approval required: always before external effect.

### Data sharing

Examples:

- Uploading private docs.
- Sending user data to third-party services.
- Using sensitive memory outside current thread.

Approval required: always.

### Credential/account use

Examples:

- Logging into accounts.
- Using API keys.
- Accessing private systems.

Approval required: always.

### Network access

Examples:

- Web browsing.
- Package installation.
- API calls.
- External scraping.

Approval required depending on sandbox and policy.

### Code execution

Examples:

- Running scripts.
- Installing dependencies.
- Starting servers.
- Running migrations.

Approval required if outside trusted workspace or touching persistent data.

## Approval card requirements

Each approval request must show:

- Action.
- Purpose.
- Scope.
- Data involved.
- Destination/system affected.
- Risk level.
- Consequence.
- Undo/recovery path.
- Proposed by.
- Buttons: Approve, Reject, Edit, Ask why.

## Risk levels

### Low

Reversible, local, no private data, no external side effects.

### Medium

Modifies local artifacts, uses non-sensitive context, reversible.

### High

External side effect, sensitive data, meaningful file changes, hard to undo.

### Critical

Financial, credential, legal, public communication, irreversible deletion, regulated data.

## Memory policy

### Memory types

- Temporary context.
- Thread memory.
- Project memory.
- User memory.
- External source memory.

### Rules

- Do not write long-term user memory silently.
- Let users inspect memory.
- Let users delete memory.
- Label memory scope.
- Do not include sensitive content in research logs without explicit consent.
- Separate product logs from personal content.

## Research logging privacy

Research logs should capture:

- Event type.
- System behavior.
- Prompt/task category.
- Outcome.
- Human intervention.
- Time/iteration count.

Research logs should avoid:

- Personal secrets.
- Private documents.
- Unredacted names unless necessary.
- API keys.
- Credentials.
- Financial account data.
- Private emails.

## Agent audit log

Every agent action should eventually log:

- Timestamp.
- Thread id.
- Agent/task id.
- Action type.
- Summary.
- Tools used.
- Data touched.
- Result.
- Approval reference if required.
- Evidence reference if available.

## Failure modes

- Agent sends something externally without approval.
- User cannot tell what the agent is doing.
- Memory is stored unexpectedly.
- Research logs leak private content.
- Approval fatigue makes users approve blindly.
- The product claims certainty without evidence.
- A simulated action is presented as real.

## Security checklist

- No secrets in frontend code.
- No private data in console logs.
- No external effect without approval.
- No destructive action without confirmation.
- No network access by default for agent code.
- No hidden persistent memory writes.
- Audit trail for meaningful actions.
- Clear distinction between simulated and real actions.
