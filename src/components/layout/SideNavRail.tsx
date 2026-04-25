import { useStore } from '../../store';
import type { NavTab } from '../../types';

interface NavItem {
  tab: NavTab;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { tab: 'assist', icon: 'forum', label: 'ASSIST' },
  { tab: 'comp', icon: 'inventory_2', label: 'COMP' },
  { tab: 'docs', icon: 'menu_book', label: 'DOCS' },
  { tab: 'test', icon: 'verified', label: 'TEST' },
];

export function SideNavRail() {
  const { activeTab, setActiveTab } = useStore();

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-16 bg-slate-50 border-r border-outline-variant flex flex-col items-center py-3 gap-1 z-40">
      {NAV_ITEMS.map(({ tab, icon, label }) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-full flex flex-col items-center justify-center py-3 gap-1 transition-colors relative ${
              isActive
                ? 'bg-blue-50 text-primary'
                : 'text-slate-400 hover:text-blue-500'
            }`}
          >
            {isActive && (
              <span className="absolute right-0 top-0 bottom-0 w-1 bg-primary rounded-l" />
            )}
            <span
              className={`material-symbols-outlined text-[22px] ${isActive ? 'material-symbols-filled' : ''}`}
            >
              {icon}
            </span>
            <span className="text-[9px] font-bold tracking-widest uppercase leading-none">
              {label}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
