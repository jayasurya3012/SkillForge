// Local 3D offsets from component origin (centre of bottom face) for each terminal.
// x = left/right, y = height above workbench, z = front/back

export interface TermOffset { x: number; y: number; z: number }

export const TERMINAL_OFFSETS: Record<string, Record<string, TermOffset>> = {
  'arduino-uno': {
    'uno-5v':  { x: -3.2, y: 0.28, z:  1.8 },
    'uno-gnd': { x: -3.2, y: 0.28, z:  1.3 },
    'uno-d13': { x:  3.2, y: 0.28, z:  1.8 },
    'uno-d12': { x:  3.2, y: 0.28, z:  1.3 },
    'uno-d11': { x:  3.2, y: 0.28, z:  0.8 },
    'uno-d10': { x:  3.2, y: 0.28, z:  0.3 },
    'uno-d9':  { x:  3.2, y: 0.28, z: -0.2 },
    'uno-a0':  { x: -3.2, y: 0.28, z:  0.3 },
    'uno-a1':  { x: -3.2, y: 0.28, z: -0.2 },
  },
  'breadboard': {
    'bb-pwr-pos': { x: -3.5, y: 0.35, z: -2.1 },
    'bb-pwr-neg': { x: -3.5, y: 0.35, z:  2.1 },
    'bb-row-a1':  { x: -2.2, y: 0.35, z: -1.8 },
    'bb-row-a5':  { x: -2.2, y: 0.35, z:  1.8 },
    'bb-row-b1':  { x:  2.2, y: 0.35, z: -1.8 },
  },
  'led-red': {
    'led-anode':   { x: 0, y: 0.9, z:  0.15 },
    'led-cathode': { x: 0, y: 0.9, z: -0.15 },
  },
  'led-green': {
    'ledg-anode':   { x: 0, y: 0.9, z:  0.15 },
    'ledg-cathode': { x: 0, y: 0.9, z: -0.15 },
  },
  'resistor-220': {
    'r220-lead1': { x: -0.65, y: 0.12, z: 0 },
    'r220-lead2': { x:  0.65, y: 0.12, z: 0 },
  },
  'resistor-10k': {
    'r10k-lead1': { x: -0.65, y: 0.12, z: 0 },
    'r10k-lead2': { x:  0.65, y: 0.12, z: 0 },
  },
  'pir-sensor': {
    'pir-vcc': { x: -0.5, y: 0.28, z:  0.7 },
    'pir-gnd': { x:  0.5, y: 0.28, z:  0.7 },
    'pir-out': { x:  0,   y: 0.28, z:  0.7 },
  },
  'buzzer': {
    'buz-pos': { x:  0.25, y: 0.88, z: 0 },
    'buz-neg': { x: -0.25, y: 0.88, z: 0 },
  },
  '9v-battery': {
    'bat-pos': { x:  0.5, y: 0.55, z: 0 },
    'bat-neg': { x: -0.5, y: 0.55, z: 0 },
  },
  'jumper-wire': {
    'jw-a': { x: -0.7, y: 0.18, z: 0 },
    'jw-b': { x:  0.7, y: 0.18, z: 0 },
  },
};
