import * as THREE from 'three';
import { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
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
  isPowered?: boolean;
  fault?: string | null;
  onSelect: (e: ThreeEvent<MouseEvent>) => void;
  onTerminalClick: (nodeId: string, terminalId: string, terminalType: string) => void;
  color?: string;
  emissiveColor?: string;
  anodeId?: string;
  cathodeId?: string;
  label?: string;
}

export function LED3D({
  node, isSelected, wireMode, isPowered = false, fault = null,
  onSelect, onTerminalClick,
  color = '#ef4444',
  emissiveColor = '#dc2626',
  anodeId = 'led-anode',
  cathodeId = 'led-cathode',
  label = 'LED Red',
}: Props) {
  const group = useRef<Group>(null);
  const domeRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const nx = node.position.x / 50;
  const nz = node.position.y / 50;

  // Reversed-polarity: flash red warning
  const faultFlashRef = useRef(0);
  useFrame((_, delta) => {
    if (fault === 'reversed-polarity' && domeRef.current) {
      faultFlashRef.current += delta * 6;
      const mat = domeRef.current.material as THREE.MeshPhysicalMaterial;
      mat.emissiveIntensity = 0.5 + Math.sin(faultFlashRef.current) * 0.5;
    }
  });

  const terminals = [
    { id: anodeId,   label: 'Anode (+)',   type: 'component-lead', z:  0.15 },
    { id: cathodeId, label: 'Cathode (−)', type: 'component-lead', z: -0.15 },
  ];

  // Get highlighted terminals from mentor
  const { project, currentStep, simulatorState, mentor } = useStore();
  const highlightedTerminals = mentor.isEnabled && mentor.showGuidance && project
    ? mentorService.getHighlightedTerminals(project.steps[currentStep - 1], simulatorState)
    : [];

  const domeColor   = fault === 'reversed-polarity' ? '#ff0000' : color;
  const emissive    = fault === 'reversed-polarity' ? '#ff0000' : isPowered ? emissiveColor : '#330000';
  const emissiveInt = fault === 'reversed-polarity' ? 1.0 : isPowered ? 3.5 : 0.15;

  return (
    <group ref={group} position={[nx, 0, nz]}>
      {/* Metal leads */}
      <mesh position={[0, 0.35, 0.15]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.35, -0.15]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Base disc */}
      <mesh
        position={[0, 0.72, 0]}
        onClick={onSelect}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        castShadow
      >
        <cylinderGeometry args={[0.25, 0.25, 0.06, 16]} />
        <meshStandardMaterial color="#888" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Dome */}
      <mesh
        ref={domeRef}
        position={[0, 0.82, 0]}
        onClick={onSelect}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        castShadow
      >
        <sphereGeometry args={[0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={domeColor}
          emissive={emissive}
          emissiveIntensity={emissiveInt}
          transparent
          opacity={isPowered ? 0.95 : 0.75}
          roughness={0.05}
          metalness={0}
          transmission={isPowered ? 0.1 : 0.4}
        />
      </mesh>

      {/* Glow corona when powered */}
      {isPowered && (
        <mesh position={[0, 0.82, 0]}>
          <sphereGeometry args={[0.38, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color={emissiveColor} transparent opacity={0.18} side={2} />
        </mesh>
      )}

      {/* Point light illuminating nearby scene */}
      {isPowered && (
        <pointLight
          position={[0, 1.4, 0]}
          intensity={3}
          distance={6}
          color={emissiveColor}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]}>
          <ringGeometry args={[0.35, 0.45, 24]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.7} side={2} />
        </mesh>
      )}

      {/* Fault indicator */}
      {fault === 'reversed-polarity' && (
        <Html position={[0, 2.2, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: '#7f1d1d', color: '#fca5a5',
            padding: '4px 8px', borderRadius: '6px', fontSize: '10px',
            fontFamily: 'Inter, sans-serif', fontWeight: 700,
            border: '1px solid #ef4444', whiteSpace: 'nowrap',
          }}>
            ⚠ Reversed polarity!
          </div>
        </Html>
      )}

      {/* Hover tooltip */}
      {hovered && !wireMode && (
        <Html position={[0, 1.8, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(25,27,35,0.95)', color: '#fff',
            padding: '6px 10px', borderRadius: '8px', fontSize: '12px',
            fontFamily: 'Inter, sans-serif', minWidth: '140px',
            border: `1px solid ${color}`, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>{label}</div>
            <div style={{ color: isPowered ? '#86efac' : '#94a3b8', fontSize: 10 }}>
              {isPowered ? '🟢 Powered — glowing!' : fault === 'reversed-polarity' ? '🔴 Reversed polarity' : 'Vf ≈ 2V  •  If ≤ 20mA'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 10 }}>Long leg = Anode (+)</div>
          </div>
        </Html>
      )}

      {/* Terminals */}
      {terminals.map((t) => (
        <Terminal3D
          key={t.id}
          id={t.id}
          label={t.label}
          terminalType={t.type}
          position={[0, 0.9, t.z]}
          isWireSource={wireMode?.sourceTerminalId === t.id}
          isValidTarget={wireMode !== null && wireMode.sourceNodeId !== node.id}
          isHighlighted={highlightedTerminals.includes(t.id)}
          onClick={() => onTerminalClick(node.id, t.id, t.type)}
        />
      ))}
    </group>
  );
}

export function LEDGreen(props: Omit<Props, 'color' | 'emissiveColor' | 'anodeId' | 'cathodeId' | 'label'>) {
  return (
    <LED3D
      {...props}
      color="#22c55e"
      emissiveColor="#16a34a"
      anodeId="ledg-anode"
      cathodeId="ledg-cathode"
      label="LED Green"
    />
  );
}
