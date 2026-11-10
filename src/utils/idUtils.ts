/**
 * Resilient UUID generator that works across all browser and test environments,
 * including non-secure contexts (e.g. plain HTTP intranet) where crypto.randomUUID is not available.
 */
export function generateUniqueId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall through to resilient fallback if crypto fails
    }
  }

  // Fallback: timestamp + high-resolution timer (if available) + random string
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  const perfPart = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? Math.floor(performance.now() * 1000).toString(36)
    : Math.random().toString(36).substring(2, 6);

  return `${prefix}-${timestamp}-${perfPart}-${randomPart}`;
}

