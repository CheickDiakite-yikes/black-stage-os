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

export type StageSceneZoneId =
  | "intent_ingress"
  | "work_focus"
  | "evidence_orbit"
  | "approval_threshold"
  | "artifact_output";

export type StageSceneZone = {
  id: StageSceneZoneId;
  label: string;
  clusterId: StageSceneClusterId;
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  intensity: number;
  active: boolean;
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
  /**
   * Stage-space percentages, where 0/0 is the upper-left of the render field.
   * Drag offsets stay on the StageObject itself; these coordinates are the
   * semantic scene anchor used by the renderer.
   */
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
  zones: StageSceneZone[];
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
    (object) =>
      object.state !== "hidden" &&
      object.type !== "approval_card" &&
      object.type !== "artifact_card"
  );
  const focalObject = findFocalObject(renderObjects);
  const clusterCounts = createClusterCounter();
  const nodes = renderObjects.map((object, index) => {
    const classification = classifyStageObject(object);
    const clusterIndex = clusterCounts[classification.clusterId];
    clusterCounts[classification.clusterId] += 1;

    return createStageSceneNode(
      object,
      index,
      clusterIndex,
      focalObject?.id,
      classification
    );
  });
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
    zones: createStageSceneZones(thread, nodes),
    nodes,
    edges: createStageSceneEdges(nodes, primaryNode?.objectId),
    updatedAt: thread.updatedAt
  };
}

function createStageSceneNode(
  object: StageObject,
  index: number,
  clusterIndex: number,
  focalObjectId: string | undefined,
  classification: StageSceneClassification
): StageSceneNode {
  const isFocal = object.id === focalObjectId;

  return {
    id: `scene_node_${object.id}`,
    objectId: object.id,
    objectType: object.type,
    title: object.title,
    ...classification,
    priority: isFocal
      ? Math.max(classification.priority, 100)
      : classification.priority,
    transform: resolveStageTransform(object, index, clusterIndex, classification, isFocal)
  };
}

function createClusterCounter(): Record<StageSceneClusterId, number> {
  return {
    intent: 0,
    primary_work: 0,
    evidence: 0,
    approval: 0,
    artifact: 0,
    telemetry: 0
  };
}

function resolveStageTransform(
  object: StageObject,
  index: number,
  clusterIndex: number,
  classification: StageSceneClassification,
  isFocal: boolean
): StageSceneTransform {
  const collapsedScale = object.state === "collapsed" ? 0.76 : 1;
  const primaryAnchors = [
    { x: 57, y: 35, z: 88, scale: 0.98, rotateX: 0, rotateY: 0 },
    { x: 94, y: 23, z: 66, scale: 0.54, rotateX: -3.5, rotateY: 7 },
    { x: 24, y: 62, z: 58, scale: 0.54, rotateX: -5, rotateY: -5 },
    { x: 94, y: 62, z: 56, scale: 0.52, rotateX: -5, rotateY: 8 }
  ];
  const artifactAnchors = [
    { x: 70, y: 77, z: 52, scale: 0.72, rotateX: -5, rotateY: 4 },
    { x: 94, y: 64, z: 56, scale: 0.66, rotateX: -4.5, rotateY: 7 },
    { x: 94, y: 82, z: 48, scale: 0.64, rotateX: -6, rotateY: 8 },
    { x: 62, y: 88, z: 40, scale: 0.62, rotateX: -7, rotateY: 3 }
  ];
  const anchor =
    classification.clusterId === "intent"
      ? { x: 15, y: 28, z: 58, scale: 0.82, rotateX: -3, rotateY: -7 }
      : classification.clusterId === "primary_work"
        ? primaryAnchors[clusterIndex % primaryAnchors.length]
        : classification.clusterId === "evidence"
          ? resolveEvidenceAnchor(object, clusterIndex)
          : classification.clusterId === "approval"
            ? { x: 78, y: 47, z: 94, scale: 0.92, rotateX: -2, rotateY: 6 }
            : classification.clusterId === "artifact"
              ? artifactAnchors[clusterIndex % artifactAnchors.length]
              : {
                  x: 17 + (clusterIndex % 2) * 7,
                  y: 82,
                  z: 24 + index,
                  scale: 0.72,
                  rotateX: -7,
                  rotateY: -5
                };

  return {
    x: clampStageCoordinate(anchor.x),
    y: clampStageCoordinate(anchor.y),
    z: anchor.z + (isFocal ? 16 : 0),
    scale: Number((anchor.scale * collapsedScale * (isFocal ? 1.06 : 1)).toFixed(2)),
    rotateX: anchor.rotateX,
    rotateY: anchor.rotateY
  };
}

