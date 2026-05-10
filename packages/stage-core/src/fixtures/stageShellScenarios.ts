import type { AgentEvent } from "../domain/AgentEvent";
import type { ApprovalRequest } from "../domain/ApprovalRequest";
import type { Artifact } from "../domain/Artifact";
import type { IntentThread } from "../domain/IntentThread";
import type { StageObject, StageObjectType } from "../domain/StageObject";
import type { StageEvent } from "../events/stageEvent";

export type StageShellScenarioId =
  | "analyze_acquisition_target"
  | "plan_seed_round"
  | "build_blackstage"
  | "research_synthesis";

export type StageShellScenario = {
  id: StageShellScenarioId;
  label: string;
  title: string;
  intent: string;
  currentObjective: string;
  contextSummary: string;
  threadId: string;
  riskCue: string;
  initialObjects: StageObject[];
  agentEvents: AgentEvent[];
  approval: ApprovalRequest;
  draftArtifact: Artifact;
  approvedObjects: StageObject[];
  approvedArtifact?: Artifact;
};

export type TimedStageEvent = {
  id: string;
  delayMs: number;
  event: StageEvent;
};

const BASE_TIME = "2026-05-10T15:00:00.000Z";

function minutesAfter(baseIso: string, minutes: number): string {
  return new Date(new Date(baseIso).getTime() + minutes * 60_000).toISOString();
}

function createObject(
  scenarioId: StageShellScenarioId,
  threadId: string,
  type: StageObjectType,
  title: string,
  summary: string,
  payload: unknown,
  createdAt: string,
  index: number
): StageObject {
  return {
    id: `${scenarioId}_${type}_${index}`,
    threadId,
    type,
    title,
    summary,
    payload,
    position: {
      x: (index % 3) * 34,
      y: Math.floor(index / 3) * 28,
      z: index
    },
    state: index === 0 ? "focused" : "expanded",
    createdAt,
    updatedAt: createdAt
  };
}

function createAgentEvent(
  scenarioId: StageShellScenarioId,
  threadId: string,
  index: number,
  type: AgentEvent["type"],
  summary: string,
  details: string,
  timestamp: string
): AgentEvent {
  return {
    id: `${scenarioId}_agent_${index}`,
    threadId,
    taskId: `${scenarioId}_task`,
    agentName: "Blackstage simulated operator",
    type,
    summary,
    details,
    evidence: [
      {
        id: `${scenarioId}_evidence_${index}`,
        label: "Simulated evidence trail",
        sourceType: "agent_log",
        excerpt: "Synthetic v0 event used to study the Stage Shell interaction model."
      }
    ],
    timestamp
  };
}

function createArtifact(
  scenarioId: StageShellScenarioId,
  threadId: string,
  type: Artifact["type"],
  title: string,
  content: unknown,
  createdAt: string
): Artifact {
  return {
    id: `${scenarioId}_artifact_${type}`,
    threadId,
    type,
    title,
    status: "draft",
    content,
    provenance: [
      {
        id: `${scenarioId}_artifact_provenance`,
        label: "Generated from simulated Stage Shell run",
        sourceType: "agent_log"
      }
    ],
    createdAt,
    updatedAt: createdAt
  };
}

function createApproval(
  scenarioId: StageShellScenarioId,
  threadId: string,
  actionType: ApprovalRequest["actionType"],
  title: string,
  summary: string,
  scope: string,
  consequence: string,
  createdAt: string,
  riskLevel: ApprovalRequest["riskLevel"] = "high"
): ApprovalRequest {
  return {
    id: `${scenarioId}_approval`,
    threadId,
    actionType,
    title,
    summary,
    riskLevel,
    proposedBy: "Blackstage simulated operator",
    scope,
    consequence,
    undoPath: "This v0 approval is simulated. No external system will be touched.",
    status: "pending",
    createdAt
  };
}

