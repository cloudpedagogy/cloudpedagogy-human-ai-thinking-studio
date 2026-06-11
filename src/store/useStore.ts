import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PatternPack, ThinkingPattern, UserSession } from '../types';
import { corePack } from '../data/corePack';

interface AppState {
  // Patterns Library
  patterns: ThinkingPattern[];
  packs: PatternPack[];
  
  // User Data
  sessions: UserSession[];
  
  // Active State
  activeSessionId: string | null;
  
  // Actions
  addPattern: (pattern: ThinkingPattern) => void;
  updatePattern: (id: string, updates: Partial<ThinkingPattern>) => void;
  deletePattern: (id: string) => void;
  
  importPack: (pack: PatternPack, strategy: 'keep' | 'replace' | 'merge') => void;
  restoreCorePack: () => void;
  
  createSession: (patternId: string) => string;
  updateSession: (sessionId: string, updates: Partial<UserSession>) => void;
  updateSessionResponses: (sessionId: string, responses: Record<string, string>) => void;
  updateSessionReflections: (sessionId: string, reflections: Record<string, string>) => void;
  updateSessionNotes: (sessionId: string, notes: string) => void;
  setActiveSession: (sessionId: string | null) => void;
  deleteSession: (sessionId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      patterns: [...corePack.patterns],
      packs: [corePack],
      sessions: [],
      activeSessionId: null,

      addPattern: (pattern) => 
        set((state) => ({ patterns: [...state.patterns, pattern] })),

      updatePattern: (id, updates) =>
        set((state) => ({
          patterns: state.patterns.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deletePattern: (id) =>
        set((state) => ({
          patterns: state.patterns.filter((p) => p.id !== id),
        })),

      importPack: (pack, strategy) => 
        set((state) => {
          let newPatterns = [...state.patterns];
          
          if (strategy === 'replace') {
            newPatterns = [...pack.patterns];
          } else if (strategy === 'merge') {
            const existingIds = new Set(newPatterns.map(p => p.id));
            pack.patterns.forEach(p => {
              if (!existingIds.has(p.id)) {
                newPatterns.push(p);
              } else {
                // If ID exists, overwrite it with the imported one
                newPatterns = newPatterns.map(existing => existing.id === p.id ? p : existing);
              }
            });
          } else if (strategy === 'keep') {
            // Keep existing, only add new IDs
            const existingIds = new Set(newPatterns.map(p => p.id));
            pack.patterns.forEach(p => {
              if (!existingIds.has(p.id)) {
                newPatterns.push(p);
              }
            });
          }

          // Check if pack is already in list
          const existingPackIndex = state.packs.findIndex(p => p.pack_name === pack.pack_name);
          const newPacks = [...state.packs];
          if (existingPackIndex >= 0) {
            newPacks[existingPackIndex] = pack;
          } else {
            newPacks.push(pack);
          }

          return { patterns: newPatterns, packs: newPacks };
        }),

      restoreCorePack: () =>
        set((state) => {
          const coreIds = new Set(corePack.patterns.map(p => p.id));
          const withoutCore = state.patterns.filter(p => !coreIds.has(p.id));
          return { patterns: [...corePack.patterns, ...withoutCore] };
        }),

      createSession: (patternId) => {
        const id = crypto.randomUUID();
        const newSession: UserSession = {
          id,
          patternId,
          timestamp: Date.now(),
          decision_context: { problem: '', options: '', why_matters: '' },
          notes: '',
          responses: {},
          stakeholder_responses: {},
          second_order_responses: {},
          reflections: {},
          confidence_level: null,
          confidence_justification: '',
          confidence_responses: {}
        };
        set((state) => ({ 
          sessions: [newSession, ...state.sessions],
          activeSessionId: id
        }));
        return id;
      },

      updateSession: (sessionId: string, updates: Partial<UserSession>) => 
        set((state) => ({
          sessions: state.sessions.map((s) => 
            s.id === sessionId ? { ...s, ...updates } : s
          )
        })),

      updateSessionResponses: (sessionId, responses) =>
        set((state) => ({
          sessions: state.sessions.map((s) => 
            s.id === sessionId ? { ...s, responses } : s
          )
        })),

      updateSessionReflections: (sessionId, reflections) =>
        set((state) => ({
          sessions: state.sessions.map((s) => 
            s.id === sessionId ? { ...s, reflections } : s
          )
        })),

      updateSessionNotes: (sessionId, notes) =>
        set((state) => ({
          sessions: state.sessions.map((s) => 
            s.id === sessionId ? { ...s, notes } : s
          )
        })),

      setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),
      
      deleteSession: (sessionId) => 
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId
        }))
    }),
    {
      name: 'cloudpedagogy-thinking-studio-storage',
    }
  )
);
