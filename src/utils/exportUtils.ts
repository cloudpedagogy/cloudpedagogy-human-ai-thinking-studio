import type { ThinkingPattern, UserSession, PatternPack } from '../types';

export const generateMarkdown = (pattern: ThinkingPattern, session: UserSession): string => {
  let md = `# ${pattern.name}\n\n`;
  md += `**Category:** ${pattern.category}\n\n`;
  md += `**Date:** ${new Date(session.timestamp).toLocaleDateString()}\n\n`;
  md += `---\n\n`;

  md += `## 1. Decision / Problem Context\n\n`;
  md += `**Problem:**\n${session.decision_context?.problem || '*Not provided*'}\n\n`;
  md += `**Options:**\n${session.decision_context?.options || '*Not provided*'}\n\n`;
  md += `**Why it matters:**\n${session.decision_context?.why_matters || '*Not provided*'}\n\n`;

  md += `## 2. Purpose\n\n${pattern.purpose}\n\n`;

  md += `## 4. Structured Reasoning\n\n`;
  pattern.thinking_questions.forEach((q, idx) => {
    md += `### ${q}\n`;
    md += `${session.responses[`q_${idx}`] || '*No response provided.*'}\n\n`;
  });

  if (pattern.stakeholder_questions && pattern.stakeholder_questions.length > 0) {
    md += `## 5. Stakeholder Lens\n\n`;
    pattern.stakeholder_questions.forEach((q, idx) => {
      md += `### ${q}\n`;
      md += `${session.stakeholder_responses[`sq_${idx}`] || '*No response provided.*'}\n\n`;
    });
  }

  if (pattern.second_order_questions && pattern.second_order_questions.length > 0) {
    md += `## 6. Second-Order Effects\n\n`;
    pattern.second_order_questions.forEach((q, idx) => {
      md += `### ${q}\n`;
      md += `${session.second_order_responses[`so_${idx}`] || '*No response provided.*'}\n\n`;
    });
  }

  md += `## 8. Reflection\n\n`;
  pattern.reflection_questions.forEach((q, idx) => {
    md += `### ${q}\n`;
    md += `${session.reflections[`r_${idx}`] || '*No response provided.*'}\n\n`;
  });

  if (pattern.confidence_questions && pattern.confidence_questions.length > 0) {
    md += `## 9. Confidence Assessment\n\n`;
    md += `**Overall Confidence Level:** ${session.confidence_level || '*Not set*'}\n\n`;
    pattern.confidence_questions.forEach((q, idx) => {
      md += `### ${q}\n`;
      md += `${session.confidence_responses?.[`cq_${idx}`] || '*No response provided.*'}\n\n`;
    });
  } else {
    md += `## 9. Confidence Assessment\n\n`;
    md += `**Overall Confidence Level:** ${session.confidence_level || '*Not set*'}\n\n`;
    md += `**What evidence would increase confidence?**\n${session.confidence_justification || '*No response provided.*'}\n\n`;
  }



  return md;
};

export const downloadTextFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadJsonPack = (pack: PatternPack, filename: string) => {
  const content = JSON.stringify(pack, null, 2);
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
