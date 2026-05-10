# 19 Source Notes: Codex

These notes summarize official Codex facts used to shape the build pack.

## Codex as coding agent

OpenAI describes Codex as a cloud-based software engineering agent that can write features, answer questions about a codebase, fix bugs, and propose pull requests for review. Each task can run in a separate isolated environment preloaded with the repository. This supports our operating model of assigning small, reviewable engineering tasks.

Source: https://openai.com/index/introducing-codex/

## Repository instructions

Codex can be guided by `AGENTS.md` files in the repository. OpenAI recommends including repo layout, commands, conventions, constraints, and definition of done. A concise, practical `AGENTS.md` is better than a long vague one.

Sources:
- https://developers.openai.com/codex/learn/best-practices
- https://developers.openai.com/codex/guides/agents-md

## Sandboxing and approvals

Codex uses sandbox and approval controls. The sandbox defines what the agent can do technically, while the approval policy determines when Codex must ask before crossing boundaries. This informs the Blackstage approval model and our development workflow.

Sources:
- https://developers.openai.com/codex/agent-approvals-security
- https://developers.openai.com/codex/concepts/sandboxing

## Multi-agent and subagent workflows

Codex supports subagent workflows when explicitly requested. This informs our review process for security, architecture, UX taste, and research instrumentation.

Source: https://developers.openai.com/codex/subagents

## GitHub reviews

Codex can review pull requests and follow review guidelines in `AGENTS.md`. This informs our review guidelines and PR checklist.

Source: https://developers.openai.com/codex/integrations/github

## CLI operation

The Codex CLI supports sandbox and approval flags. Official guidance suggests low-friction local work with workspace-write sandboxing and on-request approvals.

Source: https://developers.openai.com/codex/cli/reference

## Model guidance

Official Codex model guidance changes over time. As of the source notes used here, OpenAI recommends starting with the strongest available Codex-capable model in the model picker for complex coding, computer use, knowledge work, and research workflows, and using smaller/faster models for lighter tasks or subagents.

Source: https://developers.openai.com/codex/models

## Important caution

These notes should be refreshed periodically because Codex features, models, and recommended workflows change quickly.
