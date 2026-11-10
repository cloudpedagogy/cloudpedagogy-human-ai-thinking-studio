import test from 'node:test';
import assert from 'node:assert/strict';
import { corePack } from '../../src/data/corePack';
import { useStore } from '../../src/store/useStore';
import { generateMarkdown } from '../../src/utils/exportUtils';
import type { PatternPack, ThinkingPattern } from '../../src/types';

// Helper to reset store to pristine state
function resetStore() {
  useStore.setState({
    patterns: [...corePack.patterns],
    packs: [corePack],
    sessions: [],
    activeSessionId: null,
  });
}

test('store initializes with 32 core patterns and 9 categories for new users', () => {
  resetStore();
  const state = useStore.getState();
  assert.equal(state.patterns.length, 32);
  const categories = new Set(state.patterns.map((p) => p.category));
  assert.equal(categories.size, 9);
});

test('importPack: "keep" strategy adds only new patterns and preserves existing ones', () => {
  resetStore();
  const initialCount = useStore.getState().patterns.length;

  const samplePack: PatternPack = {
    pack_name: 'Test Keep Pack',
    version: '1.0',
    patterns: [
      {
        id: 'trade-off-analysis', // Existing core pattern ID
        name: 'Attempted Overwrite Name',
        category: 'Decision Making',
        purpose: 'Should not overwrite',
        when_to_use: [],
        thinking_questions: [],
        ai_prompts: [],
        reflection_questions: [],
      },
      {
        id: 'brand-new-pattern-1',
        name: 'Brand New Pattern',
        category: 'Custom Category',
        purpose: 'Brand new pattern',
        when_to_use: ['Testing'],
        thinking_questions: ['Why?'],
        ai_prompts: [],
        reflection_questions: [],
      },
    ],
  };

  useStore.getState().importPack(samplePack, 'keep');

  const state = useStore.getState();
  assert.equal(state.patterns.length, initialCount + 1);

  // Existing pattern was NOT overwritten
  const corePattern = state.patterns.find((p) => p.id === 'trade-off-analysis');
  assert.equal(corePattern?.name, 'Trade-off Analysis');

  // New pattern WAS added
  const newPattern = state.patterns.find((p) => p.id === 'brand-new-pattern-1');
  assert.ok(newPattern);
  assert.equal(newPattern?.name, 'Brand New Pattern');
});

test('importPack: "merge" strategy updates matching patterns and adds new ones', () => {
  resetStore();
  const initialCount = useStore.getState().patterns.length;

  const samplePack: PatternPack = {
    pack_name: 'Test Merge Pack',
    version: '1.0',
    patterns: [
      {
        id: 'trade-off-analysis', // Existing core pattern ID
        name: 'Updated Trade-off Analysis',
        category: 'Decision Making',
        purpose: 'Updated purpose via merge',
        when_to_use: ['Now'],
        thinking_questions: ['Updated Q?'],
        ai_prompts: [],
        reflection_questions: [],
      },
      {
        id: 'brand-new-pattern-merge',
        name: 'Brand New Pattern Merge',
        category: 'Custom Category',
        purpose: 'Brand new pattern',
        when_to_use: ['Testing'],
        thinking_questions: ['Why?'],
        ai_prompts: [],
        reflection_questions: [],
      },
    ],
  };

  useStore.getState().importPack(samplePack, 'merge');

  const state = useStore.getState();
  assert.equal(state.patterns.length, initialCount + 1);

  // Existing pattern WAS updated
  const updatedPattern = state.patterns.find((p) => p.id === 'trade-off-analysis');
  assert.equal(updatedPattern?.name, 'Updated Trade-off Analysis');
  assert.equal(updatedPattern?.purpose, 'Updated purpose via merge');

  // New pattern was added
  const newPattern = state.patterns.find((p) => p.id === 'brand-new-pattern-merge');
  assert.ok(newPattern);
});

