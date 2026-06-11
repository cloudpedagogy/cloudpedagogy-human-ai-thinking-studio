import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Search, Plus, Edit, Copy, Trash2, Download, Upload, Filter, Save, X } from 'lucide-react';
import type { ThinkingPattern } from '../types';
import { downloadJsonPack } from '../utils/exportUtils';

export const PatternRegistry: React.FC = () => {
  const [searchParams] = useSearchParams();
  const patterns = useStore(state => state.patterns);
  const addPattern = useStore(state => state.addPattern);
  const updatePattern = useStore(state => state.updatePattern);
  const deletePattern = useStore(state => state.deletePattern);
  const importPack = useStore(state => state.importPack);
  const restoreCorePack = useStore(state => state.restoreCorePack);

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setFilterCategory(cat);
  }, [searchParams]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ThinkingPattern> | null>(null);

  const categories = ['All', ...Array.from(new Set(patterns.map(p => p.category)))];

  const filteredPatterns = patterns.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.purpose.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (pattern: ThinkingPattern) => {
    setEditingId(pattern.id);
    setEditForm({ ...pattern });
  };

  const handleSave = () => {
    if (editingId && editForm) {
      if (patterns.find(p => p.id === editingId)) {
        updatePattern(editingId, editForm);
      } else {
        addPattern(editForm as ThinkingPattern);
      }
      setEditingId(null);
      setEditForm(null);
    }
  };

  const handleCreate = () => {
    const newId = `custom-${Date.now()}`;
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
      metadata: { author: '', version: '', source: '' }
    };
    setEditingId(newId);
    setEditForm(newPattern);
  };

  const handleDuplicate = (pattern: ThinkingPattern) => {
    const newPattern = {
      ...pattern,
      id: `${pattern.id}-copy-${Date.now()}`,
      name: `${pattern.name} (Copy)`
    };
    addPattern(newPattern);
  };

  const handleExportPack = () => {
    const customPack = {
      pack_name: "My Custom Pack",
      version: "1.0",
      patterns: patterns
    };
    downloadJsonPack(customPack, "my-thinking-pack.json");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.patterns && Array.isArray(json.patterns)) {
          const strategy = window.prompt("Import Strategy: Type 'keep' (add new only), 'replace' (overwrite everything), or 'merge' (update existing & add new).", "merge");
          if (strategy === 'keep' || strategy === 'replace' || strategy === 'merge') {
            importPack(json, strategy);
            alert("Import successful!");
          }
        }
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  // Helper to parse comma-separated lists for the simple inline editor
  const handleArrayChange = (field: keyof ThinkingPattern, value: string) => {
    if (editForm) {
      setEditForm({
        ...editForm,
        [field]: value.split('\n').filter(s => s.trim() !== '')
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Pattern Registry</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your thinking patterns. {patterns.length} available.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportPack} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium">
            <Download size={16} /> Export Pack
          </button>
          <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium cursor-pointer">
            <Upload size={16} /> Import Pack
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={handleCreate} className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm text-sm font-medium">
            <Plus size={16} /> New Pattern
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search patterns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <div className="relative w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Inline Editor or List */}
      {editingId ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold">Edit Pattern</h2>
            <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-800"><X size={24} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Name</label>
                <input value={editForm?.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Category</label>
                <input value={editForm?.category || ''} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Purpose</label>
                <textarea value={editForm?.purpose || ''} onChange={e => setEditForm({ ...editForm, purpose: e.target.value })} className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">When to Use (One per line)</label>
                <textarea value={editForm?.when_to_use?.join('\n') || ''} onChange={e => handleArrayChange('when_to_use', e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Tags (One per line)</label>
                <textarea value={editForm?.tags?.join('\n') || ''} onChange={e => handleArrayChange('tags', e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-y" />
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-sm mb-2">Metadata (Optional)</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold mb-1">Author</label>
                    <input value={editForm?.metadata?.author || ''} onChange={e => editForm && setEditForm({ ...editForm, metadata: { ...editForm.metadata, author: e.target.value } })} className="w-full p-2 text-sm border rounded-md dark:bg-slate-900 dark:border-slate-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Version</label>
                    <input value={editForm?.metadata?.version || ''} onChange={e => editForm && setEditForm({ ...editForm, metadata: { ...editForm.metadata, version: e.target.value } })} className="w-full p-2 text-sm border rounded-md dark:bg-slate-900 dark:border-slate-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">Source</label>
                    <input value={editForm?.metadata?.source || ''} onChange={e => editForm && setEditForm({ ...editForm, metadata: { ...editForm.metadata, source: e.target.value } })} className="w-full p-2 text-sm border rounded-md dark:bg-slate-900 dark:border-slate-700" />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Thinking Questions (One per line)</label>
                <textarea value={editForm?.thinking_questions?.join('\n') || ''} onChange={e => handleArrayChange('thinking_questions', e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-32 resize-y" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Stakeholder Lens (One per line)</label>
                <textarea value={editForm?.stakeholder_questions?.join('\n') || ''} onChange={e => handleArrayChange('stakeholder_questions', e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-y" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Second-Order Effects (One per line)</label>
                <textarea value={editForm?.second_order_questions?.join('\n') || ''} onChange={e => handleArrayChange('second_order_questions', e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-y" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">AI Prompts (One per line)</label>
                <textarea value={editForm?.ai_prompts?.join('\n') || ''} onChange={e => handleArrayChange('ai_prompts', e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-y" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Reflection Questions (One per line)</label>
                <textarea value={editForm?.reflection_questions?.join('\n') || ''} onChange={e => handleArrayChange('reflection_questions', e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-y" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Confidence Questions (One per line)</label>
                <textarea value={editForm?.confidence_questions?.join('\n') || ''} onChange={e => handleArrayChange('confidence_questions', e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-900 dark:border-slate-700 h-24 resize-y" />
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button onClick={() => setEditingId(null)} className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"><Save size={18} /> Save Pattern</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatterns.map(pattern => (
            <div key={pattern.id} className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary-300 transition-colors flex flex-col h-full group">
              <div className="flex-1">
                <div className="text-xs font-bold text-primary-600 mb-2 uppercase tracking-wide">{pattern.category}</div>
                <h3 className="text-lg font-bold mb-2 leading-tight text-slate-900 dark:text-white">{pattern.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{pattern.purpose}</p>
              </div>
              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 justify-between">
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(pattern)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-md transition-colors" title="Edit">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDuplicate(pattern)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-md transition-colors" title="Duplicate">
                    <Copy size={16} />
                  </button>
                </div>
                <button 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this pattern?")) {
                      deletePattern(pattern.id);
                    }
                  }} 
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors" title="Delete">
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
              if (window.confirm("This will restore the original CloudPedagogy Core Pack patterns. Any custom changes to core patterns will be lost. Continue?")) {
                restoreCorePack();
                alert("Core pack restored.");
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