function createScenario(
  id: StageShellScenarioId,
  label: string,
  title: string,
  intent: string,
  currentObjective: string,
  contextSummary: string,
  riskCue: string,
  objectSpecs: Array<{
    type: StageObjectType;
    title: string;
    summary: string;
    payload: unknown;
  }>,
  agentSpecs: Array<{
    type: AgentEvent["type"];
    summary: string;
    details: string;
  }>,
  approvalSpec: {
    actionType: ApprovalRequest["actionType"];
    title: string;
    summary: string;
    scope: string;
    consequence: string;
    riskLevel?: ApprovalRequest["riskLevel"];
  },
  artifactSpec: {
    type: Artifact["type"];
    title: string;
    content: unknown;
  },
  approvedObjectSpecs: Array<{
    type: StageObjectType;
    title: string;
    summary: string;
    payload: unknown;
  }>
): StageShellScenario {
  const threadId = `thread_${id}`;
  const initialObjects = objectSpecs.map((objectSpec, index) =>
    createObject(
      id,
      threadId,
      objectSpec.type,
      objectSpec.title,
      objectSpec.summary,
      objectSpec.payload,
      minutesAfter(BASE_TIME, index + 1),
      index
    )
  );
  const agentEvents = agentSpecs.map((agentSpec, index) =>
    createAgentEvent(
      id,
      threadId,
      index,
      agentSpec.type,
      agentSpec.summary,
      agentSpec.details,
      minutesAfter(BASE_TIME, index + 2)
    )
  );
  const approval = createApproval(
    id,
    threadId,
    approvalSpec.actionType,
    approvalSpec.title,
    approvalSpec.summary,
    approvalSpec.scope,
    approvalSpec.consequence,
    minutesAfter(BASE_TIME, 7),
    approvalSpec.riskLevel
  );
  const draftArtifact = createArtifact(
    id,
    threadId,
    artifactSpec.type,
    artifactSpec.title,
    artifactSpec.content,
    minutesAfter(BASE_TIME, 8)
  );
  const approvedArtifact: Artifact = {
    ...draftArtifact,
    id: `${draftArtifact.id}_approved`,
    title: `${draftArtifact.title} - approved output`,
    status: "approved",
    createdAt: minutesAfter(BASE_TIME, 10),
    updatedAt: minutesAfter(BASE_TIME, 10)
  };
  const approvedObjects = approvedObjectSpecs.map((objectSpec, index) =>
    createObject(
      id,
      threadId,
      objectSpec.type,
      objectSpec.title,
      objectSpec.summary,
      objectSpec.payload,
      minutesAfter(BASE_TIME, index + 9),
      initialObjects.length + index
    )
  );

  return {
    id,
    label,
    title,
    intent,
    currentObjective,
    contextSummary,
    threadId,
    riskCue,
    initialObjects,
    agentEvents,
    approval,
    draftArtifact,
    approvedObjects,
    approvedArtifact
  };
}

