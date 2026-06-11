export type PatternCategory = 
  | 'Decision Making'
  | 'Critical Thinking'
  | 'Risk Thinking'
  | 'Systems Thinking'
  | 'Stakeholder Analysis'
  | 'Reflection & Learning'
  | 'Research Thinking'
  | 'Curriculum Thinking'
  | 'Governance Thinking'
  | 'Other';

export interface ThinkingPattern {
  id: string;
  name: string;
  category: string; // The primary category mapping
  purpose: string;
  when_to_use: string[];
  thinking_questions: string[];
  stakeholder_questions?: string[];
  second_order_questions?: string[];
  ai_prompts: string[];
  reflection_questions: string[];
  
  // New Optional Schema Enhancements
  tags?: string[];
  confidence_questions?: string[];
  metadata?: {
    author?: string;
    version?: string;
    source?: string;
  };
}

export interface PatternPack {
  pack_name: string;
  version: string;
  patterns: ThinkingPattern[];
}

export interface UserSession {
  id: string;
  patternId: string;
  timestamp: number;
  decision_context: {
    problem: string;
    options: string;
    why_matters: string;
  };
  notes: string;
  responses: Record<string, string>; // q_0: "answer"
  stakeholder_responses: Record<string, string>;
  second_order_responses: Record<string, string>;
  reflections: Record<string, string>;
  
  // Kept for backward compatibility
  confidence_level: 'Low' | 'Medium' | 'High' | null;
  confidence_justification: string;
  
  // New Confidence Assessment format
  confidence_responses?: Record<string, string>;
}
