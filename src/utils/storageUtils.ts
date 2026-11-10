import type { PersistStorage, StorageValue } from 'zustand/middleware';
import type { AppState } from '../store/useStore';
import type { StudioBackup, StudioBackupData } from '../types';
import { useStore } from '../store/useStore';

export const STUDIO_STORAGE_KEY = 'cloudpedagogy-thinking-studio-storage';
export const PRE_RESTORE_SNAPSHOT_KEY = 'cloudpedagogy-pre-restore-safety-snapshot';

export type StorageStatus = 'idle' | 'saved' | 'error' | 'quota-exceeded' | 'unavailable';

let globalStorageStatusListener: ((status: StorageStatus, msg?: string) => void) | null = null;
let lastReportedStatus: StorageStatus | null = null;

// Tracks keys with unbacked corrupted data to prevent destructive overwriting
const unbackedCorruptedKeys = new Set<string>();

export function isKeyProtectedAgainstOverwrite(key: string): boolean {
  return unbackedCorruptedKeys.has(key);
}

export function clearProtectedKey(key: string): void {
  unbackedCorruptedKeys.delete(key);
}

export function setStorageStatusListener(listener: ((status: StorageStatus, msg?: string) => void) | null) {
  globalStorageStatusListener = listener;
}

export function notifyStatus(status: StorageStatus, msg?: string) {
  if (lastReportedStatus !== status) {
    lastReportedStatus = status;
    globalStorageStatusListener?.(status, msg);
  }
}

/**
 * Creates a safe, resilient storage adapter for Zustand persist.
 * 
 * - Never throws unhandled exceptions if localStorage is disabled or throws SecurityError.
 * - Catches QuotaExceededError and notifies listeners gracefully without crashing the app.
 * - Detects corrupted JSON: safely backs up the corrupted string to a recovery key
 *   rather than overwriting or discarding user data.
 * - If copying corrupted data to a backup key fails (e.g. storage full), REFUSES to overwrite
 *   the corrupted data on subsequent writes, preserving recoverable data permanently.
 */
export function createSafeStorage<T>(): PersistStorage<T> {
  return {
    getItem: (name: string): StorageValue<T> | null => {
      try {
        if (typeof window === 'undefined' || !window.localStorage) {
          notifyStatus('unavailable', 'Browser LocalStorage is unavailable in this environment.');
          return null;
        }

        const raw = window.localStorage.getItem(name);
        if (!raw) return null;

        try {
          return JSON.parse(raw);
        } catch (jsonErr) {
          console.warn(
            `[Studio Storage] Corrupted JSON detected under key "${name}". Preserving raw content in backup key and falling back to memory.`,
            jsonErr
          );

          let backupSucceeded = false;
          try {
            const backupKey = `${name}-corrupted-backup-${Date.now()}`;
            window.localStorage.setItem(backupKey, raw);
            if (window.localStorage.getItem(backupKey) === raw) {
              backupSucceeded = true;
              console.info(`[Studio Storage] Preserved corrupted data under "${backupKey}".`);
            }
          } catch {
            // Backup write failed (e.g. storage full or restricted)
          }

          if (!backupSucceeded) {
            // Protect original corrupted data from being overwritten by subsequent writes
            unbackedCorruptedKeys.add(name);
            console.error(
              `[Studio Storage] Could not create backup key for corrupted data. Protecting key "${name}" against destructive overwriting.`
            );
            notifyStatus(
              'error',
              'Corrupted stored data was detected, but cannot be copied because storage is full. Disk writes are paused to preserve your raw data. Export your work to save changes.'
            );
            return null;
          }

          notifyStatus(
            'error',
            'Corrupted stored data was detected. A safety copy has been preserved, and default state was loaded in memory.'
          );
          return null;
        }
      } catch (err) {
        console.warn(`[Studio Storage] Access to LocalStorage failed or was denied:`, err);
        notifyStatus('unavailable', 'Storage access denied or restricted.');
        return null;
      }
    },

    setItem: (name: string, value: StorageValue<T>): void => {
      try {
        if (typeof window === 'undefined' || !window.localStorage) {
          notifyStatus('unavailable', 'Browser LocalStorage is unavailable.');
          return;
        }

        // If this key contains unbacked corrupted data, refuse to overwrite it
        if (unbackedCorruptedKeys.has(name)) {
          notifyStatus(
            'error',
            'Storage writes paused: original stored data contains unbacked corrupted content that could not be copied because storage is full. Use Export to save your changes.'
          );
          return;
        }

        const serialized = JSON.stringify(value);
        window.localStorage.setItem(name, serialized);
        notifyStatus('saved');
      } catch (err) {
        const isQuota =
          err instanceof Error &&
          (err.name === 'QuotaExceededError' ||
            err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
            err.message.toLowerCase().includes('quota'));

        if (isQuota) {
          console.error(`[Studio Storage] Storage quota exceeded. Unsaved changes are in-memory only:`, err);
          notifyStatus(
            'quota-exceeded',
            'Browser LocalStorage is full. Changes cannot be saved to disk. Export your data before closing.'
          );
        } else {
          console.error(`[Studio Storage] Failed to write to LocalStorage:`, err);
          notifyStatus('error', 'Failed to save changes to browser LocalStorage.');
        }
      }
    },

    removeItem: (name: string): void => {
      try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        unbackedCorruptedKeys.delete(name);
        window.localStorage.removeItem(name);
      } catch (err) {
        console.warn(`[Studio Storage] Failed to remove item "${name}" from LocalStorage:`, err);
      }
    },
  };
}

