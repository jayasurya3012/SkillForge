import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';

const TYPE_COLOR: Record<string, string> = {
  'power-pin':      '#ef4444',
  'ground-pin':     '#334155',
  'digital-pin':    '#3b82f6',
  'analog-pin':     '#8b5cf6',
  'component-lead': '#f97316',
  'breadboard-row': '#22c55e',
  'power-rail':     '#ef4444',
  'ground-rail':    '#334155',
  'jumper':         '#facc15',
  default:          '#94a3b8',
};

interface Props {
  id?: string; // passed as key by callers, used for identification
  label: string;
  terminalType: string;
  position: [number, number, number];
  isWireSource?: boolean;
  isValidTarget?: boolean;
  isHighlighted?: boolean; // For mentor guidance
  highlightColor?: string; // Custom highlight color
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}

export function Terminal3D({ 
  label, 
  terminalType, 
  position, 
  isWireSource, 
  isValidTarget, 
  isHighlighted,
  highlightColor,
  onHoverStart, 
  onHoverEnd, 
  onClick 
}: Props) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<Mesh>(null);
  const pulseRef = useRef(0);
  
  const color = TYPE_COLOR[terminalType] ?? TYPE_COLOR.default;
  const glowing = hovered || isWireSource || isValidTarget || isHighlighted;
  
  // Determine display color based on state
  let displayColor = color;
  if (isHighlighted && highlightColor) {
    displayColor = highlightColor;
  } else if (isValidTarget) {
    displayColor = '#22c55e';
  }

  // Pulsing animation for highlighted terminals
  useFrame((_, delta) => {
    if (isHighlighted && meshRef.current) {
      pulseRef.current += delta * 4;
      const scale = 1 + Math.sin(pulseRef.current) * 0.15;
      meshRef.current.scale.setScalar(scale);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); onHoverStart?.(); }}
      onPointerLeave={() => { setHovered(false); onHoverEnd?.(); }}
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      renderOrder={10}
    >
      <sphereGeometry args={[glowing ? 0.22 : 0.16, 10, 10]} />
      <meshStandardMaterial
        color={displayColor}
        emissive={displayColor}
        emissiveIntensity={isHighlighted ? 1.2 : glowing ? 0.9 : 0.1}
        roughness={0.2}
        metalness={0.7}
      />
      {(hovered || isHighlighted) && (
        <Html distanceFactor={12} style={{ pointerEvents: 'none' }} position={[0, 0.4, 0]}>
          <div style={{
            background: isHighlighted ? 'rgba(249, 115, 22, 0.95)' : 'rgba(25,27,35,0.95)',
            color: '#fff',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            border: `1px solid ${isHighlighted ? '#f97316' : color}`,
            boxShadow: `0 0 10px ${isHighlighted ? '#f9731666' : color + '66'}`,
          }}>
            {isHighlighted && '→ '}{label}
          </div>
        </Html>
      )}
    </mesh>
  );
}
