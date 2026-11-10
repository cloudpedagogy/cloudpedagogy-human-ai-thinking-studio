# CloudPedagogy Human–AI Thinking Studio

A local-first, browser-based tool to help users reason clearly and collaborate effectively with AI through structured cognitive patterns rather than conventional prompt engineering.

The application operates entirely statically in the browser using React, Zustand, and Tailwind CSS. All reasoning sessions, custom patterns, and settings are stored locally in the browser's LocalStorage, requiring no external APIs, server backend, or network connection once loaded.

Part of the CloudPedagogy open-source ecosystem. Released under the MIT Licence.

---

## Key Capabilities

### 1. Built-in Cognitive Pattern Library
The Studio ships with **32 built-in thinking patterns** categorised into **nine core domains**:
- **Decision Making** (e.g. Trade-off Analysis, Reversibility Assessment, Decision Matrix)
- **Critical Thinking** (e.g. Evidence vs Inference, Counter-Argument Generator, Premise Checking)
- **Risk Thinking** (e.g. Failure Mode Analysis, Pre-Mortem Thinking, Worst-Case Boundary)
- **Systems Thinking** (e.g. Feedback Loop Mapping, Root Cause Analysis, Second-Order Effects)
- **Stakeholder Analysis** (e.g. Multi-Perspective Mapping, Empathy Mapping, Power-Interest Grid)
- **Reflection & Learning** (e.g. Double-Loop Learning, Retrospective Reflection, Mental Model Audit)
- **Research Thinking** (e.g. Hypothesis Formulation, Bias Identification, Literature Synthesis)
- **Curriculum Thinking** (e.g. Constructive Alignment, Scaffolding Progression, Assessment Rubric)
- **Governance Thinking** (e.g. Compliance Audit, Ethical Guardrails, Policy Impact Assessment)

### 2. Thinking Wizard
An interactive guide that helps users identify the most relevant cognitive patterns for their specific situation based on:
- Primary goal (e.g. making a decision, assessing a risk, evaluating evidence).
- Operating context (e.g. strategic, governance, educational, research).
- Desired cognitive support (e.g. challenging assumptions, considering stakeholders).

Recommendations are ranked deterministically with stable lexicographical tie-breaking, ensuring reproducible recommendations.

### 3. Reasoning Sessions & Pattern Snapshots
- Users work through structured questioning, stakeholder lenses, second-order reflections, and confidence assessments in an active workspace.
- Export reasoning sessions directly to clean, formatted **Markdown** for reports or AI prompts, or print to PDF.
- **Pattern Snapshot Protection:** Sessions automatically embed an immutable copy of the active pattern definition when created. If patterns in the library are later modified, replaced, or deleted, existing reasoning sessions remain fully readable and durable.
- Legacy sessions created without snapshots can be safely re-linked to active patterns without losing user notes or responses.

### 4. Custom Pattern Management & Pattern Pack Import
- Create, edit, and delete custom patterns directly from the **Pattern Registry**.
- Import external JSON pattern packs with dynamic category generation.
- **Accessible Import Strategies:**
  - **`keep`**: Adds only new patterns whose IDs do not already exist; preserves all existing patterns.
  - **`merge`**: Updates matching pattern definitions and adds new patterns.
  - **`replace`**: Replaces the pattern library with the imported pack. Requires explicit checkbox confirmation in the import modal to prevent accidental data removal. Existing user sessions are never deleted during replacement.
- Restore the original 32 core patterns at any time while preserving custom user patterns.

### 5. Full Studio Backup & Data Recovery
- Export a portable, versioned JSON backup of the entire Studio state (pattern library, packs, sessions, active session reference, and settings) from **Settings & Data**.
- Restore backups safely: every restore operation creates a pre-restore safety snapshot and verifies disk writes before applying changes. If restoration fails or storage is full, the original data is rolled back automatically.

### 6. LocalStorage Durability & Limitations
- All state is persisted to browser LocalStorage under the key `cloudpedagogy-thinking-studio-storage`.
- **Durability Safeguards:** Handles quota limits (`QuotaExceededError`), unavailable storage, and malformed JSON safely without crashing. If storage is full or corrupted data cannot be backed up, disk writes are paused to protect raw data from destructive overwriting, and the user is warned via an in-app banner to export their work.
- **Capacity Note:** Browser LocalStorage is generally limited to ~5–10 MB. For long-term archiving or when managing extensive reasoning histories, users should export periodic Studio Backups.

---

## Getting Started

### Prerequisites
- Node.js 20+

### Installation

```bash
# Clone the repository
git clone https://github.com/cloudpedagogy/cloudpedagogy-human-ai-thinking-studio.git
cd cloudpedagogy-human-ai-thinking-studio

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

### Running Tests

The test suite runs using Node's native test runner (`node:test`) and covers store operations, schema validation, persistence versioning, determinism, and data-integrity safeguards:

```bash
npm test
```

### Linting & Type Checking

```bash
npm run lint
npx tsc -b --noEmit
```

### Production Build

```bash
npm run build
```

Static build artefacts are output to `dist/` and can be hosted on any static web host (e.g. AWS S3, Cloudflare Pages, GitHub Pages) without server configuration.

Preview the production build locally:

```bash
npm run preview
```

---

## Licence

This project is licensed under the MIT Licence — see the [LICENSE](LICENSE) file for details.
Part of the CloudPedagogy open-source portfolio.
