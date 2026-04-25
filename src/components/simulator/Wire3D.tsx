import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ConnectionEdge, ComponentNode } from '../../types';
import { TERMINAL_OFFSETS } from './terminalOffsets';

const WIRE_COLOR: Record<string, string> = {
  'power-pin':      '#ef4444',
  'ground-pin':     '#111827',
  'digital-pin':    '#3b82f6',
  'analog-pin':     '#8b5cf6',
  'component-lead': '#f97316',
  default:          '#737686',
};

function getTerminalWorldPos(nodeId: string, terminalId: string, nodes: ComponentNode[]): THREE.Vector3 {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return new THREE.Vector3();
  const nx = node.position.x / 50;
  const nz = node.position.y / 50;
  const offset = TERMINAL_OFFSETS[node.data.definitionId as string]?.[terminalId] ?? { x: 0, y: 0.3, z: 0 };
  return new THREE.Vector3(nx + offset.x, offset.y, nz + offset.z);
}

function getWireColor(terminalId: string, nodes: ComponentNode[], nodeId: string): string {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return WIRE_COLOR.default;
  const terminal = node.data.terminals.find((t) => t.id === terminalId);
  if (!terminal) return WIRE_COLOR.default;
  return WIRE_COLOR[terminal.terminalType as string] ?? WIRE_COLOR.default;
}

// ─── Current-flow particle ─────────────────────────────────────────────────
interface ParticleProps {
  curve: THREE.QuadraticBezierCurve3;
  offset: number;     // starting phase 0..1
  color: string;
  speed?: number;
}

function CurrentParticle({ curve, offset, color, speed = 1.2 }: ParticleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(offset);

  useFrame((_, delta) => {
    tRef.current = (tRef.current + delta * speed) % 1;
    if (meshRef.current) {
      const pos = curve.getPoint(tRef.current);
      meshRef.current.position.copy(pos);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.085, 6, 6]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2.5}
        roughness={0.1}
        metalness={0}
      />
    </mesh>
  );
}

// ─── Wire props ────────────────────────────────────────────────────────────
interface Props {
  edge: ConnectionEdge;
  nodes: ComponentNode[];
  isPowered?: boolean;
}

export function Wire3D({ edge, nodes, isPowered = false }: Props) {
  const start = getTerminalWorldPos(edge.sourceNode, edge.sourceHandle, nodes);
  const end   = getTerminalWorldPos(edge.targetNode, edge.targetHandle, nodes);
  const color = getWireColor(edge.sourceHandle, nodes, edge.sourceNode);

  const curve = useMemo(() => {
    const mid = new THREE.Vector3(
      (start.x + end.x) / 2,
      Math.max(start.y, end.y) + 1.5,
      (start.z + end.z) / 2,
    );
    return new THREE.QuadraticBezierCurve3(start.clone(), mid, end.clone());
  }, [start.x, start.y, start.z, end.x, end.y, end.z]);

  const tube = useMemo(
    () => new THREE.TubeGeometry(curve, 28, isPowered ? 0.07 : 0.055, 6, false),
    [curve, isPowered],
  );

  const poweredColor = isPowered ? color : '#737686';

  return (
    <group>
      {/* Tube body */}
      <mesh geometry={tube}>
        <meshStandardMaterial
          color={poweredColor}
          emissive={isPowered ? poweredColor : '#000'}
          emissiveIntensity={isPowered ? 0.35 : 0}
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>

      {/* Animated current particles when powered */}
      {isPowered && [0, 0.33, 0.66].map((offset) => (
        <CurrentParticle
          key={offset}
          curve={curve}
          offset={offset}
          color={color}
          speed={1.5}
        />
      ))}
    </group>
  );
}

// ─── Preview wire while drawing ────────────────────────────────────────────
interface PreviewProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

export function WirePreview({ start, end }: PreviewProps) {
  const points = useMemo(() => {
    const mid = new THREE.Vector3(
      (start.x + end.x) / 2,
      Math.max(start.y, end.y) + 1.2,
      (start.z + end.z) / 2,
    );
    return new THREE.QuadraticBezierCurve3(start, mid, end).getPoints(24);
  }, [start, end]);

  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line>
      <primitive object={geo} />
      <lineBasicMaterial color="#f97316" transparent opacity={0.7} />
    </line>
  );
}
