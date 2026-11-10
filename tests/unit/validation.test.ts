import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePattern, validatePatternPack } from '../../src/utils/validation';

test('validatePattern accepts a valid complete pattern', () => {
  const validPattern = {
    id: 'test-pattern-1',
    name: 'Test Pattern',
    category: 'Decision Making',
    purpose: 'Testing purposes',
    when_to_use: ['In automated tests'],
    thinking_questions: ['Does this test pass?'],
    stakeholder_questions: ['Who cares about this test?'],
    second_order_questions: ['What happens next?'],
    ai_prompts: ['Analyze test results.'],
    reflection_questions: ['Was this test comprehensive?'],
    tags: ['testing', 'unit'],
    confidence_questions: ['How confident are you?'],
    metadata: {
      author: 'Tester',
      version: '1.0',
      source: 'Test Suite',
    },
  };

  const result = validatePattern(validPattern, 0);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.data?.id, 'test-pattern-1');
  assert.equal(result.data?.name, 'Test Pattern');
});

test('validatePattern accepts valid minimal pattern and normalizes missing optional arrays', () => {
  const minimalPattern = {
    id: 'minimal-1',
    name: 'Minimal Pattern',
    category: 'Critical Thinking',
    purpose: 'Check minimal requirements',
    when_to_use: ['Always'],
    thinking_questions: ['Why?'],
    ai_prompts: ['Explain.'],
    reflection_questions: ['Did it work?'],
  };

  const result = validatePattern(minimalPattern, 0);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.deepEqual(result.data?.stakeholder_questions, []);
  assert.deepEqual(result.data?.second_order_questions, []);
});

test('validatePattern rejects non-object, missing required fields, or wrong types', () => {
  assert.equal(validatePattern(null).valid, false);
  assert.equal(validatePattern('string').valid, false);
  assert.equal(validatePattern([]).valid, false);

  const missingId = {
    name: 'No ID',
    category: 'Other',
    purpose: 'Invalid',
    when_to_use: [],
    thinking_questions: [],
    ai_prompts: [],
    reflection_questions: [],
  };
  const res1 = validatePattern(missingId);
  assert.equal(res1.valid, false);
  assert.ok(res1.errors.some((e) => e.includes("'id' must be a non-empty string")));

  const nonArrayQuestions = {
    id: 'broken-questions',
    name: 'Broken',
    category: 'Other',
    purpose: 'Invalid',
    when_to_use: ['test'],
    thinking_questions: 'not an array', // Invalid
    ai_prompts: ['test'],
    reflection_questions: ['test'],
  };
  const res2 = validatePattern(nonArrayQuestions);
  assert.equal(res2.valid, false);
  assert.ok(res2.errors.some((e) => e.includes("'thinking_questions' must be an array of strings")));
});

test('validatePatternPack validates sample-pattern-pack.json cleanly', async () => {
  const samplePackModule = await import('../../sample-pattern-pack.json', { with: { type: 'json' } });
  const samplePack = samplePackModule.default;

  const result = validatePatternPack(samplePack);
  assert.equal(result.valid, true, `Validation failed: ${result.errors.join(', ')}`);
  assert.equal(result.data?.patterns.length, 2);
  assert.equal(result.data?.pack_name, 'CloudPedagogy Sample Pack');
});

test('validatePatternPack rejects packs without pack_name, version, or valid patterns', () => {
  assert.equal(validatePatternPack({}).valid, false);
  assert.equal(validatePatternPack({ pack_name: 'test', version: '1.0', patterns: [] }).valid, false);
  assert.equal(validatePatternPack({ pack_name: 'test', version: '1.0', patterns: 'invalid' }).valid, false);
});

test('validatePatternPack deterministically deduplicates intra-pack duplicate pattern IDs', () => {
  const packWithDuplicates = {
    pack_name: 'Duplicate Pack',
    version: '1.0',
    patterns: [
      {
        id: 'dup-1',
        name: 'First Version',
        category: 'Decision Making',
        purpose: 'Original',
        when_to_use: ['Start'],
        thinking_questions: ['Q1'],
        ai_prompts: ['P1'],
        reflection_questions: ['R1'],
      },
      {
        id: 'dup-1', // Duplicate ID
        name: 'Second Version',
        category: 'Decision Making',
        purpose: 'Overwritten version',
        when_to_use: ['Start'],
        thinking_questions: ['Q1'],
        ai_prompts: ['P1'],
        reflection_questions: ['R1'],
      },
      {
        id: 'unique-1',
        name: 'Unique',
        category: 'Risk Thinking',
        purpose: 'Unique',
        when_to_use: ['Always'],
        thinking_questions: ['Q1'],
        ai_prompts: ['P1'],
        reflection_questions: ['R1'],
      },
    ],
  };

  const result = validatePatternPack(packWithDuplicates);
  assert.equal(result.valid, true);
  assert.equal(result.data?.patterns.length, 2);
  assert.equal(result.warnings.length, 1);
  const dupPattern = result.data?.patterns.find((p) => p.id === 'dup-1');
  assert.equal(dupPattern?.name, 'Second Version');
});

