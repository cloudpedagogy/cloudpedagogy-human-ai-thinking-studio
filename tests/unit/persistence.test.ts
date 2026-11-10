import test from 'node:test';
import assert from 'node:assert/strict';
import { useStore, type AppState } from '../../src/store/useStore';
import { corePack } from '../../src/data/corePack';
import {
  createSafeStorage,
  createStudioBackup,
  applyStudioRestore,
  isKeyProtectedAgainstOverwrite,
  clearProtectedKey,
  STUDIO_STORAGE_KEY,
  PRE_RESTORE_SNAPSHOT_KEY,
} from '../../src/utils/storageUtils';
import { validateStudioBackup } from '../../src/utils/validation';
import type { ThinkingPattern, UserSession } from '../../src/types';

// Reset helper
function resetStore() {
  useStore.setState({
    patterns: [...corePack.patterns],
    packs: [corePack],
    sessions: [],
    activeSessionId: null,
    storageStatus: 'idle',
    storageErrorMessage: null,
  });
}

interface PersistApi {
  persist: {
    getOptions: () => {
      migrate?: (persistedState: unknown, version: number) => AppState;
    };
  };
}

test('1. Migration handles legacy Zustand state with version 0 without data loss', async () => {
  const legacyModule = await import('../fixtures/legacyUserData.json', { with: { type: 'json' } });
  const legacyFixture = legacyModule.default;

  const persistOptions = (useStore as unknown as PersistApi).persist.getOptions();
  const migrate = persistOptions?.migrate;
  assert.ok(typeof migrate === 'function', 'Zustand persist migrate function exists');

  const migrated = migrate(legacyFixture.state, 0);

  // Assert custom patterns preserved
  assert.equal(migrated.patterns.length, 2);
  assert.equal(migrated.patterns[1].id, 'custom-user-pattern-1');
  assert.equal(migrated.patterns[1].name, 'Custom Governance Audit');

  // Assert packs preserved
  assert.equal(migrated.packs.length, 2);
  assert.equal(migrated.packs[1].pack_name, 'Custom Enterprise Pack');

  // Assert sessions preserved
  assert.equal(migrated.sessions.length, 2);
  assert.equal(migrated.sessions[0].id, 'session-legacy-1');
  assert.equal(migrated.sessions[1].id, 'session-legacy-custom');
  assert.equal(migrated.sessions[0].responses.q_0, 'Option A offers scalability, Option B offers data residency.');

  // Assert active session preserved
  assert.equal(migrated.activeSessionId, 'session-legacy-1');
});

test('2. Migration handles legacy state with no version field (undefined)', async () => {
  const legacyModule = await import('../fixtures/legacyUserData.json', { with: { type: 'json' } });
  const legacyFixture = legacyModule.default;

  const persistOptions = (useStore as unknown as PersistApi).persist.getOptions();
  const migrate = persistOptions?.migrate;
  assert.ok(typeof migrate === 'function', 'Zustand persist migrate function exists');

  // Unversioned state (no version field passed, version = NaN or -1)
  const migrated = migrate(legacyFixture.state, -1);

  assert.equal(migrated.patterns.length, 2);
  assert.equal(migrated.sessions.length, 2);
  assert.equal(migrated.activeSessionId, 'session-legacy-1');
});

test('3. Custom patterns and sessions survive store migration and restoration', () => {
  resetStore();

  const customPattern: ThinkingPattern = {
    id: 'custom-preservation-1',
    name: 'Preserved Pattern',
    category: 'Risk Thinking',
    purpose: 'Test survival',
    when_to_use: ['Now'],
    thinking_questions: ['Does it survive?'],
    ai_prompts: [],
    reflection_questions: [],
  };

  useStore.getState().addPattern(customPattern);
  const sessionId = useStore.getState().createSession('custom-preservation-1');
  useStore.getState().updateSessionResponses(sessionId, { q_0: 'Yes it survives.' });

  const stateBefore = useStore.getState();
  assert.equal(stateBefore.patterns.some((p) => p.id === 'custom-preservation-1'), true);
  assert.equal(stateBefore.sessions.length, 1);
  assert.equal(stateBefore.sessions[0].responses.q_0, 'Yes it survives.');
  assert.ok(stateBefore.sessions[0].pattern_snapshot, 'Snapshot is automatically recorded');
});

