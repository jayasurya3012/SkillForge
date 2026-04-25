import { useStore } from '../../store';
import type { ProjectStatus } from '../../types';

const STATUS_STYLE: Record<ProjectStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  'in-progress': 'bg-blue-50 text-blue-700',
  complete: 'bg-emerald-50 text-emerald-700',
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: 'Draft',
  'in-progress': 'In Progress',
  complete: 'Complete',
};

const MENU_ITEMS = ['File', 'Edit', 'Simulation', 'View', 'Help'] as const;

export function TopAppBar() {
  const { project, activeMenu, setActiveMenu, isSimulating, setIsSimulating, simulationResult } = useStore();
  const status: ProjectStatus = project
    ? project.steps.length === 0
      ? 'draft'
      : 'in-progress'
    : 'draft';

  const hasPoweredComponents = simulationResult
    ? [...simulationResult.componentStates.values()].some((s) => s.isPowered)
    : false;

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-outline-variant shadow-sm z-50 flex items-center px-4 gap-3">
      {/* Brand */}
      <span className="font-bold text-lg tracking-tight text-on-surface select-none">SkillForge</span>
      <div className="w-px h-5 bg-outline-variant" />

      {/* Project name + status */}
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-sm text-on-surface">
          {project?.title ?? 'New Project'}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
          {STATUS_LABEL[status]}
        </span>
        {isSimulating && hasPoweredComponents && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 animate-pulse">
            ⚡ Circuit active
          </span>
        )}
      </div>
      <div className="w-px h-5 bg-outline-variant" />

      {/* Menu bar */}
      <nav className="flex items-center gap-1">
        {MENU_ITEMS.map((item) => (
          <button
            key={item}
            onClick={() => setActiveMenu(activeMenu === item ? null : item)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              activeMenu === item
                ? 'text-primary border-b-2 border-primary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <button
        onClick={() => setIsSimulating(!isSimulating)}
        className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-lg transition-all shadow-sm ${
          isSimulating
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-primary text-on-primary hover:bg-primary-container'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">
          {isSimulating ? 'stop' : 'play_arrow'}
        </span>
        {isSimulating ? 'Stop Simulation' : 'Run Simulation'}
      </button>
      {[
        { icon: 'save', label: 'Save' },
        { icon: 'picture_as_pdf', label: 'Export PDF' },
        { icon: 'settings', label: 'Settings' },
        { icon: 'account_circle', label: 'Account' },
      ].map(({ icon, label }) => (
        <button
          key={icon}
          title={label}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </button>
      ))}
    </header>
  );
}
