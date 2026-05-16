import type {
  StageSceneClusterId,
  StageSceneEdge,
  StageSceneManifest,
  StageSceneNode
} from "@blackstage/stage-core";

type StageSceneFieldProps = {
  scene: StageSceneManifest;
};

type SceneAnchor = {
  node: StageSceneNode;
  x: number;
  y: number;
};

type ClusterHalo = {
  id: StageSceneClusterId;
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
};

const clusterHaloById: Record<StageSceneClusterId, ClusterHalo> = {
  intent: {
    id: "intent",
    x: 18,
    y: 25,
    radiusX: 18,
    radiusY: 16
  },
  primary_work: {
    id: "primary_work",
    x: 54,
    y: 26,
    radiusX: 25,
    radiusY: 18
  },
  evidence: {
    id: "evidence",
    x: 28,
    y: 70,
    radiusX: 24,
    radiusY: 20
  },
  approval: {
    id: "approval",
    x: 84,
    y: 48,
    radiusX: 13,
    radiusY: 18
  },
  artifact: {
    id: "artifact",
    x: 84,
    y: 76,
    radiusX: 14,
    radiusY: 15
  },
  telemetry: {
    id: "telemetry",
    x: 84,
    y: 18,
    radiusX: 13,
    radiusY: 12
  }
};

