import type { PatternPack } from '../types';

export const corePack: PatternPack = {
  pack_name: "CloudPedagogy Core Pack",
  version: "1.2",
  patterns: [
    // --- DECISION MAKING ---
    {
      id: "trade-off-analysis",
      name: "Trade-off Analysis",
      category: "Decision Making",
      purpose: "Systematically evaluate what must be given up to gain something else in a decision.",
      when_to_use: [
        "Choosing between mutually exclusive options",
        "Resource allocation decisions",
        "Evaluating competing priorities"
      ],
      thinking_questions: [
        "What are the primary benefits of Option A vs Option B?",
        "What specifically are we giving up by choosing this option?",
        "Are we overvaluing the immediate benefits and undervaluing the long-term costs?"
      ],
      stakeholder_questions: [
        "Who bears the cost of this trade-off?",
        "Who benefits disproportionately?"
      ],
      second_order_questions: [
        "If we accept this trade-off, what precedent does it set for future decisions?"
      ],
      ai_prompts: [
        "Help me construct a trade-off matrix for [Decision].",
        "Play the role of a devil's advocate and critique my preference for [Option]. What am I missing?",
        "Identify hidden costs associated with [Option]."
      ],
      reflection_questions: [
        "Which trade-off was the hardest to accept?",
        "How confident are you that the benefits outweigh the costs?"
      ]
    },
    {
      id: "reversible-irreversible",
      name: "Reversible vs Irreversible",
      category: "Decision Making",
      purpose: "Determine the speed and process required for a decision based on its reversibility.",
      when_to_use: [
        "When feeling paralyzed by a decision",
        "When deciding how much time to spend gathering data"
      ],
      thinking_questions: [
        "If this decision turns out to be wrong, can we undo it?",
        "How much time, money, and political capital would it cost to reverse?",
        "If it is highly reversible, why are we waiting? Can we just test it?"
      ],
      stakeholder_questions: [
        "Who would be harmed if we reverse this decision later?",
        "Have we consulted the right experts for irreversible aspects?"
      ],
      second_order_questions: [
        "Does a reversible decision become irreversible over time due to sunk costs?"
      ],
      ai_prompts: [
        "Analyze this decision: [Decision]. Classify it as highly reversible, somewhat reversible, or highly irreversible.",
        "How can we structure this decision to make it more reversible or modular?"
      ],
      reflection_questions: [
        "Did treating this as a [reversible/irreversible] decision change how you approached it?"
      ]
    },
    {
      id: "opportunity-cost",
      name: "Opportunity Cost",
      category: "Decision Making",
      purpose: "Evaluate the value of the next best alternative forgone as the result of making a decision.",
      when_to_use: [
        "Committing to a long-term project",
        "Spending a significant budget"
      ],
      thinking_questions: [
        "If we don't do this, what else could we do with these resources?",
        "Is the return on this investment higher than our next best option?",
        "Are we doing this just because we started it?"
      ],
      stakeholder_questions: [
        "Which stakeholders miss out because resources are tied up here?"
      ],
      second_order_questions: [
        "How does committing these resources now limit our agility in six months?"
      ],
      ai_prompts: [
        "List 3 highly contrasting alternative uses for [Resources].",
        "Help me calculate the invisible opportunity cost of [Project]."
      ],
      reflection_questions: [
        "Are you comfortable sacrificing the alternatives to pursue this?"
      ]
    },

    // --- CRITICAL THINKING ---
    {
      id: "assumption-audit",
      name: "Assumption Audit",
      category: "Critical Thinking",
      purpose: "Reveal hidden assumptions before acting.",
      when_to_use: [
        "Starting a new project",
        "Evaluating a policy proposal",
        "When consensus forms too quickly"
      ],
      thinking_questions: [
        "What must be true for this idea to work?",
        "Which of our assumptions have no actual evidence supporting them?",
        "What if the opposite of our core assumption is actually true?"
      ],
      stakeholder_questions: [
        "Who is making these assumptions and what are their biases?",
        "Whose lived experience contradicts our assumptions?"
      ],
      second_order_questions: [
        "If our primary assumption is wrong, what chain reaction of failures occurs?"
      ],
      ai_prompts: [
        "Read this proposal and identify 5 hidden assumptions I might be making: [Proposal text].",
        "Generate a scenario where these assumptions completely fail."
      ],
      reflection_questions: [
        "Which assumption surprised you the most once it was articulated?"
      ]
    },
    {
      id: "steel-manning",
      name: "Steel-Manning",
      category: "Critical Thinking",
      purpose: "Construct the strongest possible version of an opposing argument before dismissing it.",
      when_to_use: [
        "Encountering strong pushback on a proposal",
        "Engaging in a debate over policy"
      ],
      thinking_questions: [
        "What is the most generous interpretation of the opposing view?",
        "What evidence do they have that we are ignoring?",
        "If they are entirely right, what are we missing?"
      ],
      stakeholder_questions: [
        "Why does the opposing group care so deeply about this?",
        "What are their underlying values and fears?"
      ],
      second_order_questions: [
        "If we ignore their valid points, how will this affect long-term trust?"
      ],
      ai_prompts: [
        "Act as an expert who vehemently disagrees with my proposal: [Proposal]. Write a compelling argument against it.",
        "Help me rewrite this critique into the strongest possible 'steel man' argument."
      ],
      reflection_questions: [
        "How did strengthening the counter-argument change your original position?"
      ]
    },
    {
      id: "blind-spot-identification",
      name: "Blind Spot Identification",
      category: "Critical Thinking",
      purpose: "Actively search for missing perspectives and information gaps.",
      when_to_use: [
        "When an argument feels 'too perfect'",
        "Reviewing a finalized plan"
      ],
      thinking_questions: [
        "What questions are we deliberately not asking?",
        "What data do we consistently ignore because it contradicts our theory?",
        "What expertise is entirely missing from our team?"
      ],
      stakeholder_questions: [
        "Who would immediately see the flaw in this logic?",
        "Are we relying entirely on people who agree with us?"
      ],
      second_order_questions: [
        "If this blind spot remains, when will it cause a crisis?"
      ],
      ai_prompts: [
        "Review this plan: [Plan]. Identify 3 significant blind spots.",
        "What domain expertise am I lacking to fully evaluate this problem?"
      ],
      reflection_questions: [
        "How can we systemize blind spot checking in our normal workflow?"
      ]
    },

    // --- RISK THINKING ---
    {
      id: "pre-mortem",
      name: "Pre-Mortem",
      category: "Risk Thinking",
      purpose: "Identify potential failures before they happen by imagining a future disaster.",
      when_to_use: [
        "Project kickoff",
        "Before launching a new policy or feature"
      ],
      thinking_questions: [
        "Imagine it is one year from now and this project was a spectacular failure. What went wrong?",
        "What single point of failure caused the collapse?",
        "What were the early warning signs we ignored?"
      ],
      stakeholder_questions: [
        "Who tried to warn us, and why didn't we listen?",
        "Who was harmed most by the failure?"
      ],
      second_order_questions: [
        "What cascading failures occurred after the initial breakdown?"
      ],
      ai_prompts: [
        "Act as an investigative journalist looking back at the failure of [Project]. Write an article explaining why it failed.",
        "Generate a list of 10 plausible failure modes for [Project] based on historical examples."
      ],
      reflection_questions: [
        "What mitigation strategies will you implement immediately based on this exercise?"
      ]
    },
    {
      id: "risk-amplifiers",
      name: "Risk Amplifiers",
      category: "Risk Thinking",
      purpose: "Identify the contextual factors that could turn a minor issue into a major crisis.",
      when_to_use: [
        "Evaluating system architecture",
        "Designing crisis response plans"
      ],
      thinking_questions: [
        "What conditions make this risk 10x worse? (e.g., timing, scale, public attention)",
        "Is there tight coupling that causes failures to spread rapidly?",
        "Are we relying on humans to perform perfectly under stress?"
      ],
      stakeholder_questions: [
        "Which stakeholders have the power to amplify the negative impact?"
      ],
      second_order_questions: [
        "How does media or social perception accelerate the damage?"
      ],
      ai_prompts: [
        "Identify potential 'risk amplifiers' for this scenario: [Scenario].",
        "Suggest ways to decouple systems to prevent cascading failures in [System]."
      ],
      reflection_questions: [
        "Can we remove or mitigate any of the amplifiers?"
      ]
    },
    {
      id: "black-swan-scan",
      name: "Black Swan Scan",
      category: "Risk Thinking",
      purpose: "Consider highly improbable but catastrophic risks.",
      when_to_use: [
        "Long-term strategic planning",
        "Evaluating single points of failure"
      ],
      thinking_questions: [
        "What 'impossible' event would completely destroy this strategy?",
        "Are we assuming stability in systems that are actually fragile?",
        "What happens if our most reliable infrastructure vanishes overnight?"
      ],
      stakeholder_questions: [
        "Who survives this catastrophe, and who doesn't?"
      ],
      second_order_questions: [
        "How do we rebuild if the foundational assumptions of the market change?"
      ],
      ai_prompts: [
        "Generate 5 'Black Swan' (low probability, extreme impact) events that could disrupt [Industry].",
        "Help me stress-test this plan against severe resource constraints."
      ],
      reflection_questions: [
        "Do we have any resilience built in for unexpected shocks?"
      ]
    },

    // --- SYSTEMS THINKING ---
    {
      id: "second-order-effects",
      name: "Second-Order Effects",
      category: "Systems Thinking",
      purpose: "Look past the immediate consequences of an action to anticipate the ripple effects.",
      when_to_use: [
        "Designing incentives or metrics",
        "Implementing new rules or constraints"
      ],
      thinking_questions: [
        "What is the intended immediate outcome (first-order effect)?",
        "How will people change their behavior in response to this new reality?",
        "Will the eventual outcome undermine the original goal?"
      ],
      stakeholder_questions: [
        "Who will try to game or exploit the new system?",
        "Who bears the invisible burden of the new compliance rules?"
      ],
      second_order_questions: [
        "What happens when the system adapts? (third-order effects)",
        "How does this impact adjacent systems or teams?"
      ],
      ai_prompts: [
        "Map out potential second and third-order effects of implementing [Action]. Focus on unintended negative consequences.",
        "How might people game or exploit this new rule: [Rule]?"
      ],
      reflection_questions: [
        "Are the second-order risks acceptable given the first-order benefits?"
      ]
    },
    {
      id: "feedback-loops",
      name: "Feedback Loops",
      category: "Systems Thinking",
      purpose: "Identify reinforcing and balancing loops that drive system behavior.",
      when_to_use: [
        "Trying to change organizational culture",
        "Diagnosing why a problem keeps recurring"
      ],
      thinking_questions: [
        "What behavior is currently being rewarded or punished by the system?",
        "Is there a vicious cycle driving the negative behavior?",
        "Where can we introduce a balancing loop to stabilize the system?"
      ],
      stakeholder_questions: [
        "Who benefits from the current reinforcing loop?",
        "Who is trapped in the vicious cycle?"
      ],
      second_order_questions: [
        "If we break the loop, what new dynamic takes its place?"
      ],
      ai_prompts: [
        "Identify the reinforcing feedback loops in this situation: [Situation].",
        "Suggest structural changes to disrupt the vicious cycle in [Problem]."
      ],
      reflection_questions: [
        "Have we addressed the root cause or just the symptom?"
      ]
    },
    {
      id: "system-boundaries",
      name: "System Boundaries",
      category: "Systems Thinking",
      purpose: "Define what is inside and outside your control or analysis scope.",
      when_to_use: [
        "Scoping a complex project",
        "Assigning responsibility for an outcome"
      ],
      thinking_questions: [
        "Where does our responsibility end and another system's begin?",
        "Are we trying to solve a problem that is actually outside our boundary?",
        "What external dependencies dictate our success?"
      ],
      stakeholder_questions: [
        "Who manages the adjacent systems we depend on?",
        "Are there stakeholders falling through the gaps between boundaries?"
      ],
      second_order_questions: [
        "How do changes inside our boundary force changes outside it?"
      ],
      ai_prompts: [
        "Help me define the strict operational boundaries for [Project].",
        "Identify 5 external dependencies that could derail [System]."
      ],
      reflection_questions: [
        "Is the boundary drawn too narrowly or too broadly?"
      ]
    },

    // --- STAKEHOLDER ANALYSIS ---
    {
      id: "stakeholder-lens",
      name: "Stakeholder Lens",
      category: "Stakeholder Analysis",
      purpose: "View a decision entirely from the perspective of the people impacted by it.",
      when_to_use: [
        "Before launching a public-facing product",
        "Drafting internal policy changes"
      ],
      thinking_questions: [
        "Who are all the distinct groups affected by this?",
        "What are their primary goals, fears, and constraints?",
        "How does this change their daily reality?"
      ],
      stakeholder_questions: [
        "Who holds the power in this scenario?",
        "Whose voice is completely missing from the discussion?"
      ],
      second_order_questions: [
        "How will different stakeholders interact with each other because of this change?"
      ],
      ai_prompts: [
        "Generate a matrix of stakeholders for [Initiative] detailing their goals and fears.",
        "Act as a frontline worker experiencing [Policy] for the first time. What is your reaction?"
      ],
      reflection_questions: [
        "Did you discover any stakeholder groups you had entirely ignored?"
      ]
    },
    {
      id: "equity-impact-review",
      name: "Equity Impact Review",
      category: "Stakeholder Analysis",
      purpose: "Evaluate how decisions disproportionately impact different demographic or socioeconomic groups.",
      when_to_use: [
        "Designing AI algorithms or rules",
        "Allocating public or institutional resources"
      ],
      thinking_questions: [
        "Does this policy inadvertently disadvantage a specific group?",
        "Are the prerequisites for access equal for everyone?",
        "What historical inequities might this amplify?"
      ],
      stakeholder_questions: [
        "Who is not in the room making this decision?",
        "Have we co-designed this with the affected communities?"
      ],
      second_order_questions: [
        "Will this widen the gap between advantaged and disadvantaged groups over time?"
      ],
      ai_prompts: [
        "Apply an equity lens to this policy: [Policy]. Identify potential disparate impacts.",
        "Suggest ways to make [Service] more accessible to marginalized populations."
      ],
      reflection_questions: [
        "What specific changes will you make to improve equity?"
      ]
    },
    {
      id: "perspective-conflict-mapping",
      name: "Perspective Conflict Mapping",
      category: "Stakeholder Analysis",
      purpose: "Anticipate where stakeholder goals will directly clash.",
      when_to_use: [
        "Mediating complex disputes",
        "Balancing user needs vs business goals"
      ],
      thinking_questions: [
        "Where do the goals of Group A directly contradict the goals of Group B?",
        "Is this a zero-sum conflict, or can both sides win?",
        "What compromises are unacceptable to each group?"
      ],
      stakeholder_questions: [
        "Which group has the most political capital to force their view?",
        "Who gets caught in the crossfire of this conflict?"
      ],
      second_order_questions: [
        "If Group A wins, how does Group B retaliate or disengage?"
      ],
      ai_prompts: [
        "Map out the inherent conflicts between [Group A] and [Group B] regarding [Issue].",
        "Propose 3 'third-way' compromises that address the core needs of both groups."
      ],
      reflection_questions: [
        "Is there a way to redesign the system to align their incentives?"
      ]
    },
    {
      id: "user-experience-walkthrough",
      name: "User Experience Walkthrough",
      category: "Stakeholder Analysis",
      purpose: "Step out of the designer mindset and into the end-user's reality.",
      when_to_use: [
        "Reviewing a UI or service design",
        "Evaluating a complex administrative process"
      ],
      thinking_questions: [
        "What is the user's emotional state when they interact with this?",
        "What is the most frustrating part of this experience?",
        "Are we forcing the user to learn our internal jargon?"
      ],
      stakeholder_questions: [
        "Who is our least tech-savvy user?",
        "Who is using this in a high-stress or low-bandwidth environment?"
      ],
      second_order_questions: [
        "How will users 'hack' or bypass this system to make it work for them?"
      ],
      ai_prompts: [
        "Act as an impatient, confused user trying to navigate [Process]. What questions do you have?",
        "Identify points of highest cognitive friction in this workflow."
      ],
      reflection_questions: [
        "Have you actually observed a user attempting this task in the real world?"
      ]
    },

    // --- REFLECTION & LEARNING ---
    {
      id: "what-worked-what-failed",
      name: "What Worked / What Failed",
      category: "Reflection & Learning",
      purpose: "A rapid, binary assessment of recent actions to improve the next iteration.",
      when_to_use: [
        "Weekly team reviews",
        "Agile sprint retrospectives"
      ],
      thinking_questions: [
        "What is one thing that worked exceptionally well?",
        "What is one thing that unequivocally failed?",
        "What should we stop doing immediately?"
      ],
      stakeholder_questions: [
        "Did we meet our commitments to stakeholders this cycle?",
        "Did our 'success' cause stress for another team?"
      ],
      second_order_questions: [
        "If we double down on what worked, what are the capacity implications?"
      ],
      ai_prompts: [
        "Summarize these sprint notes into actionable Keep/Stop/Start categories.",
        "Suggest ways to scale [Successful Action] without adding headcount."
      ],
      reflection_questions: [
        "Are we being honest about what failed?"
      ]
    },
    {
      id: "learning-loop-review",
      name: "Learning Loop Review",
      category: "Reflection & Learning",
      purpose: "Evaluate how well the organization or individual is integrating new knowledge.",
      when_to_use: [
        "Quarterly reviews",
        "After concluding a major training initiative"
      ],
      thinking_questions: [
        "What new information did we learn this cycle?",
        "Have we actually updated our behavior based on this new information?",
        "Where is the loop broken: gathering data, analyzing it, or acting on it?"
      ],
      stakeholder_questions: [
        "Is leadership modeling the integration of new learning?",
        "Are frontline workers empowered to change processes based on what they learn?"
      ],
      second_order_questions: [
        "What happens to organizational morale if lessons are identified but never implemented?"
      ],
      ai_prompts: [
        "Analyze this retrospective document. Are the 'next steps' addressing root causes or just symptoms?",
        "Suggest a process to ensure lessons from [Project] are embedded into standard operating procedures."
      ],
      reflection_questions: [
        "Are we a learning organization, or just an organization that collects post-mortems?"
      ]
    },
    {
      id: "practice-improvement",
      name: "Practice Improvement Reflection",
      category: "Reflection & Learning",
      purpose: "Focus on the refinement of professional craft and daily habits.",
      when_to_use: [
        "Personal career development",
        "1-on-1 coaching sessions"
      ],
      thinking_questions: [
        "Which of my daily practices yields the highest return on investment?",
        "Where am I relying on outdated methods just because they are comfortable?",
        "What is the single smallest change I could make to improve my craft?"
      ],
      stakeholder_questions: [
        "How do my personal work habits impact the velocity of my team?",
        "Who is setting the standard of excellence I should aspire to?"
      ],
      second_order_questions: [
        "If I improve this specific skill, what new opportunities open up in a year?"
      ],
      ai_prompts: [
        "Suggest 3 deliberate practice routines to improve my skill in [Domain].",
        "Help me identify the 'vital few' habits that drive success in [Role]."
      ],
      reflection_questions: [
        "Am I practicing with intention, or just repeating the same year of experience over and over?"
      ]
    },
    {
      id: "confidence-calibration",
      name: "Confidence Calibration",
      category: "Reflection & Learning",
      purpose: "Align your level of certainty with the actual quality of your evidence.",
      when_to_use: [
        "Making high-stakes forecasts",
        "Presenting recommendations to leadership"
      ],
      thinking_questions: [
        "Am I overconfident because the narrative is compelling?",
        "What specific piece of new data would make me change my mind immediately?",
        "If I had to bet my own money on this outcome, would I?"
      ],
      stakeholder_questions: [
        "Are stakeholders interpreting my confidence as a guarantee of success?",
        "Who holds the dissenting view, and what do they know that I don't?"
      ],
      second_order_questions: [
        "If I express high confidence and fail, how does that damage future credibility?"
      ],
      ai_prompts: [
        "Review this recommendation: [Text]. Point out areas where the claims exceed the supporting evidence.",
        "Generate a 'pre-mortem' specifically focused on why my confidence in [Outcome] might be misplaced."
      ],
      reflection_questions: [
        "Is my confidence based on evidence, or on ego and hope?"
      ]
    },

    // --- RESEARCH THINKING ---
    {
      id: "evidence-quality-review",
      name: "Evidence Quality Review",
      category: "Research Thinking",
      purpose: "Assess the strength, validity, and bias of the information guiding a decision.",
      when_to_use: [
        "Reviewing a vendor's claims",
        "Reading a research report"
      ],
      thinking_questions: [
        "Is the source of this evidence independent and credible?",
        "Is it a peer-reviewed study, an anecdote, or marketing material?",
        "What methodology was used to gather this data?"
      ],
      stakeholder_questions: [
        "Who funded this research?",
        "Who benefits financially or politically if this evidence is accepted as truth?"
      ],
      second_order_questions: [
        "If we build policy on flawed data, how hard will it be to reverse later?"
      ],
      ai_prompts: [
        "Critique the methodology described in this excerpt: [Text].",
        "What are the common limitations of relying on [Data Type] for decision making?"
      ],
      reflection_questions: [
        "Are you accepting weak evidence because it confirms what you already want to believe?"
      ]
    },
    {
      id: "alternative-explanations",
      name: "Alternative Explanations",
      category: "Research Thinking",
      purpose: "Generate multiple hypotheses for an observed phenomenon to avoid premature convergence.",
      when_to_use: [
        "Analyzing anomalous data",
        "Investigating an incident"
      ],
      thinking_questions: [
        "What is the most obvious explanation?",
        "What is the least obvious but still plausible explanation?",
        "What evidence would be required to disprove our favored hypothesis?"
      ],
      stakeholder_questions: [
        "How would an opposing stakeholder explain this same data?",
        "Are we favoring the explanation that makes us look the best?"
      ],
      second_order_questions: [
        "If we act on the wrong explanation, what systemic damage do we cause?"
      ],
      ai_prompts: [
        "Given the observation [Observation], generate 5 entirely different alternative explanations.",
        "Help me design an experiment to distinguish between [Explanation A] and [Explanation B]."
      ],
      reflection_questions: [
        "Did generating alternatives reduce your certainty in your initial conclusion?"
      ]
    },
    {
      id: "confounder-hunt",
      name: "Confounder Hunt",
      category: "Research Thinking",
      purpose: "Identify hidden variables that might be the true cause of an observed correlation.",
      when_to_use: [
        "Evaluating the success of an intervention",
        "Reviewing A/B test results"
      ],
      thinking_questions: [
        "We see that X is correlated with Y. What hidden variable Z could be causing both?",
        "Did the outcome improve because of our action, or because of a broader macro trend?",
        "If we hadn't intervened at all, would the outcome have happened anyway?"
      ],
      stakeholder_questions: [
        "Are different demographic groups experiencing this correlation differently?",
        "Who has an incentive to ignore the confounder and claim causal victory?"
      ],
      second_order_questions: [
        "If we optimize for X, assuming it causes Y, will we accidentally break Z?"
      ],
      ai_prompts: [
        "I observe a correlation between [X] and [Y]. Suggest 5 potential confounding variables.",
        "How can I statistically or experimentally isolate the effect of [Intervention]?"
      ],
      reflection_questions: [
        "How confident are you that your intervention actually caused the result?"
      ]
    },
    {
      id: "bias-limitation-review",
      name: "Bias and Limitation Review",
      category: "Research Thinking",
      purpose: "Systematically map the flaws in your own dataset or research methodology.",
      when_to_use: [
        "Before publishing findings",
        "Before training an AI model on a dataset"
      ],
      thinking_questions: [
        "Is there selection bias in how we gathered this data?",
        "Are we suffering from survivorship bias (only looking at successes)?",
        "What is the absolute weakest link in this research methodology?"
      ],
      stakeholder_questions: [
        "Which populations are entirely absent from our dataset?",
        "Does the data collection method exclude people without reliable internet/devices?"
      ],
      second_order_questions: [
        "How will an AI model trained on this biased data behave at scale over 5 years?"
      ],
      ai_prompts: [
        "Act as a hostile peer reviewer. Critique the limitations of this study design: [Design].",
        "What populations are likely underrepresented in a dataset collected via [Method]?"
      ],
      reflection_questions: [
        "Are the limitations so severe that the findings should not be used for decision making?"
      ]
    },

    // --- CURRICULUM THINKING ---
    {
      id: "alignment-review",
      name: "Alignment Review",
      category: "Curriculum Thinking",
      purpose: "Ensure learning objectives, assessments, and activities are perfectly coherent.",
      when_to_use: [
        "Designing a new course",
        "Updating training materials"
      ],
      thinking_questions: [
        "Does the assessment actually measure the stated learning objective?",
        "Do the learning activities give students practice in what will be assessed?",
        "Are we testing rote memorization when the goal is critical application?"
      ],
      stakeholder_questions: [
        "Are the learning objectives clear and transparent to the students?",
        "Is the assessment fair for learners with different neurocognitive profiles?"
      ],
      second_order_questions: [
        "If we change the assessment format, how will students drastically alter their study habits?"
      ],
      ai_prompts: [
        "Review this learning objective and assessment pair for alignment: [Objective] / [Assessment].",
        "Suggest 3 active learning activities to teach [Concept] at the higher levels of Bloom's Taxonomy."
      ],
      reflection_questions: [
        "Where is the weakest link in your constructive alignment?"
      ]
    },
    {
      id: "assessment-coherence-check",
      name: "Assessment Coherence Check",
      category: "Curriculum Thinking",
      purpose: "Evaluate whether the assessment accurately and fairly captures student competence.",
      when_to_use: [
        "Designing high-stakes exams",
        "Moving from traditional to authentic assessments"
      ],
      thinking_questions: [
        "Does this assessment measure actual skill, or just the ability to take a test well?",
        "Is the grading rubric explicit, objective, and tied directly to the learning goals?",
        "Can a student fail the assessment but still understand the core concept?"
      ],
      stakeholder_questions: [
        "Does this assessment format unintentionally penalize non-native speakers?",
        "Who benefits from the hidden assumptions in this rubric?"
      ],
      second_order_questions: [
        "How does the pressure of this assessment warp the classroom dynamic?"
      ],
      ai_prompts: [
        "Critique this grading rubric for subjectivity and clarity: [Rubric].",
        "Suggest alternative, 'authentic' assessment methods for [Topic] that are harder to cheat on using AI."
      ],
      reflection_questions: [
        "Are you measuring what matters, or just what is easy to measure?"
      ]
    },
    {
      id: "hidden-curriculum",
      name: "Hidden Curriculum Analysis",
      category: "Curriculum Thinking",
      purpose: "Identify the unwritten rules, values, and norms being transmitted alongside formal content.",
      when_to_use: [
        "Reviewing institutional policies",
        "Evaluating classroom dynamics and culture"
      ],
      thinking_questions: [
        "What behaviors are we implicitly rewarding? (e.g., speed over depth, conformity over creativity)",
        "What assumptions about 'success' are embedded in our examples?",
        "Who is centered as the 'default' in our case studies?"
      ],
      stakeholder_questions: [
        "Which students feel alienated by the unspoken norms of this environment?",
        "Are we assuming prior systemic knowledge that first-generation students don't have?"
      ],
      second_order_questions: [
        "How does the hidden curriculum impact long-term retention of diverse students?"
      ],
      ai_prompts: [
        "Analyze this syllabus for implicit assumptions about student resources and time: [Syllabus].",
        "Suggest ways to make the 'unwritten rules' of academia explicit for new learners."
      ],
      reflection_questions: [
        "What values are you unintentionally teaching through your policies?"
      ]
    },
    {
      id: "learner-journey-review",
      name: "Learner Journey Review",
      category: "Curriculum Thinking",
      purpose: "View the sequence of learning entirely through the eyes of the novice.",
      when_to_use: [
        "When students consistently struggle at a specific bottleneck",
        "Designing multi-week program sequences"
      ],
      thinking_questions: [
        "Are we suffering from the 'curse of knowledge' (forgetting what it's like not to know)?",
        "What is the cognitive load required to complete this specific module?",
        "Is the sequencing logical to someone who doesn't yet see the big picture?"
      ],
      stakeholder_questions: [
        "How does an anxious student perceive this sequence?",
        "Are we providing adequate scaffolding for struggling learners before removing the supports?"
      ],
      second_order_questions: [
        "Does severe cognitive overload early in the course cause permanent disengagement later?"
      ],
      ai_prompts: [
        "Act as a novice learner encountering [Concept] for the first time. What are your most likely misconceptions?",
        "Help me break down [Complex Task] into a heavily scaffolded, 5-step learning sequence."
      ],
      reflection_questions: [
        "How can you make your expert mental models visible to the novice?"
      ]
    },

    // --- GOVERNANCE THINKING ---
    {
      id: "accountability-mapping",
      name: "Accountability Mapping",
      category: "Governance Thinking",
      purpose: "Ensure clear lines of responsibility for automated or complex human-AI systems.",
      when_to_use: [
        "Deploying a new AI workflow",
        "Designing organizational structures"
      ],
      thinking_questions: [
        "If the AI system makes a harmful error, exactly which human is accountable?",
        "Does the accountable person actually have the technical visibility to monitor the system?",
        "Is accountability dispersed so widely that no one is truly responsible?"
      ],
      stakeholder_questions: [
        "How does an external victim appeal an automated decision?",
        "Are we pushing accountability onto frontline workers for flawed systemic design?"
      ],
      second_order_questions: [
        "If the accountable person leaves the company, how is the governance handed over?"
      ],
      ai_prompts: [
        "Review this AI deployment plan and identify accountability gaps: [Plan].",
        "Generate a RACI (Responsible, Accountable, Consulted, Informed) matrix for [AI Process]."
      ],
      reflection_questions: [
        "Are you comfortable putting your name as the ultimate accountable owner?"
      ]
    },
    {
      id: "human-oversight-review",
      name: "Human Oversight Review",
      category: "Governance Thinking",
      purpose: "Assess the degree of meaningful human control in automated processes.",
      when_to_use: [
        "Implementing 'Human in the Loop' systems",
        "Evaluating automation efficiency gains"
      ],
      thinking_questions: [
        "Is the human actually reviewing the output, or just clicking 'Approve' (automation bias)?",
        "Does the human have enough time and context to override the AI?",
        "Can the human completely disable the automated system in an emergency?"
      ],
      stakeholder_questions: [
        "Who is penalized if the human overrides the AI and the human is wrong?",
        "Does the system design empower the worker or turn them into a robot monitor?"
      ],
      second_order_questions: [
        "Over time, as humans rely on the AI, how do they maintain their baseline skills to catch rare errors?"
      ],
      ai_prompts: [
        "Evaluate this workflow for 'automation bias' risks: [Workflow].",
        "Suggest interface designs that force meaningful human engagement before AI approval."
      ],
      reflection_questions: [
        "Is the human genuinely in the loop, or just a liability sponge?"
      ]
    },
    {
      id: "transparency-explainability",
      name: "Transparency and Explainability Check",
      category: "Governance Thinking",
      purpose: "Determine what must be disclosed about a system and to whom.",
      when_to_use: [
        "Before public launch",
        "Drafting privacy or AI usage policies"
      ],
      thinking_questions: [
        "Can a user easily tell they are interacting with an AI system?",
        "If the AI denies a user a service, can we explain exactly why in plain language?",
        "Is the transparency meaningful, or buried in a 50-page Terms of Service?"
      ],
      stakeholder_questions: [
        "What do regulators expect us to disclose?",
        "What information would an investigative journalist or auditor try to uncover?"
      ],
      second_order_questions: [
        "How could malicious actors weaponize our detailed transparency reports to game the system?"
      ],
      ai_prompts: [
        "Draft a plain-language AI transparency notice for [Service] explaining how user data is processed.",
        "What are the ethical implications of not disclosing the use of AI in [Feature]?"
      ],
      reflection_questions: [
        "Are we hiding complexity because we think users won't understand, or because we know they won't like it?"
      ]
    },
    {
      id: "escalation-pathway",
      name: "Escalation Pathway Review",
      category: "Governance Thinking",
      purpose: "Establish clear protocols for when and how an AI failure is elevated to leadership.",
      when_to_use: [
        "Developing incident response protocols",
        "Setting up AI safety monitoring"
      ],
      thinking_questions: [
        "What exact threshold of AI error triggers an immediate halt to the system?",
        "At what point does an operational anomaly become a strategic crisis?",
        "Are the triggers automated, or do they rely on human observation?"
      ],
      stakeholder_questions: [
        "Who has the ultimate authority to pull the plug, and how quickly can they be reached?",
        "Who must be notified immediately when an escalation occurs?"
      ],
      second_order_questions: [
        "If frontline staff are penalized for false alarms, will they hesitate to escalate real crises?"
      ],
      ai_prompts: [
        "Map a step-by-step escalation timeline for this AI error scenario: [Scenario].",
        "Suggest criteria for a 'Tier 1 Critical AI Incident' for an education platform."
      ],
      reflection_questions: [
        "Do we have the courage to shut down a profitable system if safety thresholds are breached?"
      ]
    }
  ]
};
