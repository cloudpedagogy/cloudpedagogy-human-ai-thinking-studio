import type { PatternPack, ThinkingPattern, UserSession, StudioBackup, StudioBackupData } from '../types';

export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: T;
}

/**
 * Validates whether a value is a non-empty string.
 */
function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

/**
 * Validates and sanitizes a string array.
 */
function isStringArray(val: unknown): val is string[] {
  return Array.isArray(val) && val.every((item) => typeof item === 'string');
}

/**
 * Validates whether a value is a record of string keys to string values.
 */
function isStringRecord(val: unknown): val is Record<string, string> {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return false;
  return Object.values(val as Record<string, unknown>).every((item) => typeof item === 'string');
}

/**
 * Validates an individual ThinkingPattern against the application schema.
 * Normalizes missing optional fields to safe defaults so rendering never crashes.
 */
export function validatePattern(raw: unknown, index = 0): ValidationResult<ThinkingPattern> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      valid: false,
      errors: [`Pattern at index ${index} must be an object.`],
      warnings: [],
    };
  }

  const p = raw as Record<string, unknown>;
  const prefix = `Pattern at index ${index} (${typeof p.id === 'string' ? p.id : 'unknown id'})`;

  if (!isNonEmptyString(p.id)) {
    errors.push(`${prefix}: 'id' must be a non-empty string.`);
  }

  if (!isNonEmptyString(p.name)) {
    errors.push(`${prefix}: 'name' must be a non-empty string.`);
  }

  if (!isNonEmptyString(p.category)) {
    errors.push(`${prefix}: 'category' must be a non-empty string.`);
  }

  if (typeof p.purpose !== 'string') {
    errors.push(`${prefix}: 'purpose' must be a string.`);
  }

  if (!isStringArray(p.when_to_use)) {
    errors.push(`${prefix}: 'when_to_use' must be an array of strings.`);
  }

  if (!isStringArray(p.thinking_questions)) {
    errors.push(`${prefix}: 'thinking_questions' must be an array of strings.`);
  }

  if (!isStringArray(p.ai_prompts)) {
    errors.push(`${prefix}: 'ai_prompts' must be an array of strings.`);
  }

  if (!isStringArray(p.reflection_questions)) {
    errors.push(`${prefix}: 'reflection_questions' must be an array of strings.`);
  }

  // Optional arrays: if present, must be string arrays
  if (p.stakeholder_questions !== undefined && !isStringArray(p.stakeholder_questions)) {
    errors.push(`${prefix}: 'stakeholder_questions' must be an array of strings when provided.`);
  }

  if (p.second_order_questions !== undefined && !isStringArray(p.second_order_questions)) {
    errors.push(`${prefix}: 'second_order_questions' must be an array of strings when provided.`);
  }

  if (p.confidence_questions !== undefined && !isStringArray(p.confidence_questions)) {
    errors.push(`${prefix}: 'confidence_questions' must be an array of strings when provided.`);
  }

  if (p.tags !== undefined && !isStringArray(p.tags)) {
    errors.push(`${prefix}: 'tags' must be an array of strings when provided.`);
  }

  // Optional metadata object
  let metadata: ThinkingPattern['metadata'];
  if (p.metadata !== undefined) {
    if (typeof p.metadata !== 'object' || p.metadata === null || Array.isArray(p.metadata)) {
      errors.push(`${prefix}: 'metadata' must be an object when provided.`);
    } else {
      const m = p.metadata as Record<string, unknown>;
      metadata = {
        author: typeof m.author === 'string' ? m.author : undefined,
        version: typeof m.version === 'string' ? m.version : undefined,
        source: typeof m.source === 'string' ? m.source : undefined,
      };
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const sanitizedPattern: ThinkingPattern = {
    id: (p.id as string).trim(),
    name: (p.name as string).trim(),
    category: (p.category as string).trim(),
    purpose: (p.purpose as string).trim(),
    when_to_use: (p.when_to_use as string[]).map((s) => s.trim()),
    thinking_questions: (p.thinking_questions as string[]).map((s) => s.trim()),
    ai_prompts: (p.ai_prompts as string[]).map((s) => s.trim()),
    reflection_questions: (p.reflection_questions as string[]).map((s) => s.trim()),
    stakeholder_questions: isStringArray(p.stakeholder_questions)
      ? p.stakeholder_questions.map((s) => s.trim())
      : [],
    second_order_questions: isStringArray(p.second_order_questions)
      ? p.second_order_questions.map((s) => s.trim())
      : [],
    confidence_questions: isStringArray(p.confidence_questions)
      ? p.confidence_questions.map((s) => s.trim())
      : undefined,
    tags: isStringArray(p.tags) ? p.tags.map((s) => s.trim()) : undefined,
    metadata,
  };

  return { valid: true, errors: [], warnings, data: sanitizedPattern };
}

/**
 * Validates a PatternPack object.
 * Checks pack_name, version, and validates each pattern.
 * Deduplicates intra-pack duplicate pattern IDs deterministically (last occurrence wins).
 */
export function validatePatternPack(raw: unknown): ValidationResult<PatternPack> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      valid: false,
      errors: ['Imported file must contain a JSON object.'],
      warnings: [],
    };
  }

  const pack = raw as Record<string, unknown>;

  if (!isNonEmptyString(pack.pack_name)) {
    errors.push("Missing or invalid 'pack_name' in pattern pack.");
  }

  if (pack.version === undefined || pack.version === null || String(pack.version).trim().length === 0) {
    errors.push("Missing or invalid 'version' in pattern pack.");
  }

  if (!Array.isArray(pack.patterns)) {
    errors.push("Pattern pack must contain a 'patterns' array.");
    return { valid: false, errors, warnings };
  }

  if (pack.patterns.length === 0) {
    errors.push("Pattern pack 'patterns' array cannot be empty.");
    return { valid: false, errors, warnings };
  }

  const validPatterns: ThinkingPattern[] = [];
  const seenIds = new Map<string, number>();

  pack.patterns.forEach((rawPattern, idx) => {
    const result = validatePattern(rawPattern, idx);
    if (!result.valid) {
      errors.push(...result.errors);
    } else if (result.data) {
      const pattern = result.data;
      if (seenIds.has(pattern.id)) {
        warnings.push(
          `Duplicate pattern ID '${pattern.id}' found at index ${idx}. Deterministically overwriting earlier occurrence from index ${seenIds.get(pattern.id)}.`
        );
        const existingIdx = validPatterns.findIndex((p) => p.id === pattern.id);
        if (existingIdx >= 0) {
          validPatterns[existingIdx] = pattern;
        }
      } else {
        seenIds.set(pattern.id, idx);
        validPatterns.push(pattern);
      }
    }
  });

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    errors: [],
    warnings,
    data: {
      pack_name: String(pack.pack_name).trim(),
      version: String(pack.version).trim(),
      patterns: validPatterns,
    },
  };
}