export function StageSceneField({ scene }: StageSceneFieldProps) {
  const anchors = scene.nodes.map(resolveSceneAnchor);
  const anchorByObjectId = new Map(
    anchors.map((anchor) => [anchor.node.objectId, anchor])
  );
  const visibleEdges = scene.edges
    .map((edge) => ({
      edge,
      from: anchorByObjectId.get(edge.fromObjectId),
      to: anchorByObjectId.get(edge.toObjectId)
    }))
    .filter(
      (
        candidate
      ): candidate is {
        edge: StageSceneEdge;
        from: SceneAnchor;
        to: SceneAnchor;
      } => Boolean(candidate.from && candidate.to)
    );
  const visibleClusters = Array.from(
    new Set(scene.nodes.map((node) => node.clusterId))
  ).map((clusterId) => resolveClusterHalo(clusterId, anchors));
  const focalAnchor =
    anchors.find((anchor) => anchor.node.objectId === scene.camera.focalObjectId) ??
    anchors.find((anchor) => anchor.node.role === "primary_display") ??
    anchors[0];
  const floorY = focalAnchor ? Math.min(91, focalAnchor.y + 31) : 74;

  return (
    <div
      className="stage-scene-field"
      aria-hidden="true"
      data-ambient={scene.ambientState}
      data-edge-count={visibleEdges.length}
      data-layout={scene.layoutMode}
      data-node-count={scene.nodes.length}
      data-testid="stage-scene-field"
    >
      <svg
        className="stage-scene-field-vector"
        focusable="false"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <defs>
          <linearGradient id="scene-edge-default" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(216, 189, 133, 0)" />
            <stop offset="50%" stopColor="rgba(216, 189, 133, 0.62)" />
            <stop offset="100%" stopColor="rgba(216, 189, 133, 0)" />
          </linearGradient>
          <filter id="scene-field-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>
        <g className="scene-cluster-halos">
          {visibleClusters.map((cluster) => (
            <ellipse
              key={cluster.id}
              className={`scene-cluster-halo scene-cluster-halo-${cluster.id}`}
              cx={cluster.x}
              cy={cluster.y}
              data-scene-cluster={cluster.id}
              rx={cluster.radiusX}
              ry={cluster.radiusY}
            />
          ))}
        </g>
        <g className="scene-stage-floor">
          <path
            className="scene-horizon-line"
            d="M 2 74 C 19 70 32 76 48 73 S 78 70 98 73"
            pathLength="1"
          />
          {focalAnchor ? (
            <g
              className="scene-focal-stage"
              data-scene-focal={focalAnchor.node.objectId}
              transform={`translate(${focalAnchor.x} ${floorY})`}
            >
              <ellipse className="scene-floor-ring scene-floor-ring-outer" rx="25" ry="5.4" />
              <ellipse className="scene-floor-ring scene-floor-ring-mid" rx="15.2" ry="3.3" />
              <ellipse className="scene-floor-ring scene-floor-ring-core" rx="6.2" ry="1.4" />
              <path className="scene-floor-sweep" d="M -28 1.9 C -9 4.8 10 3.8 30 -1.7" />
            </g>
          ) : null}
        </g>
        <g className="scene-edge-field">
          {visibleEdges.map(({ edge, from, to }) => (
            <path
              key={edge.id}
              className={`scene-edge scene-edge-${edge.relationship}`}
              d={drawSceneEdge(from, to)}
              data-scene-relationship={edge.relationship}
              pathLength="1"
            />
          ))}
        </g>
        <g className="scene-node-field">
          {anchors.map((anchor) => (
            <g
              key={anchor.node.id}
              className={`scene-node scene-node-${anchor.node.role}`}
              data-scene-cluster={anchor.node.clusterId}
              data-scene-role={anchor.node.role}
              transform={`translate(${anchor.x} ${anchor.y})`}
            >
              <circle className="scene-node-orbit" r={nodeOrbitRadius(anchor.node)} />
              <circle className="scene-node-core" r="0.72" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function resolveSceneAnchor(node: StageSceneNode, index: number): SceneAnchor {
  const softIndexOffset = (index % 2 === 0 ? -1 : 1) * 0.65;

  return {
    node,
    x: clampSceneCoordinate(node.transform.x + softIndexOffset),
    y: clampSceneCoordinate(node.transform.y - softIndexOffset)
  };
}

function resolveClusterHalo(
  clusterId: StageSceneClusterId,
  anchors: SceneAnchor[]
): ClusterHalo {
  const clusterAnchors = anchors.filter((anchor) => anchor.node.clusterId === clusterId);
  const fallback = clusterHaloById[clusterId];

  if (clusterAnchors.length === 0) {
    return fallback;
  }

  const x =
    clusterAnchors.reduce((total, anchor) => total + anchor.x, 0) /
    clusterAnchors.length;
  const y =
    clusterAnchors.reduce((total, anchor) => total + anchor.y, 0) /
    clusterAnchors.length;
  const spreadX = Math.max(
    fallback.radiusX,
    ...clusterAnchors.map((anchor) => Math.abs(anchor.x - x) + 8)
  );
  const spreadY = Math.max(
    fallback.radiusY,
    ...clusterAnchors.map((anchor) => Math.abs(anchor.y - y) + 6)
  );

  return {
    id: clusterId,
    x,
    y,
    radiusX: Math.min(28, spreadX),
    radiusY: Math.min(23, spreadY)
  };
}

function clampSceneCoordinate(value: number): number {
  return Math.min(96, Math.max(4, value));
}

function drawSceneEdge(from: SceneAnchor, to: SceneAnchor): string {
  const midpointX = (from.x + to.x) / 2;
  const lift = Math.abs(to.y - from.y) > 24 ? -4 : 3;
  const controlOneY = from.y + lift;
  const controlTwoY = to.y - lift;

  return [
    `M ${from.x.toFixed(2)} ${from.y.toFixed(2)}`,
    `C ${midpointX.toFixed(2)} ${controlOneY.toFixed(2)}`,
    `${midpointX.toFixed(2)} ${controlTwoY.toFixed(2)}`,
    `${to.x.toFixed(2)} ${to.y.toFixed(2)}`
  ].join(" ");
}

function nodeOrbitRadius(node: StageSceneNode): number {
  if (node.role === "primary_display") {
    return 2.2;
  }

  if (node.role === "approval_gate") {
    return 1.9;
  }

  if (node.priority >= 80) {
    return 1.6;
  }

  return 1.25;
}
