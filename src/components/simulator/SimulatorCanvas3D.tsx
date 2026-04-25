import React, { Suspense, useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { ThreeEvent } from '@react-three/fiber';

import { useStore } from '../../store';
import { componentLibrary } from '../../services/ComponentLibrary';
import { simulate } from '../../services/CircuitSimulator';
import { Wire3D, WirePreview } from './Wire3D';
import { ArduinoUno3D } from './models/ArduinoUno3D';
import { Breadboard3D } from './models/Breadboard3D';
import { LED3D, LEDGreen } from './models/LED3D';
import { Resistor3D, Resistor10K } from './models/Resistor3D';
import { PIRSensor3D, Buzzer3D, Battery3D, JumperWire3D } from './models/OtherComponents3D';
import { TERMINAL_OFFSETS } from './terminalOffsets';
import { GuidanceOverlay3D } from './GuidanceOverlay3D';
import type { ComponentNode } from '../../types';

export interface WireMode {
  sourceNodeId: string;
  sourceTerminalId: string;
  sourceTerminalType: string;
  sourceWorldPos: THREE.Vector3;
}

// ─── Extended model props (includes simulation state) ─────────────────────────
type ModelProps = {
  node: ComponentNode;
  isSelected: boolean;
  wireMode: WireMode | null;
  isPowered: boolean;
  fault: string | null;
  onSelect: (e: ThreeEvent<MouseEvent>) => void;
  onTerminalClick: (nodeId: string, terminalId: string, terminalType: string) => void;
};

type ModelRenderer = (props: ModelProps) => React.ReactElement | null;

const MODEL_MAP: Record<string, ModelRenderer> = {
  'arduino-uno':  (p) => <ArduinoUno3D {...p} />,
  breadboard:     (p) => <Breadboard3D {...p} />,
  'led-red':      (p) => <LED3D {...p} />,
  'led-green':    (p) => <LEDGreen {...p} />,
  'resistor-220': (p) => <Resistor3D {...p} />,
  'resistor-10k': (p) => <Resistor10K {...p} />,
  'pir-sensor':   (p) => <PIRSensor3D {...p} />,
  buzzer:         (p) => <Buzzer3D {...p} />,
  '9v-battery':   (p) => <Battery3D {...p} />,
  'jumper-wire':  (p) => <JumperWire3D {...p} />,
};

// ─── Drag ────────────────────────────────────────────────────────────────────
interface DragState { nodeId: string; offset: THREE.Vector3 }

interface SceneProps {
  orbitRef: React.RefObject<OrbitControlsImpl | null>;
}

function Scene({ orbitRef }: SceneProps) {
  const {
    simulatorState, setSimulatorState,
    simulationResult,
  } = useStore();
  const { camera, raycaster, pointer } = useThree();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wireMode, setWireMode] = useState<WireMode | null>(null);
  const [mouseWorld, setMouseWorld] = useState<THREE.Vector3 | null>(null);

  const dragRef = useRef<DragState | null>(null);
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const hit = useRef(new THREE.Vector3());

  // Track mouse world for wire preview
  useFrame(() => {
    if (!wireMode) return;
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(plane.current, hit.current)) {
      setMouseWorld(hit.current.clone());
    }
  });

  const handlePointerDown = useCallback((nodeId: string, e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (wireMode) return;
    setSelectedId(nodeId);

    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(plane.current, hit.current)) {
      const node = simulatorState.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      dragRef.current = {
        nodeId,
        offset: new THREE.Vector3(
          node.position.x / 50 - hit.current.x,
          0,
          node.position.y / 50 - hit.current.z,
        ),
      };
      if (orbitRef.current) orbitRef.current.enabled = false;
    }
  }, [wireMode, simulatorState, raycaster, pointer, camera, orbitRef]);

  const handlePointerMove = useCallback(() => {
    if (!dragRef.current) return;
    raycaster.setFromCamera(pointer, camera);
    if (!raycaster.ray.intersectPlane(plane.current, hit.current)) return;

    const { nodeId, offset } = dragRef.current;
    setSimulatorState({
      ...simulatorState,
      nodes: simulatorState.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, position: { x: (hit.current.x + offset.x) * 50, y: (hit.current.z + offset.z) * 50 } }
          : n,
      ),
    });
  }, [simulatorState, setSimulatorState, raycaster, pointer, camera]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    if (orbitRef.current) orbitRef.current.enabled = true;
  }, [orbitRef]);

  const handleTerminalClick = useCallback(
    (nodeId: string, terminalId: string, terminalType: string) => {
      const node = simulatorState.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const offset = TERMINAL_OFFSETS[node.data.definitionId as string]?.[terminalId] ?? { x: 0, y: 0.3, z: 0 };
      const worldPos = new THREE.Vector3(
        node.position.x / 50 + offset.x,
        offset.y,
        node.position.y / 50 + offset.z,
      );

      if (!wireMode) {
        setWireMode({ sourceNodeId: nodeId, sourceTerminalId: terminalId, sourceTerminalType: terminalType, sourceWorldPos: worldPos });
        return;
      }

      if (wireMode.sourceNodeId === nodeId) { setWireMode(null); return; }

      const sourceNode = simulatorState.nodes.find((n) => n.id === wireMode.sourceNodeId);
      if (!sourceNode) return;
      const sourceTerm = sourceNode.data.terminals.find((t) => t.id === wireMode.sourceTerminalId);
      const targetTerm = node.data.terminals.find((t) => t.id === terminalId);
      if (!sourceTerm || !targetTerm) return;

      if (!componentLibrary.isCompatible(sourceTerm.terminalType as string, targetTerm.terminalType as string)) {
        setWireMode(null);
        return;
      }

      const newEdge = {
        id: `edge-${Math.random().toString(36).slice(2, 8)}`,
        source: wireMode.sourceNodeId,
        target: nodeId,
        sourceHandle: wireMode.sourceTerminalId,
        targetHandle: terminalId,
        sourceNode: wireMode.sourceNodeId,
        targetNode: nodeId,
      };

      setSimulatorState({ ...simulatorState, edges: [...simulatorState.edges, newEdge] });
      setWireMode(null);
    },
    [wireMode, simulatorState, setSimulatorState],
  );

  const handleBackgroundClick = () => {
    if (wireMode) { setWireMode(null); return; }
    setSelectedId(null);
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[12, 22, 12]} intensity={1.4} castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5} shadow-camera-far={60}
        shadow-camera-left={-20} shadow-camera-right={20}
        shadow-camera-top={20} shadow-camera-bottom={-20}
      />
      <directionalLight position={[-8, 12, -8]} intensity={0.35} color="#b0c4ff" />
      <pointLight position={[0, 8, 0]} intensity={0.3} color="#fff8e0" />

      <Environment preset="apartment" />

      {/* Workbench */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleBackgroundClick}
      >
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#2c1a0e" roughness={0.9} metalness={0} />
      </mesh>

      <Grid
        args={[60, 60]} position={[0, 0.001, 0]}
        cellSize={1} cellThickness={0.3} cellColor="#3d2512"
        sectionSize={5} sectionThickness={0.7} sectionColor="#4a2e18"
        fadeDistance={40} fadeStrength={1}
      />

      {/* Components */}
      {simulatorState.nodes.map((node) => {
        const ModelComponent = MODEL_MAP[node.data.definitionId as string];
        if (!ModelComponent) return null;
        const simState = simulationResult?.componentStates.get(node.id);
        return (
          <ModelComponent
            key={node.id}
            node={node}
            isSelected={selectedId === node.id}
            wireMode={wireMode}
            isPowered={simState?.isPowered ?? false}
            fault={simState?.fault ?? null}
            onSelect={(e) => handlePointerDown(node.id, e)}
            onTerminalClick={handleTerminalClick}
          />
        );
      })}

      {/* Wires */}
      {simulatorState.edges.map((edge) => (
        <Wire3D
          key={edge.id}
          edge={edge}
          nodes={simulatorState.nodes}
          isPowered={simulationResult?.poweredEdgeIds.has(edge.id) ?? false}
        />
      ))}

      {/* Wire drawing preview */}
      {wireMode && mouseWorld && (
        <WirePreview start={wireMode.sourceWorldPos} end={mouseWorld} />
      )}

      {/* Mentor guidance overlay */}
      <GuidanceOverlay3D />

      {/* Wire mode banner */}
      {wireMode && (
        <Html position={[0, 0, 0]} center style={{ pointerEvents: 'none', top: '-45%', position: 'absolute' }}>
          <div style={{
            background: 'rgba(249,115,22,0.92)', color: '#fff',
            padding: '5px 14px', borderRadius: '20px', fontSize: '12px',
            fontFamily: 'Inter, sans-serif', fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            Click a terminal to connect  •  ESC to cancel
          </div>
        </Html>
      )}

      {/* Empty state */}
      {simulatorState.nodes.length === 0 && (
        <Html center style={{ pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ fontSize: 48 }}>🔌</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Add components from the library below</div>
          </div>
        </Html>
      )}
    </>
  );
}

