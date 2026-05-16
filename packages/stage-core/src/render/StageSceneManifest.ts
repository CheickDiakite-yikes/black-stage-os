import type { IntentThread } from "../domain/IntentThread";
import type { StageObject, StageObjectType } from "../domain/StageObject";
import type { IsoTimestamp } from "../domain/shared";

export type StageSceneAmbientState =
  | "idle"
  | "listening"
  | "thinking"
  | "working"
  | "approval_needed"
  | "artifact_ready";

export type StageSceneLayoutMode =
  | "empty_field"
  | "intent_thread"
  | "focused_workbench"
  | "approval_gate"
  | "artifact_workbench";

export type StageSceneClusterId =
  | "intent"
  | "primary_work"
  | "evidence"
  | "approval"
  | "artifact"
  | "telemetry";

export type StageSceneNodeRole =
  | "intent_anchor"
  | "primary_display"
  | "supporting_evidence"
  | "approval_gate"
  | "artifact_output"
  | "system_telemetry";

export type StageSceneMaterial =
  | "black_glass"
  | "luminous_document"
  | "data_glass"
  | "approval_light"
  | "artifact_paper"
  | "memory_glow";

export type StageSceneContour = "rectilinear" | "soft_panel" | "liquid_island";

export type StageSceneMotionCue =
  | "none"
  | "materialize"
  | "breathe"
  | "focus_pull"
  | "orbit"
  | "approval_pulse";

export type StageScenePhaseId =
  | "intent"
  | "plan"
  | "evidence"
  | "approval"
  | "artifact";

export type StageScenePhase = {
  id: StageScenePhaseId;
  label: string;
  value: number;
  clusterId: StageSceneClusterId;
};

export type StageSceneCamera = {
  mode: "orthographic_field" | "cinematic_table";
  focalObjectId?: string;
  depth: number;
  tilt: number;
  parallax: number;
};

export type StageSceneSubstrate = {
  material: "black_velvet" | "black_glass";
  liquidity: number;
  bloom: number;
  grain: number;
};

export type StageSceneTransform = {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotateX: number;
  rotateY: number;
};

export type StageSceneNode = {
  id: string;
  objectId: string;
  objectType: StageObjectType;
  title: string;
  role: StageSceneNodeRole;
  clusterId: StageSceneClusterId;
  material: StageSceneMaterial;
  contour: StageSceneContour;
  motion: StageSceneMotionCue;
  priority: number;
  transform: StageSceneTransform;
};

export type StageSceneEdge = {
  id: string;
  fromObjectId: string;
  toObjectId: string;
  relationship: "frames" | "supports" | "requests_approval" | "produces";
  strength: number;
};

export type StageSceneManifest = {
  id: string;
  threadId: string;
  title: string;
  ambientState: StageSceneAmbientState;
  layoutMode: StageSceneLayoutMode;
  camera: StageSceneCamera;
  substrate: StageSceneSubstrate;
  phases: StageScenePhase[];
  nodes: StageSceneNode[];
  edges: StageSceneEdge[];
  updatedAt: IsoTimestamp;
};

type StageSceneClassification = Pick<
  StageSceneNode,
  "clusterId" | "contour" | "material" | "motion" | "priority" | "role"
>;

