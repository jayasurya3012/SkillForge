/**
 * PIRSensor3D, Buzzer3D, Battery3D, JumperWire3D
 */
import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { Terminal3D } from '../Terminal3D';
import type { ComponentNode } from '../../../types';
import type { WireMode } from '../SimulatorCanvas3D';
import { buzzerAudio } from '../../../services/BuzzerAudio';
import { useStore } from '../../../store';
import { mentorService } from '../../../services/MentorService';

// Helper hook to get highlighted terminals
function useHighlightedTerminals() {
  const { project, currentStep, simulatorState, mentor } = useStore();
  if (!mentor.isEnabled || !mentor.showGuidance || !project) return [];
  const step = project.steps[currentStep - 1];
  if (!step) return [];
  return mentorService.getHighlightedTerminals(step, simulatorState);
}

interface BaseProps {
  node: ComponentNode;
  isSelected: boolean;
  wireMode: WireMode | null;
  isPowered?: boolean;
  fault?: string | null;
  onSelect: (e: ThreeEvent<MouseEvent>) => void;
  onTerminalClick: (nodeId: string, terminalId: string, terminalType: string) => void;
}

// ─── PIR Sensor ──────────────────────────────────────────────────────────────
export function PIRSensor3D({ node, isSelected, wireMode, isPowered = false, onSelect, onTerminalClick }: BaseProps) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const nx = node.position.x / 50;
  const nz = node.position.y / 50;
  const highlightedTerminals = useHighlightedTerminals();

  const terminals = [
    { id: 'pir-vcc', label: 'VCC',  type: 'power-pin',  x: -0.5, z:  0.7 },
    { id: 'pir-gnd', label: 'GND',  type: 'ground-pin', x:  0.5, z:  0.7 },
    { id: 'pir-out', label: 'OUT',  type: 'component-lead', x: 0, z: 0.7 },
  ];

  return (
    <group ref={group} position={[nx, 0, nz]}>
      {/* PCB */}
      <mesh
        onClick={onSelect}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        castShadow receiveShadow
      >
        <boxGeometry args={[1.6, 0.2, 1.6]} />
        <meshStandardMaterial color={isSelected ? '#1f9e3a' : '#176b28'} roughness={0.75} metalness={0.12} />
      </mesh>

      {/* Fresnel dome */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.6, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
        <meshPhysicalMaterial
          color="#f0f0f0" transparent opacity={0.8}
          roughness={0.05} metalness={0} transmission={0.5}
        />
      </mesh>

      {/* Dome base ring */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.06, 24]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Trim-pots */}
      <mesh position={[-0.45, 0.22, -0.3]}>
        <cylinderGeometry args={[0.15, 0.15, 0.18, 8]} />
        <meshStandardMaterial color="#1a5276" roughness={0.5} />
      </mesh>
      <mesh position={[0.45, 0.22, -0.3]}>
        <cylinderGeometry args={[0.15, 0.15, 0.18, 8]} />
        <meshStandardMaterial color="#1a5276" roughness={0.5} />
      </mesh>

      {isSelected && (
        <mesh position={[0, 0.01, 0]}>
          <ringGeometry args={[0.95, 1.1, 24]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.7} side={2} />
        </mesh>
      )}

      {/* PIR dome glows when powered */}
      {isPowered && (
        <mesh position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.75, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          <meshBasicMaterial color="#bfdbfe" transparent opacity={0.12} side={2} />
        </mesh>
      )}
      {isPowered && (
        <pointLight position={[0, 1.2, 0]} intensity={1} distance={4} color="#bfdbfe" />
      )}

      {hovered && !wireMode && (
        <Html position={[0, 2.0, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(25,27,35,0.95)', color: '#fff',
            padding: '6px 10px', borderRadius: '8px', fontSize: '12px',
            fontFamily: 'Inter, sans-serif', minWidth: '170px',
            border: '1px solid #3b82f6', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>HC-SR501 PIR Sensor</div>
            <div style={{ color: isPowered ? '#86efac' : '#94a3b8', fontSize: 10 }}>
              {isPowered ? '🟢 Powered — scanning for motion' : 'Range: ~7m  •  Angle: 120°'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 10 }}>Detects motion via infrared</div>
          </div>
        </Html>
      )}

      {terminals.map((t) => (
        <Terminal3D key={t.id} id={t.id} label={t.label} terminalType={t.type}
          position={[t.x, 0.28, t.z]}
          isWireSource={wireMode?.sourceTerminalId === t.id}
          isValidTarget={wireMode !== null && wireMode.sourceNodeId !== node.id}
          isHighlighted={highlightedTerminals.includes(t.id)}
          onClick={() => onTerminalClick(node.id, t.id, t.type)}
        />
      ))}
    </group>
  );
}

