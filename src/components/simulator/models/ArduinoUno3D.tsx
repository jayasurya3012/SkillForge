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
}

const PIN_ROWS = [
  { id: 'uno-d13', label: 'D13', z: 1.8, x: 3.2, type: 'digital-pin' },
  { id: 'uno-d12', label: 'D12', z: 1.3, x: 3.2, type: 'digital-pin' },
  { id: 'uno-d11', label: 'D11', z: 0.8, x: 3.2, type: 'digital-pin' },
  { id: 'uno-d10', label: 'D10', z: 0.3, x: 3.2, type: 'digital-pin' },
  { id: 'uno-d9',  label: 'D9',  z:-0.2, x: 3.2, type: 'digital-pin' },
  { id: 'uno-5v',  label: '5V',  z: 1.8, x:-3.2, type: 'power-pin'   },
  { id: 'uno-gnd', label: 'GND', z: 1.3, x:-3.2, type: 'ground-pin'  },
  { id: 'uno-a0',  label: 'A0',  z: 0.3, x:-3.2, type: 'analog-pin'  },
  { id: 'uno-a1',  label: 'A1',  z:-0.2, x:-3.2, type: 'analog-pin'  },
];

export function ArduinoUno3D({ node, isSelected, wireMode, onSelect, onTerminalClick }: Props) {
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
    <group ref={group} position={[nx, 0, nz]}>
      {/* PCB base */}
      <mesh
        onClick={onSelect}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        castShadow receiveShadow
      >
        <boxGeometry args={[6.8, 0.16, 5.3]} />
        <meshStandardMaterial
          color={isSelected ? '#22c55e' : hovered ? '#1f9e3a' : '#176b28'}
          roughness={0.75} metalness={0.12}
        />
      </mesh>

      {/* Selection glow ring */}
      {isSelected && (
        <mesh position={[0, -0.05, 0]}>
          <ringGeometry args={[3.6, 3.9, 40]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.6} side={2} />
        </mesh>
      )}

      {/* ATmega chip */}
      <mesh position={[0.3, 0.2, 0.2]} castShadow>
        <boxGeometry args={[2.8, 0.26, 2.8]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Chip label */}
      <mesh position={[0.3, 0.34, 0.2]}>
        <planeGeometry args={[2, 0.4]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>

      {/* Crystal oscillator */}
      <mesh position={[1.6, 0.22, -0.9]} castShadow>
        <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* USB-B port */}
      <mesh position={[-3.55, 0.25, -0.5]} castShadow>
        <boxGeometry args={[0.55, 0.5, 1.2]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[-3.45, 0.25, -0.5]}>
        <boxGeometry args={[0.12, 0.3, 0.8]} />
        <meshStandardMaterial color="#c0a020" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Power barrel jack */}
      <mesh position={[-3.4, 0.22, 1.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.55, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Reset button */}
      <mesh position={[2.4, 0.22, -1.8]} castShadow>
        <boxGeometry args={[0.4, 0.2, 0.4]} />
        <meshStandardMaterial color="#e0e0f0" roughness={0.5} />
      </mesh>

      {/* LED power indicator */}
      <mesh position={[2.9, 0.22, 1.1]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.2} />
      </mesh>

      {/* Pin header rows (digital) */}
      {[1.8, 1.3, 0.8, 0.3, -0.2, -0.7, -1.2].map((z, i) => (
        <mesh key={`d${i}`} position={[3.25, 0.28, z]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.28, 6]} />
          <meshStandardMaterial color="#c8c8c8" roughness={0.15} metalness={0.9} />
        </mesh>
      ))}
      {/* Pin header rows (power/analog) */}
      {[1.8, 1.3, 0.8, 0.3, -0.2, -0.7, -1.2].map((z, i) => (
        <mesh key={`a${i}`} position={[-3.25, 0.28, z]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.28, 6]} />
          <meshStandardMaterial color="#c8c8c8" roughness={0.15} metalness={0.9} />
        </mesh>
      ))}

      {/* Hover tooltip */}
      {hovered && !wireMode && (
        <Html position={[0, 1.4, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(25,27,35,0.95)', color: '#fff',
            padding: '6px 10px', borderRadius: '8px', fontSize: '12px',
            fontFamily: 'Inter, sans-serif', minWidth: '160px',
            border: '1px solid #22c55e', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>Arduino Uno R3</div>
            <div style={{ color: '#94a3b8', fontSize: 10 }}>ATmega328P • 5V • 16MHz</div>
            <div style={{ color: '#94a3b8', fontSize: 10 }}>14 digital + 6 analog pins</div>
          </div>
        </Html>
      )}

      {/* Terminals */}
      {PIN_ROWS.map((pin) => (
        <Terminal3D
          key={pin.id}
          id={pin.id}
          label={pin.label}
          terminalType={pin.type}
          position={[pin.x, 0.28, pin.z]}
          isWireSource={wireMode?.sourceTerminalId === pin.id}
          isValidTarget={wireMode !== null && wireMode.sourceNodeId !== node.id}
          isHighlighted={highlightedTerminals.includes(pin.id)}
          onClick={() => onTerminalClick(node.id, pin.id, pin.type)}
        />
      ))}
    </group>
  );
}
