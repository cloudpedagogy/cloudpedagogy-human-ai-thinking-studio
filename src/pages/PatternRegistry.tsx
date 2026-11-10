import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Search, Plus, Edit, Copy, Trash2, Download, Upload, Filter, Save, X } from 'lucide-react';
import type { PatternPack, ThinkingPattern } from '../types';
import { downloadJsonPack } from '../utils/exportUtils';
import { validatePatternPack } from '../utils/validation';
import { generateUniqueId } from '../utils/idUtils';
import { ImportStrategyModal } from '../components/pattern/ImportStrategyModal';

export const PatternRegistry: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const patterns = useStore((state) => state.patterns);
  const addPattern = useStore((state) => state.addPattern);
  const updatePattern = useStore((state) => state.updatePattern);
  const deletePattern = useStore((state) => state.deletePattern);
  const importPack = useStore((state) => state.importPack);
  const restoreCorePack = useStore((state) => state.restoreCorePack);

  const [search, setSearch] = useState('');
  const filterCategory = searchParams.get('category') || 'All';

  // Import modal state
  const [importModalData, setImportModalData] = useState<{
    pack: PatternPack;
    warnings: string[];
  } | null>(null);

  const handleFilterChange = (cat: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (cat === 'All') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', cat);
    }
    setSearchParams(nextParams);
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ThinkingPattern> | null>(null);

  const categories = ['All', ...Array.from(new Set(patterns.map((p) => p.category))).sort()];

  const filteredPatterns = patterns.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.purpose.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (pattern: ThinkingPattern) => {
    setEditingId(pattern.id);
    setEditForm({ ...pattern });
  };

  const handleSave = () => {
    if (editingId && editForm) {
      if (patterns.find((p) => p.id === editingId)) {
        updatePattern(editingId, editForm);
      } else {
        addPattern(editForm as ThinkingPattern);
      }
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleCreate = () => {
    const newId = generateUniqueId('custom');
    const newPattern: ThinkingPattern = {
      id: newId,
      name: 'New Thinking Pattern',
      category: 'Other',
      purpose: '',
      when_to_use: [],
      thinking_questions: [],
      stakeholder_questions: [],
      second_order_questions: [],
      ai_prompts: [],
      reflection_questions: [],
      tags: [],
      confidence_questions: [],
      metadata: { author: '', version: '', source: '' },
    };
    setEditingId(newId);
    setEditForm(newPattern);
  };

  const handleDuplicate = (pattern: ThinkingPattern) => {
    const newId = generateUniqueId(`${pattern.id}-copy`);
    const newPattern: ThinkingPattern = {
      ...pattern,
      id: newId,
      name: `${pattern.name} (Copy)`,
    };
    addPattern(newPattern);
  };

  const handleExportPack = () => {
    const customPack = {
      pack_name: 'My Custom Pack',
      version: '1.0',
      patterns: patterns,
    };
    downloadJsonPack(customPack, 'my-thinking-pack.json');
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          alert('Failed to parse file: malformed JSON syntax.');
          return;
        }

        const validation = validatePatternPack(parsed);
        if (!validation.valid || !validation.data) {
          const displayedErrors = validation.errors.slice(0, 5).join('\n• ');
          const extra = validation.errors.length > 5 ? `\n...and ${validation.errors.length - 5} more error(s)` : '';
          alert(`Import rejected: the file does not match the Thinking Pattern schema:\n\n• ${displayedErrors}${extra}`);
          return;
        }

        // Open accessible import strategy dialog
        setImportModalData({
          pack: validation.data,
          warnings: validation.warnings,
        });
      } catch (error) {
        alert('An unexpected error occurred during import: ' + (error instanceof Error ? error.message : String(error)));
      }
    };
    reader.readAsText(file);
    // Reset file input so re-selecting the same file triggers onChange
    e.target.value = '';
  };

  const handleConfirmImport = (strategy: 'keep' | 'merge' | 'replace') => {
    if (!importModalData) return;

    const { pack, warnings } = importModalData;
    importPack(pack, strategy);
    setImportModalData(null);

    const warningsMsg = warnings.length > 0 ? `\n\nNotes:\n${warnings.join('\n')}` : '';
    alert(`Successfully imported "${pack.pack_name}" using '${strategy}' strategy! (${pack.patterns.length} pattern${pack.patterns.length === 1 ? '' : 's'})${warningsMsg}`);
  };

  // Helper to parse line-separated lists for the simple inline editor
  const handleArrayChange = (field: keyof ThinkingPattern, value: string) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value.split('\n').filter((s) => s.trim() !== ''),
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 pb-24">
      {/* Accessible Import Strategy Dialog */}
      <ImportStrategyModal
        isOpen={importModalData !== null}
        pack={importModalData?.pack || null}
        warnings={importModalData?.warnings}
        currentPatternsCount={patterns.length}
        onConfirm={handleConfirmImport}
        onCancel={() => setImportModalData(null)}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Pattern Registry</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your thinking patterns. {patterns.length} available.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPack}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium"
            aria-label="Export pattern pack as JSON"
          >
            <Download size={16} /> Export Pack
          </button>
          <label
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium cursor-pointer"
            aria-label="Import pattern pack from JSON"
          >
            <Upload size={16} /> Import Pack
            <input type="file" accept=".json" className="hidden" onChange={handleImportFileSelect} />
          </label>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm text-sm font-medium"
            aria-label="Create new pattern"
          >
            <Plus size={16} /> New Pattern
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            id="pattern-search-input"
            type="text"
            placeholder="Search patterns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            aria-label="Search patterns by name or purpose"
          />
        </div>
        <div className="relative w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <select
            id="category-filter-select"
            value={filterCategory}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
            aria-label="Filter patterns by category"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inline Editor or List */}
      {editingId ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold">Edit Pattern</h2>
            <button
              onClick={() => setEditingId(null)}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1 rounded-md"
              aria-label="Close pattern editor"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="pattern-name-input" className="block text-sm font-bold mb-1">
                  Name
                </label>
                <input
                  id="pattern-name-input"
                  value={editForm?.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              <div>
                <label htmlFor="pattern-category-input" className="block text-sm font-bold mb-1">
                  Category
                </label>
                <input
                  id="pattern-category-input"
                  value={editForm?.category || ''}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
              <div>
                <label htmlFor="pattern-purpose-input" className="block text-sm font-bold mb-1">
                  Purpose
                </label>
                <textarea
                  id="pattern-purpose-input"
                  value={editForm?.purpose || ''}
                  onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                  className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-none"
                />
              </div>
              <div>
                <label htmlFor="pattern-when-to-use-input" className="block text-sm font-bold mb-1">
                  When to Use (One per line)
                </label>
                <textarea
                  id="pattern-when-to-use-input"
                  value={editForm?.when_to_use?.join('\n') || ''}
                  onChange={(e) => handleArrayChange('when_to_use', e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-none"
                />
              </div>
              <div>
                <label htmlFor="pattern-tags-input" className="block text-sm font-bold mb-1">
                  Tags (One per line)
                </label>
                <textarea
                  id="pattern-tags-input"
                  value={editForm?.tags?.join('\n') || ''}
                  onChange={(e) => handleArrayChange('tags', e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-y"
                />
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-sm mb-2">Metadata (Optional)</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="pattern-author-input" className="block text-xs font-bold mb-1">
                      Author
                    </label>
                    <input
                      id="pattern-author-input"
                      value={editForm?.metadata?.author || ''}
                      onChange={(e) =>
                        editForm &&
                        setEditForm({
                          ...editForm,
                          metadata: { ...editForm.metadata, author: e.target.value },
                        })
                      }
                      className="w-full p-2 text-sm border rounded-md dark:bg-slate-900 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label htmlFor="pattern-version-input" className="block text-xs font-bold mb-1">
                      Version
                    </label>
                    <input
                      id="pattern-version-input"
                      value={editForm?.metadata?.version || ''}
                      onChange={(e) =>
                        editForm &&
                        setEditForm({
                          ...editForm,
                          metadata: { ...editForm.metadata, version: e.target.value },
                        })
                      }
                      className="w-full p-2 text-sm border rounded-md dark:bg-slate-900 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label htmlFor="pattern-source-input" className="block text-xs font-bold mb-1">
                      Source
                    </label>
                    <input
                      id="pattern-source-input"
                      value={editForm?.metadata?.source || ''}
                      onChange={(e) =>
                        editForm &&
                        setEditForm({
                          ...editForm,
                          metadata: { ...editForm.metadata, source: e.target.value },
                        })
                      }
                      className="w-full p-2 text-sm border rounded-md dark:bg-slate-900 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="pattern-thinking-questions-input" className="block text-sm font-bold mb-1">
                  Thinking Questions (One per line)
                </label>
                <textarea
                  id="pattern-thinking-questions-input"
                  value={editForm?.thinking_questions?.join('\n') || ''}
                  onChange={(e) => handleArrayChange('thinking_questions', e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-32 resize-y"
                />
              </div>
              <div>
                <label htmlFor="pattern-stakeholder-questions-input" className="block text-sm font-bold mb-1">
                  Stakeholder Lens (One per line)
                </label>
                <textarea
                  id="pattern-stakeholder-questions-input"
                  value={editForm?.stakeholder_questions?.join('\n') || ''}
                  onChange={(e) => handleArrayChange('stakeholder_questions', e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-y"
                />
              </div>
              <div>
                <label htmlFor="pattern-second-order-questions-input" className="block text-sm font-bold mb-1">
                  Second-Order Effects (One per line)
                </label>
                <textarea
                  id="pattern-second-order-questions-input"
                  value={editForm?.second_order_questions?.join('\n') || ''}
                  onChange={(e) => handleArrayChange('second_order_questions', e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-y"
                />
              </div>
              <div>
                <label htmlFor="pattern-ai-prompts-input" className="block text-sm font-bold mb-1">
                  AI Prompts (One per line)
                </label>
                <textarea
                  id="pattern-ai-prompts-input"
                  value={editForm?.ai_prompts?.join('\n') || ''}
                  onChange={(e) => handleArrayChange('ai_prompts', e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-y"
                />
              </div>
              <div>
                <label htmlFor="pattern-reflection-questions-input" className="block text-sm font-bold mb-1">
                  Reflection Questions (One per line)
                </label>
                <textarea
                  id="pattern-reflection-questions-input"
                  value={editForm?.reflection_questions?.join('\n') || ''}
                  onChange={(e) => handleArrayChange('reflection_questions', e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-y"
                />
              </div>
              <div>
                <label htmlFor="pattern-confidence-questions-input" className="block text-sm font-bold mb-1">
                  Confidence Questions (One per line)
                </label>
                <textarea
                  id="pattern-confidence-questions-input"
                  value={editForm?.confidence_questions?.join('\n') || ''}
                  onChange={(e) => handleArrayChange('confidence_questions', e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-y"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setEditingId(null)}
              className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <Save size={18} /> Save Pattern
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatterns.map((pattern) => (
            <div
              key={pattern.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary-300 transition-colors flex flex-col h-full group"
            >
              <div className="flex-1">
                <div className="text-xs font-bold text-primary-600 mb-2 uppercase tracking-wide">
                  {pattern.category}
                </div>
                <h2 className="text-lg font-bold mb-2 leading-tight text-slate-900 dark:text-white">
                  {pattern.name}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                  {pattern.purpose}
                </p>
              </div>
              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(pattern)}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-md transition-colors"
                    title="Edit pattern"
                    aria-label={`Edit ${pattern.name}`}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(pattern)}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-md transition-colors"
                    title="Duplicate pattern"
                    aria-label={`Duplicate ${pattern.name}`}
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${pattern.name}"?`)) {
                      deletePattern(pattern.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                  title="Delete pattern"
                  aria-label={`Delete ${pattern.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {filteredPatterns.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              No patterns found matching your search.
            </div>
          )}
        </div>
      )}

      {!editingId && (
        <div className="mt-12 text-center border-t border-slate-200 dark:border-slate-800 pt-8">
          <p className="text-slate-500 text-sm mb-4">Messed up the built-in patterns?</p>
          <button
            onClick={() => {
              if (
                window.confirm(
                  'This will restore the original CloudPedagogy Core Pack patterns. Any custom changes to core patterns will be lost. Continue?'
                )
              ) {
                restoreCorePack();
                alert('Core pack restored.');
              }
            }}
            className="text-primary-600 hover:text-primary-700 underline text-sm font-medium"
          >
            Restore CloudPedagogy Core Pack
          </button>
        </div>
      )}
    </div>
  );
};