export const stageShellScenarios: StageShellScenario[] = [
  createScenario(
    "analyze_acquisition_target",
    "Acquisition analysis",
    "Acquisition Diligence Thread",
    "Help me understand whether I should acquire this company and produce a diligence memo.",
    "Shape a buy-side diligence workspace with visible assumptions, risks, and a memo artifact.",
    "The stage assembles a finance, market, risk, and approval surface around a simulated acquisition target.",
    "External outreach requires explicit approval.",
    [
      {
        type: "intent_card",
        title: "Intent parsed",
        summary: "Evaluate an acquisition target and produce a decision memo.",
        payload: {
          originalIntent: "Acquire a company?",
          parsedObjective: "Assess strategic fit, risks, valuation posture, and next diligence actions."
        }
      },
      {
        type: "plan_card",
        title: "Diligence plan",
        summary: "Four workstreams: financial quality, market position, integration risk, decision memo.",
        payload: {
          steps: ["Normalize revenue", "Map competitors", "Identify red flags", "Draft memo"]
        }
      },
      {
        type: "risk_matrix",
        title: "Risk surface",
        summary: "Revenue concentration and integration complexity are the first watchpoints.",
        payload: {
          risks: [
            { label: "Customer concentration", severity: "high" },
            { label: "Founder dependency", severity: "medium" },
            { label: "Synergy uncertainty", severity: "medium" }
          ]
        }
      },
      {
        type: "model_card",
        title: "Valuation model",
        summary: "A simple base/upside/downside acquisition model stays visible as assumptions move.",
        payload: {
          modelTitle: "Acquisition sensitivity model",
          status: "simulated",
          scenarios: [
            { label: "Base", value: "4.2x ARR", confidence: "medium" },
            { label: "Upside", value: "5.1x ARR", confidence: "low" },
            { label: "Downside", value: "3.0x ARR", confidence: "medium" }
          ]
        }
      },
      {
        type: "map_portal",
        title: "Market map",
        summary: "Competitors, customers, and diligence gaps are arranged as a simulated market surface.",
        payload: {
          center: "TargetCo",
          status: "simulated",
          nodes: [
            { label: "Enterprise buyers", angle: 18, distance: 42 },
            { label: "Vertical incumbents", angle: 132, distance: 54 },
            { label: "Platform acquirers", angle: 244, distance: 49 }
          ]
        }
      },
      {
        type: "artifact_card",
        title: "Memo forming",
        summary: "A draft acquisition memo is being assembled from simulated evidence.",
        payload: {
          status: "drafting",
          artifactTitle: "Acquisition Diligence Memo"
        }
      }
    ],
    [
      {
        type: "planned",
        summary: "Mapped the acquisition question into diligence workstreams.",
        details: "The simulated runtime separated strategic fit, financial quality, risk, and memo output."
      },
      {
        type: "started",
        summary: "Started simulated evidence review.",
        details: "No external browsing or private files are used in v0."
      },
      {
        type: "progress",
        summary: "Compared revenue quality and market posture.",
        details: "The stage is using synthetic assumptions to demonstrate the diligence workflow."
      },
      {
        type: "approval_requested",
        summary: "Approval needed before simulated outreach.",
        details: "External banker/customer outreach is consequence-bearing and remains gated."
      }
    ],
    {
      actionType: "external_message",
      title: "Approve simulated outreach brief",
      summary: "Prepare a draft outreach note to request confirmatory diligence materials.",
      scope: "One simulated note to a fictional seller representative.",
      consequence: "In a real system, this would contact an external party. V0 will only create prompt cards.",
      riskLevel: "high"
    },
    {
      type: "memo",
      title: "Acquisition Diligence Memo",
      content: {
        recommendation: "Proceed to deeper diligence only if revenue concentration and founder dependency clear thresholds.",
        sections: [
          "Strategic fit is plausible but unproven.",
          "Primary diligence gap is quality of recurring revenue.",
          "Next artifact should be a confirmatory diligence request list."
        ]
      }
    },
    [
      {
        type: "codex_task_card",
        title: "Codex prompt: diligence model",
        summary: "Build a simple model scaffold from the diligence assumptions.",
        payload: {
          objective: "Create a valuation sensitivity model fixture.",
          tests: ["Model handles base/upside/downside", "Assumptions are visible and editable"]
        }
      },
      {
        type: "research_note",
        title: "Research note",
        summary: "Visible risk gating made the simulated external action feel governed.",
        payload: {
          insight: "Approval clarity is part of the product surface, not a modal afterthought."
        }
      }
    ]
  ),
  createScenario(
    "plan_seed_round",
    "Seed round plan",
    "Seed Round Command Thread",
    "Help me plan a seed round and produce the next five investor actions.",
    "Turn fundraising intent into investor workflow, narrative, approvals, and task artifacts.",
    "The stage creates a founder-facing fundraising workspace with narrative, investor segmentation, and governed outbound.",
    "Investor outreach is simulated and approval-gated.",
    [
      {
        type: "intent_card",
        title: "Intent parsed",
        summary: "Plan a seed round and produce next investor actions.",
        payload: {
          round: "Seed",
          requestedOutput: "Five prioritized actions"
        }
      },
      {
        type: "plan_card",
        title: "Raise plan",
        summary: "Narrative, target list, proof points, and weekly operating cadence.",
        payload: {
          steps: ["Sharpen thesis", "Segment investors", "Draft intro asks", "Build follow-up rhythm"]
        }
      },
      {
        type: "timeline",
        title: "Four-week cadence",
        summary: "A calm weekly rhythm, not a chaotic outbound dashboard.",
        payload: {
          weeks: ["Narrative lock", "Warm intros", "First meetings", "Partner follow-up"]
        }
      },
      {
        type: "map_portal",
        title: "Investor map",
        summary: "A simulated relationship map keeps warm paths separate from cold outbound.",
        payload: {
          center: "Founder thesis",
          status: "simulated",
          nodes: [
            { label: "Warm angels", angle: 28, distance: 44 },
            { label: "Seed specialists", angle: 155, distance: 56 },
            { label: "Strategic intros", angle: 278, distance: 48 }
          ]
        }
      },
      {
        type: "artifact_card",
        title: "Investor action brief",
        summary: "Five next actions are being drafted as an inspectable artifact.",
        payload: {
          status: "drafting",
          artifactTitle: "Seed Round Next Actions"
        }
      }
    ],
    [
      {
        type: "planned",
        summary: "Converted fundraising intent into a staged operating plan.",
        details: "The simulated operator prioritized narrative clarity before outbound volume."
      },
      {
        type: "started",
        summary: "Started simulated investor segmentation.",
        details: "No real investor data or email accounts are used."
      },
      {
        type: "progress",
        summary: "Drafted five founder actions.",
        details: "Each action has a goal, owner, and visible next artifact."
      },
      {
        type: "approval_requested",
        summary: "Approval needed before simulated intro outreach.",
        details: "The system will only create outbound prompt cards after approval."
      }
    ],
    {
      actionType: "external_message",
      title: "Approve simulated investor intro prompts",
      summary: "Create draft prompts for investor intro emails without sending them.",
      scope: "Three simulated investor prompt cards.",
      consequence: "In a real system, outbound investor communication would create external commitments.",
      riskLevel: "high"
    },
    {
      type: "plan",
      title: "Seed Round Next Actions",
      content: {
        actions: [
          "Lock one-sentence category thesis.",
          "Prepare three proof points for warm intros.",
          "Rank first 20 investor targets.",
          "Draft intro request note.",
          "Define weekly founder follow-up ritual."
        ]
      }
    },
    [
      {
        type: "codex_task_card",
        title: "Codex prompt: investor tracker",
        summary: "Create a local fixture for investor action state, not a CRM.",
        payload: {
          objective: "Prototype a stage-native investor action tracker.",
          acceptance: ["No dashboard clutter", "Actions render as objects around the intent"]
        }
      },
      {
        type: "codex_task_card",
        title: "Codex prompt: narrative artifact",
        summary: "Turn the raise thesis into an editable memo artifact.",
        payload: {
          objective: "Build a concise narrative artifact card with revision state."
        }
      }
    ]
  ),
  createScenario(
    "build_blackstage",
    "Build BlackStage",
    "BlackStage Build Thread",
    "Help me turn Black Stage OS into an engineering plan and give Codex the next three tasks.",
    "Transform the product thesis into a Stage Shell plan, visible build labor, and Codex task briefs.",
    "The stage turns its own build into a self-instrumented product/research loop.",
    "Creating task briefs is local and simulated in v0.",
    [
      {
        type: "intent_card",
        title: "Intent parsed",
        summary: "Turn the Blackstage thesis into an engineering plan and Codex tasks.",
        payload: {
          productLoop: "intent -> workspaces -> agent work -> approval -> artifact"
        }
      },
      {
        type: "plan_card",
        title: "Stage Shell v0 plan",
        summary: "Build a living field, event stream, approval ritual, artifacts, and instrumentation.",
        payload: {
          slices: ["Event model", "Render field", "Simulated runtime", "Approval/artifact loop", "Research capture"]
        }
      },
      {
        type: "document_portal",
        title: "Spec portal",
        summary: "The Stage Shell spec stays open as an inspectable object while the plan forms.",
        payload: {
          documentTitle: "Stage Shell v0 spec",
          status: "reviewing",
          sections: [
            {
              label: "Success",
              value: "Intent becomes a world."
            },
            {
              label: "Required",
              value: "Thread, render objects, approval, artifact, instrumentation."
            },
            {
              label: "Boundary",
              value: "Simulated runtime only; no real external actions."
            }
          ]
        }
      },
      {
        type: "artifact_card",
        title: "Codex task brief forming",
        summary: "A local brief is being assembled with objective, files, acceptance criteria, and tests.",
        payload: {
          status: "drafting",
          artifactTitle: "Codex Task Brief: Build Stage Shell v0"
        }
      }
    ],
    [
      {
        type: "planned",
        summary: "Read the product thesis as an interface constraint.",
        details: "The simulation keeps the black field central and treats dashboard sprawl as a product bug."
      },
      {
        type: "started",
        summary: "Started Stage Shell v0 work decomposition.",
        details: "The plan is sliced into domain, runtime, render, instrumentation, and validation checkpoints."
      },
      {
        type: "progress",
        summary: "Drafted three Codex-ready build tasks.",
        details: "Each task has files, acceptance criteria, and a validation command."
      },
      {
        type: "approval_requested",
        summary: "Approval needed to create task prompt cards.",
        details: "The task cards are local artifacts, but the approval ritual is still shown for the thesis."
      }
    ],
    {
      actionType: "file_write",
      title: "Create three Codex task prompts",
      summary: "Generate local prompt cards from the engineering plan.",
      scope: "Three local prompt-card render objects in the current Stage Shell session.",
      consequence: "In v0 this does not write files automatically; it creates inspectable local artifacts.",
      riskLevel: "medium"
    },
    {
      type: "brief",
      title: "Codex Task Brief: Build Stage Shell v0",
      content: {
        objective: "Build the browser Stage Shell prototype from the existing repo.",
        files: ["stage-core fixtures", "agent-runtime simulator", "stage-web components", "research logs"],
        acceptanceCriteria: ["Intent submits", "Objects emerge", "Approval gates action", "Artifact appears", "Events export"]
      }
    },
    [
      {
        type: "codex_task_card",
        title: "Task 1: Evented render model",
        summary: "Create deterministic scenarios and event stream primitives.",
        payload: {
          acceptance: ["Typed stage events", "At least three fixtures", "Runtime emits timed steps"]
        }
      },
      {
        type: "codex_task_card",
        title: "Task 2: Living Stage Shell",
        summary: "Render intent, plan, agent labor, approval, artifact, and task cards.",
        payload: {
          acceptance: ["No chat-bubble dominance", "Responsive field", "Visible approvals"]
        }
      },
      {
        type: "codex_task_card",
        title: "Task 3: Research instrumentation",
        summary: "Log local redacted events, export session JSON, and score the demo.",
        payload: {
          acceptance: ["Research events captured", "Session export works", "Scorecard exists"]
        }
      },
      {
        type: "research_note",
        title: "Research note",
        summary: "Self-hosting the build as a stage scenario tests whether the product can explain itself.",
        payload: {
          insight: "The demo is strongest when the system's own labor is visible and governable."
        }
      },
      {
        type: "browser_portal",
        title: "Validation browser",
        summary: "A simulated browser lane shows where live validation evidence belongs without browsing externally.",
        payload: {
          url: "blackstage://validation/stage-shell-v0",
          status: "simulated",
          observations: [
            "Stage loads from local dev server.",
            "Approval creates task objects.",
            "Artifact edits remain inspectable."
          ],
          guardrail: "No external browsing happens in this v0 scenario."
        }
      },
      {
        type: "model_card",
        title: "Interface model",
        summary: "A compact model shows how intent turns into objects, approvals, and artifacts.",
        payload: {
          modelTitle: "Reality interface model",
          status: "simulated",
          scenarios: [
            { label: "Intent", value: "thread created", confidence: "high" },
            { label: "Objects", value: "workspace formed", confidence: "high" },
            { label: "Artifact", value: "approved/exportable", confidence: "medium" }
          ]
        }
      },
      {
        type: "map_portal",
        title: "Object map",
        summary: "The stage arranges object families around the current intent instead of opening apps.",
        payload: {
          center: "Build Stage Shell v0",
          status: "simulated",
          nodes: [
            { label: "Documents", angle: 8, distance: 42 },
            { label: "Browser", angle: 86, distance: 49 },
            { label: "Models", angle: 172, distance: 45 },
            { label: "Memory", angle: 252, distance: 51 }
          ]
        }
      },
      {
        type: "simulation_card",
        title: "Demo simulator",
        summary: "The system rehearses the first five-second experience as a simulated timeline.",
        payload: {
          simulationTitle: "First five seconds",
          status: "simulated",
          steps: [
            { label: "0s", value: "black field waits" },
            { label: "2s", value: "intent forms a thread" },
            { label: "5s", value: "objects and labor become visible" }
          ]
        }
      },
      {
        type: "memory_card",
        title: "Memory boundary",
        summary: "Project memory remains local and redacted unless the user approves a future write.",
        payload: {
          policy: "local-first",
          status: "private",
          notes: [
            "Store event types and non-sensitive summaries.",
            "Do not store private documents by default.",
            "Memory writes require approval."
          ]
        }
      }
    ]
  ),
  createScenario(
    "research_synthesis",
    "Research synthesis",
    "Research Synthesis Thread",
    "Synthesize these notes into a product insight memo and identify what to test next.",
    "Turn unstructured research into a calm insight workspace with a governed sharing step.",
    "The stage clusters notes, shows uncertainty, and produces a synthesis artifact without storing private source text.",
    "Sharing research outside the session is approval-gated.",
    [
      {
        type: "intent_card",
        title: "Intent parsed",
        summary: "Synthesize notes into product insights and next tests.",
        payload: {
          output: "Product insight memo",
          privacy: "Redacted by default"
        }
      },
      {
        type: "plan_card",
        title: "Synthesis plan",
        summary: "Cluster notes, name insights, identify uncertainty, and define next tests.",
        payload: {
          steps: ["Cluster", "Extract claims", "Mark uncertainty", "Draft next experiments"]
        }
      },
      {
        type: "research_note",
        title: "Insight clusters",
        summary: "Three simulated clusters: trust, control, and artifact usefulness.",
        payload: {
          clusters: ["Trust from visibility", "Control from approval", "Value from artifacts"]
        }
      },
      {
        type: "simulation_card",
        title: "Next-test simulator",
        summary: "A small simulated experiment compares the stage flow against chat-only output.",
        payload: {
          simulationTitle: "Research comparison",
          status: "simulated",
          steps: [
            { label: "Variant A", value: "chat-only synthesis" },
            { label: "Variant B", value: "stage objects plus approval" },
            { label: "Signal", value: "perceived control and artifact confidence" }
          ]
        }
      },
      {
        type: "memory_card",
        title: "Memory boundary",
        summary: "The system keeps source notes redacted and tracks only safe research metadata.",
        payload: {
          policy: "redacted by default",
          status: "private",
          notes: [
            "No private source notes in product metrics.",
            "Store uncertainty and test plans.",
            "Ask before future memory writes."
          ]
        }
      }
    ],
    [
      {
        type: "planned",
        summary: "Separated product claims from build observations.",
        details: "The simulation keeps research ethics visible."
      },
      {
        type: "started",
        summary: "Started redacted synthesis.",
        details: "No private source notes are retained in the product event log."
      },
      {
        type: "progress",
        summary: "Drafted next-test hypotheses.",
        details: "The stage makes assumptions inspectable before export."
      },
      {
        type: "approval_requested",
        summary: "Approval needed before simulated sharing.",
        details: "Research sharing may expose private findings, so it is gated."
      }
    ],
    {
      actionType: "data_share",
      title: "Approve simulated research share",
      summary: "Create a share-ready synthesis brief with private details redacted.",
      scope: "One local share-preview artifact.",
      consequence: "In a real system, this could expose product research externally.",
      riskLevel: "high"
    },
    {
      type: "research_note",
      title: "Product Insight Memo",
      content: {
        insights: [
          "Visible agent labor appears central to trust.",
          "Approval cards should explain consequence, not merely ask permission.",
          "Artifacts make the stage feel useful beyond conversation."
        ],
        nextTests: ["Compare against chat-only flow", "Measure approval clarity", "Observe first five-second comprehension"]
      }
    },
    [
      {
        type: "codex_task_card",
        title: "Codex prompt: synthesis replay",
        summary: "Create a replay fixture from redacted research events.",
        payload: {
          objective: "Make product sessions replayable without retaining private notes."
        }
      }
    ]
  )
];

