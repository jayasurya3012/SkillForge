import { useRef, useState, useMemo } from 'react';
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
}

const TERMINALS = [
  { id: 'bb-pwr-pos', label: 'PWR +', type: 'power-rail',  x: -3.5, z: -2.1 },
  { id: 'bb-pwr-neg', label: 'PWR −', type: 'ground-rail', x: -3.5, z:  2.1 },
  { id: 'bb-row-a1',  label: 'Row A1', type: 'breadboard-row', x: -2.2, z: -1.8 },
  { id: 'bb-row-a5',  label: 'Row A5', type: 'breadboard-row', x: -2.2, z:  1.8 },
  { id: 'bb-row-b1',  label: 'Row B1', type: 'breadboard-row', x:  2.2, z: -1.8 },
];

export function Breadboard3D({ node, isSelected, wireMode, onSelect, onTerminalClick }: Props) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const nx = node.position.x / 50;
  const nz = node.position.y / 50;

  // Get highlighted terminals from mentor
  const { project, currentStep, simulatorState, mentor } = useStore();
  const highlightedTerminals = mentor.isEnabled && mentor.showGuidance && project
    ? mentorService.getHighlightedTerminals(project.steps[currentStep - 1], simulatorState)
    : [];

  // Build hole grid texture-like dots using instanced mesh
  const holePositions = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let col = -12; col <= 12; col++) {
      for (let row = -8; row <= 8; row++) {
        if (Math.abs(row) === 1) continue; // center gap
        pos.push([col * 0.26, 0.31, row * 0.26]);
      }
    }
    return pos;
  }, []);

  return (
    <group ref={group} position={[nx, 0, nz]}>
      {/* Main body */}
      <mesh
        onClick={onSelect}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        castShadow receiveShadow
      >
        <boxGeometry args={[8, 0.6, 5]} />
        <meshStandardMaterial
          color={isSelected ? '#f0e8d0' : '#ede5ce'}
          roughness={0.9} metalness={0}
        />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, -0.28, 0]}>
          <ringGeometry args={[4.2, 4.5, 40]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.6} side={2} />
        </mesh>
      )}

      {/* Power rail strips — red (top) */}
      <mesh position={[-3.5, 0.31, -2.1]}>
        <boxGeometry args={[0.9, 0.04, 5.0 * 0.18]} />
        <meshStandardMaterial color="#dc2626" roughness={0.7} />
      </mesh>
      <mesh position={[3.5, 0.31, -2.1]}>
        <boxGeometry args={[0.9, 0.04, 5.0 * 0.18]} />
        <meshStandardMaterial color="#dc2626" roughness={0.7} />
      </mesh>

      {/* Power rail strips — blue (bottom) */}
      <mesh position={[-3.5, 0.31, 2.1]}>
        <boxGeometry args={[0.9, 0.04, 5.0 * 0.18]} />
        <meshStandardMaterial color="#2563eb" roughness={0.7} />
      </mesh>
      <mesh position={[3.5, 0.31, 2.1]}>
        <boxGeometry args={[0.9, 0.04, 5.0 * 0.18]} />
        <meshStandardMaterial color="#2563eb" roughness={0.7} />
      </mesh>

      {/* Center DIP gap */}
      <mesh position={[0, 0.31, 0]}>
        <boxGeometry args={[7.5, 0.045, 0.3]} />
        <meshStandardMaterial color="#c9bfa8" roughness={1} />
      </mesh>

      {/* Hole grid dots */}
      {holePositions.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <cylinderGeometry args={[0.055, 0.055, 0.06, 6]} />
          <meshStandardMaterial color="#888070" roughness={0.9} />
        </mesh>
      ))}

      {/* Hover tooltip */}
      {hovered && !wireMode && (
        <Html position={[0, 1.8, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(25,27,35,0.95)', color: '#fff',
            padding: '6px 10px', borderRadius: '8px', fontSize: '12px',
            fontFamily: 'Inter, sans-serif', minWidth: '170px',
            border: '1px solid #f97316', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>Half-size Breadboard</div>
            <div style={{ color: '#94a3b8', fontSize: 10 }}>400 tie points</div>
            <div style={{ color: '#94a3b8', fontSize: 10 }}>Red = VCC  •  Blue = GND</div>
          </div>
        </Html>
      )}

      {/* Terminals */}
      {TERMINALS.map((t) => (
        <Terminal3D
          key={t.id}
          id={t.id}
          label={t.label}
          terminalType={t.type}
          position={[t.x, 0.35, t.z]}
          isWireSource={wireMode?.sourceTerminalId === t.id}
          isValidTarget={wireMode !== null && wireMode.sourceNodeId !== node.id}
          isHighlighted={highlightedTerminals.includes(t.id)}
          onClick={() => onTerminalClick(node.id, t.id, t.type)}
        />
      ))}
    </group>
  );
}
