import { MarkerType } from "@xyflow/react";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_SIZES,
  EDGE_STROKE_COLOR,
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeShape,
} from "@/types/canvas";

export type TemplateComplexity = "Starter" | "Intermediate" | "Advanced";

// A predefined diagram the user can drop onto the canvas in place of the
// current work. Reuses the shared canvas node/edge types so imported elements
// behave exactly like hand-drawn ones. The descriptive metadata powers the
// searchable/filterable template gallery and the premium template cards.
export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  /** Best-fit situation for this pattern (shown as "Best for ..."). */
  useCase: string;
  /** Relative architecture complexity, used for the badge and filter. */
  complexity: TemplateComplexity;
  /** Suggested stack or system type (mono line on the card). */
  stack: string;
  /** Grouping for the gallery filter (e.g. Backend, Delivery, Messaging). */
  category: string;
  /** Free-text tags for search + chips. */
  tags: string[];
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// Arrow marker matching the canvas default so imported edges render with the
// same arrowhead as connections drawn by hand.
const ARROW_MARKER = {
  type: MarkerType.ArrowClosed,
  width: 18,
  height: 18,
  color: EDGE_STROKE_COLOR,
} as const;

// Build a template node from terse, readable args. Size defaults to the shape's
// standard footprint so template data only carries layout positions.
function node(
  id: string,
  label: string,
  shape: CanvasNodeShape,
  colorIndex: number,
  x: number,
  y: number,
): CanvasNode {
  const size = DEFAULT_NODE_SIZES[shape];
  return {
    id,
    type: CANVAS_NODE_TYPE,
    position: { x, y },
    style: { width: size.width, height: size.height },
    data: {
      label,
      color: NODE_COLORS[colorIndex % NODE_COLORS.length],
      shape,
    },
  };
}

// Build a template edge with the custom edge type + arrow marker so it matches
// canvas defaults without relying on defaultEdgeOptions at import time.
function edge(source: string, target: string, label?: string): CanvasEdge {
  return {
    id: `${source}->${target}`,
    type: CANVAS_EDGE_TYPE,
    source,
    target,
    markerEnd: ARROW_MARKER,
    data: label ? { label } : {},
  };
}

const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description:
    "Client traffic through an API gateway fanning out to auth, user, and order services backed by a shared database.",
  useCase: "Splitting a monolith into independently deployable services.",
  complexity: "Intermediate",
  stack: "API gateway · services · shared database",
  category: "Backend",
  tags: ["api-gateway", "services", "rest", "database", "monolith-split"],
  nodes: [
    node("client", "Client", "pill", 1, 280, 0),
    node("gateway", "API Gateway", "rectangle", 3, 270, 140),
    node("auth", "Auth Service", "rectangle", 5, 40, 300),
    node("user", "User Service", "rectangle", 6, 280, 300),
    node("order", "Order Service", "rectangle", 4, 520, 300),
    node("db", "Database", "cylinder", 7, 280, 480),
  ],
  edges: [
    edge("client", "gateway"),
    edge("gateway", "auth"),
    edge("gateway", "user"),
    edge("gateway", "order"),
    edge("user", "db"),
    edge("order", "db"),
  ],
};

const cicd: CanvasTemplate = {
  id: "cicd-pipeline",
  name: "CI/CD Pipeline",
  description:
    "A linear delivery pipeline from commit through build, test, and staged deploys to production.",
  useCase: "Automating build, test, and staged deploys to production.",
  complexity: "Starter",
  stack: "CI runner · build · test · environments",
  category: "Delivery",
  tags: ["ci", "cd", "pipeline", "deploy", "release"],
  nodes: [
    node("commit", "Commit", "circle", 1, 0, 60),
    node("build", "Build", "rectangle", 3, 200, 70),
    node("test", "Test", "rectangle", 6, 440, 70),
    node("staging", "Deploy Staging", "rectangle", 4, 680, 70),
    node("prod", "Deploy Prod", "rectangle", 7, 920, 70),
  ],
  edges: [
    edge("commit", "build"),
    edge("build", "test"),
    edge("test", "staging", "on pass"),
    edge("staging", "prod", "promote"),
  ],
};

const eventDriven: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description:
    "A producer publishing to a central event bus that fans out to independent consumers and a data store.",
  useCase: "Decoupling producers from consumers for async workloads.",
  complexity: "Advanced",
  stack: "Event bus · consumers · data store",
  category: "Messaging",
  tags: ["events", "pub-sub", "async", "queue", "streaming"],
  nodes: [
    node("producer", "Producer", "rectangle", 3, 0, 160),
    node("bus", "Event Bus", "hexagon", 7, 280, 150),
    node("consumerA", "Consumer A", "rectangle", 5, 560, 20),
    node("consumerB", "Consumer B", "rectangle", 4, 560, 180),
    node("store", "Data Store", "cylinder", 6, 560, 340),
  ],
  edges: [
    edge("producer", "bus", "publish"),
    edge("bus", "consumerA"),
    edge("bus", "consumerB"),
    edge("bus", "store"),
  ],
};

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  microservices,
  cicd,
  eventDriven,
];

// Clone a template into fresh canvas elements with unique IDs so importing the
// same template repeatedly never collides with existing or previously imported
// nodes. Edge endpoints are remapped to the new node IDs.
export function instantiateTemplate(template: CanvasTemplate): {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
} {
  const stamp = Date.now();
  const idMap = new Map<string, string>();

  const nodes = template.nodes.map((source, index) => {
    const newId = `${template.id}-${source.id}-${stamp}-${index}`;
    idMap.set(source.id, newId);
    return {
      ...source,
      id: newId,
      data: { ...source.data },
      position: { ...source.position },
    };
  });

  const edges = template.edges.map((source, index) => ({
    ...source,
    id: `${template.id}-edge-${stamp}-${index}`,
    source: idMap.get(source.source) ?? source.source,
    target: idMap.get(source.target) ?? source.target,
    data: { ...source.data },
  }));

  return { nodes, edges };
}
