import { readFileSync } from "node:fs";

const checks = [
  {
    file: "WORKFLOW.md",
    label: "root workflow names Symphony as the control-plane pattern",
    pattern: /Treat Symphony as the orchestration pattern/
  },
  {
    file: "WORKFLOW.md",
    label: "root workflow assigns coding tasks to Codex worker transports",
    pattern: /Use Codex CLI or Codex App Server as the coding worker transport/
  },
  {
    file: "WORKFLOW.md",
    label: "root workflow pins the Realtime voice target",
    pattern: /Use `gpt-realtime-2` as the Realtime voice target/
  },
  {
    file: "WORKFLOW.md",
    label: "root workflow blocks browser-origin mutations",
    pattern: /Browser-origin mutations remain disabled/
  },
  {
    file: "WORKFLOW.md",
    label: "root workflow gates agent memory access",
    pattern: /Agent memory inspection, writes, and deletes require Stage approval/
  },
  {
    file: "packages/agent-runtime/src/harness/workflowPolicy.ts",
    label: "typed policy points at the root workflow",
    pattern: /BLACKSTAGE_WORKFLOW_POLICY_SOURCE = "WORKFLOW\.md"/
  },
  {
    file: "packages/agent-runtime/src/harness/workflowPolicy.ts",
    label: "typed policy names the supported Codex transports",
    pattern: /codexTransports: \["cli", "app_server"\]/
  },
  {
    file: "packages/agent-runtime/src/harness/workflowPolicy.ts",
    label: "typed policy keeps live execution disabled by default",
    pattern: /liveExecutionDefault: "disabled"/
  },
  {
    file: "packages/agent-runtime/src/harness/workflowPolicy.ts",
    label: "typed policy keeps provider credentials out of the browser",
    pattern: /browserReceivesProviderCredentials: false/
  },
  {
    file: "packages/agent-runtime/src/harness/workflowPolicy.ts",
    label: "typed policy gates background-agent memory access",
    pattern: /agentMemoryAccessDefault: "stage_approval_required"/
  },
  {
    file: "apps/stage-runner/src/server.ts",
    label: "runner readiness exposes the typed workflow policy",
    pattern: /workflowPolicy: createBlackstageWorkflowPolicy\(\)/
  },
  {
    file: "docs/21_agentic_harness_architecture.md",
    label: "architecture note references the root workflow policy",
    pattern: /root `WORKFLOW\.md`/
  },
  {
    file: "docs/19_source_notes_codex.md",
    label: "source notes include the refreshed harness stack",
    pattern: /## 2026-05-11 Harness Source Refresh/
  },
  {
    file: "docs/19_source_notes_codex.md",
    label: "source notes keep Symphony as an orchestration reference",
    pattern: /open-source Codex orchestration reference/
  },
  {
    file: "docs/19_source_notes_codex.md",
    label: "source notes pin the Realtime voice model",
    pattern: /`gpt-realtime-2` remains the pinned Realtime voice model/
  }
];

const failures = [];

for (const check of checks) {
  const content = readFileSync(check.file, "utf8");

  if (!check.pattern.test(content)) {
    failures.push(`${check.file}: ${check.label}`);
  }
}

if (failures.length > 0) {
  console.error("Workflow policy check failed:");
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Workflow policy check passed across ${checks.length} contract checks.`);
