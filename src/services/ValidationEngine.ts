import type { SimulatorState, ExpectedState, ValidationResult } from '../types';

class ValidationEngineService {
  validate(current: SimulatorState, expected: ExpectedState): ValidationResult {
    const currentConnectionSet = new Set(
      current.edges.map((e) => this.canonicalKey(e.sourceHandle, e.targetHandle)),
    );
    const currentComponentTypes = new Set(
      current.nodes.map((n) => n.data.definitionId),
    );

    const missingConnections = expected.requiredConnections
      .filter(
        (req) =>
          !currentConnectionSet.has(this.canonicalKey(req.sourceTerminal, req.targetTerminal)),
      )
      .map((req) => ({
        source: req.sourceTerminal,
        target: req.targetTerminal,
        hint: `Connect terminal "${req.sourceTerminal}" to "${req.targetTerminal}".`,
      }));

    const expectedConnectionSet = new Set(
      expected.requiredConnections.map((r) =>
        this.canonicalKey(r.sourceTerminal, r.targetTerminal),
      ),
    );
    const extraConnections = current.edges
      .filter((e) => !expectedConnectionSet.has(this.canonicalKey(e.sourceHandle, e.targetHandle)))
      .map((e) => ({
        source: e.sourceHandle,
        target: e.targetHandle,
        reason: `Connection from "${e.sourceHandle}" to "${e.targetHandle}" is not required for this step.`,
      }));

    const missingComponents = expected.requiredComponents
      .filter((req) => !currentComponentTypes.has(req.type))
      .map((req) => ({
        type: req.type,
        hint: `Add a "${req.type}" component to the canvas.`,
      }));

    const isCorrect =
      missingConnections.length === 0 &&
      extraConnections.length === 0 &&
      missingComponents.length === 0;

    return { isCorrect, missingConnections, extraConnections, missingComponents };
  }

  getHint(result: ValidationResult): string {
    if (result.isCorrect) return 'All connections are correct!';

    const parts: string[] = [];

    if (result.missingComponents.length > 0) {
      const mc = result.missingComponents[0];
      parts.push(`Add a "${mc.type}" component to the canvas.`);
    }
    if (result.missingConnections.length > 0) {
      const mc = result.missingConnections[0];
      parts.push(`Connect terminal "${mc.source}" to "${mc.target}".`);
    }
    if (result.extraConnections.length > 0) {
      const ec = result.extraConnections[0];
      parts.push(`Remove the connection from "${ec.source}" to "${ec.target}".`);
    }

    return parts.join(' ');
  }

  private canonicalKey(a: string, b: string): string {
    return [a, b].sort().join('::');
  }
}

export const validationEngine = new ValidationEngineService();
