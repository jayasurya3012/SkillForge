import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Terminal } from '../../types';

const POSITION_MAP: Record<Terminal['position'], Position> = {
  top: Position.Top,
  bottom: Position.Bottom,
  left: Position.Left,
  right: Position.Right,
};

const TERMINAL_COLOR: Record<string, string> = {
  'power-pin': 'bg-red-500',
  'ground-pin': 'bg-slate-800',
  'digital-pin': 'bg-blue-500',
  'analog-pin': 'bg-purple-500',
  'component-lead': 'bg-orange-400',
  'breadboard-row': 'bg-green-500',
  default: 'bg-slate-400',
};

export interface ComponentNodeData extends Record<string, unknown> {
  label: string;
  definitionId: string;
  terminals: Terminal[];
  properties: Record<string, string | number>;
  icon?: string;
}

export function ComponentNodeRenderer({ data, selected }: NodeProps) {
  const d = data as ComponentNodeData;

  return (
    <div
      className={`relative bg-white border-2 rounded-xl shadow-md min-w-[80px] min-h-[80px] flex flex-col items-center justify-center gap-1 p-2 transition-all ${
        selected ? 'border-primary shadow-lg shadow-primary/20' : 'border-outline-variant'
      }`}
    >
      <div className="w-10 h-10 flex items-center justify-center bg-surface-container rounded-lg">
        <span className="material-symbols-outlined text-[24px] text-primary">{d.icon ?? 'memory'}</span>
      </div>
      <span className="font-mono font-bold text-[9px] uppercase tracking-wider text-on-surface-variant text-center leading-tight">
        {d.label}
      </span>

      {d.terminals.map((terminal) => {
        const colorClass = TERMINAL_COLOR[terminal.terminalType] ?? TERMINAL_COLOR.default;
        return (
          <Handle
            key={terminal.id}
            id={terminal.id}
            type="source"
            position={POSITION_MAP[terminal.position]}
            className={`!w-3 !h-3 !rounded-full !border-2 !border-white ${colorClass}`}
            title={terminal.label}
          />
        );
      })}
    </div>
  );
}
