import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  Printer,
  Download,
  Save,
  MessageSquare,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  Users,
  FastForward,
  Activity,
  AlertCircle,
  Link2,
} from 'lucide-react';
import { generateMarkdown, downloadTextFile } from '../utils/exportUtils';
import { corePack } from '../data/corePack';
import type { ThinkingPattern } from '../types';

export const PatternWorkspace: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const sessions = useStore((state) => state.sessions);
  const patterns = useStore((state) => state.patterns);
  const setActiveSession = useStore((state) => state.setActiveSession);
  const updateSession = useStore((state) => state.updateSession);
  const updateSessionResponses = useStore((state) => state.updateSessionResponses);
  const updateSessionReflections = useStore((state) => state.updateSessionReflections);
  const relinkSessionPattern = useStore((state) => state.relinkSessionPattern);
  const storageStatus = useStore((state) => state.storageStatus);
  const storageErrorMessage = useStore((state) => state.storageErrorMessage);

  const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null);

  useEffect(() => {
    if (sessionId) setActiveSession(sessionId);
    return () => setActiveSession(null);
  }, [sessionId, setActiveSession]);

  const session = sessions.find((s) => s.id === sessionId);

  if (!session) {
    return (
      <div className="p-12 text-center text-slate-500">
        Workspace session not found.
        <br />
        <button onClick={() => navigate('/')} className="mt-4 text-primary-500 underline font-medium">
          Return to Guide
        </button>
      </div>
    );
  }

  // Pattern resolution precedence:
  // 1. Session's embedded pattern snapshot (if present)
  // 2. Active pattern from store matching patternId
  // 3. Core pack pattern matching patternId
  // 4. Fallback recovery pattern (preserving user responses when original pattern was deleted/untraceable)
  const isOriginalPatternInLibrary = patterns.some((p) => p.id === session.patternId);
  const isOriginalPatternInCore = corePack.patterns.some((p) => p.id === session.patternId);
  const isPatternMissing = !session.pattern_snapshot && !isOriginalPatternInLibrary && !isOriginalPatternInCore;

  const pattern: ThinkingPattern =
    session.pattern_snapshot ||
    patterns.find((p) => p.id === session.patternId) ||
    corePack.patterns.find((p) => p.id === session.patternId) || {
      id: session.patternId,
      name: `Unlinked Pattern (${session.patternId})`,
      category: 'Archived',
      purpose:
        'The original pattern definition is not in your current active library. All your recorded responses, problem context, and reflections are preserved below.',
      when_to_use: [],
      thinking_questions: Object.keys(session.responses || {}).map(
        (k, i) => `Saved Question ${i + 1} [${k}]`
      ),
      stakeholder_questions: Object.keys(session.stakeholder_responses || {}).map(
        (k, i) => `Saved Stakeholder Lens ${i + 1} [${k}]`
      ),
      second_order_questions: Object.keys(session.second_order_responses || {}).map(
        (k, i) => `Saved Second-Order Effect ${i + 1} [${k}]`
      ),
      ai_prompts: [],
      reflection_questions: Object.keys(session.reflections || {}).map(
        (k, i) => `Saved Reflection ${i + 1} [${k}]`
      ),
      confidence_questions: Object.keys(session.confidence_responses || {}).map(
        (k, i) => `Saved Confidence Item ${i + 1} [${k}]`
      ),
    };

  const handleContextChange = (field: keyof typeof session.decision_context, value: string) => {
    updateSession(session.id, {
      decision_context: { ...session.decision_context, [field]: value },
    });
  };

  const handleResponseChange = (idx: number, value: string) => {
    updateSessionResponses(session.id, { ...session.responses, [`q_${idx}`]: value });
  };

  const handleStakeholderChange = (idx: number, value: string) => {
    updateSession(session.id, {
      stakeholder_responses: { ...session.stakeholder_responses, [`sq_${idx}`]: value },
    });
  };

  const handleSecondOrderChange = (idx: number, value: string) => {
    updateSession(session.id, {
      second_order_responses: { ...session.second_order_responses, [`so_${idx}`]: value },
    });
  };

  const handleReflectionChange = (idx: number, value: string) => {
    updateSessionReflections(session.id, { ...session.reflections, [`r_${idx}`]: value });
  };

  const handleExportMarkdown = () => {
    const md = generateMarkdown(pattern, session);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadTextFile(md, `${pattern.id}-workspace-${dateStr}.md`);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(idx);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 pb-24">
      {/* Storage Operational Alert */}
      {storageStatus !== 'idle' && storageStatus !== 'saved' && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 flex items-start gap-3 no-print">
          <AlertCircle className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" size={20} />
          <div className="text-sm">
            <div className="font-bold mb-1">Storage Alert</div>
            <p>
              {storageErrorMessage || 'Changes cannot currently be saved to browser LocalStorage.'}{' '}
              Please download your workspace using the <strong>Markdown</strong> button before closing this tab.
            </p>
          </div>
        </div>
      )}

      {/* Missing Pattern Recovery Alert */}
      {isPatternMissing && (
        <div className="mb-8 p-5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 no-print">
          <div className="flex items-start gap-3">
            <AlertTriangle className="shrink-0 text-amber-500 mt-0.5" size={22} />
            <div className="flex-1">
              <h3 className="font-bold text-base mb-1">Pattern Definition Missing from Library</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                The original pattern definition (ID: <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-xs">{session.patternId}</code>)
                was removed or replaced from your active pattern library. All of your decision notes, questions, and reflections remain intact below.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Link2 size={14} /> Re-link to an active pattern:
                </span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      relinkSessionPattern(session.id, e.target.value);
                    }
                  }}
                  defaultValue=""
                  className="text-xs py-1.5 px-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none cursor-pointer"
                  aria-label="Re-link session to an active pattern"
                >
                  <option value="" disabled>
                    Select an active pattern...
                  </option>
                  {patterns.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8 no-print">
        <div>
          <div className="text-sm font-bold text-primary-600 mb-1">{pattern.category}</div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{pattern.name}</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm font-medium"
            aria-label="Export workspace session as Markdown"
          >
            <Download size={18} /> <span className="hidden sm:inline">Markdown</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-medium"
            aria-label="Print workspace session or save as PDF"
          >
            <Printer size={18} /> <span className="hidden sm:inline">Print PDF</span>
          </button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="print-only mb-8 pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-extrabold mb-2">{pattern.name}</h1>
        <p className="text-sm text-slate-500">
          Category: {pattern.category} | Date: {new Date(session.timestamp).toLocaleDateString()}
        </p>
      </div>

      {/* Decision / Problem Context */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mb-8 shadow-sm print-page-break-inside-avoid">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Activity className="text-primary-500" /> 1. Decision / Problem Context
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="workspace-problem-input" className="block font-semibold mb-2 text-slate-700 dark:text-slate-300">
              What decision or problem are you working on?
            </label>
            <textarea
              id="workspace-problem-input"
              value={session.decision_context.problem || ''}
              onChange={(e) => handleContextChange('problem', e.target.value)}
              className="w-full h-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y"
            />
          </div>
          <div>
            <label htmlFor="workspace-options-input" className="block font-semibold mb-2 text-slate-700 dark:text-slate-300">
              What options are being considered?
            </label>
            <textarea
              id="workspace-options-input"
              value={session.decision_context.options || ''}
              onChange={(e) => handleContextChange('options', e.target.value)}
              className="w-full h-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y"
            />
          </div>
          <div>
            <label htmlFor="workspace-why-matters-input" className="block font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Why does this matter?
            </label>
            <textarea
              id="workspace-why-matters-input"
              value={session.decision_context.why_matters || ''}
              onChange={(e) => handleContextChange('why_matters', e.target.value)}
              className="w-full h-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y"
            />
          </div>
        </div>
      </div>

      {/* Purpose & When to Use (Only if defined) */}
      {pattern.purpose && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-2xl p-6 mb-8 text-primary-900 dark:text-primary-100 print-page-break-inside-avoid">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="text-primary-500" /> 2. Purpose
          </h2>
          <p className="opacity-90 mb-6">{pattern.purpose}</p>

          {pattern.when_to_use && pattern.when_to_use.length > 0 && (
            <>
              <h3 className="font-bold mb-2">3. When to use</h3>
              <ul className="list-disc list-inside space-y-1 opacity-90">
                {pattern.when_to_use.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Thinking Questions */}
      {pattern.thinking_questions && pattern.thinking_questions.length > 0 && (
        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
            <AlertTriangle className="text-orange-500" /> 4. Structured Reasoning
          </h2>
          {pattern.thinking_questions.map((q, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 print-page-break-inside-avoid"
            >
              <label htmlFor={`thinking-q-${idx}`} className="block font-bold text-lg mb-3 text-slate-800 dark:text-slate-100">
                {q}
              </label>
              <textarea
                id={`thinking-q-${idx}`}
                value={session.responses[`q_${idx}`] || ''}
                onChange={(e) => handleResponseChange(idx, e.target.value)}
                placeholder="Your thinking..."
                className="w-full h-28 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y transition-shadow"
              />
            </div>
          ))}
        </div>
      )}

      {/* Stakeholder Lens */}
      {pattern.stakeholder_questions && pattern.stakeholder_questions.length > 0 && (
        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
            <Users className="text-purple-500" /> 5. Stakeholder Lens
          </h2>
          {pattern.stakeholder_questions.map((q, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 print-page-break-inside-avoid"
            >
              <label htmlFor={`stakeholder-sq-${idx}`} className="block font-bold text-lg mb-3 text-slate-800 dark:text-slate-100">
                {q}
              </label>
              <textarea
                id={`stakeholder-sq-${idx}`}
                value={session.stakeholder_responses[`sq_${idx}`] || ''}
                onChange={(e) => handleStakeholderChange(idx, e.target.value)}
                placeholder="Consider the stakeholders..."
                className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-y transition-shadow"
              />
            </div>
          ))}
        </div>
      )}

      {/* Second Order Effects */}
      {pattern.second_order_questions && pattern.second_order_questions.length > 0 && (
        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
            <FastForward className="text-teal-500" /> 6. Second-Order Effects
          </h2>
          {pattern.second_order_questions.map((q, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 print-page-break-inside-avoid"
            >
              <label htmlFor={`second-order-so-${idx}`} className="block font-bold text-lg mb-3 text-slate-800 dark:text-slate-100">
                {q}
              </label>
              <textarea
                id={`second-order-so-${idx}`}
                value={session.second_order_responses[`so_${idx}`] || ''}
                onChange={(e) => handleSecondOrderChange(idx, e.target.value)}
                placeholder="Look past the immediate consequences..."
                className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-y transition-shadow"
              />
            </div>
          ))}
        </div>
      )}

      {/* AI Prompts */}
      {pattern.ai_prompts && pattern.ai_prompts.length > 0 && (
        <div className="mb-12 no-print">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
            <MessageSquare className="text-blue-500" /> 7. AI Companion Prompts
          </h2>
          <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
              These prompts support your thinking rather than replacing it. Copy them into your preferred AI tool.
            </p>
            <div className="space-y-3">
              {pattern.ai_prompts.map((prompt, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 items-start bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex-1 text-slate-800 dark:text-slate-200 font-mono text-sm leading-relaxed">
                    {prompt}
                  </div>
                  <button
                    onClick={() => copyToClipboard(prompt, idx)}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-md transition-colors"
                    title="Copy prompt"
                    aria-label="Copy AI companion prompt"
                  >
                    {copiedPrompt === idx ? <Check className="text-green-500" size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reflection */}
      {pattern.reflection_questions && pattern.reflection_questions.length > 0 && (
        <div className="space-y-6 mb-12 print-page-break">
          <h2 className="text-2xl font-bold mb-6">8. Reflection</h2>
          {pattern.reflection_questions.map((q, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 print-page-break-inside-avoid"
            >
              <label htmlFor={`reflection-r-${idx}`} className="block font-bold text-lg mb-3 text-slate-800 dark:text-slate-100">
                {q}
              </label>
              <textarea
                id={`reflection-r-${idx}`}
                value={session.reflections[`r_${idx}`] || ''}
                onChange={(e) => handleReflectionChange(idx, e.target.value)}
                placeholder="Reflect on your outcome..."
                className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y transition-shadow"
              />
            </div>
          ))}
        </div>
      )}

      {/* Confidence Assessment (Only show if pattern has confidence_questions) */}
      {pattern.confidence_questions && pattern.confidence_questions.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-8 print-page-break-inside-avoid">
          <h2 className="text-2xl font-bold mb-6">9. Confidence Assessment</h2>

          <div className="mb-6">
            <label className="block font-bold mb-4 text-slate-700 dark:text-slate-300">
              Overall confidence level:
            </label>
            <div className="flex gap-4">
              {(['Low', 'Medium', 'High'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => updateSession(session.id, { confidence_level: level })}
                  className={`px-6 py-3 rounded-xl border-2 font-bold transition-colors ${
                    session.confidence_level === level
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {pattern.confidence_questions.map((q, idx) => (
              <div key={idx}>
                <label htmlFor={`confidence-cq-${idx}`} className="block font-bold mb-3 text-slate-700 dark:text-slate-300">{q}</label>
                <textarea
                  id={`confidence-cq-${idx}`}
                  value={session.confidence_responses?.[`cq_${idx}`] || ''}
                  onChange={(e) =>
                    updateSession(session.id, {
                      confidence_responses: {
                        ...(session.confidence_responses || {}),
                        [`cq_${idx}`]: e.target.value,
                      },
                    })
                  }
                  className="w-full h-24 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-slate-500 justify-center no-print mt-12">
        <Save size={16} />
        {storageStatus === 'saved' || storageStatus === 'idle'
          ? 'All changes are saved locally to your browser automatically.'
          : 'Local auto-save is currently restricted. Download your work to preserve changes.'}
      </div>
    </div>
  );
};