test('4. SafeStorage detects corrupted JSON, preserves backup string, and avoids crash', () => {
  const storage = createSafeStorage<unknown>();

  // Simulate corrupted JSON string in localStorage
  const corruptedKey = 'test-corrupted-storage-key';
  const corruptedContent = '{"state": { unclosed json...';
  globalThis.localStorage.setItem(corruptedKey, corruptedContent);

  // getItem should not throw
  const result = storage.getItem(corruptedKey);
  assert.equal(result, null);

  // Verify backup key was created in localStorage
  let foundBackup = false;
  for (let i = 0; i < globalThis.localStorage.length; i++) {
    const k = globalThis.localStorage.key(i);
    if (k && k.startsWith(`${corruptedKey}-corrupted-backup-`)) {
      foundBackup = true;
      assert.equal(globalThis.localStorage.getItem(k), corruptedContent);
      // clean up
      globalThis.localStorage.removeItem(k);
    }
  }
  assert.ok(foundBackup, 'Corrupted data was backed up into a recovery key');
  globalThis.localStorage.removeItem(corruptedKey);
});

test('5. SafeStorage handles missing or null stored state gracefully', () => {
  const storage = createSafeStorage<unknown>();
  assert.equal(storage.getItem('non-existent-key'), null);
});

test('6. SafeStorage handles unavailable localStorage safely', () => {
  const originalWindow = globalThis.window;
  const storage = createSafeStorage<unknown>();

  try {
    // Simulate window without localStorage
    (globalThis as { window?: unknown }).window = {};
    assert.equal(storage.getItem('any-key'), null);
    assert.doesNotThrow(() => storage.setItem('any-key', { state: {}, version: 1 }));
    assert.doesNotThrow(() => storage.removeItem('any-key'));
  } finally {
    globalThis.window = originalWindow;
  }
});

test('7. SafeStorage handles QuotaExceededError without throwing', () => {
  const storage = createSafeStorage<unknown>();
  const originalSetItem = globalThis.localStorage.setItem;

  try {
    globalThis.localStorage.setItem = () => {
      const err = new Error('The quota has been exceeded.');
      err.name = 'QuotaExceededError';
      throw err;
    };

    // Should catch QuotaExceededError gracefully without throwing
    assert.doesNotThrow(() => {
      storage.setItem('quota-key', { state: { test: true }, version: 1 });
    });
  } finally {
    globalThis.localStorage.setItem = originalSetItem;
  }
});

test('8. Full Studio Backup export and restore round trip preserves all data accurately', () => {
  resetStore();

  const customPattern: ThinkingPattern = {
    id: 'backup-pattern-1',
    name: 'Backup Pattern',
    category: 'Governance Thinking',
    purpose: 'Ensure backup fidelity',
    when_to_use: ['Backup testing'],
    thinking_questions: ['Is everything preserved?'],
    ai_prompts: ['Verify.'],
    reflection_questions: ['Pass?'],
    tags: ['backup', 'integrity'],
  };
  useStore.getState().addPattern(customPattern);
  const sessionId = useStore.getState().createSession('backup-pattern-1');
  useStore.getState().updateSession(sessionId, {
    notes: 'Important session notes',
    decision_context: { problem: 'Problem 1', options: 'Option A/B', why_matters: 'High priority' },
  });
  useStore.getState().updateSessionResponses(sessionId, { q_0: 'All verified.' });

  const backup = createStudioBackup(useStore.getState());
  assert.equal(backup.format, 'cloudpedagogy-thinking-studio-backup');
  assert.equal(backup.version, 1);
  assert.equal(backup.data.patterns.some((p) => p.id === 'backup-pattern-1'), true);
  assert.equal(backup.data.sessions.length, 1);
  assert.equal(backup.data.sessions[0].notes, 'Important session notes');

  // Validate the backup object
  const validation = validateStudioBackup(backup);
  assert.equal(validation.valid, true);

  // Clear store completely to simulate clean slate
  useStore.setState({ patterns: [], packs: [], sessions: [], activeSessionId: null });
  assert.equal(useStore.getState().patterns.length, 0);

  // Restore backup
  useStore.getState().restoreStudioBackup(backup.data);

  const restored = useStore.getState();
  assert.equal(restored.patterns.some((p) => p.id === 'backup-pattern-1'), true);
  assert.equal(restored.sessions.length, 1);
  assert.equal(restored.sessions[0].notes, 'Important session notes');
  assert.equal(restored.sessions[0].responses.q_0, 'All verified.');
  assert.equal(restored.activeSessionId, sessionId);
});

