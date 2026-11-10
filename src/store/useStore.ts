import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PatternPack, ThinkingPattern, UserSession, StudioBackupData } from '../types';
import { corePack } from '../data/corePack';
import { generateUniqueId } from '../utils/idUtils';
import {
  STUDIO_STORAGE_KEY,
  createSafeStorage,
  setStorageStatusListener,
  type StorageStatus,
} from '../utils/storageUtils';

export interface AppState {
  // Patterns Library
  patterns: ThinkingPattern[];
  packs: PatternPack[];

  // User Data
  sessions: UserSession[];

  // Active State
  activeSessionId: string | null;

  // Storage Operational State
  storageStatus: StorageStatus;
  storageErrorMessage: string | null;

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
  relinkSessionPattern: (sessionId: string, newPatternId: string) => void;
  setActiveSession: (sessionId: string | null) => void;
  deleteSession: (sessionId: string) => void;

  restoreStudioBackup: (backupData: StudioBackupData) => void;
  setStorageStatus: (status: StorageStatus, message?: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      // Connect storage status listener, preventing recursive updates
      setStorageStatusListener((status, msg) => {
        const current = get();
        if (current.storageStatus !== status || current.storageErrorMessage !== (msg || null)) {
          set({ storageStatus: status, storageErrorMessage: msg || null });
        }
      });

      return {
        patterns: [...corePack.patterns],
        packs: [corePack],
        sessions: [],
        activeSessionId: null,
        storageStatus: 'idle',
        storageErrorMessage: null,

        setStorageStatus: (status, message = null) =>
          set({ storageStatus: status, storageErrorMessage: message }),

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
            // Deterministically deduplicate incoming patterns by ID (last occurrence wins)
            const incomingMap = new Map<string, ThinkingPattern>();
            pack.patterns.forEach((p) => incomingMap.set(p.id, p));
            const deduplicatedIncoming = Array.from(incomingMap.values());

            let newPatterns: ThinkingPattern[];

            if (strategy === 'replace') {
              // Replaces the pattern library with the imported pack
              newPatterns = deduplicatedIncoming;
              return {
                patterns: newPatterns,
                packs: [pack],
              };
            }

            if (strategy === 'merge') {
              // Update existing patterns with matching IDs, append new ones
              const retainedExisting = state.patterns.map((existing) =>
                incomingMap.has(existing.id) ? incomingMap.get(existing.id)! : existing
              );
              const existingIdSet = new Set(state.patterns.map((p) => p.id));
              const completelyNew = deduplicatedIncoming.filter((p) => !existingIdSet.has(p.id));
              newPatterns = [...retainedExisting, ...completelyNew];
            } else {
              // 'keep': Only add patterns whose IDs do not already exist
              const existingIds = new Set(state.patterns.map((p) => p.id));
              const trulyNew = deduplicatedIncoming.filter((p) => !existingIds.has(p.id));
              newPatterns = [...state.patterns, ...trulyNew];
            }

            // Update packs registry
            const existingPackIndex = state.packs.findIndex((p) => p.pack_name === pack.pack_name);
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
            const coreIds = new Set(corePack.patterns.map((p) => p.id));
            const customPatterns = state.patterns.filter((p) => !coreIds.has(p.id));

            // Ensure corePack is represented in packs
            const packExists = state.packs.some((p) => p.pack_name === corePack.pack_name);
            const newPacks = packExists ? state.packs : [corePack, ...state.packs];

            return {
              patterns: [...corePack.patterns, ...customPatterns],
              packs: newPacks,
            };
          }),

        createSession: (patternId) => {
          const state = get();
          const targetPattern =
            state.patterns.find((p) => p.id === patternId) ||
            corePack.patterns.find((p) => p.id === patternId);

          const id = generateUniqueId('session');
          const newSession: UserSession = {
            id,
            patternId,
            pattern_snapshot: targetPattern ? { ...targetPattern } : undefined,
            timestamp: Date.now(),
            decision_context: { problem: '', options: '', why_matters: '' },
            notes: '',
            responses: {},
            stakeholder_responses: {},
            second_order_responses: {},
            reflections: {},
            confidence_level: null,
            confidence_justification: '',
            confidence_responses: {},
          };
          set((s) => ({
            sessions: [newSession, ...s.sessions],
            activeSessionId: id,
          }));
          return id;
        },

        updateSession: (sessionId: string, updates: Partial<UserSession>) =>
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? { ...s, ...updates } : s
            ),
          })),

        updateSessionResponses: (sessionId, responses) =>
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? { ...s, responses } : s
            ),
          })),

        updateSessionReflections: (sessionId, reflections) =>
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? { ...s, reflections } : s
            ),
          })),

        updateSessionNotes: (sessionId, notes) =>
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? { ...s, notes } : s
            ),
          })),

        relinkSessionPattern: (sessionId: string, newPatternId: string) =>
          set((state) => {
            const targetPattern =
              state.patterns.find((p) => p.id === newPatternId) ||
              corePack.patterns.find((p) => p.id === newPatternId);

            return {
              sessions: state.sessions.map((s) =>
                s.id === sessionId
                  ? {
                      ...s,
                      patternId: newPatternId,
                      pattern_snapshot: targetPattern ? { ...targetPattern } : s.pattern_snapshot,
                    }
                  : s
              ),
            };
          }),

        setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

        deleteSession: (sessionId) =>
          set((state) => ({
            sessions: state.sessions.filter((s) => s.id !== sessionId),
            activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
          })),

        restoreStudioBackup: (backupData: StudioBackupData) =>
          set(() => ({
            patterns: [...backupData.patterns],
            packs: [...backupData.packs],
            sessions: [...backupData.sessions],
            activeSessionId: backupData.activeSessionId,
          })),
      };
    },
    {
      name: STUDIO_STORAGE_KEY,
      version: 1,
      storage: createSafeStorage(),
      migrate: (persistedState: unknown, version: number) => {
        // If migrating from version 0 or unversioned state
        if (version < 1) {
          if (!persistedState || typeof persistedState !== 'object') {
            return persistedState as AppState;
          }

          const legacy = persistedState as Record<string, unknown>;

          // Safely preserve or initialize patterns (preserving intentionally empty arrays [])
          let patterns: ThinkingPattern[];
          if (Array.isArray(legacy.patterns)) {
            patterns = legacy.patterns as ThinkingPattern[];
          } else {
            patterns = [...corePack.patterns];
          }

          // Safely preserve or initialize packs (preserving intentionally empty arrays [])
          let packs: PatternPack[];
          if (Array.isArray(legacy.packs)) {
            packs = legacy.packs as PatternPack[];
          } else {
            packs = [corePack];
          }

          // Safely preserve sessions without dropping any
          const sessions = Array.isArray(legacy.sessions)
            ? (legacy.sessions as UserSession[])
            : [];

          const activeSessionId =
            typeof legacy.activeSessionId === 'string' ? legacy.activeSessionId : null;

          // Preserve all legacy properties (including custom or future fields)
          return {
            ...legacy,
            patterns,
            packs,
            sessions,
            activeSessionId,
            storageStatus: 'idle' as StorageStatus,
            storageErrorMessage: null,
          } as AppState;
        }

        return persistedState as AppState;
      },
      partialize: (state) => ({
        patterns: state.patterns,
        packs: state.packs,
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }) as unknown as AppState,
    }
  )
);
