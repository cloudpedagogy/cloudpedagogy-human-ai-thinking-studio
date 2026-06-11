import React from 'react';
import { useStore } from '../store/useStore';
import { Trash2, AlertTriangle, Info } from 'lucide-react';

export const Settings: React.FC = () => {
  const sessions = useStore(state => state.sessions);
  const deleteSession = useStore(state => state.deleteSession);
  const patterns = useStore(state => state.patterns);

  const handleDeleteSession = (id: string) => {
    if (window.confirm("Are you sure you want to delete this workspace session?")) {
      deleteSession(id);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("WARNING: This will delete ALL your local data, including custom patterns and workspace sessions. This cannot be undone. Are you sure?")) {
      localStorage.removeItem('cloudpedagogy-thinking-studio-storage');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-8 pb-24">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">Settings & Data</h1>
      
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-6 mb-12">
        <div className="flex gap-3 items-start">
          <Info className="text-primary-600 mt-1 shrink-0" />
          <div>
            <h3 className="font-bold text-primary-900 dark:text-primary-100 mb-1">Local-First Privacy</h3>
            <p className="text-primary-800 dark:text-primary-200 text-sm leading-relaxed">
              This application operates entirely in your browser. No data is sent to any server. Your patterns, sessions, and reflections are stored securely in your browser's LocalStorage. If you clear your browser data, your work will be lost unless you export it first.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-slate-200 dark:border-slate-800">Your Workspaces</h2>
        
        {sessions.length === 0 ? (
          <p className="text-slate-500 italic">No active workspaces.</p>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => {
              const pattern = patterns.find(p => p.id === session.patternId);
              return (
                <div key={session.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{pattern?.name || 'Unknown Pattern'}</h4>
                    <p className="text-xs text-slate-500">{new Date(session.timestamp).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteSession(session.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-slate-200 dark:border-slate-800 text-red-600">Danger Zone</h2>
        <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 rounded-xl p-6">
          <div className="flex gap-4 items-start">
            <AlertTriangle className="text-red-500 shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-lg mb-1 text-slate-900 dark:text-white">Clear All Data</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                This will instantly delete all patterns, workspace sessions, and settings from your browser. Export any custom packs before doing this.
              </p>
              <button 
                onClick={handleClearAll}
                className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
