import Groq from 'groq-sdk';
import type { ChatMessage, CircuitProject, Step } from '../types';
import { KNOWN_CATEGORIES } from '../utils/constants';
import { videoGenerationService } from './VideoGenerationService';

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// llama-3.3-70b-versatile is GROQ's best general-purpose model
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are SkillForge, an expert electronics tutor. Generate a CircuitProject JSON object for Arduino circuits.

AVAILABLE COMPONENTS (use these exact IDs):
- arduino-uno: terminals: uno-5v, uno-gnd, uno-d13, uno-d12, uno-d11, uno-d10, uno-d9, uno-a0, uno-a1
- resistor-220: terminals: r220-lead1, r220-lead2
- resistor-10k: terminals: r10k-lead1, r10k-lead2
- led-red: terminals: led-anode, led-cathode
- led-green: terminals: ledg-anode, ledg-cathode
- buzzer: terminals: buz-pos, buz-neg
- pir-sensor: terminals: pir-vcc, pir-gnd, pir-out

REQUIRED JSON STRUCTURE:
{
  "id": "unique-slug-001",
  "title": "Project Title",
  "description": "What this project does",
  "difficulty": "beginner",
  "category": "basic-led",
  "isExperimental": false,
  "finalDiagram": "",
  "requiredComponents": [
    {"id": "arduino-uno", "name": "Arduino Uno", "category": "boards", "icon": "memory", "physicalLabel": "Arduino UNO R3", "terminals": [], "defaultProperties": {}}
  ],
  "steps": [
    {
      "number": 1,
      "title": "Step Title",
      "instruction": "What to do in this step",
      "componentsInvolved": ["arduino-uno"],
      "connections": [],
      "referenceImage": null,
      "diagramFallback": "ASCII diagram",
      "expectedState": {
        "requiredComponents": [{"type": "arduino-uno", "id": "arduino-uno"}],
        "requiredConnections": []
      }
    }
  ]
}

Categories: basic-led, sensor-based, motor-control, alarm-buzzer, communication
For connections use: {"sourceComponentId": "arduino-uno", "sourceTerminalId": "uno-d13", "targetComponentId": "led-red", "targetTerminalId": "led-anode"}
For expectedState.requiredConnections use: {"sourceTerminal": "uno-d13", "targetTerminal": "r220-lead1"}