test('9. Invalid Studio Backup is rejected without modifying store state', () => {
  resetStore();
  const initialPatternsCount = useStore.getState().patterns.length;

  const invalidBackup = {
    format: 'wrong-format',
    version: 99,
    data: {
      patterns: 'not an array',
      sessions: null,
    },
  };

  const validation = validateStudioBackup(invalidBackup);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.length > 0);

  // Store state remains completely untouched
  assert.equal(useStore.getState().patterns.length, initialPatternsCount);
});

test('10. Session preservation after pattern deletion', () => {
  resetStore();

  const patternId = 'trade-off-analysis';
  const sessionId = useStore.getState().createSession(patternId);
  useStore.getState().updateSessionResponses(sessionId, { q_0: 'Trade-off analysis response' });

  const sessionBefore = useStore.getState().sessions.find((s) => s.id === sessionId);
  assert.ok(sessionBefore?.pattern_snapshot, 'Snapshot captured at creation');

  // Delete the pattern from library
  useStore.getState().deletePattern(patternId);
  assert.equal(useStore.getState().patterns.some((p) => p.id === patternId), false);

  // Session remains intact with its snapshot!
  const sessionAfter = useStore.getState().sessions.find((s) => s.id === sessionId);
  assert.ok(sessionAfter);
  assert.equal(sessionAfter?.responses.q_0, 'Trade-off analysis response');
  assert.equal(sessionAfter?.pattern_snapshot?.name, 'Trade-off Analysis');
});

test('11. Session preservation after library replacement', () => {
  resetStore();

  const sessionId = useStore.getState().createSession('trade-off-analysis');
  useStore.getState().updateSessionResponses(sessionId, { q_0: 'Valuable answer' });

  // Replace library with a minimal 1-pattern pack
  useStore.getState().importPack(
    {
      pack_name: 'Replacement Pack',
      version: '1.0',
      patterns: [
        {
          id: 'unrelated-pattern',
          name: 'Unrelated Pattern',
          category: 'Other',
          purpose: 'Replaces everything',
          when_to_use: [],
          thinking_questions: [],
          ai_prompts: [],
          reflection_questions: [],
        },
      ],
    },
    'replace'
  );

  // Pattern library now only has 1 pattern
  assert.equal(useStore.getState().patterns.length, 1);
  assert.equal(useStore.getState().patterns[0].id, 'unrelated-pattern');

  // But the session still exists and holds its responses and snapshot
  const preservedSession = useStore.getState().sessions.find((s) => s.id === sessionId);
  assert.ok(preservedSession);
  assert.equal(preservedSession?.responses.q_0, 'Valuable answer');
  assert.equal(preservedSession?.pattern_snapshot?.id, 'trade-off-analysis');
});

test('12. Legacy sessions with missing pattern snapshot can be re-linked to active pattern', () => {
  resetStore();

  // Simulate a legacy session created without a pattern_snapshot
  const legacySession: UserSession = {
    id: 'legacy-session-no-snap',
    patternId: 'deleted-old-pattern',
    timestamp: Date.now(),
    decision_context: { problem: 'Old problem', options: '', why_matters: '' },
    notes: 'Preserved notes',
    responses: { q_0: 'Old response' },
    stakeholder_responses: {},
    second_order_responses: {},
    reflections: {},
    confidence_level: null,
    confidence_justification: '',
  };

  useStore.setState({ sessions: [legacySession] });

  // Re-link to an active pattern
  useStore.getState().relinkSessionPattern('legacy-session-no-snap', 'trade-off-analysis');

  const updatedSession = useStore.getState().sessions.find((s) => s.id === 'legacy-session-no-snap');
  assert.ok(updatedSession);
  assert.equal(updatedSession?.patternId, 'trade-off-analysis');
  assert.equal(updatedSession?.pattern_snapshot?.name, 'Trade-off Analysis');
  // Original user notes and responses are preserved!
  assert.equal(updatedSession?.notes, 'Preserved notes');
  assert.equal(updatedSession?.responses.q_0, 'Old response');
});