export function createStageSceneManifest(thread: IntentThread): StageSceneManifest {
  const renderObjects = thread.renderObjects.filter(
    (object) => object.state !== "hidden"
  );
  const focalObject =
    renderObjects.find((object) => object.state === "focused") ??
    findPrimaryObject(renderObjects);
  const nodes = renderObjects.map((object, index) =>
    createStageSceneNode(object, index, focalObject?.id)
  );
  const primaryNode = nodes.find((node) => node.role === "primary_display") ?? nodes[0];

  return {
    id: `scene_${thread.id}`,
    threadId: thread.id,
    title: thread.title,
    ambientState: resolveAmbientState(thread),
    layoutMode: resolveLayoutMode(thread, nodes),
    camera: {
      mode: nodes.length > 4 ? "cinematic_table" : "orthographic_field",
      focalObjectId: focalObject?.id,
      depth: nodes.length > 4 ? 0.72 : 0.38,
      tilt: nodes.length > 4 ? 9 : 0,
      parallax: nodes.length > 4 ? 0.48 : 0.18
    },
    substrate: {
      material: thread.originalIntent ? "black_glass" : "black_velvet",
      liquidity: thread.originalIntent ? 0.72 : 0.44,
      bloom: thread.approvals.some((approval) => approval.status === "pending")
        ? 0.82
        : 0.58,
      grain: 0.34
    },
    phases: createStageScenePhases(thread, nodes),
    nodes,
    edges: createStageSceneEdges(nodes, primaryNode?.objectId),
    updatedAt: thread.updatedAt
  };
}

function createStageSceneNode(
  object: StageObject,
  index: number,
  focalObjectId: string | undefined
): StageSceneNode {
  const classification = classifyStageObject(object);
  const isFocal = object.id === focalObjectId;
  const objectPosition = object.position ?? { x: 0, y: 0, z: index };

  return {
    id: `scene_node_${object.id}`,
    objectId: object.id,
    objectType: object.type,
    title: object.title,
    ...classification,
    priority: isFocal
      ? Math.max(classification.priority, 100)
      : classification.priority,
    transform: {
      x: objectPosition.x,
      y: objectPosition.y,
      z: objectPosition.z ?? index,
      scale: isFocal ? 1.08 : object.state === "collapsed" ? 0.82 : 1,
      rotateX: classification.role === "primary_display" ? 0 : -1.5,
      rotateY:
        classification.clusterId === "evidence"
          ? -2.5
          : classification.clusterId === "artifact"
            ? 2.5
            : 0
    }
  };
}

function classifyStageObject(object: StageObject): StageSceneClassification {
  switch (object.type) {
    case "intent_card":
      return {
        role: "intent_anchor",
        clusterId: "intent",
        material: "black_glass",
        contour: "liquid_island",
        motion: "breathe",
        priority: 90
      };
    case "plan_card":
    case "model_card":
    case "simulation_card":
      return {
        role: "primary_display",
        clusterId: "primary_work",
        material: "data_glass",
        contour: "liquid_island",
        motion: "focus_pull",
        priority: 95
      };
    case "document_portal":
      return {
        role: "supporting_evidence",
        clusterId: "evidence",
        material: "luminous_document",
        contour: "soft_panel",
        motion: "materialize",
        priority: 74
      };
    case "browser_portal":
    case "map_portal":
    case "risk_matrix":
    case "table":
    case "chart":
    case "timeline":
      return {
        role: "supporting_evidence",
        clusterId: "evidence",
        material: "data_glass",
        contour: "soft_panel",
        motion: "materialize",
        priority: 66
      };
    case "approval_card":
      return {
        role: "approval_gate",
        clusterId: "approval",
        material: "approval_light",
        contour: "liquid_island",
        motion: "approval_pulse",
        priority: 98
      };
    case "artifact_card":
    case "codex_task_card":
    case "code_diff":
      return {
        role: "artifact_output",
        clusterId: "artifact",
        material: "artifact_paper",
        contour: "soft_panel",
        motion: "materialize",
        priority: 82
      };
    case "agent_feed":
      return {
        role: "system_telemetry",
        clusterId: "telemetry",
        material: "black_glass",
        contour: "rectilinear",
        motion: "orbit",
        priority: 58
      };
    case "memory_card":
    case "research_note":
      return {
        role: "supporting_evidence",
        clusterId: "evidence",
        material: "memory_glow",
        contour: "soft_panel",
        motion: "materialize",
        priority: 62
      };
  }
}

