import React from 'react';
import { NavLink } from 'react-router-dom';
import { Library, Settings, Compass, HelpCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const Sidebar: React.FC = () => {
  const patterns = useStore(state => state.patterns);
  const categories = Array.from(new Set(patterns.map(p => p.category))).sort();

  return (
    <div className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col transition-colors duration-200 no-print">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col gap-1">
          <div className="text-xs font-bold text-slate-500 tracking-wider uppercase">CloudPedagogy</div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-900 dark:text-white leading-tight">Human-AI<br/>Thinking Studio</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <nav className="space-y-1">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <Compass size={20} />
            <span>Guide</span>
          </NavLink>

          <NavLink
            to="/registry"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <Library size={20} />
            <span>Pattern Registry</span>
          </NavLink>

          <div className="pt-6 pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Categories
          </div>

          <div className="space-y-0.5">
            {categories.map(cat => (
              <NavLink
                key={cat}
                to={`/registry?category=${encodeURIComponent(cat)}`}
                className="block px-3 py-1.5 text-sm rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                {cat}
              </NavLink>
            ))}
          </div>

          <div className="pt-6 pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Workspace
          </div>
          
          <ActiveSessionLink />

        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
              isActive
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
        <button 
          onClick={() => alert("CloudPedagogy Capability Framework\n\nThink before you prompt. Evaluate before you act.")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
        >
          <HelpCircle size={20} />
          <span>About</span>
        </button>
      </div>
    </div>
  );
};

const ActiveSessionLink = () => {
  const activeSessionId = useStore(state => state.activeSessionId);
  const session = useStore(state => state.sessions.find(s => s.id === activeSessionId));
  const pattern = useStore(state => state.patterns.find(p => p.id === session?.patternId));

  if (!activeSessionId || !session || !pattern) {
    return (
      <div className="px-3 py-2 text-sm text-slate-500 italic">
        No active session
      </div>
    );
  }

  return (
    <NavLink
      to={`/workspace/${activeSessionId}`}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-primary-500 text-white shadow-md'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-primary-400'
        }`
      }
    >
      <div className="truncate">
        <span className="block font-bold truncate">{pattern.name}</span>
        <span className="block text-xs opacity-80">Working now...</span>
      </div>
    </NavLink>
  );
};