/**
 * Generates a full StudioBackup object from the current application state.
 */
export function createStudioBackup(state: AppState): StudioBackup {
  return {
    format: 'cloudpedagogy-thinking-studio-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      patterns: state.patterns,
      packs: state.packs,
      sessions: state.sessions,
      activeSessionId: state.activeSessionId,
    },
  };
}

/**
 * Atomically and safely applies a Studio Backup with pre-restore safety snapshotting
 * and storage write verification.
 */
export function applyStudioRestore(backupData: StudioBackupData): { success: boolean; error?: string } {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { success: false, error: 'Browser LocalStorage is unavailable in this environment.' };
    }

    const currentRaw = window.localStorage.getItem(STUDIO_STORAGE_KEY);

    // 1. Take and verify pre-restore safety snapshot before touching current data
    if (currentRaw !== null) {
      try {
        window.localStorage.setItem(PRE_RESTORE_SNAPSHOT_KEY, currentRaw);
        if (window.localStorage.getItem(PRE_RESTORE_SNAPSHOT_KEY) !== currentRaw) {
          return {
            success: false,
            error: 'Failed to verify pre-restore safety snapshot. Restoration was aborted to protect current data.',
          };
        }
      } catch (snapErr) {
        return {
          success: false,
          error: `Cannot create pre-restore safety snapshot (${snapErr instanceof Error ? snapErr.message : 'Storage full'}). Restoration was aborted to protect current data.`,
        };
      }
    }

    // 2. Prepare the new persisted envelope
    const targetPayload = {
      state: {
        patterns: backupData.patterns,
        packs: backupData.packs,
        sessions: backupData.sessions,
        activeSessionId: backupData.activeSessionId,
      },
      version: 1,
    };
    const serialized = JSON.stringify(targetPayload);

    // 3. Atomically test write to LocalStorage
    try {
      window.localStorage.setItem(STUDIO_STORAGE_KEY, serialized);
      if (window.localStorage.getItem(STUDIO_STORAGE_KEY) !== serialized) {
        throw new Error('Storage write verification mismatch.');
      }
    } catch (writeErr) {
      // Rollback to original currentRaw if write failed
      if (currentRaw !== null) {
        try {
          window.localStorage.setItem(STUDIO_STORAGE_KEY, currentRaw);
        } catch {
          // If rollback write fails, PRE_RESTORE_SNAPSHOT_KEY still has currentRaw
        }
      }
      return {
        success: false,
        error: `Failed to write restored data to LocalStorage (${writeErr instanceof Error ? writeErr.message : 'Storage full'}). Previous data was preserved.`,
      };
    }

    // 4. Update in-memory Zustand store and clear any protected key flag
    unbackedCorruptedKeys.delete(STUDIO_STORAGE_KEY);
    useStore.getState().restoreStudioBackup(backupData);
    notifyStatus('saved');
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: `Unexpected error during restoration: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Downloads a text or JSON file safely with proper ObjectURL revocation to prevent memory leaks.
 */
export function safeDownloadFile(content: string, filename: string, mimeType = 'application/json'): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up ObjectURL after a short delay so the browser can initiate download
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
