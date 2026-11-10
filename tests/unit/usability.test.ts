import test from 'node:test';
import assert from 'node:assert/strict';
import { corePack } from '../../src/data/corePack';
import { rankWizardPatterns } from '../../src/utils/wizardUtils';
import type { ThinkingPattern } from '../../src/types';

test('Wizard ranking produces deterministic recommendations for identical inputs', () => {
  const goal = 'Make a decision';
  const situation = 'Strategic';
  const help = 'Compare options';

  const run1 = rankWizardPatterns(corePack.patterns, goal, situation, help);
  const run2 = rankWizardPatterns(corePack.patterns, goal, situation, help);

  assert.ok(run1.bestMatch);
  assert.ok(run2.bestMatch);
  assert.equal(run1.bestMatch?.id, run2.bestMatch?.id);
  assert.equal(run1.suggestions.length, run2.suggestions.length);
  for (let i = 0; i < run1.suggestions.length; i++) {
    assert.equal(run1.suggestions[i].id, run2.suggestions[i].id);
  }
});

test('Wizard tie-breaking resolves identical scores stably by name and ID', () => {
  const tiePatterns: ThinkingPattern[] = [
    {
      id: 'pattern-z',
      name: 'Alpha Pattern',
      category: 'Decision Making',
      purpose: 'Identical purpose',
      when_to_use: [],
      thinking_questions: [],
      ai_prompts: [],
      reflection_questions: [],
    },
    {
      id: 'pattern-a',
      name: 'Beta Pattern',
      category: 'Decision Making',
      purpose: 'Identical purpose',
      when_to_use: [],
      thinking_questions: [],
      ai_prompts: [],
      reflection_questions: [],
    },
    {
      id: 'pattern-b',
      name: 'Alpha Pattern',
      category: 'Decision Making',
      purpose: 'Identical purpose',
      when_to_use: [],
      thinking_questions: [],
      ai_prompts: [],
      reflection_questions: [],
    },
  ];

  // No criteria selected: all patterns receive score 0
  const result = rankWizardPatterns(tiePatterns, null, null, null);

  // 'Alpha Pattern' comes before 'Beta Pattern'
  // Between the two 'Alpha Pattern' entries: 'pattern-b' comes before 'pattern-z'
  assert.equal(result.bestMatch?.id, 'pattern-b');
  assert.equal(result.bestMatch?.name, 'Alpha Pattern');
  assert.equal(result.suggestions[0]?.id, 'pattern-z');
  assert.equal(result.suggestions[1]?.id, 'pattern-a');
});

test('Category filter logic filters patterns accurately', () => {
  const allPatterns = corePack.patterns;

  // Filter: 'All'
  const filterAll = (category: string) =>
    allPatterns.filter((p) => category === 'All' || p.category === category);

  assert.equal(filterAll('All').length, 32);

  // Filter: 'Decision Making'
  const decisionPatterns = filterAll('Decision Making');
  assert.equal(decisionPatterns.length, 3);
  assert.ok(decisionPatterns.every((p) => p.category === 'Decision Making'));

  // Filter: 'Curriculum Thinking'
  const curriculumPatterns = filterAll('Curriculum Thinking');
  assert.equal(curriculumPatterns.length, 4);
  assert.ok(curriculumPatterns.every((p) => p.category === 'Curriculum Thinking'));
});

