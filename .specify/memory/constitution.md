<!--
Sync Impact Report:
- Version change: Initial Draft (unratified template) → 1.0.0
- List of modified principles:
  - Replaced unratified template placeholders with 10 Core Principles tailored for NetStudy:
    1. Vanilla-First Architecture (NON-NEGOTIABLE)
    2. Feature & Capability Preservation
    3. Deterministic Exam Engine & Course Data Stability
    4. Local-First & Privacy Preservation
    5. UI/UX Pro Max Design Standard
    6. Accessibility (WCAG 2.2 AA), Responsiveness & Keyboard-First
    7. Zero-Dependency & Strict XSS / Input Security
    8. Mandatory Headless Regression Testing (NON-NEGOTIABLE)
    9. Spec-Driven Development (SDD) Workflow
    10. Controlled Git Operations & Deployment Gates
- Added sections:
  - Core Principles (I through X)
  - Security & Quality Constraints
  - Development Workflow & Quality Gates
  - Governance
- Removed sections: None (template placeholders converted to formal governance).
- Follow-up TODOs: None.
-->

# NetStudy Project Constitution

## Core Principles

### I. Vanilla-First Architecture (NON-NEGOTIABLE)
The application MUST remain built with pure, framework-free HTML5, CSS3, and modern JavaScript (ES2022+). Under no circumstances may runtime frontend frameworks (React, Vue, Angular, Svelte, Solid, etc.) or heavy runtime libraries be introduced into `dist/`. The client bundle MUST run directly in standard modern web browsers without mandatory bundling, polyfilling, or compilation overhead.
*Rationale: NetStudy's core identity is an ultra-fast, zero-overhead, portable educational tool that runs anywhere without dependency rot or npm maintenance burden.*

### II. Feature & Capability Preservation
Every code and architectural change MUST preserve 100% of existing capabilities:
- 9 course modules (Chapters 1 through 8, including 2a Trojan and 2b Virus) across 95 sections mapped to 802 slide pages.
- 264 rationalized multiple-choice questions with per-option (A/B/C/D) explanations.
- 278 bilingual technical terms in the glossary.
- 27 interactive SVG mechanism models across 112 sequential steps with active edge/node highlights, definitions, boundary limitations, worked examples, and self-check questions.
- Practice modes ("Học có giải thích" - Learn with instant rationale; "Tự kiểm tra" - Test mode).
- Exam simulation: 40 questions in 75 minutes with countdown timer, absolute deadline enforcement, auto-submit on timeout, and seed-fixed or unseen-random question selection.
- Topic-level grading analytics, weak topic recommendations (<70%), and review notebook (wrong questions and bookmarks).
- Full local history and backup import/export.
*Rationale: Enhancements and redesigns must remain strictly non-destructive to the verified educational curriculum and learner utility.*

### III. Deterministic Exam Engine & Course Data Stability
The exam generation logic (`StudyCore.makeExam`), chapter matrix quotas (`matrix`: 1:4, 2a:3, 2b:3, 3:6, 4:5, 5:5, 6:6, 7:5, 8:3), cognitive level quotas (`levelMatrix`: 12 Nhận biết, 20 Thông hiểu, 8 Vận dụng), pseudo-random seed generator (`StudyCore.seeded(533)`), scoring formula (score = correct / total × 10, no negative marking), and underlying question/section IDs MUST NOT be altered unless explicitly mandated by an approved educational curriculum specification.
*Rationale: Examination fairness, historical comparability, and reproducible test sets depend upon invariant, deterministic core logic.*

### IV. Local-First & Privacy Preservation
All learner data—including completed sections, active exam state, answers, bookmarks, flags, and exam history—MUST be stored strictly client-side via browser `localStorage` (key: `netstudy-atmmt-v1`). The application MUST NOT transmit learner progress, activity logs, or telemetry to external servers. Backup export and import functionality MUST remain fully functional, offline-capable, and validated against corruption.
*Rationale: NetStudy guarantees complete user privacy, offline accessibility, and zero data liability.*

### V. UI/UX Pro Max Design Standard
All visual, styling, layout, and interaction changes MUST adhere to the UI UX Pro Max design intelligence framework:
- Implement a systematic 3-tier Design Token architecture (Primitive → Semantic → Component) in CSS.
- Establish high-contrast, refined palettes appropriate for cybersecurity and technical education (e.g. Clean Cyber Emerald / Modern Deep Slate), supporting both Light and Dark themes.
- Replace unstyled Unicode glyphs (`⌂`, `▤`, `◷`, `◇`, `☆`) with coherent, accessible SVG icon assets (e.g. Phosphor Icons).
- Deliver subtle, purposeful micro-interactions, smooth state feedback, and clean dialog surfaces without layout shifts.
*Rationale: Professional, intentional design reinforces technical credibility and minimizes cognitive friction during intensive study.*

### VI. Accessibility (WCAG 2.2 AA), Responsiveness & Keyboard-First
All user interfaces and interactive components MUST target WCAG 2.2 Level AA compliance:
- Color contrast ratios MUST satisfy at least 4.5:1 for normal text and 3:1 for graphical elements and large text.
- Full keyboard operability: every interactive element MUST provide clear `:focus-visible` outlines, logical tab ordering, and accessible keyboard shortcuts (e.g., option selection, question navigation, modal dismissal).
- Mobile responsiveness: layouts MUST adapt seamlessly from wide desktop screens down to narrow mobile viewports (320px minimum width), with thumb-zone accessible navigation and touch targets of at least 44×44px.
*Rationale: Educational tools must be universally accessible to all students, regardless of device, physical ability, or input modality.*

