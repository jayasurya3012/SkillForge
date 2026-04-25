import { useState, useCallback } from 'react';
import { useStore } from '../../store';
import { componentLibrary } from '../../services/ComponentLibrary';
import type { ComponentCategory, ComponentDefinition } from '../../types';
import { simulatorEngine } from '../../services/SimulatorEngine';

const CATEGORIES: Array<{ id: ComponentCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'boards', label: 'Boards' },
  { id: 'passives', label: 'Passives' },
  { id: 'sensors', label: 'Sensors' },
  { id: 'actuators', label: 'Actuators' },
  { id: 'wires', label: 'Wires' },
];

export function ComponentLibraryDrawer() {
  const { project, simulatorState, setSimulatorState } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ComponentCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const allComponents = project
    ? componentLibrary.getForProject(project)
    : componentLibrary.getAll();

  const filtered = allComponents.filter((c) => {
    const matchCat = activeCategory === 'all' || c.category === activeCategory;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleDrop = useCallback(
    (def: ComponentDefinition) => {
      // Position centered on workbench (maps to 3D: x/50, y/50)
    const placed = simulatorEngine.placeComponent(def, {
        x: (Math.random() - 0.5) * 500,
        y: (Math.random() - 0.5) * 300,
      });
      setSimulatorState({
        ...simulatorState,
        nodes: [...simulatorState.nodes, placed],
      });
    },
    [simulatorState, setSimulatorState],
  );

  return (
    <div
      className={`fixed bottom-0 left-16 right-0 z-50 transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-2.25rem)]'
      }`}
    >
      {/* Tab trigger */}
      <div className="flex justify-center">
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="flex items-center gap-1.5 bg-white border border-outline-variant border-b-0 rounded-t-xl px-5 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface shadow-sm transition-colors"
        >
          <span
            className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          >
            keyboard_double_arrow_up
          </span>
          Component Library
        </button>
      </div>

      {/* Drawer body */}
      <div className="h-64 bg-white border-t border-outline-variant shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex flex-col">
        {/* Drawer header */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-outline-variant flex-shrink-0">
          <span className="font-semibold text-sm text-on-surface">Component Library</span>

          {/* Category tabs */}
          <div className="flex gap-1">
            {CATEGORIES.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveCategory(id as ComponentCategory | 'all')}
                className={`text-xs px-3 py-1 rounded-full transition-colors font-medium ${
                  activeCategory === id
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="flex items-center gap-2 bg-slate-50 border border-outline-variant rounded-full px-3 py-1">
            <span className="material-symbols-outlined text-[16px] text-outline">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components…"
              className="bg-transparent text-xs outline-none text-on-surface placeholder-outline w-32"
            />
          </div>
        </div>

        {/* Component grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-6 gap-2">
            {filtered.map((comp) => (
              <ComponentCard key={comp.id} component={comp} onAdd={handleDrop} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-6 flex items-center justify-center py-8 text-outline text-sm">
                No components match your search.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComponentCard({
  component,
  onAdd,
}: {
  component: ComponentDefinition;
  onAdd: (c: ComponentDefinition) => void;
}) {
  return (
    <button
      onClick={() => onAdd(component)}
      draggable
      className="flex flex-col items-center gap-1.5 bg-slate-50 border border-outline-variant rounded-xl p-2 hover:border-primary hover:bg-blue-50 active:scale-95 transition-all cursor-grab group"
      title={`Add ${component.name}`}
    >
      <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-outline-variant/50 group-hover:border-primary/30">
        <span className="material-symbols-outlined text-[28px] text-primary">{component.icon}</span>
      </div>
      <span className="font-mono font-bold text-[9px] uppercase tracking-wider text-on-surface-variant text-center leading-tight">
        {component.name}
      </span>
    </button>
  );
}
