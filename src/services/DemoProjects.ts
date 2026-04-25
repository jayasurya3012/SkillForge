import type { CircuitProject, ComponentDefinition } from '../types';
import { componentLibrary } from './ComponentLibrary';

/**
 * Demo projects for testing the mentor feature without requiring API calls
 * Each step focuses on ONE action: either placing a component OR making ONE connection
 */

const arduinoUno = componentLibrary.getById('arduino-uno')!;
const resistor220 = componentLibrary.getById('resistor-220')!;
const ledRed = componentLibrary.getById('led-red')!;

export const DEMO_LED_BLINK_PROJECT: CircuitProject = {
  id: 'demo-led-blink-001',
  title: 'LED Blink Circuit',
  description: 'Learn the basics of Arduino by building a simple LED blink circuit. This classic "Hello World" of electronics teaches you about digital output pins, current-limiting resistors, and LED polarity.',
  difficulty: 'beginner',
  category: 'basic-led',
  isExperimental: false,
  finalDiagram: '',
  requiredComponents: [
    arduinoUno,
    resistor220,
    ledRed,
  ] as ComponentDefinition[],
  steps: [
    // Step 1: Place Arduino
    {
      number: 1,
      title: 'Place the Arduino Uno',
      instruction: 'Start by dragging the **Arduino Uno** from the component library onto the canvas. This is the brain of your circuit - it will control when the LED turns on and off.',
      componentsInvolved: ['arduino-uno'],
      connections: [],
      referenceImage: null,
      referenceVideo: null,
      diagramFallback: `
┌─────────────────┐
│   ARDUINO UNO   │
│                 │
│  [5V] [GND]     │
│                 │
│  [D13] [D12]    │
└─────────────────┘

Just the Arduino - no other components yet.
      `,
      expectedState: {
        requiredComponents: [{ type: 'arduino-uno', id: 'arduino-uno' }],
        requiredConnections: [],
      },
    },
    // Step 2: Place Resistor
    {
      number: 2,
      title: 'Add the 220Ω Resistor',
      instruction: 'Add a **220Ω resistor** to the canvas. This resistor limits the current flowing through the LED to prevent it from burning out. Look for the RED-RED-BROWN color bands on a real resistor.',
      componentsInvolved: ['arduino-uno', 'resistor-220'],
      connections: [],
      referenceImage: null,
      referenceVideo: null,
      diagramFallback: `
┌─────────────────┐
│   ARDUINO UNO   │
└─────────────────┘

    ┌──[///]──┐
    │  220Ω  │
    └─────────┘

Arduino + Resistor placed (not connected yet)
      `,
      expectedState: {
        requiredComponents: [
          { type: 'arduino-uno', id: 'arduino-uno' },
          { type: 'resistor-220', id: 'resistor-220' },
        ],
        requiredConnections: [],
      },
    },
    // Step 3: Place LED
    {
      number: 3,
      title: 'Add the Red LED',
      instruction: 'Add a **Red LED** to the canvas. Notice it has two terminals - the **Anode (+)** is the positive side and the **Cathode (-)** is the negative side. LEDs only work when connected in the correct direction!',
      componentsInvolved: ['arduino-uno', 'resistor-220', 'led-red'],
      connections: [],
      referenceImage: null,
      referenceVideo: null,
      diagramFallback: `
┌─────────────────┐
│   ARDUINO UNO   │
└─────────────────┘

    ┌──[///]──┐        🔴
    │  220Ω  │        LED
    └─────────┘       (+)(-)

All 3 components placed (not connected yet)
      `,
      expectedState: {
        requiredComponents: [
          { type: 'arduino-uno', id: 'arduino-uno' },
          { type: 'resistor-220', id: 'resistor-220' },
          { type: 'led-red', id: 'led-red' },
        ],
        requiredConnections: [],
      },
    },
    // Step 4: First connection - D13 to Resistor Lead 1
    {
      number: 4,
      title: 'Connect D13 → Resistor',
      instruction: 'Make your first connection! Click on the Arduino **D13** pin, then click on **Lead 1** of the resistor. This connects the digital output to the resistor.',
      componentsInvolved: ['arduino-uno', 'resistor-220'],
      connections: [
        {
          sourceComponentId: 'arduino-uno',
          sourceTerminalId: 'uno-d13',
          targetComponentId: 'resistor-220',
          targetTerminalId: 'r220-lead1',
        },
      ],
      referenceImage: null,
      referenceVideo: null,
      diagramFallback: `
┌─────────────────┐
│   ARDUINO UNO   │
│                 │
│  [D13]──────────┼───┐
└─────────────────┘   │
                      │
    ┌──[///]──────────┘
    │  220Ω  │
    └─────────┘        🔴

Wire 1: D13 → Resistor Lead 1
      `,
      expectedState: {
        requiredComponents: [
          { type: 'arduino-uno', id: 'arduino-uno' },
          { type: 'resistor-220', id: 'resistor-220' },
          { type: 'led-red', id: 'led-red' },
        ],
        requiredConnections: [
          { sourceTerminal: 'uno-d13', targetTerminal: 'r220-lead1' },
        ],
      },
    },
    // Step 5: Second connection - Resistor Lead 2 to LED Anode
    {
      number: 5,
      title: 'Connect Resistor → LED Anode',
      instruction: 'Connect **Lead 2** of the resistor to the LED **Anode (+)**. This sends the current-limited signal to the positive side of the LED.',
      componentsInvolved: ['resistor-220', 'led-red'],
      connections: [
        {
          sourceComponentId: 'resistor-220',
          sourceTerminalId: 'r220-lead2',
          targetComponentId: 'led-red',
          targetTerminalId: 'led-anode',
        },
      ],
      referenceImage: null,
      referenceVideo: null,
      diagramFallback: `
┌─────────────────┐
│   ARDUINO UNO   │
│                 │
│  [D13]──────────┼───┐
└─────────────────┘   │
                      │
    ┌──[///]──────────┘
    │  220Ω  │
    └────┬────┘
         │
         └────────────🔴(+)
                      LED
                      (-)

Wire 2: Resistor Lead 2 → LED Anode (+)
      `,
      expectedState: {
        requiredComponents: [
          { type: 'arduino-uno', id: 'arduino-uno' },
          { type: 'resistor-220', id: 'resistor-220' },
          { type: 'led-red', id: 'led-red' },
        ],
        requiredConnections: [
          { sourceTerminal: 'uno-d13', targetTerminal: 'r220-lead1' },
          { sourceTerminal: 'r220-lead2', targetTerminal: 'led-anode' },
        ],
      },
    },
    // Step 6: Third connection - LED Cathode to GND
    {
      number: 6,
      title: 'Connect LED Cathode → GND',
      instruction: 'Final connection! Connect the LED **Cathode (-)** to the Arduino **GND** pin. This completes the circuit - current flows from D13 → Resistor → LED → GND.',
      componentsInvolved: ['arduino-uno', 'led-red'],
      connections: [
        {
          sourceComponentId: 'led-red',
          sourceTerminalId: 'led-cathode',
          targetComponentId: 'arduino-uno',
          targetTerminalId: 'uno-gnd',
        },
      ],
      referenceImage: null,
      referenceVideo: null,
      diagramFallback: `
┌─────────────────┐
│   ARDUINO UNO   │
│                 │
│  [GND]◄─────────┼───────────┐
│  [D13]──────────┼───┐       │
└─────────────────┘   │       │
                      │       │
    ┌──[///]──────────┘       │
    │  220Ω  │                │
    └────┬────┘               │
         │                    │
         └────────────🔴(+)   │
                      LED     │
                      (-)─────┘

Wire 3: LED Cathode (-) → GND
CIRCUIT COMPLETE! ✓
      `,
      expectedState: {
        requiredComponents: [
          { type: 'arduino-uno', id: 'arduino-uno' },
          { type: 'resistor-220', id: 'resistor-220' },
          { type: 'led-red', id: 'led-red' },
        ],
        requiredConnections: [
          { sourceTerminal: 'uno-d13', targetTerminal: 'r220-lead1' },
          { sourceTerminal: 'r220-lead2', targetTerminal: 'led-anode' },
          { sourceTerminal: 'led-cathode', targetTerminal: 'uno-gnd' },
        ],
      },
    },
  ],
};

export const DEMO_PROJECTS = [DEMO_LED_BLINK_PROJECT];