function createStageScenePhases(
  thread: IntentThread,
  nodes: StageSceneNode[]
): StageScenePhase[] {
  return [
    {
      id: "intent",
      label: "Intent",
      value: nodes.filter((node) => node.clusterId === "intent").length,
      clusterId: "intent"
    },
    {
      id: "plan",
      label: "Plan",
      value: nodes.filter((node) => node.clusterId === "primary_work").length,
      clusterId: "primary_work"
    },
    {
      id: "evidence",
      label: "Evidence",
      value: nodes.filter((node) => node.clusterId === "evidence").length,
      clusterId: "evidence"
    },
    {
      id: "approval",
      label: "Approval",
      value: thread.approvals.filter((approval) => approval.status === "pending")
        .length,
      clusterId: "approval"
    },
    {
      id: "artifact",
      label: "Artifact",
      value: thread.artifacts.length,
      clusterId: "artifact"
    }
  ];
}

function createStageSceneEdges(
  nodes: StageSceneNode[],
  primaryObjectId: string | undefined
): StageSceneEdge[] {
  const intentNode = nodes.find((node) => node.clusterId === "intent");
  const primaryNode = primaryObjectId
    ? nodes.find((node) => node.objectId === primaryObjectId)
    : nodes.find((node) => node.role === "primary_display");
  const edges: StageSceneEdge[] = [];

  if (intentNode && primaryNode && intentNode.objectId !== primaryNode.objectId) {
    edges.push({
      id: `edge_${intentNode.objectId}_${primaryNode.objectId}`,
      fromObjectId: intentNode.objectId,
      toObjectId: primaryNode.objectId,
      relationship: "frames",
      strength: 0.9
    });
  }

  for (const node of nodes) {
    if (!primaryNode || node.objectId === primaryNode.objectId) {
      continue;
    }

    if (node.clusterId === "evidence") {
      edges.push({
        id: `edge_${node.objectId}_${primaryNode.objectId}`,
        fromObjectId: node.objectId,
        toObjectId: primaryNode.objectId,
        relationship: "supports",
        strength: 0.64
      });
    }

    if (node.clusterId === "approval") {
      edges.push({
        id: `edge_${primaryNode.objectId}_${node.objectId}`,
        fromObjectId: primaryNode.objectId,
        toObjectId: node.objectId,
        relationship: "requests_approval",
        strength: 0.82
      });
    }

    if (node.clusterId === "artifact") {
      edges.push({
        id: `edge_${primaryNode.objectId}_${node.objectId}`,
        fromObjectId: primaryNode.objectId,
        toObjectId: node.objectId,
        relationship: "produces",
        strength: 0.72
      });
    }
  }

  return edges;
}

function resolveAmbientState(thread: IntentThread): StageSceneAmbientState {
  if (!thread.originalIntent) {
    return "idle";
  }

  if (thread.approvals.some((approval) => approval.status === "pending")) {
    return "approval_needed";
  }

  if (thread.artifacts.some((artifact) => artifact.status === "approved")) {
    return "artifact_ready";
  }

  if (thread.agentEvents.some((event) => event.type === "progress")) {
    return "working";
  }

  return thread.status === "active" ? "thinking" : "listening";
}

function resolveLayoutMode(
  thread: IntentThread,
  nodes: StageSceneNode[]
): StageSceneLayoutMode {
  if (!thread.originalIntent || nodes.length === 0) {
    return "empty_field";
  }

  if (thread.approvals.some((approval) => approval.status === "pending")) {
    return "approval_gate";
  }

  if (thread.artifacts.length > 0) {
    return "artifact_workbench";
  }

  if (nodes.some((node) => node.role === "primary_display")) {
    return "focused_workbench";
  }

  return "intent_thread";
}

function findPrimaryObject(objects: StageObject[]): StageObject | undefined {
  return (
    objects.find((object) => object.type === "plan_card") ??
    objects.find((object) => object.type === "model_card") ??
    objects.find((object) => object.type === "document_portal") ??
    objects[0]
  );
}
