/**
 * Video Generation Service
 * Calls the backend /api/videos/generate endpoint which uses OpenAI Sora
 * Generates short tutorial videos for each circuit building step
 */

export interface StepInfo {
  number: number;
  title: string;
  instruction: string;
  componentsInvolved: string[];
  connections: Array<{
    sourceComponentId: string;
    sourceTerminalId: string;
    targetComponentId: string;
    targetTerminalId: string;
  }>;
}

const COMPONENT_NAMES: Record<string, string> = {
  'arduino-uno': 'Arduino Uno board (blue PCB with USB port)',
  'resistor-220': '220 ohm resistor (small cylindrical component with red-red-brown color bands)',
  'resistor-10k': '10k ohm resistor (small cylindrical component with brown-black-orange color bands)',
  'led-red': 'red LED (small red transparent component with two metal legs)',
  'led-green': 'green LED (small green transparent component with two metal legs)',
  'buzzer': 'piezo buzzer (small black cylinder)',
  'pir-sensor': 'PIR motion sensor (white dome on green PCB)',
  'breadboard': 'solderless breadboard (white rectangular board with rows of holes)',
};

const TERMINAL_NAMES: Record<string, string> = {
  'uno-d13': 'digital pin D13',
  'uno-d12': 'digital pin D12',
  'uno-d11': 'digital pin D11',
  'uno-gnd': 'GND pin',
  'uno-5v': '5V power pin',
  'r220-lead1': 'resistor lead 1',
  'r220-lead2': 'resistor lead 2',
  'led-anode': 'LED anode (longer leg, positive)',
  'led-cathode': 'LED cathode (shorter leg, negative)',
  'buz-pos': 'buzzer positive terminal',
  'buz-neg': 'buzzer negative terminal',
};

const BACKEND_URL = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_BACKEND_URL || 'http://localhost:3001';

class VideoGenerationServiceClass {
  /**
   * Build a video prompt for a specific step
   */
  buildVideoPrompt(
    stepNumber: number,
    _totalSteps: number,
    currentStep: StepInfo,
    allSteps: StepInfo[]
  ): string {
    const hasConnection = currentStep.connections.length > 0;

    if (hasConnection) {
      const conn = currentStep.connections[0];
      const sourceName = TERMINAL_NAMES[conn.sourceTerminalId] || conn.sourceTerminalId;
      const targetName = TERMINAL_NAMES[conn.targetTerminalId] || conn.targetTerminalId;
      const sourceComp = COMPONENT_NAMES[conn.sourceComponentId] || conn.sourceComponentId;
      const targetComp = COMPONENT_NAMES[conn.targetComponentId] || conn.targetComponentId;

      return `Close-up tutorial video of hands on an electronics workbench. A hand picks up a colored jumper wire and connects it from the ${sourceName} on the ${sourceComp} to the ${targetName} on the ${targetComp}. Clean well-lit workspace, educational style, smooth motion.`;
    }

    const newComponents = currentStep.componentsInvolved.filter(c => {
      for (let i = 0; i < stepNumber - 1; i++) {
        if (allSteps[i].componentsInvolved.includes(c)) return false;
      }
      return true;
    });

    if (newComponents.length > 0) {
      const compName = COMPONENT_NAMES[newComponents[0]] || newComponents[0];
      return `Close-up tutorial video of hands placing a ${compName} on a clean electronics workbench. The component is picked up and carefully placed on the workspace. Well-lit, educational style, smooth motion.`;
    }

    return `Close-up tutorial video of hands working with Arduino electronics on a clean workbench. Educational style, smooth motion.`;
  }

  /**
   * Generate a video for a specific step via the backend (OpenAI Sora)
   */
  async generateStepVideo(
    stepNumber: number,
    totalSteps: number,
    currentStep: StepInfo,
    allSteps: StepInfo[],
    onLog?: (msg: string) => void
  ): Promise<string | null> {
    const prompt = this.buildVideoPrompt(stepNumber, totalSteps, currentStep, allSteps);
    console.log(`Generating video for step ${stepNumber}:`, prompt.substring(0, 100) + '...');

    try {
      onLog?.('Generating video with Sora...');

      const response = await fetch(`${BACKEND_URL}/api/videos/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Server error (${response.status})`);
      }

      const data = await response.json();

      if (data.videoId) {
        // Use the backend proxy URL to serve the video (avoids exposing API key)
        const proxyUrl = `${BACKEND_URL}/api/videos/${data.videoId}/content`;
        console.log(`Video generated for step ${stepNumber}:`, proxyUrl);
        onLog?.('Video ready!');
        return proxyUrl;
      }

      console.warn(`No video returned for step ${stepNumber}`);
      return null;
    } catch (error) {
      console.error(`Failed to generate video for step ${stepNumber}:`, error);
      onLog?.(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }
}

export const videoGenerationService = new VideoGenerationServiceClass();
