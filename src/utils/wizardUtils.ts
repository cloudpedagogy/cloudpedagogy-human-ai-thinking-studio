import type { ThinkingPattern } from '../types';

export interface ScoredPattern {
  pattern: ThinkingPattern;
  score: number;
}

export interface WizardRecommendations {
  bestMatch?: ThinkingPattern;
  suggestions: ThinkingPattern[];
}

/**
 * Deterministically ranks thinking patterns based on user goal, situation, and help requirements.
 * Employs stable lexicographical tie-breaking by pattern name and ID to guarantee reproducible results.
 */
export function rankWizardPatterns(
  patterns: ThinkingPattern[],
  goal: string | null,
  situation: string | null,
  help: string | null
): WizardRecommendations {
  const scoredPatterns: ScoredPattern[] = patterns.map((p) => {
    let score = 0;
    const t = [p.name, p.purpose, p.category, ...(p.when_to_use || [])].join(' ').toLowerCase();

    // Goal matching
    if (goal === 'Make a decision' && t.includes('decision')) score += 3;
    if (goal === 'Assess a risk' && t.includes('risk')) score += 3;
    if (goal === 'Evaluate evidence' && t.includes('evidence')) score += 3;
    if (goal === 'Challenge assumptions' && t.includes('assumption')) score += 3;
    if (goal === 'Reflect on an outcome' && t.includes('reflection')) score += 3;
    if (goal === 'Design a course' && t.includes('curriculum')) score += 3;
    if (goal === 'Design a workflow' && t.includes('system')) score += 3;
    if (goal === 'Plan a project' && t.includes('plan')) score += 2;
    if (goal === 'Review an AI output' && t.includes('critical')) score += 2;

    // Situation matching
    if (situation === 'Educational' && t.includes('curriculum')) score += 2;
    if (situation === 'Governance' && t.includes('governance')) score += 2;
    if (situation === 'Strategic' && t.includes('strategy')) score += 2;
    if (situation === 'Research' && t.includes('research')) score += 2;

    // Help matching
    if (help === 'Identify risks' && t.includes('risk')) score += 3;
    if (help === 'Consider stakeholders' && t.includes('stakeholder')) score += 3;
    if (help === 'Compare options' && t.includes('trade-off')) score += 3;
    if (help === 'Challenge assumptions' && t.includes('assumption')) score += 3;
    if (help === 'Reflect on outcomes' && t.includes('reflection')) score += 3;
    if (help === 'Evaluate evidence' && t.includes('evidence')) score += 3;

    return { pattern: p, score };
  });

  // Deterministic sorting with stable tie-breaking
  scoredPatterns.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const nameComp = a.pattern.name.localeCompare(b.pattern.name);
    return nameComp !== 0 ? nameComp : a.pattern.id.localeCompare(b.pattern.id);
  });

  return {
    bestMatch: scoredPatterns[0]?.pattern,
    suggestions: scoredPatterns.slice(1, 4).map((s) => s.pattern),
  };
}

