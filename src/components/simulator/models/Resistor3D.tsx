import { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { Terminal3D } from '../Terminal3D';
import type { ComponentNode } from '../../../types';
import type { WireMode } from '../SimulatorCanvas3D';
import { useStore } from '../../../store';
import { mentorService } from '../../../services/MentorService';

interface Props {
  node: ComponentNode;
  isSelected: boolean;
  wireMode: WireMode | null;
  onSelect: (e: ThreeEvent<MouseEvent>) => void;
  onTerminalClick: (nodeId: string, terminalId: string, terminalType: string) => void;
  bands?: string[];   // color band hex values
  resistance?: string;
  lead1Id?: string;
  lead2Id?: string;
  label?: string;
}

export function Resistor3D({
  node, isSelected, wireMode, onSelect, onTerminalClick,
  bands = ['#dc2626', '#dc2626', '#92400e', '#f8d800'],
  resistance: _resistance = '220Ω',
  lead1Id = 'r220-lead1',
  lead2Id = 'r220-lead2',
  label = '220Ω Resistor',
}: Props) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const nx = node.position.x / 50;
  const nz = node.position.y / 50;

  // Get highlighted terminals from mentor
  const { project, currentStep, simulatorState, mentor } = useStore();
  const highlightedTerminals = mentor.isEnabled && mentor.showGuidance && project
    ? mentorService.getHighlightedTerminals(project.steps[currentStep - 1], simulatorState)
    : [];

  return (
    <group ref={group} position={[nx, 0.12, nz]}>
      {/* Lead wires */}
      <mesh position={[-0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.45, 6]} />
        <meshStandardMaterial color="#c8c8c8" roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.45, 6]} />
        <meshStandardMaterial color="#c8c8c8" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Body */}
      <mesh
        rotation={[0, 0, Math.PI / 2]}
        onClick={onSelect}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        castShadow
      >
        <cylinderGeometry args={[0.14, 0.14, 0.72, 12]} />
        <meshStandardMaterial color="#d4b896" roughness={0.8} metalness={0} />
      </mesh>

      {/* Color bands */}
      {bands.map((color, i) => (
        <mesh key={i} position={[-0.2 + i * 0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.145, 0.145, 0.07, 12]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0} />
        </mesh>
      ))}

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, -0.08, 0]}>
          <ringGeometry args={[0.55, 0.68, 24]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.7} side={2} />
        </mesh>
      )}

      {/* Hover tooltip */}
      {hovered && !wireMode && (
        <Html position={[0, 0.8, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(25,27,35,0.95)', color: '#fff',
            padding: '6px 10px', borderRadius: '8px', fontSize: '12px',
            fontFamily: 'Inter, sans-serif', minWidth: '150px',
            border: '1px solid #f97316', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>{label}</div>
            <div style={{ color: '#94a3b8', fontSize: 10 }}>Tolerance ±5%</div>
            <div style={{ color: '#94a3b8', fontSize: 10 }}>Limits LED current to safe range</div>
          </div>
        </Html>
      )}

      {/* Terminals */}
      <Terminal3D
        id={lead1Id} label="Lead 1" terminalType="component-lead"
        position={[-0.65, 0, 0]}
        isWireSource={wireMode?.sourceTerminalId === lead1Id}
        isValidTarget={wireMode !== null && wireMode.sourceNodeId !== node.id}
        isHighlighted={highlightedTerminals.includes(lead1Id)}
        onClick={() => onTerminalClick(node.id, lead1Id, 'component-lead')}
      />
      <Terminal3D
        id={lead2Id} label="Lead 2" terminalType="component-lead"
        position={[0.65, 0, 0]}
        isWireSource={wireMode?.sourceTerminalId === lead2Id}
        isValidTarget={wireMode !== null && wireMode.sourceNodeId !== node.id}
        isHighlighted={highlightedTerminals.includes(lead2Id)}
        onClick={() => onTerminalClick(node.id, lead2Id, 'component-lead')}
      />
    </group>
  );
}

export function Resistor10K(props: Omit<Props, 'bands' | 'resistance' | 'lead1Id' | 'lead2Id' | 'label'>) {
  return (
    <Resistor3D
      {...props}
      bands={['#92400e', '#111', '#f8a000', '#f8d800']}
      resistance="10kΩ"
      lead1Id="r10k-lead1"
      lead2Id="r10k-lead2"
      label="10kΩ Resistor"
    />
  );
}