function resolveEvidenceAnchor(
  object: StageObject,
  clusterIndex: number
): Omit<StageSceneTransform, "rotateX" | "rotateY"> &
  Pick<StageSceneTransform, "rotateX" | "rotateY"> {
  const fallbackAnchors = [
    { x: 18, y: 75, z: 44, scale: 0.74, rotateX: -5.5, rotateY: -7 },
    { x: 37, y: 73, z: 40, scale: 0.68, rotateX: -6, rotateY: -3 },
    { x: 82, y: 72, z: 42, scale: 0.68, rotateX: -5.5, rotateY: 6 },
    { x: 18, y: 91, z: 30, scale: 0.58, rotateX: -7, rotateY: -6 },
    { x: 37, y: 90, z: 28, scale: 0.56, rotateX: -7, rotateY: -2 },
    { x: 58, y: 90, z: 27, scale: 0.56, rotateX: -7, rotateY: 3 },
    { x: 82, y: 88, z: 25, scale: 0.56, rotateX: -7, rotateY: 7 }
  ];

  switch (object.type) {
    case "document_portal":
      return { x: 18, y: 75, z: 44, scale: 0.74, rotateX: -5.5, rotateY: -7 };
    case "browser_portal":
      return { x: 52, y: 80, z: 42, scale: 0.6, rotateX: -6.5, rotateY: 0 };
    case "map_portal":
      return { x: 58, y: 90, z: 34, scale: 0.56, rotateX: -7, rotateY: 3 };
    case "memory_card":
      return { x: 82, y: 94, z: 30, scale: 0.54, rotateX: -7.5, rotateY: 7 };
    case "timeline":
      return { x: 18, y: 91, z: 30, scale: 0.56, rotateX: -7, rotateY: -6 };
    case "research_note":
      return clusterIndex % 2 === 0
        ? { x: 37, y: 90, z: 28, scale: 0.54, rotateX: -7, rotateY: -2 }
        : { x: 27, y: 84, z: 38, scale: 0.56, rotateX: -6.5, rotateY: -5 };
    default:
      return fallbackAnchors[clusterIndex % fallbackAnchors.length];
  }
}

function clampStageCoordinate(value: number): number {
  return Math.min(94, Math.max(6, value));
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

function createStageSceneZones(
  thread: IntentThread,
  nodes: StageSceneNode[]
): StageSceneZone[] {
  const clusterCount = (clusterId: StageSceneClusterId) =>
    nodes.filter((node) => node.clusterId === clusterId).length;
  const approvalCount = thread.approvals.length;
  const artifactCount = thread.artifacts.length;

  return [
    {
      id: "intent_ingress",
      label: "Intent ingress",
      clusterId: "intent",
      x: 15,
      y: 28,
      radiusX: 17,
      radiusY: 15,
      intensity: resolveZoneIntensity(clusterCount("intent"), 1),
      active: clusterCount("intent") > 0
    },
    {
      id: "work_focus",
      label: "Work focus",
      clusterId: "primary_work",
      x: 57,
      y: 36,
      radiusX: 32,
      radiusY: 22,
      intensity: resolveZoneIntensity(clusterCount("primary_work"), 3),
      active: clusterCount("primary_work") > 0
    },
    {
      id: "evidence_orbit",
      label: "Evidence orbit",
      clusterId: "evidence",
      x: 36,
      y: 78,
      radiusX: 38,
      radiusY: 18,
      intensity: resolveZoneIntensity(clusterCount("evidence"), 6),
      active: clusterCount("evidence") > 0
    },
    {
      id: "approval_threshold",
      label: "Approval threshold",
      clusterId: "approval",
      x: 84,
      y: 48,
      radiusX: 15,
      radiusY: 20,
      intensity: resolveZoneIntensity(approvalCount, 1),
      active: approvalCount > 0
    },
    {
      id: "artifact_output",
      label: "Artifact output",
      clusterId: "artifact",
      x: 82,
      y: 76,
      radiusX: 19,
      radiusY: 18,
      intensity: resolveZoneIntensity(artifactCount, 3),
      active: artifactCount > 0 || clusterCount("artifact") > 0
    }
  ];
}

function resolveZoneIntensity(value: number, fullStrengthAt: number): number {
  if (value <= 0) {
    return 0.18;
  }

  return Number(Math.min(1, 0.34 + value / fullStrengthAt / 1.45).toFixed(2));
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

function findFocalObject(objects: StageObject[]): StageObject | undefined {
  return (
    objects.find(
      (object) => object.state === "focused" && object.type !== "intent_card"
    ) ??
    findPrimaryObject(objects) ??
    objects.find((object) => object.state === "focused") ??
    objects[0]
  );
}