RESPOND WITH ONLY THE JSON OBJECT. No markdown, no explanation, no code fences.`;

class ChatbotServiceClass {
  private client: Groq | null = null;

  private getClient(): Groq {
    if (!this.client) {
      const apiKey = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        throw new Error('VITE_GROQ_API_KEY is not set. Add it to your .env file.');
      }
      this.client = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    }
    return this.client;
  }

  buildUserMessage(content: string): ChatMessage {
    return { id: generateId(), role: 'user', content, timestamp: Date.now() };
  }

  buildAssistantMessage(content: string, isImportant = false): ChatMessage {
    return { id: generateId(), role: 'assistant', content, timestamp: Date.now(), isImportant };
  }

  async generateProject(
    description: string,
  ): Promise<{ project: CircuitProject; summary: string } | { error: string }> {
    if (!description.trim()) {
      return { error: 'Please describe the circuit you want to build.' };
    }

    try {
      const client = this.getClient();
      const response = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 4096,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Create a circuit project for: ${description}` },
        ],
      });

      const text = response.choices[0]?.message?.content ?? '';
      console.log('LLM Response:', text.substring(0, 500)); // Debug log

      let raw: unknown;
      try {
        // Try to extract JSON from various formats
        let cleaned = text.trim();
        
        // Remove markdown code fences if present
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
        
        // Try to find JSON object in the response
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleaned = jsonMatch[0];
        }
        
        raw = JSON.parse(cleaned);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, '\nRaw text:', text);
        return {
          error: 'Could not generate a valid circuit project. Please try rephrasing your request.',
        };
      }

      const validation = this.validateProject(raw);
      if (!validation.valid) {
        return { error: `Circuit generation error: ${validation.reason}` };
      }

      const project = raw as CircuitProject;

      if (!KNOWN_CATEGORIES.includes(project.category)) {
        project.isExperimental = true;
      }

      const summary = this.buildSummary(project);
      return { project, summary };
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('VITE_GROQ_API_KEY')) {
        return { error: err.message };
      }
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { error: `Failed to generate project: ${msg}` };
    }
  }

  async askFollowUp(
    question: string,
    currentStep: Step | undefined,
    history: ChatMessage[],
    projectTitle: string,
  ): Promise<ChatMessage> {
    try {
      const client = this.getClient();

      const contextMessages = history
        .filter((m) => m.role !== 'system')
        .slice(-8)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const stepContext = currentStep
        ? `\n\nCurrent step: "${currentStep.title}"\nInstruction: ${currentStep.instruction}\nComponents: ${currentStep.componentsInvolved.join(', ')}`
        : '';

      const response = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content: `You are SkillForge, a helpful electronics tutor for the project "${projectTitle}".${stepContext}\nAnswer concisely and reference specific component names or pin labels when relevant.`,
          },
          ...contextMessages,
          { role: 'user', content: question },
        ],
      });

      const text = response.choices[0]?.message?.content ?? 'Sorry, I could not generate a response.';
      return this.buildAssistantMessage(text);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return this.buildAssistantMessage(`Error: ${msg}`, true);
    }
  }

  private validateProject(raw: unknown): { valid: boolean; reason?: string } {
    if (typeof raw !== 'object' || raw === null) {
      console.error('Validation failed: not an object', raw);
      return { valid: false, reason: 'Response is not an object' };
    }
    const p = raw as Record<string, unknown>;
    
    if (!p.title || typeof p.title !== 'string') {
      console.error('Validation failed: missing title', p);
      return { valid: false, reason: 'Missing or invalid title' };
    }
    if (!p.description || typeof p.description !== 'string') {
      console.error('Validation failed: missing description', p);
      return { valid: false, reason: 'Missing description' };
    }
    if (!Array.isArray(p.steps) || p.steps.length === 0) {
      console.error('Validation failed: no steps', p);
      return { valid: false, reason: 'No steps generated' };
    }
    
    // Ensure requiredComponents exists
    if (!Array.isArray(p.requiredComponents)) {
      p.requiredComponents = [];
    }
    
    // Ensure other required fields have defaults
    if (!p.id) p.id = `project-${generateId()}`;
    if (!p.difficulty) p.difficulty = 'beginner';
    if (!p.category) p.category = 'basic-led';
    if (p.isExperimental === undefined) p.isExperimental = false;
    if (!p.finalDiagram) p.finalDiagram = '';
    
    for (let i = 0; i < (p.steps as unknown[]).length; i++) {
      const s = (p.steps as unknown[])[i] as Record<string, unknown>;
      if (!s.instruction || typeof s.instruction !== 'string') {
        console.error(`Validation failed: step ${i + 1} missing instruction`, s);
        return { valid: false, reason: `Step ${i + 1} missing instruction` };
      }
      
      // Add defaults for missing step fields
      if (!s.number) s.number = i + 1;
      if (!s.title) s.title = `Step ${i + 1}`;
      if (!Array.isArray(s.componentsInvolved)) s.componentsInvolved = [];
      if (!Array.isArray(s.connections)) s.connections = [];
      if (!s.referenceImage) s.referenceImage = null;
      if (!s.referenceVideo) s.referenceVideo = null;
      if (!s.diagramFallback) s.diagramFallback = '';
      if (!s.expectedState) {
        s.expectedState = { requiredComponents: [], requiredConnections: [] };
      }
    }
    
    return { valid: true };
  }

  private buildSummary(project: CircuitProject): string {
    const componentList = project.requiredComponents.map((c) => `• ${c.physicalLabel || c.name}`).join('\n');
    return `Generated: **${project.title}**\n\nDifficulty: ${project.difficulty} | Category: ${project.category}${project.isExperimental ? ' (experimental)' : ''}\n\n${project.description}\n\nComponents needed (${project.requiredComponents.length}):\n${componentList}\n\nThe tutorial has ${project.steps.length} steps. Start with Step 1 in the instructions panel →`;
  }

  /**
   * Generate tutorial videos for all steps in a project using fal.ai
   * Videos show the specific action for each step (placing component or making connection)
   */
  async generateStepVideos(
    project: CircuitProject,
    onProgress?: (stepNumber: number, total: number, status: string) => void
  ): Promise<CircuitProject> {
    const updatedSteps = [...project.steps];

    const stepInfos = project.steps.map(step => ({
      number: step.number,
      title: step.title,
      instruction: step.instruction,
      componentsInvolved: step.componentsInvolved,
      connections: step.connections,
    }));

    onProgress?.(1, updatedSteps.length, `Generating all ${updatedSteps.length} videos in parallel...`);

    // Fire all requests in parallel
    const promises = updatedSteps.map((step, i) => {
      const stepNumber = i + 1;
      return videoGenerationService.generateStepVideo(
        stepNumber,
        updatedSteps.length,
        stepInfos[i],
        stepInfos,
        (msg) => onProgress?.(stepNumber, updatedSteps.length, `Step ${stepNumber}: ${msg}`)
      ).then(videoUrl => {
        if (videoUrl) {
          updatedSteps[i] = { ...step, referenceVideo: videoUrl };
        }
        onProgress?.(stepNumber, updatedSteps.length, `Step ${stepNumber}: Done`);
      }).catch(error => {
        console.error(`Failed to generate video for step ${stepNumber}:`, error);
      });
    });

    await Promise.all(promises);

    return { ...project, steps: updatedSteps };
  }
}

export const chatbotService = new ChatbotServiceClass();