export function getStageShellScenario(id: StageShellScenarioId): StageShellScenario {
  const scenario = stageShellScenarios.find((candidate) => candidate.id === id);

  if (!scenario) {
    throw new Error(`Unknown Stage Shell scenario: ${id}`);
  }

  return scenario;
}

export function resolveStageShellScenario(intentText: string): StageShellScenario {
  const normalizedIntent = intentText.toLowerCase();

  if (
    normalizedIntent.includes("acquisition") ||
    normalizedIntent.includes("acquire") ||
    normalizedIntent.includes("diligence")
  ) {
    return getStageShellScenario("analyze_acquisition_target");
  }

  if (
    normalizedIntent.includes("seed") ||
    normalizedIntent.includes("raise") ||
    normalizedIntent.includes("investor")
  ) {
    return getStageShellScenario("plan_seed_round");
  }

  if (
    normalizedIntent.includes("research") ||
    normalizedIntent.includes("synth") ||
    normalizedIntent.includes("notes")
  ) {
    return getStageShellScenario("research_synthesis");
  }

  return getStageShellScenario("build_blackstage");
}

export function createScenarioThread(
  scenario: StageShellScenario,
  originalIntent = scenario.intent,
  now = new Date().toISOString(),
  sessionId = `session_${scenario.id}`
): IntentThread {
  return {
    id: scenario.threadId,
    title: scenario.title,
    originalIntent,
    currentObjective: scenario.currentObjective,
    status: "active",
    createdAt: now,
    updatedAt: now,
    contextSummary: scenario.contextSummary,
    renderObjects: [],
    agentEvents: [],
    artifacts: [],
    approvals: [],
    memoryNotes: [],
    decisions: [],
    researchSessionId: sessionId
  };
}

