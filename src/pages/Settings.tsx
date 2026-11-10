import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  Trash2,
  AlertTriangle,
  Info,
  Download,
  Upload,
  HardDrive,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { createStudioBackup, applyStudioRestore, safeDownloadFile } from '../utils/storageUtils';
import { validateStudioBackup } from '../utils/validation';
import { corePack } from '../data/corePack';

export const Settings: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessions = useStore((state) => state.sessions);
  const patterns = useStore((state) => state.patterns);
  const deleteSession = useStore((state) => state.deleteSession);
  const storageStatus = useStore((state) => state.storageStatus);
  const storageErrorMessage = useStore((state) => state.storageErrorMessage);

  const handleDeleteSession = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the workspace session for "${name}"?`)) {
      deleteSession(id);
    }
  };

  const handleExportBackup = () => {
    const state = useStore.getState();
    const backup = createStudioBackup(state);
    const dateStr = new Date().toISOString().split('T')[0];
    safeDownloadFile(
      JSON.stringify(backup, null, 2),
      `cloudpedagogy-studio-backup-${dateStr}.json`
    );
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawContent = event.target?.result as string;
        let parsed: unknown;
        try {
          parsed = JSON.parse(rawContent);
        } catch {
          alert('Failed to parse backup file: malformed JSON syntax.');
          return;
        }

        const validation = validateStudioBackup(parsed);
        if (!validation.valid || !validation.data) {
          const errorsList = validation.errors.slice(0, 5).join('\n• ');
          const extra = validation.errors.length > 5 ? `\n...and ${validation.errors.length - 5} more error(s)` : '';
          alert(`Backup rejected: the file does not match the CloudPedagogy Studio Backup schema:\n\n• ${errorsList}${extra}`);
          return;
        }

        const backup = validation.data;
        const patternCount = backup.data.patterns.length;
        const sessionCount = backup.data.sessions.length;
        const exportDate = new Date(backup.exportedAt).toLocaleString();

        const confirmed = window.confirm(
          `STUDIO RESTORE CONFIRMATION\n\nBackup details:\n• Exported: ${exportDate}\n• Patterns: ${patternCount}\n• Workspace Sessions: ${sessionCount}\n\nWARNING: Restoring will replace your current pattern library and reasoning workspaces with this backup.\n\nDo you want to proceed?`
        );

        if (!confirmed) return;

        const restoreResult = applyStudioRestore(backup.data);
        if (!restoreResult.success) {
          alert(`Restore failed: ${restoreResult.error || 'Could not safely apply backup.'}`);
          return;
        }

        alert(`Studio restored successfully! (${patternCount} patterns, ${sessionCount} sessions)`);
      } catch (err) {
        alert('An unexpected error occurred during restore: ' + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        'WARNING: This will delete ALL your local data, including custom patterns and workspace sessions. This cannot be undone.\n\nHave you exported a Studio Backup first?\n\nClick OK to permanently clear everything.'
      )
    ) {
      try {
        localStorage.removeItem('cloudpedagogy-thinking-studio-storage');
      } catch {
        // Ignore
      }
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-8 pb-24">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">Settings & Data</h1>

      {/* Storage Health Notice */}
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-6 mb-8">
        <div className="flex gap-3 items-start">
          <Info className="text-primary-600 dark:text-primary-400 mt-1 shrink-0" />
          <div className="flex-1">
            <h2 className="font-bold text-primary-900 dark:text-primary-100 mb-1">Local-First Privacy</h2>
            <p className="text-primary-800 dark:text-primary-200 text-sm leading-relaxed mb-3">
              This application operates entirely in your browser. No data is sent to any server. Your patterns, sessions,
              and reflections are stored securely in your browser's LocalStorage. If you clear browser cookies or switch devices,
              use the <strong>Studio Backup</strong> feature below to transfer your work.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary-700 dark:text-primary-300">
              <HardDrive size={16} />
              <span>
                Storage Status:{' '}
                {storageStatus === 'saved' || storageStatus === 'idle' ? (
                  <span className="text-green-600 dark:text-green-400 inline-flex items-center gap-1 font-bold">
                    <CheckCircle2 size={14} /> Normal (Local-first active)
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-1 font-bold">
                    <ShieldAlert size={14} /> {storageStatus} ({storageErrorMessage || 'Storage restricted'})
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Full Studio Backup & Restore */}
      <div className="mb-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white flex items-center gap-2">
          <HardDrive className="text-primary-600" size={22} /> Studio Backup & Transfer
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
          Create a full, portable JSON backup of your entire studio — including your pattern library, imported packs, custom
          patterns, and all reasoning sessions with your notes.
        </p>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm"
            aria-label="Export complete studio backup as JSON"
          >
            <Download size={18} /> Export Studio Backup (JSON)
          </button>

          <label
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors shadow-sm text-sm cursor-pointer"
            aria-label="Restore complete studio backup from JSON"
          >
            <Upload size={18} /> Restore Studio Backup
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleRestoreBackup}
            />
          </label>
        </div>
      </div>

      {/* Your Workspaces */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-slate-200 dark:border-slate-800">Your Workspaces</h2>

        {sessions.length === 0 ? (
          <p className="text-slate-500 italic">No active workspaces.</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const pattern =
                session.pattern_snapshot ||
                patterns.find((p) => p.id === session.patternId) ||
                corePack.patterns.find((p) => p.id === session.patternId);

              const isMissing = !pattern;
              const displayName = pattern ? pattern.name : `Unlinked Pattern (${session.patternId})`;

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/workspace/${session.id}`}
                        className="font-bold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center gap-1.5 transition-colors"
                      >
                        {displayName} <ExternalLink size={14} className="opacity-70" />
                      </Link>
                      {isMissing && (
                        <span className="text-[10px] uppercase font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                          Pattern Missing
                        </span>
                      )}
                      {session.pattern_snapshot && (
                        <span className="text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                          Snapshot Saved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {session.decision_context?.problem
                        ? `Problem: ${session.decision_context.problem.slice(0, 80)}${session.decision_context.problem.length > 80 ? '...' : ''} • `
                        : ''}
                      Created: {new Date(session.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteSession(session.id, displayName)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                    aria-label={`Delete workspace session for ${displayName}`}
                    title="Delete session"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div>
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-slate-200 dark:border-slate-800 text-red-600">
          Danger Zone
        </h2>
        <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 rounded-xl p-6">
          <div className="flex gap-4 items-start">
            <AlertTriangle className="text-red-500 shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-lg mb-1 text-slate-900 dark:text-white">Clear All Data</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                This will reset your browser's local library and delete all saved workspaces and settings. Export a Studio
                Backup before doing this to ensure you have a copy of your work.
              </p>
              <button
                onClick={handleClearAll}
                className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                aria-label="Clear all local data"
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