// ─── Main exported canvas ────────────────────────────────────────────────────
export function SimulatorCanvas3D() {
  const orbitRef = useRef<OrbitControlsImpl>(null);
  const { simulatorState, isSimulating, setSimulationResult } = useStore();

  // Re-run simulation whenever circuit changes or isSimulating toggles
  useEffect(() => {
    const result = simulate(simulatorState, isSimulating);
    setSimulationResult(result);
  }, [simulatorState, isSimulating, setSimulationResult]);

  return (
    <div className="relative w-full h-full">
      {/* Status bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-outline-variant rounded-full px-4 py-1.5 shadow-sm text-sm font-medium text-on-surface pointer-events-auto">
        <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'}`} />
        <span className="text-outline text-xs">|</span>
        {isSimulating ? 'Simulating' : '3D Simulator'}
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

      {/* Controls hint */}
      <div className="absolute bottom-20 left-3 z-10 text-[10px] text-white/40 font-mono pointer-events-none select-none leading-relaxed">
        Drag: move  •  Click terminal: wire<br />
        Scroll: zoom  •  Right-drag: pan
      </div>

      <Canvas
        camera={{ position: [0, 18, 18], fov: 45, near: 0.1, far: 200 }}
        shadows
        gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.1 }}
        style={{ background: '#1a0f08' }}
      >
        <Suspense fallback={null}>
          <Scene orbitRef={orbitRef} />
          <OrbitControls
            ref={orbitRef}
            makeDefault
            minDistance={4}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2.1}
            enableDamping dampingFactor={0.08}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
