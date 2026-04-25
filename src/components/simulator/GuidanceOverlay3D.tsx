import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';
import { mentorService } from '../../services/MentorService';
import { TERMINAL_OFFSETS } from './terminalOffsets';

interface GuidanceArrowProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
}

function GuidanceArrow({ start, end }: GuidanceArrowProps) {
  const points = useMemo(() => {
    // Create a curved path between start and end
    const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
    midPoint.y += 1.5; // Arc upward

    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
    return curve.getPoints(32);
  }, [start, end]);

  return (
    <group>
      {/* Guidance line using drei's Line component */}
      <Line
        points={points}
        color="#f97316"
        lineWidth={3}
        dashed
        dashSize={0.15}
        gapSize={0.1}
      />

      {/* Glowing endpoint markers */}
      <mesh position={start}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#f97316"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

interface TerminalHighlightProps {
  position: THREE.Vector3;
  label: string;
  isSource: boolean;
}

function TerminalHighlight({ position, label, isSource }: TerminalHighlightProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 2;
    }
  });

  const color = isSource ? '#22c55e' : '#f97316';

  return (
    <group position={position}>
      {/* Pulsing ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.2, 0.28, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Label */}
      <Html
        position={[0, 0.5, 0]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: isSource ? 'rgba(34, 197, 94, 0.95)' : 'rgba(249, 115, 22, 0.95)',
            color: '#fff',
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {isSource ? '① ' : '② '}{label}
        </div>
      </Html>
    </group>
  );
}

export function GuidanceOverlay3D() {
  const { project, currentStep, simulatorState, mentor } = useStore();

  // Don't render if mentor is disabled or no project
  if (!mentor.isEnabled || !mentor.showGuidance || !project) {
    return null;
  }

  const step = project.steps[currentStep - 1];
  if (!step) return null;

  // Get the next connection to guide
  const nextConnection = mentorService.getNextConnection(step, simulatorState);
  if (!nextConnection) return null;

  // Find the nodes containing these terminals
  const sourceNode = simulatorState.nodes.find((n) =>
    n.data.terminals.some((t) => t.id === nextConnection.sourceTerminalId)
  );
  const targetNode = simulatorState.nodes.find((n) =>
    n.data.terminals.some((t) => t.id === nextConnection.targetTerminalId)
  );

  // If components aren't placed yet, don't show connection guidance
  if (!sourceNode || !targetNode) return null;

  // Get terminal positions
  const sourceOffset = TERMINAL_OFFSETS[sourceNode.data.definitionId as string]?.[nextConnection.sourceTerminalId];
  const targetOffset = TERMINAL_OFFSETS[targetNode.data.definitionId as string]?.[nextConnection.targetTerminalId];

  if (!sourceOffset || !targetOffset) return null;

  const sourcePos = new THREE.Vector3(
    sourceNode.position.x / 50 + sourceOffset.x,
    sourceOffset.y + 0.1,
    sourceNode.position.y / 50 + sourceOffset.z
  );

  const targetPos = new THREE.Vector3(
    targetNode.position.x / 50 + targetOffset.x,
    targetOffset.y + 0.1,
    targetNode.position.y / 50 + targetOffset.z
  );

  // Get terminal labels
  const sourceTerm = sourceNode.data.terminals.find((t) => t.id === nextConnection.sourceTerminalId);
  const targetTerm = targetNode.data.terminals.find((t) => t.id === nextConnection.targetTerminalId);

  return (
    <group>
      <GuidanceArrow start={sourcePos} end={targetPos} />
      <TerminalHighlight
        position={sourcePos}
        label={sourceTerm?.label ?? nextConnection.sourceTerminalId}
        isSource={true}
      />
      <TerminalHighlight
        position={targetPos}
        label={targetTerm?.label ?? nextConnection.targetTerminalId}
        isSource={false}
      />
    </group>
  );
}
