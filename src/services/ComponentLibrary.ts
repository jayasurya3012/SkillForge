import type { ComponentCategory, ComponentDefinition, CircuitProject } from '../types';

const COMPONENTS: ComponentDefinition[] = [
  {
    id: 'arduino-uno',
    name: 'Arduino Uno',
    category: 'boards',
    icon: 'memory',
    physicalLabel: 'Arduino UNO R3',
    defaultProperties: { voltage: 5 },
    terminals: [
      { id: 'uno-5v', label: '5V', position: 'top', terminalType: 'power-pin', compatible: ['wire', 'jumper', 'power-rail'] },
      { id: 'uno-gnd', label: 'GND', position: 'top', terminalType: 'ground-pin', compatible: ['wire', 'jumper', 'ground-rail'] },
      { id: 'uno-d13', label: 'D13', position: 'right', terminalType: 'digital-pin', compatible: ['wire', 'jumper', 'component-lead'] },
      { id: 'uno-d12', label: 'D12', position: 'right', terminalType: 'digital-pin', compatible: ['wire', 'jumper', 'component-lead'] },
      { id: 'uno-d11', label: 'D11', position: 'right', terminalType: 'digital-pin', compatible: ['wire', 'jumper', 'component-lead'] },
      { id: 'uno-d10', label: 'D10', position: 'right', terminalType: 'digital-pin', compatible: ['wire', 'jumper', 'component-lead'] },
      { id: 'uno-d9', label: 'D9', position: 'right', terminalType: 'digital-pin', compatible: ['wire', 'jumper', 'component-lead'] },
      { id: 'uno-a0', label: 'A0', position: 'left', terminalType: 'analog-pin', compatible: ['wire', 'jumper', 'component-lead'] },
      { id: 'uno-a1', label: 'A1', position: 'left', terminalType: 'analog-pin', compatible: ['wire', 'jumper', 'component-lead'] },
    ],
  },
  {
    id: 'resistor-220',
    name: 'Resistor 220Ω',
    category: 'passives',
    icon: 'reorder',
    physicalLabel: '220Ω ±5% (Red-Red-Brown)',
    defaultProperties: { resistance: 220 },
    terminals: [
      { id: 'r220-lead1', label: 'Lead 1', position: 'left', terminalType: 'component-lead', compatible: ['wire', 'jumper', 'digital-pin', 'analog-pin', 'breadboard-row'] },
      { id: 'r220-lead2', label: 'Lead 2', position: 'right', terminalType: 'component-lead', compatible: ['wire', 'jumper', 'digital-pin', 'analog-pin', 'breadboard-row'] },
    ],
  },
  {
    id: 'resistor-10k',
    name: 'Resistor 10kΩ',
    category: 'passives',
    icon: 'reorder',
    physicalLabel: '10kΩ ±5% (Brown-Black-Orange)',
    defaultProperties: { resistance: 10000 },
    terminals: [
      { id: 'r10k-lead1', label: 'Lead 1', position: 'left', terminalType: 'component-lead', compatible: ['wire', 'jumper', 'digital-pin', 'analog-pin', 'breadboard-row'] },
      { id: 'r10k-lead2', label: 'Lead 2', position: 'right', terminalType: 'component-lead', compatible: ['wire', 'jumper', 'digital-pin', 'analog-pin', 'breadboard-row'] },
    ],
  },
  {
    id: 'led-red',
    name: 'LED Red',
    category: 'actuators',
    icon: 'light_mode',
    physicalLabel: 'LED 5mm Red (Vf≈2V)',
    defaultProperties: { color: 'red', vf: 2 },
    terminals: [
      { id: 'led-anode', label: 'Anode (+)', position: 'top', terminalType: 'component-lead', compatible: ['wire', 'jumper', 'digital-pin', 'breadboard-row'] },
      { id: 'led-cathode', label: 'Cathode (−)', position: 'bottom', terminalType: 'component-lead', compatible: ['wire', 'jumper', 'ground-pin', 'breadboard-row'] },
    ],
  },
  {
    id: 'led-green',
    name: 'LED Green',
    category: 'actuators',
    icon: 'light_mode',
    physicalLabel: 'LED 5mm Green (Vf≈2.2V)',
    defaultProperties: { color: 'green', vf: 2.2 },
    terminals: [
      { id: 'ledg-anode', label: 'Anode (+)', position: 'top', terminalType: 'component-lead', compatible: ['wire', 'jumper', 'digital-pin', 'breadboard-row'] },
      { id: 'ledg-cathode', label: 'Cathode (−)', position: 'bottom', terminalType: 'component-lead', compatible: ['wire', 'jumper', 'ground-pin', 'breadboard-row'] },
    ],
  },
  {
    id: 'buzzer',
    name: 'Buzzer',
    category: 'actuators',
    icon: 'volume_up',
    physicalLabel: 'Piezo Buzzer 5V Active',
    defaultProperties: { frequency: 2700 },
    terminals: [
      { id: 'buz-pos', label: 'VCC (+)', position: 'top', terminalType: 'component-lead', compatible: ['wire', 'jumper', 'digital-pin', 'breadboard-row'] },
      { id: 'buz-neg', label: 'GND (−)', position: 'bottom', terminalType: 'component-lead', compatible: ['wire', 'jumper', 'ground-pin', 'breadboard-row'] },
    ],
  },
  {
    id: 'pir-sensor',
    name: 'PIR Sensor',
    category: 'sensors',
    icon: 'sensors',
    physicalLabel: 'HC-SR501 PIR Motion Sensor',
    defaultProperties: { range: 7, angle: 120 },
    terminals: [
      { id: 'pir-vcc', label: 'VCC', position: 'top', terminalType: 'power-pin', compatible: ['wire', 'jumper', 'power-rail'] },
      { id: 'pir-gnd', label: 'GND', position: 'bottom', terminalType: 'ground-pin', compatible: ['wire', 'jumper', 'ground-rail'] },
      { id: 'pir-out', label: 'OUT', position: 'right', terminalType: 'component-lead', compatible: ['wire', 'jumper', 'digital-pin'] },
    ],
  },
  {
    id: 'breadboard',
    name: 'Breadboard',
    category: 'boards',
    icon: 'grid_on',
    physicalLabel: 'Half-size Breadboard 400 ties',
    defaultProperties: { rows: 30, columns: 10 },
    terminals: [
      { id: 'bb-pwr-pos', label: 'Power Rail +', position: 'top', terminalType: 'power-rail', compatible: ['power-pin', 'wire'] },
      { id: 'bb-pwr-neg', label: 'Power Rail −', position: 'top', terminalType: 'ground-rail', compatible: ['ground-pin', 'wire'] },
      { id: 'bb-row-a1', label: 'Row A1', position: 'left', terminalType: 'breadboard-row', compatible: ['component-lead', 'wire', 'jumper'] },
      { id: 'bb-row-a5', label: 'Row A5', position: 'left', terminalType: 'breadboard-row', compatible: ['component-lead', 'wire', 'jumper'] },
      { id: 'bb-row-b1', label: 'Row B1', position: 'right', terminalType: 'breadboard-row', compatible: ['component-lead', 'wire', 'jumper'] },
    ],
  },
  {
    id: 'jumper-wire',
    name: 'Jumper Wire',
    category: 'wires',
    icon: 'cable',
    physicalLabel: 'M-M Jumper Wire 20cm',
    defaultProperties: { length: 20 },
    terminals: [
      { id: 'jw-a', label: 'End A', position: 'left', terminalType: 'jumper', compatible: ['digital-pin', 'analog-pin', 'power-pin', 'ground-pin', 'component-lead', 'breadboard-row'] },
      { id: 'jw-b', label: 'End B', position: 'right', terminalType: 'jumper', compatible: ['digital-pin', 'analog-pin', 'power-pin', 'ground-pin', 'component-lead', 'breadboard-row'] },
    ],
  },
  {
    id: '9v-battery',
    name: 'Power Cell',
    category: 'boards',
    icon: 'bolt',
    physicalLabel: '9V Battery + Snap Connector',
    defaultProperties: { voltage: 9 },
    terminals: [
      { id: 'bat-pos', label: 'Positive (+)', position: 'top', terminalType: 'power-pin', compatible: ['wire', 'jumper', 'power-rail'] },
      { id: 'bat-neg', label: 'Negative (−)', position: 'bottom', terminalType: 'ground-pin', compatible: ['wire', 'jumper', 'ground-rail'] },
    ],
  },
];

