import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, ShieldCheck, RefreshCw, Layers } from 'lucide-react';
import type { PatternPack } from '../../types';

interface ImportStrategyModalProps {
  isOpen: boolean;
  pack: PatternPack | null;
  warnings?: string[];
  currentPatternsCount: number;
  onConfirm: (strategy: 'keep' | 'merge' | 'replace') => void;
  onCancel: () => void;
}

export const ImportStrategyModal: React.FC<ImportStrategyModalProps> = ({
  isOpen,
  pack,
  warnings = [],
  currentPatternsCount,
  onConfirm,
  onCancel,
}) => {
  const [strategy, setStrategy] = useState<'keep' | 'merge' | 'replace'>('merge');
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle Escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !pack) return null;

  const handleCancel = () => {
    setStrategy('merge');
    setReplaceConfirmed(false);
    onCancel();
  };

  const handleConfirm = () => {
    if (strategy === 'replace' && !replaceConfirmed) {
      return;
    }
    const chosenStrategy = strategy;
    setStrategy('merge');
    setReplaceConfirmed(false);
    onConfirm(chosenStrategy);
  };

  const isConfirmDisabled = strategy === 'replace' && !replaceConfirmed;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
      ref={modalRef}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <div className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">
              Pattern Pack Import
            </div>
            <h2 id="import-dialog-title" className="text-xl font-bold text-slate-900 dark:text-white">
              {pack.pack_name}
            </h2>
            <p className="text-xs text-slate-500">
              Version {pack.version} • {pack.patterns.length} pattern{pack.patterns.length === 1 ? '' : 's'} to import
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Cancel and close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Warnings / Notes */}
        {warnings.length > 0 && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
            <div className="font-bold mb-1">Notice:</div>
            <ul className="list-disc list-inside space-y-0.5">
              {warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Strategy Options */}
        <div className="p-6 space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Select an import strategy:
          </p>

          {/* Merge option */}
          <label
            className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              strategy === 'merge'
                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <input
              type="radio"
              name="import-strategy"
              value="merge"
              checked={strategy === 'merge'}
              onChange={() => setStrategy('merge')}
              className="mt-1 text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <RefreshCw size={16} className="text-primary-600" /> Merge & Update Existing
                <span className="text-[10px] bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-semibold px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Updates existing patterns if an imported ID matches, and adds all new patterns. Unrelated patterns remain
                intact.
              </p>
            </div>
          </label>

          {/* Keep option */}
          <label
            className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              strategy === 'keep'
                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <input
              type="radio"
              name="import-strategy"
              value="keep"
              checked={strategy === 'keep'}
              onChange={() => setStrategy('keep')}
              className="mt-1 text-primary-600 focus:ring-primary-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <ShieldCheck size={16} className="text-green-600" /> Keep Existing (Add New Only)
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Only imports patterns with new IDs. All existing pattern definitions in your library are kept strictly
                untouched.
              </p>
            </div>
          </label>

          {/* Replace option */}
          <label
            className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              strategy === 'replace'
                ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <input
              type="radio"
              name="import-strategy"
              value="replace"
              checked={strategy === 'replace'}
              onChange={() => setStrategy('replace')}
              className="mt-1 text-red-600 focus:ring-red-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <Layers size={16} className="text-red-600" /> Replace Entire Pattern Library
                <span className="text-[10px] bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-semibold px-2 py-0.5 rounded-full">
                  Destructive to Library
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Replaces your active library ({currentPatternsCount} patterns) with the {pack.patterns.length} patterns
                from this pack. (Saved workspace sessions remain preserved).
              </p>
            </div>
          </label>

          {/* Explicit confirmation checkbox if replace is selected */}
          {strategy === 'replace' && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-xs text-red-900 dark:text-red-200 animate-in fade-in duration-150">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={18} className="shrink-0 text-red-600 mt-0.5" />
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceConfirmed}
                    onChange={(e) => setReplaceConfirmed(e.target.checked)}
                    className="mt-0.5 text-red-600 focus:ring-red-500 rounded"
                  />
                  <span>
                    I confirm that I want to replace my current {currentPatternsCount} patterns with this pack. I understand
                    that unreferenced library patterns will be removed.
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            ref={confirmBtnRef}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`px-5 py-2 text-sm font-bold text-white rounded-lg transition-colors shadow-sm ${
              strategy === 'replace'
                ? 'bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {strategy === 'replace' ? 'Replace Library' : 'Import Patterns'}
          </button>
        </div>
      </div>
    </div>
  );
};
