import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { chatbotService } from '../../services/ChatbotService';
import { DEMO_LED_BLINK_PROJECT } from '../../services/DemoProjects';

export function AIAssistantPanel() {
  const { messages, addMessage, setProject, updateProjectSteps, project, currentStep } = useStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageGenStatus, setImageGenStatus] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleLoadDemo() {
    setProject(DEMO_LED_BLINK_PROJECT);
    addMessage(chatbotService.buildAssistantMessage(
      `🎓 **Demo Project Loaded: ${DEMO_LED_BLINK_PROJECT.title}**\n\n${DEMO_LED_BLINK_PROJECT.description}\n\nThis tutorial has ${DEMO_LED_BLINK_PROJECT.steps.length} steps. The Mentor panel on the right will guide you through each connection.\n\n**Tip:** Enable "Show Arrows" in the Mentor panel to see visual guidance in the 3D view!`,
      true
    ));
    
    // Generate images for demo project in background
    generateVideosForProject(DEMO_LED_BLINK_PROJECT);
  }

  async function generateVideosForProject(proj: typeof DEMO_LED_BLINK_PROJECT) {
    setImageGenStatus('Generating tutorial videos...');
    try {
      const updatedProject = await chatbotService.generateStepVideos(
        proj,
        (step, total, status) => {
          setImageGenStatus(`${status} (${step}/${total})`);
        }
      );
      updateProjectSteps(updatedProject.steps);
      const videoCount = updatedProject.steps.filter(s => s.referenceVideo).length;
      if (videoCount > 0) {
        addMessage(chatbotService.buildAssistantMessage(
          `🎬 Generated ${videoCount} tutorial video${videoCount > 1 ? 's' : ''}! Check the Mentor panel to watch them.`,
          false
        ));
      } else {
        addMessage(chatbotService.buildAssistantMessage(
          '⚠️ Video generation completed but no videos were returned. Check the browser console for errors.',
          false
        ));
      }
    } catch (error) {
      console.error('Failed to generate videos:', error);
      addMessage(chatbotService.buildAssistantMessage(
        `⚠️ Could not generate tutorial videos: ${error instanceof Error ? error.message : 'Unknown error'}. You can still follow the text instructions and diagrams.`,
        false
      ));
    } finally {
      setImageGenStatus(null);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput('');

    const userMsg = chatbotService.buildUserMessage(text);
    addMessage(userMsg);
    setIsLoading(true);

    try {
      if (!project) {
        const result = await chatbotService.generateProject(text);
        if ('error' in result) {
          addMessage(chatbotService.buildAssistantMessage(result.error, true));
        } else {
          setProject(result.project);
          addMessage(chatbotService.buildAssistantMessage(result.summary, true));
          
          // Generate images in background
          generateVideosForProject(result.project);
        }
      } else {
        const stepCtx = project.steps[currentStep - 1];
        const reply = await chatbotService.askFollowUp(
          text,
          stepCtx,
          messages,
          project.title,
        );
        addMessage(reply);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const displayMessages = messages.filter((m) => m.role !== 'system');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant flex-shrink-0">
        <h2 className="font-semibold text-sm text-on-surface">AI Assistant</h2>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
          ONLINE
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
        {displayMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <span className="material-symbols-outlined text-[48px] text-outline">forum</span>
            <p className="text-sm text-on-surface-variant">
              Describe a circuit you'd like to build — e.g.{' '}
              <span className="font-medium text-on-surface">"Blink an LED with Arduino"</span>
            </p>
            <button
              onClick={handleLoadDemo}
              className="mt-2 px-4 py-2 bg-secondary-container/20 hover:bg-secondary-container/40 text-secondary border border-secondary-container/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">school</span>
              Try Demo Tutorial
            </button>
          </div>
        )}

        {displayMessages.map((msg) => {
          const isAssistant = msg.role === 'assistant';
          return (
            <div key={msg.id} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed shadow-sm ${
                  isAssistant
                    ? `bg-surface-container text-on-surface rounded-tl-none ${msg.isImportant ? 'border-l-4 border-primary' : ''}`
                    : 'bg-primary text-on-primary rounded-tr-none'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p
                  className={`text-[10px] mt-1 tracking-wide uppercase ${
                    isAssistant ? 'text-outline' : 'text-blue-200'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface-container rounded-xl rounded-tl-none px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-2 h-2 rounded-full bg-outline animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {imageGenStatus && (
          <div className="flex justify-start">
            <div className="bg-blue-50 border border-blue-200 rounded-xl rounded-tl-none px-4 py-2 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                {imageGenStatus}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-outline-variant bg-white">
        {/* Generate Videos button when project exists but no videos */}
        {project && !imageGenStatus && !project.steps.some(s => s.referenceVideo) && (
          <button
            onClick={() => generateVideosForProject(project)}
            className="w-full mb-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">movie</span>
            Generate Tutorial Videos
          </button>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              project
                ? 'Ask a follow-up question...'
                : 'Describe a circuit to build...'
            }
            rows={2}
            disabled={isLoading}
            className="flex-1 bg-surface-container-low rounded-lg px-3 py-2 text-sm text-on-surface resize-none outline-none focus:ring-2 focus:ring-primary/30 placeholder-outline disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-9 h-9 flex items-center justify-center bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