/**
 * Validates an individual UserSession object.
 * Normalizes missing record objects to safe empty records.
 */
export function validateUserSession(raw: unknown, index = 0): ValidationResult<UserSession> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      valid: false,
      errors: [`Session at index ${index} must be an object.`],
      warnings: [],
    };
  }

  const s = raw as Record<string, unknown>;
  const prefix = `Session at index ${index} (${typeof s.id === 'string' ? s.id : 'unknown id'})`;

  if (!isNonEmptyString(s.id)) {
    errors.push(`${prefix}: 'id' must be a non-empty string.`);
  }

  if (!isNonEmptyString(s.patternId)) {
    errors.push(`${prefix}: 'patternId' must be a non-empty string.`);
  }

  const timestamp = typeof s.timestamp === 'number' && !isNaN(s.timestamp) ? s.timestamp : Date.now();

  const rawCtx = (s.decision_context && typeof s.decision_context === 'object' && !Array.isArray(s.decision_context))
    ? (s.decision_context as Record<string, unknown>)
    : {};

  const decision_context = {
    problem: typeof rawCtx.problem === 'string' ? rawCtx.problem : '',
    options: typeof rawCtx.options === 'string' ? rawCtx.options : '',
    why_matters: typeof rawCtx.why_matters === 'string' ? rawCtx.why_matters : '',
  };

  const notes = typeof s.notes === 'string' ? s.notes : '';

  const responses = isStringRecord(s.responses) ? s.responses : {};
  const stakeholder_responses = isStringRecord(s.stakeholder_responses) ? s.stakeholder_responses : {};
  const second_order_responses = isStringRecord(s.second_order_responses) ? s.second_order_responses : {};
  const reflections = isStringRecord(s.reflections) ? s.reflections : {};

  let confidence_level: 'Low' | 'Medium' | 'High' | null = null;
  if (s.confidence_level === 'Low' || s.confidence_level === 'Medium' || s.confidence_level === 'High') {
    confidence_level = s.confidence_level;
  }

  const confidence_justification = typeof s.confidence_justification === 'string' ? s.confidence_justification : '';
  const confidence_responses = isStringRecord(s.confidence_responses) ? s.confidence_responses : {};

  let pattern_snapshot: ThinkingPattern | undefined;
  if (s.pattern_snapshot && typeof s.pattern_snapshot === 'object') {
    const snapRes = validatePattern(s.pattern_snapshot);
    if (snapRes.valid && snapRes.data) {
      pattern_snapshot = snapRes.data;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const validSession: UserSession = {
    id: String(s.id).trim(),
    patternId: String(s.patternId).trim(),
    pattern_snapshot,
    timestamp,
    decision_context,
    notes,
    responses,
    stakeholder_responses,
    second_order_responses,
    reflections,
    confidence_level,
    confidence_justification,
    confidence_responses,
  };

  return { valid: true, errors: [], warnings, data: validSession };
}

/**
 * Validates a full Studio Backup file.
 */
export function validateStudioBackup(raw: unknown): ValidationResult<StudioBackup> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      valid: false,
      errors: ['Backup file must contain a JSON object.'],
      warnings: [],
    };
  }

  const backup = raw as Record<string, unknown>;

  if (backup.format !== 'cloudpedagogy-thinking-studio-backup') {
    errors.push("Invalid backup format: 'format' must be 'cloudpedagogy-thinking-studio-backup'.");
  }

  if (backup.version !== 1) {
    errors.push(`Unsupported backup version: expected 1, found ${String(backup.version)}.`);
  }

  if (!backup.data || typeof backup.data !== 'object' || Array.isArray(backup.data)) {
    errors.push("Backup must contain a 'data' object.");
    return { valid: false, errors, warnings };
  }

  const data = backup.data as Record<string, unknown>;

  if (!Array.isArray(data.patterns)) {
    errors.push("Backup data must contain a 'patterns' array.");
  }

  if (!Array.isArray(data.sessions)) {
    errors.push("Backup data must contain a 'sessions' array.");
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const rawPatterns = data.patterns as unknown[];
  const rawSessions = data.sessions as unknown[];

  const validPatterns: ThinkingPattern[] = [];
  rawPatterns.forEach((rawP, idx) => {
    const res = validatePattern(rawP, idx);
    if (!res.valid) {
      errors.push(...res.errors);
    } else if (res.data) {
      validPatterns.push(res.data);
    }
  });

  const validSessions: UserSession[] = [];
  rawSessions.forEach((rawS, idx) => {
    const res = validateUserSession(rawS, idx);
    if (!res.valid) {
      errors.push(...res.errors);
    } else if (res.data) {
      validSessions.push(res.data);
    }
  });

  const validPacks: PatternPack[] = [];
  if (Array.isArray(data.packs)) {
    data.packs.forEach((rawPack) => {
      if (rawPack && typeof rawPack === 'object') {
        const p = rawPack as Record<string, unknown>;
        if (typeof p.pack_name === 'string' && typeof p.version === 'string') {
          validPacks.push({
            pack_name: p.pack_name,
            version: p.version,
            patterns: Array.isArray(p.patterns) ? (p.patterns as ThinkingPattern[]) : [],
          });
        }
      }
    });
  }

  const activeSessionId = typeof data.activeSessionId === 'string' ? data.activeSessionId : null;

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const studioData: StudioBackupData = {
    patterns: validPatterns,
    packs: validPacks,
    sessions: validSessions,
    activeSessionId,
  };

  const validatedBackup: StudioBackup = {
    format: 'cloudpedagogy-thinking-studio-backup',
    version: 1,
    exportedAt: typeof backup.exportedAt === 'string' ? backup.exportedAt : new Date().toISOString(),
    data: studioData,
  };

  return { valid: true, errors: [], warnings, data: validatedBackup };
}


