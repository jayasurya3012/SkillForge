import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../store';
import { validationEngine } from '../../services/ValidationEngine';
import { mentorService, type StepGuidance } from '../../services/MentorService';

export function StepInstructionsPanel() {
  const { 
    project, 
    currentStep, 
    setCurrentStep, 
    simulatorState,
    completedSteps,
    mentor,
    setMentorEnabled,
    setShowGuidance,
    markStepComplete,
    resetMentorForStep,
  } = useStore();
  
  const [validationResult, setValidationResult] = useState<import('../../types').ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [imgZoom, setImgZoom] = useState(false);

  // Get step guidance from mentor service
  const guidance: StepGuidance | null = useMemo(() => {
    if (!project) return null;
    const step = project.steps[currentStep - 1];
    if (!step) return null;
    return mentorService.getStepGuidance(step, simulatorState);
  }, [project, currentStep, simulatorState]);

  // Reset mentor state when step changes
  useEffect(() => {
    resetMentorForStep();
    setValidationResult(null);
  }, [currentStep, resetMentorForStep]);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <span className="material-symbols-outlined text-[48px] text-outline">school</span>
        <p className="text-sm text-on-surface-variant">
          Generate a circuit project with the AI Assistant to start the guided tutorial.
        </p>
      </div>
    );
  }

  const step = project.steps[currentStep - 1];
  const totalSteps = project.steps.length;
  const progress = guidance?.progress ?? 0;
  const circumference = 2 * Math.PI * 18;
  const strokeDash = (progress / 100) * circumference;

  async function handleValidate() {
    if (!step) return;
    setIsValidating(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = validationEngine.validate(simulatorState, step.expectedState);
    setValidationResult(result);
    setIsValidating(false);

    if (result.isCorrect && currentStep < totalSteps) {
      markStepComplete(currentStep);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setValidationResult(null);
      }, 1200);
    } else if (result.isCorrect && currentStep === totalSteps) {
      markStepComplete(currentStep);
    }
  }

  function formatInstruction(text: string) {
    return text
      .split(/(\*\*[^*]+\*\*|RED|BLUE|GREEN|BLACK|YELLOW|ORANGE)/g)
      .map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        const wireColors: Record<string, string> = {
          RED: 'text-red-600 font-semibold',
          BLUE: 'text-blue-600 font-semibold',
          GREEN: 'text-emerald-600 font-semibold',
          BLACK: 'text-slate-800 font-semibold',
          YELLOW: 'text-yellow-600 font-semibold',
          ORANGE: 'text-orange-500 font-semibold',
        };
        if (wireColors[part]) {
          return <span key={i} className={wireColors[part]}>{part}</span>;
        }
        return part;
      });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-3 border-b border-outline-variant flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
              Mentor Mode
            </p>
            {mentor.isEnabled && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE
              </span>
            )}
          </div>
          <h2 className="font-semibold text-sm text-on-surface leading-tight truncate">
            {step?.title ?? 'Loading...'}
          </h2>
        </div>
        {/* Circular progress */}
        <div className="relative flex-shrink-0 w-10 h-10">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="none" stroke="#e7e7f3" strokeWidth="3" />
            <circle
              cx="20" cy="20" r="18" fill="none"
              stroke={progress === 100 ? '#22c55e' : '#004ac6'}
              strokeWidth="3"
              strokeDasharray={`${strokeDash} ${circumference}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
            {currentStep}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="px-4 py-2 border-b border-outline-variant bg-surface-container-low">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep <= 1}
            className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            Previous
          </button>
          <span className="text-xs font-semibold text-on-surface">
            Step {currentStep} of {totalSteps}
          </span>
          <button
            onClick={() => currentStep < totalSteps && setCurrentStep(currentStep + 1)}
            disabled={currentStep >= totalSteps}
            className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5">
          {project.steps.map((_, i) => {
            const stepNum = i + 1;
            const isComplete = completedSteps.includes(stepNum);
            const isCurrent = stepNum === currentStep;
            return (
              <button
                key={stepNum}
                onClick={() => setCurrentStep(stepNum)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  isCurrent
                    ? 'bg-primary scale-125'
                    : isComplete
                    ? 'bg-emerald-500'
                    : 'bg-outline-variant hover:bg-outline'
                }`}
                title={`Step ${stepNum}: ${project.steps[i].title}`}
              />
            );
          })}
        </div>
      </div>

      {/* Mentor Controls */}
      <div className="px-4 py-2 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={mentor.isEnabled}
              onChange={(e) => setMentorEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <span className="text-xs text-on-surface-variant">Enable Guidance</span>
          </label>
          {mentor.isEnabled && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mentor.showGuidance}
                onChange={(e) => setShowGuidance(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span className="text-xs text-on-surface-variant">Show Arrows</span>
            </label>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        {step && guidance ? (
          <>
            {/* Instruction */}
            <p className="text-sm text-on-surface leading-relaxed">
              {formatInstruction(step.instruction)}
            </p>

            {/* Next Action Banner */}
            {!guidance.isStepComplete && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary mt-0.5">
                    arrow_forward
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                      Next Action
                    </p>
                    <p className="text-sm text-on-surface">{guidance.nextAction}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Components Checklist */}
            {guidance.componentsNeeded.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-outline mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                  Components Needed
                </p>
                <div className="flex flex-col gap-1.5">
                  {guidance.componentsNeeded.map((comp) => (
                    <div
                      key={comp.componentId}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                        comp.isPlaced
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-surface-container border-outline-variant'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          comp.isPlaced ? 'text-emerald-600' : 'text-outline'
                        }`}
                        style={{ fontVariationSettings: comp.isPlaced ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {comp.isPlaced ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${comp.isPlaced ? 'text-emerald-700' : 'text-on-surface'}`}>
                          {comp.componentName}
                        </p>
                        <p className="text-[10px] text-on-surface-variant font-mono truncate">
                          {comp.physicalLabel}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connections Checklist */}
            {guidance.connectionsNeeded.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-outline mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">cable</span>
                  Connections
                </p>
                <div className="flex flex-col gap-1.5">
                  {guidance.connectionsNeeded.map((conn, i) => (
                    <div
                      key={`${conn.sourceTerminalId}-${conn.targetTerminalId}`}
                      className={`flex items-start gap-2 px-3 py-2 rounded-lg border transition-all ${
                        conn.isComplete
                          ? 'bg-emerald-50 border-emerald-200'
                          : i === guidance.connectionsNeeded.findIndex((c) => !c.isComplete)
                          ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200'
                          : 'bg-surface-container border-outline-variant'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] mt-0.5 ${
                          conn.isComplete
                            ? 'text-emerald-600'
                            : i === guidance.connectionsNeeded.findIndex((c) => !c.isComplete)
                            ? 'text-orange-500'
                            : 'text-outline'
                        }`}
                        style={{ fontVariationSettings: conn.isComplete ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {conn.isComplete ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={`font-mono font-bold ${conn.isComplete ? 'text-emerald-700' : 'text-primary'}`}>
                            {conn.sourceTerminalId.split('-').pop()}
                          </span>
                          <span className="material-symbols-outlined text-[14px] text-outline">
                            arrow_forward
                          </span>
                          <span className={`font-mono font-bold ${conn.isComplete ? 'text-emerald-700' : 'text-primary'}`}>
                            {conn.targetTerminalId.split('-').pop()}
                          </span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          {conn.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reference video or image or fallback diagram */}
            {(step.referenceVideo || step.referenceImage || step.diagramFallback) && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-outline mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">
                    {step.referenceVideo ? 'movie' : 'image'}
                  </span>
                  {step.referenceVideo ? 'Tutorial Video' : step.referenceImage ? 'Reference Image' : 'Reference Diagram'}
                </p>
                {step.referenceVideo ? (
                  <div className="relative rounded-lg overflow-hidden border border-outline-variant bg-black">
                    <video
                      src={step.referenceVideo}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-auto"
                      style={{ maxHeight: '200px', objectFit: 'contain' }}
                    />
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">replay</span>
                      Looping
                    </div>
                  </div>
                ) : step.referenceImage ? (
                  <div
                    className="relative rounded-lg overflow-hidden border border-outline-variant cursor-zoom-in group"
                    onClick={() => setImgZoom(true)}
                  >
                    <img src={step.referenceImage} alt="Reference diagram" className="w-full h-auto" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="material-symbols-outlined text-white text-[32px]">zoom_in</span>
                    </div>
                  </div>
                ) : (
                  <pre className="text-xs font-mono bg-surface-container rounded-lg p-3 overflow-x-auto text-on-surface-variant whitespace-pre-wrap">
                    {step.diagramFallback}
                  </pre>
                )}
              </div>
            )}

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-on-surface-variant font-medium">Step Progress</span>
                <span className={`text-xs font-semibold ${progress === 100 ? 'text-emerald-600' : 'text-primary'}`}>
                  {progress}%
                </span>
              </div>
              <div className="h-2 bg-outline-variant rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progress === 100 ? 'bg-emerald-500' : 'bg-primary'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Validation result */}
            {validationResult && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  validationResult.isCorrect
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {validationResult.isCorrect ? (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                    <span className="font-semibold">
                      {currentStep === totalSteps ? 'Project complete! 🎉' : 'Step complete! Moving to next step…'}
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold mb-1">Not quite yet:</p>
                    <p className="text-xs">{validationEngine.getHint(validationResult)}</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-outline">No step data available.</p>
        )}
      </div>

      {/* Validate button */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-outline-variant">
        <button
          onClick={handleValidate}
          disabled={isValidating || !step}
          className={`w-full text-sm font-bold py-2.5 rounded-xl shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            guidance?.isStepComplete
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-primary text-on-primary hover:bg-primary-container'
          } hover:-translate-y-0.5 active:translate-y-0`}
        >
          {isValidating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              Validating…
            </span>
          ) : guidance?.isStepComplete ? (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check</span>
              Validate & Continue
            </span>
          ) : (
            'Validate Step'
          )}
        </button>
      </div>

      {/* Zoom overlay */}
      {imgZoom && step?.referenceImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-8"
          onClick={() => setImgZoom(false)}
        >
          <img
            src={step.referenceImage}
            alt="Reference diagram zoom"
            className="max-w-full max-h-full rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
