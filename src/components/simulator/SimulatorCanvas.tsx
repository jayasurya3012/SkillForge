import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  MiniMap,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '../../store';
import { ComponentNodeRenderer } from './ComponentNodeRenderer';
import { simulatorEngine } from '../../services/SimulatorEngine';
import type { ComponentNode } from '../../types';

const NODE_TYPES: NodeTypes = { component: ComponentNodeRenderer };

type SimStatus = 'ready' | 'running' | 'error';

const STATUS_CONFIG: Record<SimStatus, { dot: string; statusLabel: string }> = {
  ready: { dot: 'bg-emerald-400', statusLabel: 'Ready' },
  running: { dot: 'bg-blue-400 animate-pulse', statusLabel: 'Running' },
  error: { dot: 'bg-red-400', statusLabel: 'Error' },
};

export function SimulatorCanvas() {
  const { simulatorState, setSimulatorState } = useStore();
  const simStatus: SimStatus = 'ready';

  const [nodes, , onNodesChange] = useNodesState<Node>(
    simulatorState.nodes as Node[],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    simulatorState.edges as Edge[],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) return;

      const result = simulatorEngine.createConnection(
        connection.sourceHandle,
        connection.targetHandle,
        connection.source,
        connection.target,
        nodes as unknown as ComponentNode[],
      );

      if ('kind' in result) {
        console.warn(result.message);
        return;
      }

      setEdges((eds) => addEdge({ ...connection, id: result.id, style: result.style }, eds));

      setSimulatorState({
        nodes: nodes as unknown as ComponentNode[],
        edges: [...simulatorState.edges, result],
        viewport: simulatorState.viewport,
      });
    },
    [nodes, setEdges, simulatorState, setSimulatorState],
  );

  const { dot, statusLabel } = STATUS_CONFIG[simStatus];

  return (
    <div className="relative w-full h-full">
      {/* Status bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-outline-variant rounded-full px-4 py-1.5 shadow-sm text-sm font-medium text-on-surface">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className="text-outline text-xs">|</span>
        {statusLabel}
        <span className="text-outline text-xs">|</span>
        <button title="Play" className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[20px]">play_circle</span>
        </button>
        <button title="Pause" className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[20px]">pause_circle</span>
        </button>
        <button title="Stop" className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[20px]">stop_circle</span>
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        fitView
        className="canvas-grid"
        defaultEdgeOptions={{ style: { strokeWidth: 2.5 } }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#c3c6d7" />
        <MiniMap
          className="!bg-surface-container-low !border !border-outline-variant !rounded-lg"
          nodeColor="#004ac6"
          maskColor="rgba(243, 243, 254, 0.8)"
        />
      </ReactFlow>

      {/* Canvas controls */}
      <div className="absolute bottom-16 left-3 z-10 flex flex-col gap-1 bg-white border border-outline-variant rounded-lg shadow-sm overflow-hidden">
        {[
          { icon: 'add', label: 'Zoom in' },
          { icon: 'remove', label: 'Zoom out' },
          { icon: 'center_focus_weak', label: 'Fit view' },
        ].map(({ icon, label }) => (
          <button
            key={icon}
            title={label}
            className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </button>
        ))}
      </div>

      {/* Drop hint */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="material-symbols-outlined text-[56px] text-outline-variant">developer_board</span>
            <p className="text-outline text-sm mt-2">Drag components here to start building</p>
          </div>
        </div>
      )}
    </div>
  );
}