### VII. Zero-Dependency & Strict XSS / Input Security
The runtime environment MUST maintain zero npm dependencies. Security engineering practices MUST be applied across the entire codebase:
- Strict sanitization: any dynamic string interpolated into the DOM (including route hashes, model IDs, and imported backup JSON) MUST be sanitized to eliminate Cross-Site Scripting (XSS) vulnerabilities.
- Nối chuỗi HTML thủ công (`innerHTML`) MUST be systematically safeguarded or transitioned to safe templating mechanisms.
- All imported files MUST undergo structural schema validation and size restrictions before state ingestion.
- The application SHOULD declare a strict Content Security Policy (CSP) meta tag.
*Rationale: An application teaching network and cybersecurity principles must itself be a benchmark of secure software development.*

### VIII. Mandatory Headless Regression Testing (NON-NEGOTIABLE)
Prior to concluding any modification, the complete automated regression test suite MUST execute and pass with zero failures:
```powershell
py assemble.py
py build-models.py
node --check dist/app.js
node --check dist/core.js
node --check dist/models.js
node --check dist/model-ui.js
node checks.cjs
node checks-models.cjs
```
Any schema mismatch, routing error, exam matrix failure across 100 simulations, score calculation flaw, timer defect, or cryptographic verification error (RSA, DH, OTP) constitutes an immediate blocking failure.
*Rationale: Automated headless verification guarantees regression-free iterations without requiring manual testing overhead.*

### IX. Spec-Driven Development (SDD) Workflow
All major feature additions, refactorings, and design system overhauls MUST follow the disciplined GitHub Spec Kit workflow:
1. **Specification** (`/speckit-specify`): Detail user requirements, functional boundaries, and testable acceptance criteria.
2. **Clarification** (`/speckit-clarify`): Identify ambiguities and define edge-case behaviors.
3. **Planning** (`/speckit-plan`): Establish technical designs, data flows, and architectural conformance.
4. **Task Generation** (`/speckit-tasks`): Break down implementation into sequenced, dependency-ordered, verifiable tasks.
5. **Implementation** (`/speckit-implement`): Execute code changes in strict task order with regression checks at each step.
6. **Convergence** (`/speckit-converge`): Verify full alignment between specifications and deployed implementation.
*Rationale: Formal specifications eliminate guesswork, scope creep, and untested ad-hoc modifications.*

### X. Controlled Git Operations & Deployment Gates
Automated agents and contributors MUST NOT execute `git commit`, `git push`, branch merges, or release deployments without explicit user inspection and approval. Work MUST remain isolated on working branches, and live deployments to GitHub Pages (`.github/workflows/pages.yml`) MUST only trigger upon approved merges to the `main` branch.
*Rationale: Protects the repository and public GitHub Pages site from accidental or premature publishing of unverified work.*

## Security & Quality Constraints

1. **Client-Side Sandbox Integrity**: The application MUST operate without server-side dependencies. It MUST NOT make unauthorized third-party network requests or leak local state.
2. **Data Pipeline Purity**: Content files (`content-*.json`, `source-pages.json`) represent the single source of truth for course curriculum. `dist/data.js` and `dist/models.js` are generated artifacts and MUST NOT be edited manually.
3. **DOM Stability & Rendering Quality**: UI updates SHOULD minimize layout shifts and avoid destructive full-page re-renders. Selective DOM updates MUST preserve user focus and scroll state.
4. **Defensive Cryptographic Calculations**: All educational cryptographic demonstrations (e.g. modular exponentiation, Diffie-Hellman exchanges, OTP XOR) in models MUST maintain verified numeric precision checked by `checks-models.cjs`.

## Development Workflow & Quality Gates

1. **Pre-Implementation**:
   - Verify alignment with this constitution.
   - For non-trivial changes, ensure an approved feature specification exists in `specs/`.
2. **Implementation Quality Gates**:
   - Zero framework addition.
   - Zero runtime npm packages.
   - Proper input escaping and schema validation.
   - Adherence to UI UX Pro Max design tokens and accessibility guidelines.
3. **Post-Implementation Verification**:
   - Syntax validation via `node --check`.
   - Data generation via `assemble.py` and `build-models.py`.
   - Comprehensive test suite execution via `checks.cjs` and `checks-models.cjs`.
   - User approval before any git commit or push.

## Governance

1. **Constitutional Primacy**: This Constitution supersedes all informal guidelines and ad-hoc practices. Any code change conflicting with these principles is invalid.
2. **Amendment Procedure**: Amendments to this Constitution require:
   - A documented rationale explaining why the existing principle must change.
   - Updating the semantic version following the rules below.
   - Explicit user ratification before the amended constitution takes effect.
3. **Versioning Policy**:
   - **MAJOR (X.0.0)**: Removal or backward-incompatible redefinition of core architectural or governance principles (e.g. adopting a build toolchain or altering the exam algorithm).
   - **MINOR (1.X.0)**: Addition of new principles, quality gates, or substantially expanded guidance.
   - **PATCH (1.0.X)**: Wording refinements, typo corrections, or non-semantic clarifications.
4. **Compliance Verification**: All proposed specifications (`spec.md`), architectural plans (`plan.md`), task lists (`tasks.md`), and pull requests MUST verify compliance with this Constitution during the Spec Kit workflow.

**Version**: 1.0.0 | **Ratified**: 2026-11-03 | **Last Amended**: 2026-11-03