// ─── Buzzer ───────────────────────────────────────────────────────────────────
export function Buzzer3D({ node, isSelected, wireMode, isPowered = false, onSelect, onTerminalClick }: BaseProps) {
  const group = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const nx = node.position.x / 50;
  const nz = node.position.y / 50;
  const vibeRef = useRef(0);
  const highlightedTerminals = useHighlightedTerminals();

  // Start/stop buzzer sound when powered state changes
  useEffect(() => {
    if (isPowered) {
      buzzerAudio.start(2700, 0.07);
    } else {
      buzzerAudio.stop();
    }
    return () => { buzzerAudio.stop(); };
  }, [isPowered]);

  // Vibration animation when powered
  useFrame((_, delta) => {
    if (!isPowered || !group.current) return;
    vibeRef.current += delta * 80;
    const amp = 0.018;
    group.current.position.x = nx + Math.sin(vibeRef.current) * amp;
    group.current.position.z = nz + Math.cos(vibeRef.current * 1.3) * amp;
  });

  return (
    <group ref={group} position={[nx, 0, nz]}>
      {/* Body cylinder */}
      <mesh
        ref={bodyRef}
        onClick={onSelect}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        castShadow
      >
        <cylinderGeometry args={[0.58, 0.58, 0.72, 20]} />
        <meshStandardMaterial
          color={isSelected ? '#374151' : '#1a1a1a'}
          emissive={isPowered ? '#3b0000' : '#000'}
          emissiveIntensity={isPowered ? 0.6 : 0}
          roughness={0.5} metalness={0.2}
        />
      </mesh>

      {/* Top hole with sound wave ripple when powered */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.06, 10]} />
        <meshStandardMaterial color="#111" roughness={0.7} />
      </mesh>
      {isPowered && (
        <SoundRipple />
      )}

      {/* Sticker label */}
      <mesh position={[0, 0.04, 0.58]}>
        <planeGeometry args={[0.6, 0.3]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Leads */}
      <mesh position={[0.25, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.65, 6]} />
        <meshStandardMaterial color="#c8c8c8" roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh position={[-0.25, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.65, 6]} />
        <meshStandardMaterial color="#c8c8c8" roughness={0.2} metalness={0.9} />
      </mesh>

      {isSelected && (
        <mesh position={[0, 0.01, 0]}>
          <ringGeometry args={[0.7, 0.85, 24]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.7} side={2} />
        </mesh>
      )}

      {/* Powered status badge */}
      {isPowered && (
        <Html position={[0, 1.8, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: '#7f1d1d', color: '#fca5a5',
            padding: '4px 8px', borderRadius: '6px', fontSize: '10px',
            fontFamily: 'Inter, sans-serif', fontWeight: 700,
            border: '1px solid #ef4444', whiteSpace: 'nowrap',
            animation: 'none',
          }}>
            🔊 BUZZING!
          </div>
        </Html>
      )}

      {hovered && !wireMode && (
        <Html position={[0, 1.6, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(25,27,35,0.95)', color: '#fff',
            padding: '6px 10px', borderRadius: '8px', fontSize: '12px',
            fontFamily: 'Inter, sans-serif', minWidth: '155px',
            border: '1px solid #ef4444', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>Piezo Buzzer (Active)</div>
            <div style={{ color: isPowered ? '#86efac' : '#94a3b8', fontSize: 10 }}>
              {isPowered ? '🔊 Buzzing at 2700Hz' : '5V  •  2700Hz'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 10 }}>+ lead is longer</div>
          </div>
        </Html>
      )}

      <Terminal3D id="buz-pos" label="VCC (+)" terminalType="component-lead"
        position={[0.25, 0.88, 0]}
        isWireSource={wireMode?.sourceTerminalId === 'buz-pos'}
        isValidTarget={wireMode !== null && wireMode.sourceNodeId !== node.id}
        isHighlighted={highlightedTerminals.includes('buz-pos')}
        onClick={() => onTerminalClick(node.id, 'buz-pos', 'component-lead')}
      />
      <Terminal3D id="buz-neg" label="GND (−)" terminalType="component-lead"
        position={[-0.25, 0.88, 0]}
        isWireSource={wireMode?.sourceTerminalId === 'buz-neg'}
        isValidTarget={wireMode !== null && wireMode.sourceNodeId !== node.id}
        isHighlighted={highlightedTerminals.includes('buz-neg')}
        onClick={() => onTerminalClick(node.id, 'buz-neg', 'component-lead')}
      />
    </group>
  );
}

