import { TopAppBar } from './components/layout/TopAppBar';
import { SideNavRail } from './components/layout/SideNavRail';
import { AIAssistantPanel } from './components/chat/AIAssistantPanel';
import { SimulatorCanvas3D } from './components/simulator/SimulatorCanvas3D';
import { StepInstructionsPanel } from './components/steps/StepInstructionsPanel';
import { ComponentLibraryDrawer } from './components/library/ComponentLibraryDrawer';

export default function App() {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden font-sans">
      <TopAppBar />

      <div className="flex flex-1 overflow-hidden mt-14">
        <SideNavRail />

        {/* Three-column workspace */}
        <main className="flex flex-1 overflow-hidden ml-16 mb-9">
          {/* Left — AI Assistant (25%) */}
          <section className="w-[25%] min-w-[260px] max-w-[360px] flex-shrink-0 border-r border-outline-variant bg-white overflow-hidden flex flex-col">
            <AIAssistantPanel />
          </section>

          {/* Center — Simulator Canvas (flex-1) */}
          <section className="flex-1 overflow-hidden relative">
            <SimulatorCanvas3D />
          </section>

          {/* Right — Step Instructions (25%) */}
          <section className="w-[25%] min-w-[240px] max-w-[340px] flex-shrink-0 border-l border-outline-variant bg-white overflow-hidden flex flex-col">
            <StepInstructionsPanel />
          </section>
        </main>
      </div>

      <ComponentLibraryDrawer />
    </div>
  );
}