const TERMINAL_COMPATIBILITY: Record<string, string[]> = {
  // Arduino / board pins
  'digital-pin':    ['wire', 'jumper', 'component-lead'],
  'analog-pin':     ['wire', 'jumper', 'component-lead'],
  'power-pin':      ['wire', 'jumper', 'power-rail', 'component-lead'],
  'ground-pin':     ['wire', 'jumper', 'ground-rail', 'component-lead'],
  // Passive / actuator leads — can connect to any pin type or another lead directly
  'component-lead': ['wire', 'jumper', 'component-lead', 'digital-pin', 'analog-pin', 'power-pin', 'ground-pin', 'breadboard-row'],
  // Breadboard rows
  'breadboard-row': ['component-lead', 'wire', 'jumper'],
  // Breadboard power rails
  'power-rail':     ['power-pin', 'wire', 'component-lead'],
  'ground-rail':    ['ground-pin', 'wire', 'component-lead'],
  // Bare wire / jumper — connects to everything
  wire:   ['digital-pin', 'analog-pin', 'power-pin', 'ground-pin', 'component-lead', 'breadboard-row', 'power-rail', 'ground-rail'],
  jumper: ['digital-pin', 'analog-pin', 'power-pin', 'ground-pin', 'component-lead', 'breadboard-row', 'power-rail', 'ground-rail'],
};

export const TERMINAL_COMPAT = TERMINAL_COMPATIBILITY;

class ComponentLibraryService {
  getAll(): ComponentDefinition[] {
    return [...COMPONENTS];
  }

  getByCategory(category: ComponentCategory): ComponentDefinition[] {
    return COMPONENTS.filter((c) => c.category === category);
  }

  getForProject(project: CircuitProject): ComponentDefinition[] {
    const requiredIds = new Set(project.requiredComponents.map((c) => c.id));
    const projectComponents = COMPONENTS.filter((c) => requiredIds.has(c.id));

    // Sort so same-category components are adjacent
    return projectComponents.sort((a, b) => a.category.localeCompare(b.category));
  }

  getForStep(step: import('../types').Step): ComponentDefinition[] {
    const ids = new Set(step.componentsInvolved);
    return COMPONENTS.filter((c) => ids.has(c.id));
  }

  getById(id: string): ComponentDefinition | undefined {
    return COMPONENTS.find((c) => c.id === id);
  }

  isCompatible(typeA: string, typeB: string): boolean {
    return (
      (TERMINAL_COMPATIBILITY[typeA]?.includes(typeB) ?? false) &&
      (TERMINAL_COMPATIBILITY[typeB]?.includes(typeA) ?? false)
    );
  }
}

export const componentLibrary = new ComponentLibraryService();