// Expanding ring animation above the buzzer hole to visualise sound waves
function SoundRipple() {
  const r1 = useRef<Mesh>(null);
  const r2 = useRef<Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current = (t.current + delta * 1.2) % 1;
    const t2 = (t.current + 0.5) % 1;

    for (const [ref, phase] of [[r1, t.current], [r2, t2]] as const) {
      if (!ref.current) continue;
      const scale = 0.5 + phase * 2.5;
      ref.current.scale.setScalar(scale);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - phase);
    }
  });

  return (
    <>
      <mesh ref={r1} position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.22, 16]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.5} side={2} />
      </mesh>
      <mesh ref={r2} position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.22, 16]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.25} side={2} />
      </mesh>
    </>
  );
}

// ─── 9V Battery ──────────────────────────────────────────────────────────────
export function Battery3D({ node, isSelected, wireMode, onSelect, onTerminalClick }: BaseProps) {
  const [hovered, setHovered] = useState(false);
  const nx = node.position.x / 50;
  const nz = node.position.y / 50;
  const highlightedTerminals = useHighlightedTerminals();

  return (
    <group position={[nx, 0, nz]}>
      {/* Battery body */}
      <mesh
        onClick={onSelect}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        castShadow receiveShadow
      >
        <boxGeometry args={[2.5, 1.7, 0.7]} />
        <meshStandardMaterial color={isSelected ? '#374151' : '#1a1a1a'} roughness={0.6} metalness={0.15} />
      </mesh>

      {/* Label face */}
      <mesh position={[0, 0, 0.36]}>
        <planeGeometry args={[2.4, 1.6]} />
        <meshBasicMaterial color="#1c3a78" />
      </mesh>
      {/* "9V" label area */}
      <mesh position={[0, 0, 0.365]}>
        <planeGeometry args={[0.8, 0.5]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>

      {/* Snap connector base */}
      <mesh position={[0, 0.98, 0]}>
        <boxGeometry args={[1.0, 0.18, 0.6]} />
        <meshStandardMaterial color="#111" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Positive terminal */}
      <mesh position={[0.5, 1.18, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.22, 10]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Negative terminal */}
      <mesh position={[-0.5, 1.18, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.13, 0.22, 10]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
      </mesh>

      {isSelected && (
        <mesh position={[0, -0.84, 0]}>
          <ringGeometry args={[1.4, 1.6, 24]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.7} side={2} />
        </mesh>
      )}

      {hovered && !wireMode && (
        <Html position={[0, 2.2, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(25,27,35,0.95)', color: '#fff',
            padding: '6px 10px', borderRadius: '8px', fontSize: '12px',
            fontFamily: 'Inter, sans-serif', minWidth: '150px',
            border: '1px solid #ef4444', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>9V Battery</div>
            <div style={{ color: '#94a3b8', fontSize: 10 }}>Snap connector included</div>
            <div style={{ color: '#94a3b8', fontSize: 10 }}>Red = + &nbsp; Black = −</div>
          </div>
        </Html>
      )}

      <Terminal3D id="bat-pos" label="Positive (+)" terminalType="power-pin"
        position={[0.5, 0.55, 0]}
        isWireSource={wireMode?.sourceTerminalId === 'bat-pos'}
        isValidTarget={wireMode !== null && wireMode.sourceNodeId !== node.id}
        isHighlighted={highlightedTerminals.includes('bat-pos')}
        onClick={() => onTerminalClick(node.id, 'bat-pos', 'power-pin')}
      />
      <Terminal3D id="bat-neg" label="Negative (−)" terminalType="ground-pin"
        position={[-0.5, 0.55, 0]}
        isWireSource={wireMode?.sourceTerminalId === 'bat-neg'}
        isValidTarget={wireMode !== null && wireMode.sourceNodeId !== node.id}
        isHighlighted={highlightedTerminals.includes('bat-neg')}
        onClick={() => onTerminalClick(node.id, 'bat-neg', 'ground-pin')}
      />
    </group>
  );
}

// ─── Jumper Wire ──────────────────────────────────────────────────────────────
export function JumperWire3D({ node, isSelected, wireMode, onSelect, onTerminalClick }: BaseProps) {
  const [hovered, setHovered] = useState(false);
  const nx = node.position.x / 50;
  const nz = node.position.y / 50;
  const highlightedTerminals = useHighlightedTerminals();

  return (
    <group position={[nx, 0.18, nz]}>
      {/* Wire body */}
      <mesh
        onClick={onSelect}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerLeave={() => setHovered(false)}
        rotation={[0, 0, Math.PI / 2]} castShadow
      >
        <cylinderGeometry args={[0.06, 0.06, 1.1, 8]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* End connectors */}
      {[-0.55, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.2, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
        </mesh>
      ))}

      {isSelected && (
        <mesh position={[0, -0.12, 0]}>
          <ringGeometry args={[0.65, 0.78, 24]} />
          <meshBasicMaterial color="#22c55e" transparent opacity={0.7} side={2} />
        </mesh>
      )}

      {hovered && !wireMode && (
        <Html position={[0, 0.7, 0]} distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(25,27,35,0.95)', color: '#fff',
            padding: '6px 10px', borderRadius: '8px', fontSize: '12px',
            fontFamily: 'Inter, sans-serif', minWidth: '145px',
            border: '1px solid #f59e0b', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>M-M Jumper Wire</div>
            <div style={{ color: '#94a3b8', fontSize: 10 }}>20cm  •  Connect any pins</div>
          </div>
        </Html>
      )}

      <Terminal3D id="jw-a" label="End A" terminalType="jumper"
        position={[-0.7, 0, 0]}
        isWireSource={wireMode?.sourceTerminalId === 'jw-a'}
        isValidTarget={wireMode !== null && wireMode.sourceNodeId !== node.id}
        isHighlighted={highlightedTerminals.includes('jw-a')}
        onClick={() => onTerminalClick(node.id, 'jw-a', 'jumper')}
      />
      <Terminal3D id="jw-b" label="End B" terminalType="jumper"
        position={[0.7, 0, 0]}
        isWireSource={wireMode?.sourceTerminalId === 'jw-b'}
        isValidTarget={wireMode !== null && wireMode.sourceNodeId !== node.id}
        isHighlighted={highlightedTerminals.includes('jw-b')}
        onClick={() => onTerminalClick(node.id, 'jw-b', 'jumper')}
      />
    </group>
  );
}