test('importPack: "replace" strategy replaces library with imported pack without deleting sessions', () => {
  resetStore();

  // Create an active session first
  const sessionId = useStore.getState().createSession('trade-off-analysis');
  assert.equal(useStore.getState().sessions.length, 1);

  const singlePatternPack: PatternPack = {
    pack_name: 'Single Pattern Pack',
    version: '2.0',
    patterns: [
      {
        id: 'solo-pattern',
        name: 'Solo Pattern',
        category: 'Focused Thinking',
        purpose: 'Sole pattern after replacement',
        when_to_use: ['Testing replace'],
        thinking_questions: ['Is this the only pattern?'],
        ai_prompts: [],
        reflection_questions: [],
      },
    ],
  };

  useStore.getState().importPack(singlePatternPack, 'replace');

  const state = useStore.getState();
  // Exactly 1 pattern in library now
  assert.equal(state.patterns.length, 1);
  assert.equal(state.patterns[0].id, 'solo-pattern');

  // Existing session is preserved and not deleted
  assert.equal(state.sessions.length, 1);
  assert.equal(state.sessions[0].id, sessionId);
});

test('deletePattern removes pattern without automatic resurrection', () => {
  resetStore();
  const initialCount = useStore.getState().patterns.length;

  useStore.getState().deletePattern('trade-off-analysis');

  const state = useStore.getState();
  assert.equal(state.patterns.length, initialCount - 1);
  assert.equal(state.patterns.some((p) => p.id === 'trade-off-analysis'), false);
});

test('restoreCorePack restores all 32 core patterns while keeping custom patterns', () => {
  resetStore();

  const customPattern: ThinkingPattern = {
    id: 'user-custom-pattern',
    name: 'User Custom Pattern',
    category: 'Custom Category',
    purpose: 'Should survive restoreCorePack',
    when_to_use: [],
    thinking_questions: [],
    ai_prompts: [],
    reflection_questions: [],
  };

  useStore.getState().addPattern(customPattern);
  useStore.getState().deletePattern('trade-off-analysis');

  assert.equal(useStore.getState().patterns.some((p) => p.id === 'trade-off-analysis'), false);
  assert.equal(useStore.getState().patterns.some((p) => p.id === 'user-custom-pattern'), true);

  useStore.getState().restoreCorePack();

  const state = useStore.getState();
  // 32 core patterns + 1 custom pattern = 33 patterns
  assert.equal(state.patterns.length, 33);
  assert.equal(state.patterns.some((p) => p.id === 'trade-off-analysis'), true);
  assert.equal(state.patterns.some((p) => p.id === 'user-custom-pattern'), true);
});

test('createSession generates unique session IDs and records initial state', () => {
  resetStore();
  const id1 = useStore.getState().createSession('trade-off-analysis');
  const id2 = useStore.getState().createSession('trade-off-analysis');

  assert.notEqual(id1, id2);
  const state = useStore.getState();
  assert.equal(state.sessions.length, 2);
  assert.equal(state.activeSessionId, id2);
});

test('addPattern, updatePattern, and deletePattern manage custom patterns predictably', () => {
  resetStore();
  const initialCount = useStore.getState().patterns.length;

  const newPattern: ThinkingPattern = {
    id: 'custom-lifecycle-pattern',
    name: 'Custom Lifecycle Pattern',
    category: 'Risk Thinking',
    purpose: 'Initial purpose',
    when_to_use: ['Phase 1'],
    thinking_questions: ['Question 1?'],
    ai_prompts: ['Prompt 1'],
    reflection_questions: ['Reflection 1?'],
  };

  // 1. Add pattern
  useStore.getState().addPattern(newPattern);
  let state = useStore.getState();
  assert.equal(state.patterns.length, initialCount + 1);
  assert.equal(state.patterns.find((p) => p.id === 'custom-lifecycle-pattern')?.name, 'Custom Lifecycle Pattern');

  // 2. Update pattern
  useStore.getState().updatePattern('custom-lifecycle-pattern', {
    name: 'Updated Pattern Name',
    purpose: 'Updated purpose text',
  });
  state = useStore.getState();
  const updated = state.patterns.find((p) => p.id === 'custom-lifecycle-pattern');
  assert.equal(updated?.name, 'Updated Pattern Name');
  assert.equal(updated?.purpose, 'Updated purpose text');
  // Unchanged fields preserved
  assert.deepEqual(updated?.when_to_use, ['Phase 1']);

  // 3. Delete pattern
  useStore.getState().deletePattern('custom-lifecycle-pattern');
  state = useStore.getState();
  assert.equal(state.patterns.length, initialCount);
  assert.equal(state.patterns.some((p) => p.id === 'custom-lifecycle-pattern'), false);
});