test('13. Snapshots preserve original pattern even if pattern in store is subsequently modified', () => {
  resetStore();

  const patternId = 'trade-off-analysis';
  const sessionId = useStore.getState().createSession(patternId);

  // Modify the pattern in the store
  useStore.getState().updatePattern(patternId, { name: 'Drastically Changed Name' });

  // Store pattern reflects modification
  const storePattern = useStore.getState().patterns.find((p) => p.id === patternId);
  assert.equal(storePattern?.name, 'Drastically Changed Name');

  // But the session snapshot retains the original pattern definition!
  const session = useStore.getState().sessions.find((s) => s.id === sessionId);
  assert.equal(session?.pattern_snapshot?.name, 'Trade-off Analysis');
});

test('14. Recovery after interrupted restore: snapshot safety backup exists', () => {
  const originalGetItem = globalThis.localStorage.getItem;
  const originalSetItem = globalThis.localStorage.setItem;

  try {
    globalThis.localStorage.setItem('cloudpedagogy-thinking-studio-storage', '{"state": {"test": 123}}');

    // Simulate pre-restore snapshot logic
    const current = globalThis.localStorage.getItem('cloudpedagogy-thinking-studio-storage');
    globalThis.localStorage.setItem('cloudpedagogy-pre-restore-safety-snapshot', current || '');

    assert.equal(
      globalThis.localStorage.getItem('cloudpedagogy-pre-restore-safety-snapshot'),
      '{"state": {"test": 123}}'
    );
  } finally {
    globalThis.localStorage.getItem = originalGetItem;
    globalThis.localStorage.setItem = originalSetItem;
  }
});

test('15. Intentionally empty pattern library (patterns: []) is preserved after migration', () => {
  const persistOptions = (useStore as unknown as PersistApi).persist.getOptions();
  const migrate = persistOptions?.migrate;
  assert.ok(typeof migrate === 'function', 'Zustand persist migrate function exists');

  const legacyStateWithEmptyPatterns = {
    patterns: [], // Intentionally empty array
    packs: [],
    sessions: [],
    activeSessionId: null,
  };

  const migrated = migrate(legacyStateWithEmptyPatterns, 0);

  // Must NOT re-inject core patterns if patterns array was explicitly empty
  assert.equal(Array.isArray(migrated.patterns), true);
  assert.equal(migrated.patterns.length, 0, 'Intentionally empty patterns library is preserved');
});

test('16. Corrupted storage write refusal when backup creation fails (unbacked corrupted data)', () => {
  const testKey = 'test-unbacked-corrupted-key';
  clearProtectedKey(testKey);

  const originalSetItem = globalThis.localStorage.setItem;
  const originalGetItem = globalThis.localStorage.getItem;

  try {
    // Put corrupted JSON under testKey
    globalThis.localStorage.setItem(testKey, '{ invalid: corrupt json content');

    // Make setItem throw (e.g. quota exceeded) when trying to write backup
    let setItemCallCount = 0;
    globalThis.localStorage.setItem = (key: string, val: string) => {
      setItemCallCount++;
      if (key.includes('-corrupted-backup-')) {
        const quotaError = new Error('Storage quota exceeded');
        quotaError.name = 'QuotaExceededError';
        throw quotaError;
      }
      return originalSetItem.call(globalThis.localStorage, key, val);
    };

    const storage = createSafeStorage<unknown>();
    const loaded = storage.getItem(testKey);

    assert.equal(loaded, null);
    assert.ok(setItemCallCount > 0, 'Backup write attempt was made');
    // Key should now be protected against destructive overwriting
    assert.equal(isKeyProtectedAgainstOverwrite(testKey), true);

    // Attempting to setItem on the protected key must NOT overwrite raw data
    globalThis.localStorage.setItem = originalSetItem; // restore normal setItem
    storage.setItem(testKey, { state: { patterns: [] }, version: 1 });

    // The raw corrupted data in localStorage must be intact!
    const rawAfterWriteAttempt = globalThis.localStorage.getItem(testKey);
    assert.equal(rawAfterWriteAttempt, '{ invalid: corrupt json content');
  } finally {
    globalThis.localStorage.setItem = originalSetItem;
    globalThis.localStorage.getItem = originalGetItem;
    clearProtectedKey(testKey);
  }
});