export function createScenarioStageEvents(
  scenario: StageShellScenario,
  thread: IntentThread,
  submittedAt = thread.createdAt
): TimedStageEvent[] {
  const events: TimedStageEvent[] = [
    {
      id: `${scenario.id}_intent_submitted`,
      delayMs: 0,
      event: {
        type: "intent.submitted",
        payload: {
          rawText: thread.originalIntent,
          submittedAt,
          inputMode: "text"
        }
      }
    },
    {
      id: `${scenario.id}_thread_created`,
      delayMs: 120,
      event: {
        type: "thread.created",
        payload: thread
      }
    }
  ];

  scenario.initialObjects.forEach((object, index) => {
    events.push({
      id: `${object.id}_created`,
      delayMs: 420 + index * 360,
      event: {
        type: "object.created",
        payload: object
      }
    });
  });

  scenario.agentEvents.forEach((agentEvent, index) => {
    events.push({
      id: `${agentEvent.id}_emitted`,
      delayMs: 760 + index * 640,
      event: {
        type: "agent.progress",
        payload: agentEvent
      }
    });
  });

  events.push(
    {
      id: `${scenario.approval.id}_requested`,
      delayMs: 3_250,
      event: {
        type: "approval.requested",
        payload: scenario.approval
      }
    },
    {
      id: `${scenario.draftArtifact.id}_created`,
      delayMs: 3_650,
      event: {
        type: "artifact.created",
        payload: scenario.draftArtifact
      }
    }
  );

  return events.sort((left, right) => left.delayMs - right.delayMs);
}

export function createApprovedScenarioStageEvents(
  scenario: StageShellScenario,
  resolvedAt = new Date().toISOString()
): TimedStageEvent[] {
  const approvedEvents: TimedStageEvent[] = [
    {
      id: `${scenario.approval.id}_approved`,
      delayMs: 0,
      event: {
        type: "approval.resolved",
        payload: {
          approvalId: scenario.approval.id,
          threadId: scenario.threadId,
          status: "approved",
          resolvedAt,
          userRequestedExplanation: false
        }
      }
    }
  ];

  scenario.approvedObjects.forEach((object, index) => {
    approvedEvents.push({
      id: `${object.id}_created_after_approval`,
      delayMs: 220 + index * 260,
      event: {
        type: "object.created",
        payload: object
      }
    });
  });

  if (scenario.approvedArtifact) {
    approvedEvents.push({
      id: `${scenario.approvedArtifact.id}_created_after_approval`,
      delayMs: 920,
      event: {
        type: "artifact.created",
        payload: scenario.approvedArtifact
      }
    });
  }

  return approvedEvents;
}