test('session response and context updates persist all inputs accurately', () => {
  resetStore();
  const sessionId = useStore.getState().createSession('trade-off-analysis');

  // Update context
  useStore.getState().updateSession(sessionId, {
    decision_context: {
      problem: 'Which architecture to adopt?',
      options: 'Serverless vs Containerized',
      why_matters: 'Affects operational overhead and latency',
    },
  });

  // Update responses
  useStore.getState().updateSessionResponses(sessionId, {
    q_0: 'Serverless requires lower maintenance.',
    q_1: 'Containerized allows local parity.',
  });

  // Update reflections
  useStore.getState().updateSessionReflections(sessionId, {
    r_0: 'We must also consider team familiarity.',
  });

  // Update notes
  useStore.getState().updateSessionNotes(sessionId, 'Meeting notes with engineering lead.');

  const session = useStore.getState().sessions.find((s) => s.id === sessionId);
  assert.ok(session);
  assert.equal(session?.decision_context.problem, 'Which architecture to adopt?');
  assert.equal(session?.decision_context.options, 'Serverless vs Containerized');
  assert.equal(session?.decision_context.why_matters, 'Affects operational overhead and latency');
  assert.equal(session?.responses.q_0, 'Serverless requires lower maintenance.');
  assert.equal(session?.responses.q_1, 'Containerized allows local parity.');
  assert.equal(session?.reflections.r_0, 'We must also consider team familiarity.');
  assert.equal(session?.notes, 'Meeting notes with engineering lead.');
});

test('deleteSession removes session and clears activeSessionId if active', () => {
  resetStore();
  const id1 = useStore.getState().createSession('trade-off-analysis');
  const id2 = useStore.getState().createSession('trade-off-analysis');

  assert.equal(useStore.getState().activeSessionId, id2);
  assert.equal(useStore.getState().sessions.length, 2);

  // Delete active session
  useStore.getState().deleteSession(id2);
  let state = useStore.getState();
  assert.equal(state.sessions.length, 1);
  assert.equal(state.sessions[0].id, id1);
  assert.equal(state.activeSessionId, null);

  // Delete remaining session
  useStore.getState().deleteSession(id1);
  state = useStore.getState();
  assert.equal(state.sessions.length, 0);
  assert.equal(state.activeSessionId, null);
});

test('generateMarkdown formats structured reasoning, context, and reflections into Markdown', () => {
  resetStore();
  const pattern = corePack.patterns[0]; // Trade-off Analysis
  const sessionId = useStore.getState().createSession(pattern.id);

  useStore.getState().updateSession(sessionId, {
    decision_context: {
      problem: 'Select Database Solution',
      options: 'PostgreSQL vs DynamoDB',
      why_matters: 'Scalability vs relational consistency',
    },
  });
  useStore.getState().updateSessionResponses(sessionId, {
    q_0: 'Postgres offers rich joins; Dynamo offers horizontal auto-scale.',
  });
  useStore.getState().updateSessionReflections(sessionId, {
    r_0: 'Dynamo requires careful access pattern planning.',
  });

  const session = useStore.getState().sessions.find((s) => s.id === sessionId);
  assert.ok(session);

  const markdown = generateMarkdown(pattern, session!);
  assert.ok(markdown.includes(`# ${pattern.name}`));
  assert.ok(markdown.includes('Select Database Solution'));
  assert.ok(markdown.includes('PostgreSQL vs DynamoDB'));
  assert.ok(markdown.includes('Scalability vs relational consistency'));
  assert.ok(markdown.includes('Postgres offers rich joins; Dynamo offers horizontal auto-scale.'));
  assert.ok(markdown.includes('Dynamo requires careful access pattern planning.'));
});

