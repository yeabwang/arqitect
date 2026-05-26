"use client";

import { Component, useCallback, type DragEvent, type ReactNode } from "react";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { Cursors, useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import { CanvasNode as CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { ShapePanel } from "@/components/editor/shape-panel";
import {
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  SHAPE_DRAG_MIME,
  type CanvasEdge,
  type CanvasNode,
  type ShapeDragPayload,
} from "@/types/canvas";

const nodeTypes: NodeTypes = {
  [CANVAS_NODE_TYPE]: CanvasNodeRenderer,
};

// Monotonic counter combined with the shape name and a timestamp to build
// unique node IDs for shapes dropped onto the canvas.
let nodeIdCounter = 0;

interface CanvasWorkspaceProps {
  roomId: string;
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

function CollaborativeCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: { initial: initialNodes },
    edges: { initial: initialEdges },
  });
  const { screenToFlowPosition } = useReactFlow<CanvasNode, CanvasEdge>();

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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        fitView
        colorMode="dark"
        className="bg-background"
      >
        <MiniMap
          pannable
          zoomable
          bgColor="var(--bg-surface)"
          maskColor="var(--bg-base)"
          nodeColor="var(--accent-primary)"
          nodeStrokeColor="var(--text-primary)"
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="var(--border-subtle)"
        />
        <Cursors />
      </ReactFlow>
      <ShapePanel />
    </div>
  );
}

export function CanvasWorkspace({ roomId }: CanvasWorkspaceProps) {
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
                <CollaborativeCanvas />
              </ReactFlowProvider>
            )}
          </ClientSideSuspense>
        </RoomProvider>
      </CanvasErrorBoundary>
    </LiveblocksProvider>
  );
}
