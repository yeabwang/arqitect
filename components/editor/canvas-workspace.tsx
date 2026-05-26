"use client";

import {
  Component,
  useCallback,
  useRef,
  type DragEvent,
  type ReactNode,
} from "react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react/suspense";
import { Cursors, useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type DefaultEdgeOptions,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import { CanvasControls } from "@/components/editor/canvas-controls";
import { CanvasEdge as CanvasEdgeRenderer } from "@/components/editor/canvas-edge";
import { CanvasNode as CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { ShapePanel } from "@/components/editor/shape-panel";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import {
  instantiateTemplate,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";
import {
  useKeyboardShortcuts,
  ZOOM_ANIMATION_DURATION,
} from "@/hooks/useKeyboardShortcuts";
import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  EDGE_STROKE_COLOR,
  SHAPE_DRAG_MIME,
  type CanvasEdge,
  type CanvasNode,
  type ShapeDragPayload,
} from "@/types/canvas";

const nodeTypes: NodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeRenderer,
};

const edgeTypes: EdgeTypes = {
  [CANVAS_EDGE_TYPE]: CanvasEdgeRenderer,
};

// Default style for new edges: custom renderer, light rounded stroke, and an
// arrowhead at the end.
const ARROW_MARKER = {
  type: MarkerType.ArrowClosed,
  width: 18,
  height: 18,
  color: EDGE_STROKE_COLOR,
} as const;

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: CANVAS_EDGE_TYPE,
  markerEnd: ARROW_MARKER,
  style: { stroke: EDGE_STROKE_COLOR, strokeWidth: 2, strokeLinecap: "round" },
};

// Monotonic counter combined with the shape name and a timestamp to build
// unique node IDs for shapes dropped onto or pasted into the canvas.
let nodeIdCounter = 0;

// Pixel offset applied to pasted nodes so they don't land exactly on top of
// their originals.
const PASTE_OFFSET = 32;

interface CanvasWorkspaceProps {
  roomId: string;
  templatesOpen: boolean;
  onTemplatesOpenChange: (open: boolean) => void;
}

interface CollaborativeCanvasProps {
  templatesOpen: boolean;
  onTemplatesOpenChange: (open: boolean) => void;
}

interface CanvasErrorBoundaryState {
  hasError: boolean;
}

const initialNodes: CanvasNode[] = [];
const initialEdges: CanvasEdge[] = [];

class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <CanvasConnectionError />;
    }

    return this.props.children;
  }
}

function CanvasLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background text-sm text-muted-foreground">
      Loading canvas...
    </div>
  );
}

function CanvasConnectionError() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background text-sm text-muted-foreground">
      Unable to connect to the canvas.
    </div>
  );
}

