# Blackstage Workflow

This file is the repo-owned policy for Blackstage's background agentic harness. It keeps open-source Codex, Symphony-style orchestration, Agents SDK work, and Realtime voice behind Blackstage's stage events, approval gates, and replayable proof.

## Control Plane

- Treat Symphony as the orchestration pattern: task tracker state becomes a control plane, active tasks get bounded workers, outputs return for human review.
- Keep Blackstage's internal queue as the live control plane until an external tracker is explicitly chosen.
- Project every task into visible stage events before, during, and after worker execution.
- Store proof packets in `.blackstage/workspaces/*` when workspace preparation is armed.

## Workers

- Use Codex CLI or Codex App Server as the coding worker transport for implementation tasks.
- Select the dry-run Codex transport with `BLACKSTAGE_CODEX_TRANSPORT=cli|app_server`; live execution stays separately gated.
- Use Agents SDK manager-style plans for non-coding research, artifact, memory, and analysis tasks.
- Keep specialist agents as tools unless a branch truly needs delegated ownership.
- Use `gpt-realtime-2` as the Realtime voice target for live voice contracts.

## Boundaries

- Browser-origin mutations remain disabled.
- Browser surfaces never receive provider credentials.
- Live Codex subprocess execution is disabled by default.
- Live Codex App Server execution is disabled by default.
- Live Realtime SDP exchange is disabled unless local env, local approval phrase, and visible stage approval are all armed.
- Agent memory inspection, writes, and deletes require Stage approval; background agents receive redacted memory summaries by default.
- All external or high-impact actions require explicit human approval and later human review.

## Artifacts And Evidence

- Every serious task returns an artifact, proof packet, or research log entry.
- Codex workers must report validation evidence.
- Realtime tool calls enter the stage as approval requests, not provider-native side effects.
- Failed runs should still produce auditable events when possible.

## Validation Floor

Before promoting a workflow slice, run the narrow relevant tests plus the repo gates that match its blast radius:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm check:workflow`
- `pnpm test`
- `pnpm build`
- `pnpm scan:secrets`
