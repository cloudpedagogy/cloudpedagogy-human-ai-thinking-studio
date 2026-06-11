import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowRight, BrainCircuit, CheckCircle2 } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

export const Wizard: React.FC = () => {
  const [step, setStep] = useState<Step>(1);
  const [goal, setGoal] = useState<string | null>(null);
  const [situation, setSituation] = useState<string | null>(null);
  const [help, setHelp] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const patterns = useStore(state => state.patterns);
  const createSession = useStore(state => state.createSession);

  const goals = [
    'Make a decision', 'Assess a risk', 'Review an AI output',
    'Design a workflow', 'Evaluate evidence', 'Reflect on an outcome',
    'Challenge assumptions', 'Design a course', 'Plan a project'
  ];

  const situations = [
    'Strategic', 'Operational', 'Research',
    'Educational', 'Governance', 'Personal', 'Organisational'
  ];

  const helps = [
    'Clarify the problem', 'Compare options', 'Challenge assumptions',
    'Identify risks', 'Consider stakeholders', 'Evaluate evidence', 'Reflect on outcomes'
  ];

  const getRecommendations = () => {
    // Scoring system based on the selections to rank patterns
    const scoredPatterns = patterns.map(p => {
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

      // Random tiebreaker to avoid same exact list
      score += Math.random() * 0.5;

      return { pattern: p, score };
    });

    scoredPatterns.sort((a, b) => b.score - a.score);
    
    return {
      bestMatch: scoredPatterns[0]?.pattern,
      suggestions: scoredPatterns.slice(1, 4).map(s => s.pattern)
    };
  };

  const startSession = (patternId: string) => {
    const sessionId = createSession(patternId);
    navigate(`/workspace/${sessionId}`);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-8">
      <div className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl mb-4">
          <BrainCircuit size={48} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Think better with AI.
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Structured reasoning for human judgement in AI-supported environments.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        {/* Progress Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`flex-1 py-3 px-4 text-sm font-medium border-r last:border-r-0 border-slate-200 dark:border-slate-700 transition-colors duration-300 ${
                step >= s ? 'text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-800' : 'text-slate-400'
              }`}
            >
              Step {s}
            </div>
          ))}
        </div>

        <div className="p-8 md:p-12 min-h-[400px]">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">What are you trying to do?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {goals.map(option => (
                  <button
                    key={option}
                    onClick={() => { setGoal(option); setStep(2); }}
                    className={`p-6 text-left border-2 rounded-xl transition-all duration-200 group ${
                      goal === option 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    <div className="font-bold text-lg">{option}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">What kind of situation is this?</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {situations.map(option => (
                  <button
                    key={option}
                    onClick={() => { setSituation(option); setStep(3); }}
                    className={`p-4 text-center border-2 rounded-xl font-medium transition-all duration-200 ${
                      situation === option 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="mt-8 text-slate-500 hover:text-slate-800 underline text-sm">Go back</button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold mb-6">What would be most helpful?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {helps.map(option => (
                  <button
                    key={option}
                    onClick={() => { setHelp(option); setStep(4); }}
                    className={`p-4 text-left border-2 rounded-xl font-medium transition-all duration-200 ${
                      help === option 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="mt-8 text-slate-500 hover:text-slate-800 underline text-sm">Go back</button>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-8">
                <CheckCircle2 className="text-green-500" size={32} />
                <h2 className="text-2xl font-bold">Recommended Thinking Patterns</h2>
              </div>
              
              {(() => {
                const recs = getRecommendations();
                return (
                  <div className="space-y-8">
                    {/* Best Match */}
                    {recs.bestMatch && (
                      <div>
                        <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-4">Best Match</h3>
                        <div className="border-2 border-primary-400 dark:border-primary-600 bg-primary-50/50 dark:bg-primary-900/10 rounded-2xl p-8 shadow-lg">
                          <div className="flex justify-between items-start flex-col sm:flex-row gap-6">
                            <div>
                              <div className="text-sm font-semibold text-slate-500 mb-1">{recs.bestMatch.category}</div>
                              <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">{recs.bestMatch.name}</h3>
                              <p className="text-slate-700 dark:text-slate-300 text-lg">{recs.bestMatch.purpose}</p>
                            </div>
                            <button 
                              onClick={() => startSession(recs.bestMatch.id)}
                              className="shrink-0 flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md w-full sm:w-auto justify-center"
                            >
                              Use Pattern <ArrowRight size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    {recs.suggestions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Additional Suggestions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {recs.suggestions.map(pattern => (
                            <div key={pattern.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-shadow bg-white dark:bg-slate-800 flex flex-col">
                              <div className="flex-1 mb-4">
                                <div className="text-xs font-semibold text-primary-600 mb-1">{pattern.category}</div>
                                <h4 className="text-lg font-bold mb-2 text-slate-900 dark:text-white leading-tight">{pattern.name}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{pattern.purpose}</p>
                              </div>
                              <button 
                                onClick={() => startSession(pattern.id)}
                                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-lg font-medium transition-colors w-full"
                              >
                                Select <ArrowRight size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
              
              <button onClick={() => setStep(1)} className="mt-12 text-slate-500 hover:text-slate-800 underline text-sm">Start over</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