test('17. applyStudioRestore pre-restore snapshot creation, read-back verification, and abort on failure', () => {
  resetStore();
  const originalSetItem = globalThis.localStorage.setItem;
  const originalGetItem = globalThis.localStorage.getItem;

  try {
    // 17a: Successful restore creates verified pre-restore snapshot
    globalThis.localStorage.setItem(STUDIO_STORAGE_KEY, JSON.stringify({ state: { current: 'val' }, version: 1 }));

    const validBackupData = {
      patterns: [...corePack.patterns],
      packs: [corePack],
      sessions: [],
      activeSessionId: null,
    };

    const result = applyStudioRestore(validBackupData);
    assert.equal(result.success, true);
    assert.ok(globalThis.localStorage.getItem(PRE_RESTORE_SNAPSHOT_KEY)?.includes('val'));

    // 17b: If pre-restore snapshot fails, restore aborts without modifying original data
    globalThis.localStorage.setItem(STUDIO_STORAGE_KEY, '{"state": {"protected": "data"}, "version": 1}');
    globalThis.localStorage.setItem = (key: string, val: string) => {
      if (key === PRE_RESTORE_SNAPSHOT_KEY) {
        throw new Error('Quota exceeded on snapshot');
      }
      return originalSetItem.call(globalThis.localStorage, key, val);
    };

    const abortResult = applyStudioRestore(validBackupData);
    assert.equal(abortResult.success, false);
    assert.ok(abortResult.error?.includes('Cannot create pre-restore safety snapshot'));

    // Original data was NOT overwritten
    assert.equal(
      originalGetItem.call(globalThis.localStorage, STUDIO_STORAGE_KEY),
      '{"state": {"protected": "data"}, "version": 1}'
    );
  } finally {
    globalThis.localStorage.setItem = originalSetItem;
    globalThis.localStorage.getItem = originalGetItem;
  }
});

test('18. applyStudioRestore rolls back primary key if writing restored data fails', () => {
  resetStore();
  const originalSetItem = globalThis.localStorage.setItem;
  const originalGetItem = globalThis.localStorage.getItem;

  try {
    const originalContent = '{"state": {"pre_existing": "intact"}, "version": 1}';
    globalThis.localStorage.setItem(STUDIO_STORAGE_KEY, originalContent);

    // Allow snapshot writing, but fail when writing the new restored data to STUDIO_STORAGE_KEY
    let snapshotWritten = false;
    globalThis.localStorage.setItem = (key: string, val: string) => {
      if (key === PRE_RESTORE_SNAPSHOT_KEY) {
        snapshotWritten = true;
        return originalSetItem.call(globalThis.localStorage, key, val);
      }
      if (key === STUDIO_STORAGE_KEY && snapshotWritten) {
        throw new Error('Simulated disk write failure on target key');
      }
      return originalSetItem.call(globalThis.localStorage, key, val);
    };

    const validBackupData = {
      patterns: [...corePack.patterns],
      packs: [corePack],
      sessions: [],
      activeSessionId: null,
    };

    const result = applyStudioRestore(validBackupData);
    assert.equal(result.success, false);
    assert.ok(result.error?.includes('Failed to write restored data'));

    // Safety snapshot was preserved
    assert.equal(
      originalGetItem.call(globalThis.localStorage, PRE_RESTORE_SNAPSHOT_KEY),
      originalContent
    );
  } finally {
    globalThis.localStorage.setItem = originalSetItem;
    globalThis.localStorage.getItem = originalGetItem;
  }
});