function CollaborativeCanvas({
  templatesOpen,
  onTemplatesOpenChange,
}: CollaborativeCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: initialNodes },
      edges: { initial: initialEdges },
    });
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const { screenToFlowPosition } = reactFlow;

  // Liveblocks history powers undo/redo for the synced flow state.
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  // In-memory clipboard for canvas copy/paste. Holds copied nodes plus the
  // edges fully internal to that selection so a connected group survives paste.
  const clipboard = useRef<{ nodes: CanvasNode[]; edges: CanvasEdge[] }>({
    nodes: [],
    edges: [],
  });

  // Snapshot the current selection into the clipboard (nodes + internal edges)
  // and return the copied nodes so cut can also remove them.
  const copySelectionToClipboard = useCallback((): CanvasNode[] => {
    const selectedNodes = reactFlow.getNodes().filter((node) => node.selected);
    if (selectedNodes.length === 0) {
      return [];
    }
    const selectedIds = new Set(selectedNodes.map((node) => node.id));
    const internalEdges = reactFlow
      .getEdges()
      .filter(
        (edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target),
      );
    clipboard.current = { nodes: selectedNodes, edges: internalEdges };
    return selectedNodes;
  }, [reactFlow]);

  const handleCopy = useCallback(() => {
    copySelectionToClipboard();
  }, [copySelectionToClipboard]);

  const handleCut = useCallback(() => {
    const selectedNodes = copySelectionToClipboard();
    if (selectedNodes.length === 0) {
      return;
    }
    // deleteElements cascades to connected edges and routes removal through the
    // Liveblocks-synced change handlers.
    void reactFlow.deleteElements({
      nodes: selectedNodes.map((node) => ({ id: node.id })),
    });
  }, [copySelectionToClipboard, reactFlow]);

  const handleSelectAll = useCallback(() => {
    const nodeChanges = reactFlow
      .getNodes()
      .map((node) => ({ type: "select" as const, id: node.id, selected: true }));
    const edgeChanges = reactFlow
      .getEdges()
      .map((edge) => ({ type: "select" as const, id: edge.id, selected: true }));
    if (nodeChanges.length > 0) {
      onNodesChange(nodeChanges);
    }
    if (edgeChanges.length > 0) {
      onEdgesChange(edgeChanges);
    }
  }, [onEdgesChange, onNodesChange, reactFlow]);

  const handlePaste = useCallback(() => {
    const { nodes: copiedNodes, edges: copiedEdges } = clipboard.current;
    if (copiedNodes.length === 0) {
      return;
    }

    const stamp = Date.now();
    const idMap = new Map<string, string>();
    const pastedNodes: CanvasNode[] = copiedNodes.map((node) => {
      nodeIdCounter += 1;
      const newId = `${node.data.shape}-${stamp}-${nodeIdCounter}`;
      idMap.set(node.id, newId);
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + PASTE_OFFSET,
          y: node.position.y + PASTE_OFFSET,
        },
        selected: true,
      };
    });

    const pastedEdges: CanvasEdge[] = copiedEdges.map((edge) => {
      nodeIdCounter += 1;
      return {
        ...edge,
        id: `edge-${stamp}-${nodeIdCounter}`,
        source: idMap.get(edge.source) ?? edge.source,
        target: idMap.get(edge.target) ?? edge.target,
        selected: false,
      };
    });

    // Deselect the current selection so only the freshly pasted copy is active.
    const deselectChanges = reactFlow
      .getNodes()
      .filter((node) => node.selected)
      .map((node) => ({ type: "select" as const, id: node.id, selected: false }));

    onNodesChange([
      ...deselectChanges,
      ...pastedNodes.map((item) => ({ type: "add" as const, item })),
    ]);
    if (pastedEdges.length > 0) {
      onEdgesChange(pastedEdges.map((item) => ({ type: "add" as const, item })));
    }
  }, [onEdgesChange, onNodesChange, reactFlow]);

  // Append a starter template to the canvas alongside the user's existing work.
  // Template positions are shifted so the imported diagram lands adjacent to
  // the rightmost existing node instead of stacking on top of current content.
  // The freshly added nodes become the selection, and the view fits to show
  // both the existing diagram and the new import.
  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      const { nodes: templateNodes, edges: templateEdges } =
        instantiateTemplate(template);
      if (templateNodes.length === 0) {
        return;
      }

      const existingNodes = reactFlow.getNodes();

      // Place the template to the right of whatever is already on the canvas
      // (with a small gap) so existing diagrams stay intact and visible.
      const GAP_BETWEEN_DIAGRAMS = 160;
      if (existingNodes.length > 0) {
        const existingMaxX = Math.max(
          ...existingNodes.map((node) => {
            const width =
              Number(node.style?.width) || node.measured?.width || 0;
            return node.position.x + width;
          }),
        );
        const templateMinX = Math.min(
          ...templateNodes.map((node) => node.position.x),
        );
        const shiftX = existingMaxX + GAP_BETWEEN_DIAGRAMS - templateMinX;
        templateNodes.forEach((node) => {
          node.position = { x: node.position.x + shiftX, y: node.position.y };
        });
      }

      // Deselect anything currently selected so the import is the active
      // selection — makes it obvious which nodes just arrived.
      const deselectChanges = existingNodes
        .filter((node) => node.selected)
        .map((node) => ({
          type: "select" as const,
          id: node.id,
          selected: false,
        }));
      const addNodeChanges = templateNodes.map((item) => ({
        type: "add" as const,
        item: { ...item, selected: true },
      }));

      onNodesChange([...deselectChanges, ...addNodeChanges]);
      if (templateEdges.length > 0) {
        onEdgesChange(
          templateEdges.map((item) => ({ type: "add" as const, item })),
        );
      }

      // Fit once the new elements have settled into the flow so the user sees
      // both their original work and the imported template.
      requestAnimationFrame(() => {
        void reactFlow.fitView({
          duration: ZOOM_ANIMATION_DURATION,
          padding: 0.2,
        });
      });
    },
    [onEdgesChange, onNodesChange, reactFlow],
  );

  useKeyboardShortcuts({
    reactFlow,
    onUndo: undo,
    onRedo: redo,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onCut: handleCut,
    onSelectAll: handleSelectAll,
  });

  // Liveblocks' onConnect creates a plain edge (no type/marker), so build the
  // connection here with the custom edge type + arrow and add it through the
  // synced onEdgesChange flow.
  const handleConnect = useCallback(
    (connection: Connection) => {
      const [base] = addEdge<CanvasEdge>(connection, []);
      if (!base) {
        return;
      }
      const newEdge: CanvasEdge = {
        ...base,
        type: CANVAS_EDGE_TYPE,
        markerEnd: ARROW_MARKER,
        data: {},
      };
      onEdgesChange([{ type: "add", item: newEdge }]);
    },
    [onEdgesChange],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(SHAPE_DRAG_MIME)) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const raw = event.dataTransfer.getData(SHAPE_DRAG_MIME);
      if (!raw) {
        return;
      }
      event.preventDefault();

      let payload: ShapeDragPayload;
      try {
        payload = JSON.parse(raw) as ShapeDragPayload;
      } catch {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      nodeIdCounter += 1;
      const newNode: CanvasNode = {
        id: `${payload.shape}-${Date.now()}-${nodeIdCounter}`,
        type: CANVAS_NODE_TYPE,
        position,
        style: {
          width: payload.size.width,
          height: payload.size.height,
        },
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR,
          shape: payload.shape,
        },
      };

      onNodesChange([{ type: "add", item: newNode }]);
    },
    [onNodesChange, screenToFlowPosition],
  );

  return (
    <div
      className="relative h-full w-full bg-background"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow<CanvasNode, CanvasEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: EDGE_STROKE_COLOR, strokeWidth: 2 }}
        fitView
        colorMode="dark"
        className="bg-background"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="var(--border-subtle)"
        />
        {/* Bottom-right minimap, lifted above the runtime Liveblocks watermark
            so it covers it cleanly; React Flow's own attribution is removed via
            proOptions.hideAttribution. */}
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          bgColor="var(--bg-surface)"
          maskColor="var(--bg-base)"
          nodeColor="var(--accent-primary)"
          nodeStrokeColor="var(--text-primary)"
          className="!bottom-6 !right-6 !m-0 z-[1000] overflow-hidden rounded-xl border border-border-default shadow-lg"
        />
        <Cursors />
      </ReactFlow>
      <CanvasControls
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <ShapePanel />
      <StarterTemplatesModal
        open={templatesOpen}
        onClose={() => onTemplatesOpenChange(false)}
        onImport={handleImportTemplate}
      />
    </div>
  );
}

export function CanvasWorkspace({
  roomId,
  templatesOpen,
  onTemplatesOpenChange,
}: CanvasWorkspaceProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <CanvasErrorBoundary>
        <RoomProvider
          id={roomId}
          initialPresence={{ cursor: null, isThinking: false }}
        >
          <ClientSideSuspense fallback={<CanvasLoading />}>
            {() => (
              <ReactFlowProvider>
                <CollaborativeCanvas
                  templatesOpen={templatesOpen}
                  onTemplatesOpenChange={onTemplatesOpenChange}
                />
              </ReactFlowProvider>
            )}
          </ClientSideSuspense>
        </RoomProvider>
      </CanvasErrorBoundary>
    </LiveblocksProvider>
  );
}
