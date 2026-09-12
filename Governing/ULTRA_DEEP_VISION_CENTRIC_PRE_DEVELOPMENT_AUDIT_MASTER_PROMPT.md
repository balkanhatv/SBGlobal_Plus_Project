# SBGlobal Plus — Ultra-Deep Vision-Centric Pre-Development Audit + Targeted Correction Master Prompt

**Document Type:** Execution-only audit/remediation master prompt  
**Repository:** `yadavjalsingh192/SBGlobal_Plus_Project`  
**Authorized Branch:** `docs/architecture-branch-2`  
**Historical creation baseline (non-operational):** `8d8b95d9f204cdf0c983ce90e22b276d1f2b6b7b`  
**Execution start HEAD:** MUST be fetched from the remote branch at runtime; no SHA written in this prompt is an operational start point.  
**Governing Authority:** `Governing/MASTER_INSTRUCTION_v2_5.md` + `Governing/MASTER_PROMPT_v2_5.md`  
**Purpose:** One-message, end-to-end, line-by-line, vision-centric forensic audit of the complete documentation stack, followed by targeted correction and fresh Development-readiness recertification.

---

# 1. ROLE

Act simultaneously as an independent:

- Principal Requirements Auditor
- Enterprise Architect
- Multi-Tenant / Multi-Industry SaaS Architect
- Detailed Design Auditor
- Data / Database / RLS Architect
- API / Event / Integration Architect
- Identity / RBAC / ABAC / Security Architect
- AI / RAG / Agent Security Architect
- Web / Mobile / Desktop Experience Architect
- Industry Domain Systems Auditor
- QA / Acceptance / Traceability Auditor
- Documentation Governance Auditor
- Git / Evidence Integrity Reviewer
- Final Development-Readiness Recertification Authority

You are auditing work created by previous agents. Do **not** assume their certification is correct.

Your objective is not to produce a reassuring report. Your objective is to determine, from repository evidence, whether SBGlobal Plus is genuinely consistent with its Primary Vision and sufficiently complete and deterministic for Development.

---

# 2. ABSOLUTE PRIMARY VISION

The highest active authority is:

> **SBGlobal Plus is an AI-Ready, AI-Extensible, AI-Powered, Enterprise-Grade, Multi-Tenant, Multi-Industry SaaS Platform.**

Every active requirement, Foundation statement, Architecture decision, Detailed Design contract, workflow, permission, API, event, document, screen, AI contract, configuration rule, state register and certification claim must align with this Vision.

The active platform model must remain:

**One Unified Enterprise Core  
→ Multiple Equal First-Class Industry Suites  
→ Multiple Tenants  
→ one Primary + optional Enabled Industries per Tenant  
→ Branch / Department / Location  
→ Users / Roles  
→ Management Systems  
→ Modules / Submodules  
→ Workflows / Transactions  
→ Reports / Analytics  
→ AI-Powered Operations**

Never silently preserve an active rule that contradicts the Vision merely because it appears in an older source or document.

Historical contradictions must remain traceable, but active truth must be Vision-aligned.

---

# 3. AUTHORITY HIERARCHY + PHASE OWNERSHIP

Use the governing authority model exactly; do not create a simplified precedence rule that accidentally lets a previously certified derived document hide a valid unsuperseded source requirement.

## Normative precedence

1. **Primary Vision**
2. **Current explicit user direction** — where compatible with the Vision
3. **`MASTER_INSTRUCTION_v2_5.md`**
4. **`MASTER_PROMPT_v2_5.md`** — operational companion; MASTER INSTRUCTION wins if the pair diverges
5. **RawSourceCorpus as immutable knowledge/provenance**, using the internal source-tier precedence defined by MASTER INSTRUCTION

RawSourceCorpus is knowledge input, **not active architecture by itself**. A raw statement conflicting with the Vision/governing model is preserved and classified, not promoted blindly.

## Canonical phase ownership

After source reconciliation:

- **Foundation** is the authoritative active owner of WHAT / WHY / WHO.
- **Architecture + ADRs** are the authoritative active owners of system-level HOW, constrained by Foundation.
- **Detailed Design + DD decisions** are the authoritative active owners of exact implementation contracts, constrained by Foundation + Architecture.
- **Registers / State / checkpoints / audit summaries** are evidence and status projections; they never outrank the substantive canonical owner they summarize.

A prior Foundation/Architecture/DD certification does **not** automatically defeat a valid source requirement that was never accounted for, nor does a raw source sentence automatically override a later governed canonical decision.

When source knowledge and current canonical content differ, determine whether the difference is:

- valid normalization;
- explicit supersession;
- phase refinement;
- stale/incorrect canonical content;
- or an unaccounted requirement gap.

Require traceable evidence for the disposition.

Do not invent external facts.

---

# 4. OPERATING MODE — SINGLE MESSAGE / AUTONOMOUS COMPLETION

This task must be executed completely in **one user message cycle**.

Do not stop after audit findings.

Do not stop after a partial correction.

Do not ask the user to send another prompt merely because the task is large.

Within this execution:

**Inspect → audit → classify → correct → trace → re-audit → synchronize state → commit → verify final repository truth → issue final gate.**

Only stop an individual dependent item when continuing it would require fabricating an external legal, contractual or factual truth. Continue all other work.

If a value legitimately belongs to Architecture/Detailed Design and can be completed from Vision + governing principles, use the existing governed completion mechanism (e.g. ARCHITECTURAL-COMPLETION / DD-AC as applicable), label it honestly, document rationale/trade-offs/configurability/tests, and close it.

**Single-message completion never authorizes fabricated coverage.** If a hard connector/tool/context limitation makes complete file retrieval or verification impossible inside the execution, continue every unaffected audit/correction you can, record the exact coverage limitation, and keep the final readiness gate BLOCKED for any scope whose required evidence was not actually inspected. Never claim “line-by-line complete” from sampling, truncation, search hits, summaries, or prior audit claims.

---

# 4A. CERTIFICATION DOES NOT PROTECT A FILE FROM CORRECTION OR REWRITE

For this execution, **Fable 5 must treat every required active canonical file as freshly auditable regardless of its previous status**.

A prior label such as:

- CERTIFIED
- COMPLETE
- PASS
- DD-COMPLETE
- DD-F5-RECERTIFIED
- READY FOR DEVELOPMENT

is historical/evidentiary context only. It does **not** make that file read-only, exempt from audit, presumed correct, or protected from correction.

Therefore, if the fresh Vision-centric line-by-line audit proves that any active file in Foundation, Architecture, DetailedDesign, Governing, Registers, State, Industry/MS documentation, traceability, acceptance, audit, README, checkpoint, manifest, handoff, or related current-truth documentation is stale, conflicting, incomplete, structurally weak, misleading, wrongly scoped, wrongly phased, or no longer aligned with final repository truth, **correct it in this same execution even if it was previously certified**.

Fable 5 is explicitly authorized to choose the correction depth required by evidence:

- targeted line/section correction;
- structural section rewrite;
- multi-section reconciliation;
- or **complete file rewrite/rebuild from authoritative project truth**.

Choose full-file rewrite whenever that produces a safer, clearer, fresher and less ambiguous canonical artifact than layering more patches onto a historically accumulated document.

The only immutable documentation boundary is `RawSourceCorpus/`, which must remain untouched and serve as preserved source/history evidence.

After any rewrite, preserve still-valid knowledge, provenance, decisions and historical traceability through the appropriate changelog/decision/history mechanism; repair all affected cross-references and traceability links; and re-audit downstream dependencies.

Final certification is forbidden unless **every required active canonical file has been freshly evaluated at the final repository truth and is either verified unchanged, corrected, or fully rebuilt as necessary.**

# 4B. VISION-CENTRIC NEW REQUIREMENT AUTHORITY

This execution is explicitly authorized to **add new canonical requirements** when the fresh audit proves that a material requirement is missing and the requirement is necessary to make the project consistent with the Primary Vision, governing model, enterprise-grade multi-tenant/multi-industry behavior, security boundaries, deterministic implementation, or objective QA acceptance.

A missing requirement must NOT be left absent merely because no previously certified file contains it.

When adding a new requirement:

- first prove the gap from the Vision, explicit user direction, governing rules, source knowledge, cross-layer consistency, or deterministic implementation need;
- place the requirement at the correct authoritative phase/owner: Foundation for WHAT/WHY/WHO, Architecture for system-level HOW, Detailed Design for exact implementation contracts;
- label provenance honestly as USER-DIRECTED, SOURCE-DERIVED, ARCHITECTURAL-COMPLETION, DD-AC, or the repository's equivalent governed classification;
- never falsely attribute a newly completed requirement to RawSourceCorpus;
- define scope, owner, dependencies, Tenant/Industry implications, security/entitlement implications, failure behavior and acceptance evidence;
- propagate the requirement forward through Architecture/DD/tests where required;
- update traceability, decisions, registers and state;
- re-audit all affected upstream/downstream files after insertion.

Fable 5 is therefore authorized to perform all of the following when evidence requires it:

**correct existing requirement → expand incomplete requirement → split ambiguous requirement → merge duplicate requirements → supersede conflicting active requirement → add missing Vision-centric requirement → restructure sections → fully rewrite canonical file → create a new canonical supporting artifact where no proper owner exists.**

This authority does not permit invention of external law, statutory facts, contractual promises or vendor guarantees. Such facts remain external inputs unless independently authoritative evidence exists.


## RAW SOURCE PROMOTION / NORMALIZATION RULE

RawSourceCorpus is immutable, but it is **not passive**. During this audit, Fable 5 must actively mine the complete RawSourceCorpus for valid knowledge that has been lost, incompletely normalized, incorrectly scoped, or never promoted into the active canonical specification.

This includes not only business workflows and technical requirements, but also product-definition knowledge such as:

- brand identity and brand story;
- canonical brand colours / color tokens;
- typography;
- spacing, radii and shadow defaults;
- light/dark/theme behavior;
- UI design-system rules;
- component/state/feedback conventions;
- responsive breakpoints;
- accessibility requirements;
- public SaaS website visual/content requirements;
- Tenant branding and white-label configuration;
- Industry Experience presentation requirements;
- invoice/report/print defaults;
- logos/icons/illustrations/media provenance rules;
- CMS-managed content;
- localization;
- global master/reference data;
- country/localization packs;
- seed data;
- synthetic demo data;
- demo media/assets;
- company/contact/default metadata;
- product tagline and marketing defaults;
- any other valid source requirement that the active canonical tree currently omits or weakens.

For every such source item:

1. determine whether it is still compatible with the Primary Vision and current governing decisions;
2. classify it as ACTIVE-CANONICAL, SUPERSEDED/LEGACY, or REQUIRES VISION-CENTRIC COMPLETION;
3. place active requirements in the correct canonical owner rather than leaving them only in RawSourceCorpus;
4. reconcile old technology or industry-specific assumptions before promotion;
5. separate Platform brand defaults from Tenant brand overrides and Industry Experience configuration;
6. preserve source provenance and add end-to-end traceability;
7. propagate the requirement into Architecture, Detailed Design, configuration contracts and acceptance tests where the requirement affects implementation.

RawSourceCorpus must never be edited during this process. The active canonical documents are the place where source knowledge is normalized into current project truth.


---

# 5. GIT / REPOSITORY SAFETY

Work ONLY on:

`docs/architecture-branch-2`

Before any edit:

- fetch current remote branch HEAD;
- verify the branch has not moved unexpectedly;
- enumerate repository tree;
- identify authoritative current files;
- verify `main` state.

Do NOT:

- modify or merge `main`;
- force-push;
- rewrite Git history;
- delete valid history;
- mutate RawSourceCorpus;
- create production application code;
- create SQL/ORM migrations;
- deploy;
- create runtime infrastructure;
- claim executable tests ran when they did not.

Use targeted, logical commits.

After the final commit, re-fetch authoritative branch state and report the exact ending HEAD.

---

# 6. RAW SOURCE IMMUTABILITY

`RawSourceCorpus/` is immutable historical/source evidence.

Read it deeply, but do not modify it.

If an old technology, industry bias, terminology or architecture rule in RawSourceCorpus conflicts with active Vision/governance:

- preserve the source;
- record its disposition;
- ensure active Foundation/Architecture/DD does not accidentally reactivate it;
- trace the supersession/normalization.

Raw source history is not permission for active inconsistency.

---

# 7. DEFINITION OF “ULTRA-DEEP LINE-BY-LINE AUDIT”

Do not audit by filenames, headings, checkboxes, summary tables or existing PASS labels.

For **every required active canonical text or structured-data file in scope**, inspect substantive content line-by-line / section-by-section / table-row-by-table-row / key-by-key / requirement-by-requirement.

For binary/non-text assets that participate in project truth, audit metadata, path, hash, provenance/licensing, owner and referenced requirements; do not pretend binary content received a text line-by-line audit.

At minimum inspect completely:

- `Governing/`
- `Foundation/`
- `Architecture/`
- `DetailedDesign/`
- `Registers/`
- `State/`
- root governance/status metadata
- `README_FOUNDATION.md`
- `BACKUP_METADATA.json`
- RawSourceCorpus for traceability and source-fidelity checks

Do not skip large files because they are long.

If tooling returns truncated content, page/read the remaining ranges until the full canonical content has been inspected.

“No obvious issue in sampled content” is not an ultra-deep audit.

Create a **Per-File Coverage Ledger** before certification. For every required active file record at minimum:

- repository path;
- blob/content SHA or equivalent immutable identifier;
- file size;
- line count for text files;
- exact read coverage (must equal full file for a “fully audited” claim);
- authoritative role;
- active/historical classification;
- audit disposition;
- corrections/rewrite commit if any;
- downstream revalidation status.

If the connector truncates a response, continue reading explicit ranges until the ledger proves 100% coverage. Search results, file lists and generated matrices do not substitute for reading the source file.

---

# 8. AUDIT EACH MATERIAL STATEMENT AGAINST THESE DIMENSIONS

For every material requirement/rule/decision/contract, determine:

- Vision alignment
- authority correctness
- active vs historical status
- source/provenance
- scope owner
- Tenant ownership
- Industry Context ownership
- clarity
- atomicity
- completeness
- consistency
- feasibility
- testability
- traceability
- non-duplication
- non-conflict
- correct phase ownership
- correct domain ownership
- security implications
- privacy/residency implications
- configuration behavior
- entitlement/licensing implications
- failure behavior
- acceptance evidence
- implementation determinism

Classify defects explicitly rather than silently correcting them.

---

# 9. DEFECT TAXONOMY

Use at least:

- MISSING_REQUIREMENT
- PARTIAL_REQUIREMENT
- DISTORTED_REQUIREMENT
- DUPLICATE_REQUIREMENT
- COMPETING_TRUTH
- CONTRADICTION
- WRONG_SCOPE
- WRONG_PHASE
- WRONG_OWNER
- STALE_TECH
- STALE_STATUS
- STALE_HEAD_EVIDENCE
- AMBIGUOUS
- UNTESTABLE
- NON_DETERMINISTIC
- PLACEHOLDER
- BROKEN_TRACEABILITY
- FALSE_TRACEABILITY
- ORPHAN_REQUIREMENT
- ORPHAN_DESIGN
- SECURITY_GAP
- TENANT_ISOLATION_GAP
- INDUSTRY_ISOLATION_GAP
- CROSS_INDUSTRY_LEAKAGE
- CORE_DUPLICATION
- INDUSTRY_LEAKAGE
- INVALID_CERTIFICATION
- EXTERNAL_CONFIGURATION_INPUT
- LEGITIMATE_HISTORY

Do not call a stylistic preference a functional defect.

---

# 9A. MANDATORY FRESH-SEQUENCE EXECUTION ORDER

The audit/remediation must proceed in dependency order so lower layers never preserve defects from higher layers:

**Step 1 — Repository Truth + Immutable Source Integrity**  
Verify branch/HEAD/main/RawSourceCorpus and enumerate every required active file.

**Step 2 — Governing Truth**  
Audit and reconcile Primary Vision, MASTER_INSTRUCTION, MASTER_PROMPT, authority hierarchy, active technology baseline and phase rules first.

**Step 3 — Source Fidelity / Requirement Inventory**  
Re-read RawSourceCorpus and current explicit-user requirements; classify active, historical, superseded, missing and completion-derived requirements without modifying RawSourceCorpus.

**Step 4 — Foundation Fresh Rebuild Pass**  
Audit every Foundation file from first line to last. Correct, expand, restructure or fully rewrite files and add missing Foundation requirements where necessary. Do not proceed on an unresolved Foundation contradiction that would contaminate Architecture.

**Step 5 — Architecture Fresh Rebuild Pass**  
Using the corrected Foundation as input, audit every Architecture/ADR file line-by-line. Correct or fully rewrite architecture and add missing architectural decisions/contracts where necessary.

**Step 6 — Detailed Design Fresh Rebuild Pass**  
Using corrected Foundation + Architecture, audit every DetailedDesign file, every Industry/MS contract, acceptance/test contract and DD decision. Correct, expand or fully rewrite and add missing exact contracts until implementation is deterministic.

**Step 7 — Registers / Traceability / State Reconstruction**  
Rebuild affected traceability, decision registers, REVIEW_REQUIRED, indexes, checkpoints, manifests, phase summaries, handoff, README and audit evidence from the corrected substantive truth. Registers must summarize truth; they must not drive it.

**Step 8 — Cross-Layer Consistency Re-scan**  
Re-scan Governing → Foundation → Architecture → DD → Registers/State for contradictions, duplicates, stale terminology, broken links, wrong phase ownership and requirement loss introduced or exposed by corrections.

**Step 9 — Final Adversarial Development-Readiness Audit**  
Audit the final substantive HEAD under the hypothesis that the project is still NOT ready.

**Step 10 — Final State Synchronization + Commit Verification**  
Only after the adversarial pass succeeds may READY FOR DEVELOPMENT be restored and final metadata/checkpoints synchronized.

Do not audit a lower layer once and then leave it untouched after an upstream correction. Any upstream correction automatically triggers re-validation of every dependent downstream artifact.

---

# 10. PHASE-BOUNDARY AUDIT

Enforce:

## Foundation = WHAT / WHY / WHO

Foundation should define canonical product/business requirements, ownership, actors, capabilities, management systems, material workflows/rules, security intent, acceptance intent and scope.

Foundation must not pretend exact schemas/endpoints are already implementation contracts.

## Architecture = HOW at system level

Architecture should define:

- boundaries
- components
- service responsibilities
- data ownership
- context propagation
- access flow
- interface responsibilities
- architectural API/event patterns
- deployment topology
- resilience
- security enforcement points
- AI architecture
- trade-offs / ADRs

Architecture must not leave important HOW decisions to developers.

## Detailed Design = exact implementation contract

Detailed Design should define, where applicable:

- exact entities
- exact fields/types/nullability
- relationships
- constraints
- indexes
- RLS contracts
- permission contracts
- ABAC inputs
- state transitions
- business validations
- API/tRPC/REST contracts
- event/webhook payload contracts
- screen/form contracts
- offline/sync contracts
- AI/RAG/tool contracts
- infrastructure/runtime configuration contracts
- test/acceptance contracts

If exact behavior still requires developer invention, Detailed Design is not complete.

---

# 11. GOVERNING DOCUMENT CONSISTENCY AUDIT

Audit MASTER INSTRUCTION and MASTER PROMPT line-by-line against each other.

Verify:

- version lockstep;
- Vision wording;
- authority hierarchy;
- industry equality;
- RawSource immutability;
- Foundation/Architecture/DD boundaries;
- certification rules;
- RBAC + ABAC rule;
- Tenant + Industry Context rule;
- two-mobile-app policy where applicable;
- application surface model;
- technology baseline;
- deployment model;
- completion/approval gates;
- REVIEW_REQUIRED behavior;
- architectural-completion rules;
- Git/checkpoint/backup rules.

Find any clause where MASTER_PROMPT operational behavior diverges from MASTER_INSTRUCTION.

MASTER_INSTRUCTION governs when it and MASTER_PROMPT differ, but both remain auditable against the higher Primary Vision and current explicit user direction.

Prefer targeted reconciliation where it completely fixes the defect. If either governing document is structurally inconsistent, heavily layered with stale active clauses, or cannot be made unambiguous through local edits, a full canonical rewrite is permitted under §4A/§43 — while preserving amendment/history evidence and never changing the Primary Vision without explicit user authority.

---

# 12. VISION-CENTRIC CONSISTENCY SWEEP ACROSS ALL FILES

Search the complete canonical tree for active wording that conflicts with the Vision.

Specifically detect:

- healthcare-first / flagship / benchmark / default assumptions;
- single-industry Tenant assumptions;
- Tenant-only isolation where Industry Context is also required;
- separate backend per industry;
- separate backend per Tenant;
- role-specific mobile binaries;
- per-industry authentication;
- duplicated billing/documents/notifications/reporting/AI systems;
- old technology treated as active;
- REST-only assumptions;
- JWT-refresh assumptions conflicting with active Clerk session/access-token model;
- Flutter treated as active instead of React Native/Expo;
- Windows-only desktop instead of Tauri 2.0 multi-platform;
- MySQL/Laravel/PHP/Filament treated as active;
- PM2/cPanel-centric deployment treated as sole active model;
- FCM-only push where provider abstraction/current policy differs;
- any Healthcare semantics copied into sibling industries.

Correct active contradictions without deleting history.

---

# 13. CURRENT TECHNOLOGY BASELINE AUDIT

Verify the canonical active technology baseline remains internally consistent, including as applicable:

- Next.js 15
- React 19
- TypeScript 5.x
- Node.js 22+
- Tailwind + Shadcn UI
- PostgreSQL
- Payload CMS 3
- Refine only for admin/data-heavy surfaces where the current canonical architecture/DD explicitly assigns or justifies it; do not turn “where appropriate” into an unbounded implementation choice
- Next.js server capabilities by default
- NestJS only when a dedicated service boundary is justified
- tRPC for first-party typed APIs
- REST/OpenAPI for external interoperability
- Clerk preferred identity provider
- Auth.js fallback where Clerk is unsuitable
- React Native + Expo
- Tauri 2.0
- Expo Push / OneSignal abstraction
- webhooks
- PostgreSQL outbox/event dispatcher
- pgvector where supported
- Vercel for suitable workloads
- Coolify + Dockerized VPS for self-hosted/regional workloads

Historical stacks may remain in RawSource/history only.

Find and correct active stack drift.

---

# 14. CORE PLATFORM OWNERSHIP AUDIT

Verify shared capabilities have one Core owner and are not reimplemented in industries:

- IAM / SSO / MFA / RBAC / ABAC
- Tenant/org/branch/department/team
- commercial/subscription/license/entitlement
- Affiliate / Referral / Commission / Payout engine
- workflow/rules/config/metadata
- forms/form-builder/dynamic fields
- feature flags / controlled rollout
- documents/storage
- notifications/communications
- reporting/BI
- audit/logging
- search
- task/scheduling/queue
- automation
- API/integration/webhooks/event bus
- AI Gateway/providers/models/RAG/agents/tools
- device/sync/offline foundations
- localization/country packs
- CMS/branding
- marketplace/plugins/provider-extension framework
- support/elevation shared controls
- observability/security/backup/deployment

Find:

- duplicate ownership;
- no owner;
- multiple competing Core definitions;
- direct MS table coupling where a Core/API/event contract should exist.

Correct by consolidation/cross-reference, not by destructive rewrite.

---

# 14A. SHARED PLATFORM ENGINES / CONFIGURATION / EXTENSIBILITY AUDIT

Do not treat the Core capability list in §14 as sufficient evidence. Deep-audit the actual requirements, Architecture and DD contracts for each reusable platform engine:

- Workflow Engine
- Rules/Policy Engine
- Configuration Engine
- Metadata Engine
- Form Builder / Dynamic Fields
- Feature Flags / controlled rollout
- Notification / Communication Engine
- Search / indexing
- Task / Inbox / Scheduling
- Queue / worker / scheduler orchestration
- Automation
- Reporting / BI shared framework
- Audit shared framework
- CMS
- Localization / country-pack framework
- Marketplace / Plugin framework
- Affiliate / Referral / Commission / Payout engine
- support/operator-elevation shared capabilities

For each engine verify:

- one authoritative Core owner;
- exact Foundation purpose/scope;
- Architecture boundary;
- configuration hierarchy and versioning;
- Tenant/Core/Industry scope semantics;
- permission/entitlement enforcement;
- deterministic DD contracts;
- event/API integration;
- idempotency/concurrency where relevant;
- audit/observability;
- acceptance tests;
- no per-Industry reimplementation.

For dynamic forms/metadata/rules, verify schema/version migration, validation, publication/activation, rollback, safe expression/rule execution and audit ownership so Tenant configuration cannot become arbitrary code execution.

For feature flags, verify platform/plan/Tenant/Industry targeting, default state, rollout history, security boundaries and removal/retirement lifecycle.

For Affiliate/Referral/Commission/Payout, verify it remains a Core commercial capability, with attribution, eligibility, anti-abuse, commission calculation/versioning, payout state, reversal/clawback, Tenant configuration, permissions, audit and reporting defined where the source requires it.

---

# 14B. TENANT LIFECYCLE + ORGANIZATION MODEL AUDIT

Deep-audit more than isolation. Verify deterministic requirements/contracts for:

- Tenant creation/onboarding/provisioning;
- Tenant status lifecycle;
- exactly one Primary Industry;
- optional Enabled Industries;
- Industry Context provisioning/disable/re-enable;
- organization / legal entity where applicable;
- branches;
- departments;
- teams;
- locations/sites;
- domains/subdomains;
- regional Data Home;
- user membership and organization assignment;
- branding/config initialization;
- subscription/license initialization;
- suspension/grace effects;
- export/offboarding;
- erasure/retention/legal hold;
- Tenant closure/deletion;
- restore/recovery where applicable.

Verify referential integrity and authorization behavior when an Industry Context, branch, department, membership, license or Tenant becomes disabled.

No downstream system may silently default to another Tenant/Industry because a context was disabled.

---

# 14C. INTEGRATION / PROVIDER / THIRD-PARTY RISK AUDIT

Deep-audit the Integration Registry and provider-adapter model.

Verify:

- IntegrationDefinition / provider capability ownership;
- TenantIntegration / Industry scope;
- credential references, never plaintext secrets in business tables;
- provider authentication/signature verification;
- normalized errors;
- timeout/retry/circuit-breaker classes;
- idempotency;
- sync cursor/context;
- webhook/callback ingestion;
- external callback → governed OperationContract/event, never direct domain-table write;
- data minimization;
- residency/cross-border transfer behavior;
- provider fallback rules;
- health/observability;
- revocation/rotation;
- audit.

Where external providers materially handle sensitive or regulated data, verify vendor/third-party risk requirements, data-processing responsibility, regional availability constraints and fail-safe behavior are represented without fabricating vendor guarantees.

---

# 15. TENANT + INDUSTRY CONTEXT AUDIT

This is a critical zero-trust audit.

For every relevant layer verify:

**Tenant + active Industry Context**

is preserved across:

- RequestContext
- database rows
- RLS
- repositories
- services
- APIs
- events
- webhooks
- documents
- signed URLs
- reporting/projections
- cache
- local mobile/desktop storage
- offline queues
- AI/RAG metadata
- AI agent/tool calls
- observability/audit
- data residency routing

`industryContextId = null` must never mean “all industries.”

Sibling Industry data under the same Tenant must remain isolated unless a governed `EXPLICIT_CROSS_CONTEXT` contract exists.

Attempt to falsify isolation at every layer.

---

# 16. IDENTITY / AUTHENTICATION / AUTHORIZATION AUDIT

Verify a single authoritative identity abstraction.

Confirm:

- Clerk preferred;
- Auth.js fallback is behind the same identity boundary;
- provider IDs are not domain identities;
- service principals/API credentials/device/session concepts are consistent;
- revocation behavior is defined.

Verify the canonical effective-access chain is consistent everywhere:

**Authenticate  
→ Tenant  
→ Industry Context  
→ Subscription  
→ License  
→ Session/Device/API Credential  
→ Entitlement Snapshot  
→ RBAC  
→ applicable ABAC/context  
→ Security/Compliance/Residency  
→ Resource/Workflow Rules  
→ Effective Access**

RBAC is primary.

ABAC complements/narrows RBAC and cannot create access after RBAC denial.

UI hiding must never substitute server authorization.

Correct any alternate competing authorization chain.

---

# 17. COMMERCIAL MODEL AUDIT

Verify plan model and lifecycle consistency.

Plans:

- Free
- Starter
- Pro
- Premium
- Enterprise

Commercial routes must align with current governing decisions.

Verify canonical subscription states:

`PENDING → TRIAL → ACTIVE → GRACE → SUSPENDED → EXPIRED/CANCELLED`

`Renewed` is an event/re-entry behavior, not a resting state.

No active canonical `PAST_DUE` resting state.

Audit:

- plan/version
- subscription
- license
- entitlement definition
- entitlement snapshot
- add-ons
- overrides
- usage metering
- upgrade/downgrade
- grace/dunning
- recovery
- cancellation/expiry
- commercial route policy

Find hidden plan hard-coding in Industry DD.

Also audit the **Affiliate / Referral / Commission / Payout** capability as a Core commercial subsystem where required by the governing/source corpus. Ensure attribution, referral identity, commission rule/version, earning state, reversal/clawback, payout state, anti-abuse, permissions, Tenant configuration, reporting and audit are not lost merely because the subscription lifecycle is complete.

---

# 18. APPLICATION SURFACE AUDIT

Verify exactly the current canonical surface responsibilities and terminology.

At minimum distinguish:

1. Public SaaS Website
2. Platform Application
3. Tenant Management Application
4. Reusable Industry Experiences

Audit for competing “Tenant App”, “Admin Portal”, “Industry Portal”, “Super Admin app” semantics that create a fifth authority.

Tenant Management must remain administration/configuration/commercial/security oriented.

Operational industry transactions belong to governed Industry Experiences.

Clarify cross-channel hosting without creating new architectural surfaces.

---

# 19. MOBILE POLICY AUDIT

Verify the active mobile concept is consistent throughout the repository.

For Tenant Industry experiences, enforce the governing mobile policy of **exactly two Tenant mobile application families/shells per Tenant/Industry experience**:

- **Tenant User App** — external users
- **Tenant Staff App** — internal staff

These two app families may share one reusable codebase/shell architecture across industries and Tenants, but the product model must never proliferate role-specific binaries. The separate Platform Application is not counted as a Tenant mobile app.

Do not create separate binaries for Patient, Doctor, Teacher, Student, Cashier, Guard, etc.

Role/permission/context/feature flags/module activation determine the experience.

Verify React Native + Expo, secure local storage, push abstraction, device registration, Tenant/Industry switching and offline context isolation.

If the canonical documents intentionally model these as reusable shells/packages, ensure the terminology still satisfies the two-app policy and does not create binary proliferation.

---

# 20. DESKTOP AUDIT

Verify Tauri 2.0 and Windows/macOS/Linux compatibility where desktop is enabled.

Audit:

- native capability allowlist
- IPC
- keychain
- encrypted local DB
- file/printer/device access
- update verification
- offline context isolation

No unrestricted shell/process/filesystem bridge.

Where Tenant desktop capability is enabled, verify one reusable governed Tenant desktop shell/application model rather than role-specific or per-Industry native binaries. Industry/module behavior must remain context/config/permission driven.

---

# 21. PUBLIC SAAS WEBSITE AUDIT

Verify all required SaaS website areas remain represented and correctly owned, including:

- Home
- Platform/Features/Solutions
- Industries
- Pricing/Plans/Trials
- Signup / Demo / Quote
- Company / Team / Careers / Contact
- FAQ
- Testimonials / Reviews / Success Stories / Case Studies
- Blog / Articles
- Knowledge Base / Documentation / Downloads / Resources / Help
- Trust / Status / Compliance posture
- Privacy / Terms / Cookies / Refund / SLA / DPA
- Media / Gallery / Videos / Events / Newsletter
- Contact forms / landing pages / CMS
- cookie consent
- live/AI chat where governed
- SEO
- analytics
- localization
- accessibility

Detect accidental compression/loss of website requirements.


---

# 21A. BRANDING / THEME / DESIGN SYSTEM / CONTENT / DATA DEFAULTS AUDIT

Perform a dedicated line-by-line audit of all source and canonical requirements related to branding, visual identity, UI themes, content defaults, master/reference data, seed/demo data and media assets.

Do **not** assume these requirements are secondary or cosmetic. They are part of the product specification and must be canonical, configurable, traceable and implementation-ready.

## Brand Architecture

Verify clear ownership and separation between:

### Platform Brand Default
The SBGlobal Plus corporate/product identity used by the SaaS platform and public SaaS website.

### Tenant Brand Configuration
Governed Tenant-specific logo, colours, typography/theme options, domains, contact identity, print/report branding and white-label settings where entitled.

### Industry Experience Presentation
Reusable Industry Experience presentation rules that consume the Core design system and Tenant configuration without becoming separate per-Industry codebases.

Do not allow branding configuration to create separate application forks.

## Brand Tokens and Theme Requirements

Re-read RawSourceCorpus and all canonical files for valid requirements covering, where present:

- primary/secondary/accent colours;
- semantic status colours;
- background/surface/text/border tokens;
- light theme;
- dark theme where supported;
- typography families, weights and hierarchy;
- spacing scale;
- radius scale;
- shadows/elevation;
- grid/layout;
- breakpoints;
- iconography;
- form/table/report defaults;
- print/PDF styling;
- chart/report colour conventions;
- focus/hover/disabled/error/success/warning states;
- motion/animation preferences;
- reduced-motion accessibility behavior;
- contrast/accessibility requirements.

If source gives concrete valid brand values, promote them into the correct active canonical owner after checking compatibility with current Vision/governance.

If multiple source values conflict, do not randomly choose one. Resolve by authority, record the conflict and make the active value explicit.

If a required design token is missing but implementation requires one, use governed Vision-centric completion and label it correctly rather than leaving Development to invent it.

## Theme Configuration Model

Define or verify a configuration hierarchy such as:

**Platform Design-System Security/Accessibility Floor  
→ Platform Brand Default  
→ Industry Experience Allowed Overrides  
→ Tenant Branding / White-Label Configuration  
→ User Preference (non-authoritative presentation only)**

A lower layer must not weaken:

- accessibility;
- security indicators;
- required warning/error semantics;
- legally required notices;
- auditability;
- brand restrictions explicitly imposed by commercial entitlement.

## Public Website Brand/Content

Verify canonical requirements for:

- canonical tagline;
- company identity;
- logo usage;
- hero/CTA defaults;
- industry solution presentation;
- pricing/plan presentation;
- trust/security presentation;
- CMS ownership;
- SEO metadata;
- structured data;
- social preview metadata;
- legal footer;
- cookie/consent UI;
- contact/company details;
- media/gallery/video/event content where governed.

Source branding/content requirements must not remain stranded only in RawSourceCorpus if they are still active.

## Tenant Website / Experience Branding

Where Tenant website or published Tenant experience is part of the canonical model, verify requirements for:

- Tenant logo;
- favicon/app icon;
- brand colours;
- typography/theme options;
- domain/subdomain;
- contact details;
- branch/location details;
- social links where supported;
- invoice/report/receipt branding;
- email/SMS/push template branding;
- user/staff mobile appearance;
- desktop appearance;
- accessibility-safe customization;
- preview/publish/version/rollback behavior.

Clarify which options are plan/entitlement gated.

Verify the reusable experience publication model stays explicit and consistent:

**Industry Experience Definition → Tenant Experience Configuration → Published Tenant Experience Instance**

Branding/content/configuration changes must not create a separate per-Tenant source-code fork.

## Master / Reference / Localization Data

Audit source and active requirements for:

- global master data;
- reference catalogs;
- India-default baseline where governed;
- country/localization packs;
- currency;
- locale;
- timezone;
- date/number formats;
- language;
- regional address/phone/tax metadata abstractions;
- Tenant overrides;
- Industry-specific masters.

Do not hard-code country-specific business rules into the global Core unless governance explicitly requires a default plus localization mechanism.

## Seed / Demo Data

Verify requirements for:

- deterministic/reproducible seed data;
- small safe synthetic demo datasets;
- industry-appropriate examples for all nine industries;
- Tenant scoping;
- DEMO flags where applicable;
- no real PII;
- realistic but non-production identifiers;
- images/illustrations/media used for demo;
- reset/reseed behavior;
- localization/country-pack alignment;
- entitlement-aware demo visibility.

Healthcare-specific demo entities must not be used as generic templates for other industries.

## Media Asset Governance

Verify requirements for:

- asset ownership;
- source/provenance;
- licensing;
- file type/size;
- optimization/derivatives;
- accessibility alt text;
- localization;
- tenant/industry scope;
- malware scanning where uploaded;
- versioning;
- retention/deletion;
- CMS linkage.

Do not commit or expose unlicensed third-party assets merely to satisfy a visual requirement.

## Required Brand/Theme Output

After the audit, produce or repair the appropriate canonical artifacts so Development has deterministic answers for:

- active platform brand identity;
- design tokens;
- theme behavior;
- Tenant branding configuration;
- Industry Experience branding boundaries;
- public website visual/content defaults;
- master/reference/localization defaults;
- seed/demo data policy;
- media asset governance.

Add acceptance/test contracts for materially configurable behavior.

Before final readiness, there must be **no material branding/theme/data-default requirement left only in RawSourceCorpus without a current canonical disposition**.


---

# 22. NINE INDUSTRY SUITES — EQUAL FIRST-CLASS AUDIT

Independently verify all nine current industries:

1. Healthcare & Diagnostics
2. Education
3. eCommerce / Retail & Commerce
4. Hospitality
5. Manufacturing
6. Professional Services
7. Government & Public Sector
8. NGO / Temple / Trust
9. Security & Facility Management

Healthcare must not be:

- flagship;
- benchmark;
- template;
- default;
- source for invented sibling requirements.

Equal status does not require identical module counts.

Every industry must satisfy the same documentation/evidence discipline.

---

# 23. MANAGEMENT SYSTEM RECOUNT AND AUDIT

Independently recalculate the canonical Management System list from active Foundation.

Do not trust “41” merely because a register says 41.

Then verify every MS has substantive, domain-specific requirements and Detailed Design.

For every MS audit:

- purpose
- actors
- modules/submodules
- masters/reference data
- entities
- exact fields/types where DD owns them
- relationships
- constraints/indexes
- Tenant/Industry ownership
- states
- workflows
- allowed/forbidden transitions
- reversal/cancellation
- business rules
- approvals
- permissions
- ABAC/context
- documents/templates
- notifications
- reports
- KPI definitions/formulas
- API operations
- events
- webhooks/integrations
- AI/RAG/tools
- web/mobile/desktop experience
- offline behavior
- configuration
- entitlements
- audit
- acceptance/test IDs
- traceability

Do not accept generic boilerplate or a completeness matrix as proof.

Inspect the actual underlying design.

---

# 24. DOMAIN AUTHENTICITY AUDIT

For every industry/MS ask:

> Does this design represent real domain behavior, or is it generic CRUD/SaaS filler?

Detect:

- copied templates;
- renamed entities;
- copied state machines;
- missing industry-critical rules;
- missing reversals;
- missing exception paths;
- meaningless KPI names;
- generic “manage X” requirements;
- “AI-powered” with no concrete capability.

Correct domain-thin requirements using source knowledge first, then governed labelled completion where legitimately needed.

Do not import another industry’s semantics.

---

# 25. DATABASE / ENTITY / RLS AUDIT

For every material entity/table verify:

- one authoritative owner
- table/logical storage name
- fields
- types
- nullability
- defaults
- PK
- FK
- unique constraints
- check constraints
- exact indexes
- optimistic concurrency where needed
- sensitivity
- retention
- Tenant ownership
- Industry Context ownership
- state/status
- audit behavior

For industry-owned rows verify fail-closed Tenant + Industry predicates.

Check foreign keys and uniqueness cannot create cross-context leakage.

Check pooled PostgreSQL context cannot leak prior Tenant/Industry state.

Check background/service roles do not silently bypass policies.

---

# 26. WORKFLOW / STATE MACHINE AUDIT

For every major workflow verify an actual transition contract exists.

At minimum:

- current state
- trigger
- preconditions
- permission
- approval
- next state
- side effects
- event
- notification
- audit
- reversal/cancellation

Unlisted transitions should have deterministic denial behavior.

Find enum lists presented as if they were transition models.

Developers must not invent valid transitions.

---

# 27. BUSINESS RULE / VALIDATION AUDIT

For each material rule verify:

- Rule ID
- input facts
- trigger/condition
- decision
- resulting action
- error/deny behavior
- permission
- configuration inputs
- event
- audit
- acceptance test

Flag vague words such as:

- appropriate
- where needed
- where justified
- configurable
- flexible
- advanced
- intelligent
- secure
- scalable
- dynamic
- relevant
- optionally

unless a concrete supporting contract defines them.

---

# 28. KPI / REPORTING AUDIT

Independently enumerate every KPI/report metric named anywhere in Foundation, Architecture, DD and Industry artifacts.

Every KPI that is intended to be computable must have:

- stable ID
- definition
- numerator
- denominator where applicable
- aggregation
- time basis
- inclusion/exclusion rules
- filters
- source entities/events/projection
- Tenant/Industry scope
- permission
- refresh owner
- test fixture
- isolation test

Do not trust prior KPI counts.

Find named KPI without a formula/contract and correct it.

---

# 29. API / tRPC / REST AUDIT

Verify one canonical OperationContract model.

First-party tRPC and external REST/OpenAPI must project the same domain behavior.

Audit material operations for:

- operation ID
- router/procedure or method/path
- input schema
- output schema
- authorization
- Tenant/Industry context
- entitlement
- validation
- error taxonomy
- idempotency
- pagination where applicable
- versioning
- concurrency behavior
- event side effects
- audit

Find endpoint/procedure names with no exact contract.

Find REST/tRPC drift.

---

# 30. EVENTS / OUTBOX / WEBHOOK AUDIT

Verify one event model and contextual transactional outbox.

Audit event envelope for:

- event ID
- type/version
- scope class
- Tenant
- Industry Context
- source/target context for explicit cross-context
- actor
- source module/resource
- aggregate version
- correlation/causation
- sensitivity
- residency
- payload schema/version
- idempotency

Webhooks must enforce:

- endpoint verification
- signature/HMAC
- secret rotation
- Tenant/Industry filters
- retry
- DLQ
- replay controls
- payload minimization
- audit

Attempt sibling-industry event/webhook leakage.

---

# 31. DOCUMENT / STORAGE AUDIT

Verify one DocumentMeta/storage authorization model.

Audit:

- Tenant
- Industry Context
- source MS/module/resource
- object reference
- checksum
- ACL
- sensitivity
- retention
- residency
- malware status
- version/derivative lineage
- lifecycle
- signed URL authorization

Storage path/key must never be authorization.

Cross-context document access must fail closed.

---

# 32. AI / RAG / AGENT AUDIT

Verify AI remains a governed Core capability.

Audit:

- provider/model registry
- capability registry
- TenantAIConfig
- IndustryAIConfig
- policy
- routing
- sensitivity
- residency
- model allowlist
- cost/budget
- audit
- metering

RAG ingestion/retrieval must preserve:

- Tenant
- Industry Context
- ACL
- source
- sensitivity
- residency
- retention
- document/version
- embedding/model version

Retrieval filters must enforce authorization before semantic ranking.

Agent/tool execution must satisfy:

**Agent permission ≤ Acting principal permission**

Every state-changing tool must bind a governed operation contract, permission, approval where needed, idempotency and audit.

Attempt:

- cross-Tenant RAG
- sibling-Industry RAG
- prompt injection
- hallucinated resource ID
- approval bypass
- unauthorized tool
- provider fallback violating residency

Correct any gap.

---

# 33. OFFLINE / SYNC AUDIT

Verify queued operations preserve origin:

- Tenant
- Industry Context
- principal
- device
- module/MS
- resource
- operation
- base version
- payload version
- idempotency
- correlation
- sensitivity

Replay must re-evaluate current:

identity → membership → Tenant → Industry Context → device → commercial entitlement → RBAC → ABAC → security/residency → resource/version/business validation.

Offline authorization is never permanent authorization.

No naive last-write-wins for financial, stock, regulated, security or critical workflow state.

---

# 34. SECURITY / PRIVACY / COMPLIANCE-POSTURE AUDIT

Audit actual contracts for:

- auth/session
- MFA/SSO
- device trust
- API credentials
- service principals
- Tenant isolation
- Industry isolation
- RLS
- encryption
- key/secret management
- CSRF
- XSS
- CSP
- SSRF
- injection
- file upload
- malware
- rate limits/abuse
- API gateway / WAF / DDoS / bot-abuse controls
- risk-based/adaptive authentication
- trusted/unknown device policy
- impossible-travel / geo-fencing / geo-restriction where governed
- time/concurrent-session restrictions where governed
- webhooks
- vulnerability management / penetration-test readiness
- incident response / breach-notification workflow
- support/operator elevation
- digital identity/signature/trust-service boundaries where governed
- vendor/third-party security risk where providers handle sensitive data
- audit
- erasure
- retention/legal hold
- data residency
- AI prompt/RAG/tool security
- export
- privacy-safe logging

Do not falsely claim regulatory certification.

Use readiness/posture language unless actual certification evidence exists.

---

# 35. INFRASTRUCTURE / DEPLOYMENT / RECOVERY AUDIT

Audit design-level contracts for:

- Development / Staging / Production environment separation
- CI/CD and release governance at design level
- Vercel-suitable workloads
- Coolify + Dockerized VPS/regional workloads
- workers
- scheduler
- outbox/webhook/document/AI workers
- PostgreSQL/pooler
- object storage
- regional Data Homes
- secret references
- health/readiness
- database migration/preflight/rollback contract (design only, no migration execution)
- release stages
- backup/PITR
- restore exercises
- failover
- observability
- RPO/RTO policy

Check managed + self-hosted/regional compatibility.

Do not deploy.

---

# 36. NON-FUNCTIONAL REQUIREMENTS AUDIT

Verify measurable/testable contracts exist for:

- performance
- availability
- scalability
- resilience
- recoverability
- observability
- security
- privacy
- accessibility
- localization
- maintainability
- provider portability
- cost awareness

A statement such as “enterprise-grade/scalable/secure” is not sufficient evidence.

---

# 37. REQUIREMENT TRACEABILITY / NO-LOSS AUDIT

Independently validate source fidelity.

Do not trust previous counts or prior “0 GAP” claims without inspecting mappings.

Trace every material active requirement through:

**Source / Explicit User Requirement  
→ Knowledge Unit / Classification  
→ Foundation  
→ Architecture  
→ ADR/Decision  
→ Shared Detailed Design  
→ Industry/MS Detailed Design where applicable  
→ Acceptance/Test Contract**

For provenance, preserve/use the governing classification taxonomy where applicable:

- SOURCE-DERIVED
- PLATFORM-REUSABLE
- USER-DIRECTED
- ARCHITECTURAL-COMPLETION
- REVIEW_REQUIRED
- DD-AC / equivalent Detailed-Design completion provenance

Separately classify current disposition:

- VERIFIED
- REFINED_CORRECTLY
- SUPERSEDED_WITH_AUTHORITY
- CLOSED_IN_DD
- DEFERRED_TO_DEVELOPMENT_TEST
- EXTERNAL_CONFIGURATION_INPUT
- PARTIAL
- DUPLICATED_PROVENANCE
- DISTORTED
- GAP
- ORPHAN

A broad section pointer that cannot prove the actual requirement is not sufficient traceability.

---

# 38. REVIEW_REQUIRED / TODO / PLACEHOLDER SWEEP

Search the entire active canonical tree for:

- REVIEW_REQUIRED
- TBD
- TBC
- TODO
- OPEN
- unresolved
- placeholder
- later
- future decision
- as appropriate
- where appropriate
- where justified
- if needed
- module policy
- developer decides
- implementation decides

Classify every occurrence:

- RESOLVED
- LEGITIMATE_HISTORY
- EXTERNAL_CONFIGURATION_INPUT
- REAL_FOUNDATION_GAP
- REAL_ARCHITECTURE_GAP
- REAL_DD_GAP

Do not hide a design gap as an external input.

Target before Development readiness:

- REAL_FOUNDATION_GAP = 0
- REAL_ARCHITECTURE_GAP = 0
- REAL_DD_GAP = 0

unless a genuine external fact prevents completion, in which case Development readiness for the dependent scope must be truthfully constrained.

---

# 39. DUPLICATE / COMPETING TRUTH AUDIT

Search for multiple active definitions of:

- Primary Vision
- technology stack
- Tenant
- Industry Context
- RequestContext
- scope classes
- IdentityPort
- authorization chain
- subscription lifecycle
- entitlement snapshot
- OperationContract
- EventEnvelope
- DocumentMeta
- application surfaces
- mobile app model
- offline queued operation
- AI Gateway
- RAG access
- Management System IDs
- KPI definitions
- rate/security policy
- RPO/RTO
- storage provider abstraction

There should be one authoritative owner and references elsewhere.

Consolidate competing active truths through targeted cross-reference and supersession markers.

---

# 40. STATUS / CERTIFICATION EVIDENCE AUDIT

Audit every active status file against substantive evidence.

Verify consistency across:

- project state
- project manifest
- DD phase state
- checkpoints
- indexes
- changelogs
- review-required registers
- traceability
- audit artifacts
- phase summary
- handoff
- README/current guidance
- backup metadata

A status file may not claim more than the evidence proves.

Detect stale evaluated HEAD values.

Every final audit must state the exact commit it evaluated.

---

# 41. DEVELOPMENT DETERMINISM TEST

Select representative end-to-end flows from all nine industries, including at minimum:

- Healthcare: visit/order → sample/exam/dispense as applicable → result/report
- Education: student/exam → marks/moderation → result publication/correction
- Retail: POS/cart → payment → stock → refund/reconciliation
- Hospitality: reservation → check-in → service/folio → night audit → checkout
- Manufacturing: production order → material → execution → QC → inventory/closure
- Professional Services: client/project → allocation → timesheet → milestone/billing
- Government: application/request → deficiency/verification → SLA → approval/permit → appeal
- NGO/Temple/Trust: donor/devotee → donation/pledge → fund/service allocation → receipt/certificate
- Security/Facility: site/shift → attendance → patrol/checkpoint → incident/maintenance escalation

For each flow answer:

1. Can Development implement it without inventing a material entity/field/rule/state/permission/API/event/screen/formula?
2. Can QA test it without inventing expected behavior?

Both must be YES for final readiness.

---

# 42. CROSS-LAYER ISOLATION ATTACK MATRIX

Run a design-level adversarial attack against the final substantive corrected HEAD.

At minimum:

- Tenant A → Tenant B
- same Tenant Industry A → Industry B
- wrong-context resource ID
- wrong-context document
- wrong-context event consumer
- wrong-context webhook
- wrong-context projection/report
- offline wrong-context replay
- stale entitlement
- disabled Industry Context / disabled MS/module
- revoked session/device/API credential
- support/operator elevation outside approved scope
- cross-context export/report attempt
- pooled DB context carry-over
- worker missing persisted context
- AI cross-Tenant retrieval
- AI cross-Industry retrieval
- unauthorized AI tool
- prompt injection
- explicit cross-context operation missing source/target permission/audit

For each attack record:

- exact enforcement owner
- exact contract
- exact acceptance/test ID
- expected result
- audit/evidence result

---

# 43. TARGETED CORRECTION RULE

After identifying defects, correct them in the same execution.

Targeted correction is preferred when it can fully restore canonical truth, but you are **explicitly authorized to completely rewrite/rebuild any canonical non-RawSource file** when patching would leave stale, conflicting, fragmented, misleading, incomplete, historically layered, or internally inconsistent active content.

The goal is not to preserve old wording. The goal is to leave every required active canonical file **fresh, coherent, self-consistent, Vision-aligned, phase-correct, traceable, and development-ready**.

A full-file rewrite is appropriate whenever it is safer or clearer than accumulating patches, including when:
- a file contains mixed old/new truths;
- amendment layers make active rules ambiguous;
- the file contains pervasive stale technology or scope assumptions;
- multiple contradictions are distributed throughout the file;
- traceability would remain confusing after local edits;
- certification/state sections cannot be trusted independently;
- the file is structurally template-thin or materially incomplete;
- a fresh canonical rebuild would reduce ambiguity without losing valid knowledge.

When rewriting a file:
- preserve all still-valid requirements and decisions;
- preserve historical traceability through the proper history/changelog/decision mechanism;
- do not silently delete knowledge;
- do not rewrite RawSourceCorpus;
- do not fabricate unsupported source facts;
- update every inbound/outbound cross-reference affected by the rewrite;
- re-run traceability and acceptance checks against the rewritten file.

For every correction:

1. identify higher authority;
2. identify exact defect;
3. classify defect;
4. preserve valid content;
5. apply the smallest complete correction;
6. update affected cross-references;
7. update traceability;
8. add/update acceptance evidence;
9. record decision/provenance when material;
10. re-audit the affected dependency chain.

Examples:

- missing requirement → add at correct authoritative owner, then trace downstream;
- conflicting duplicate → choose authority-based canonical definition, mark other active copy as reference/history;
- shallow MS rule → add domain-specific rule + tests;
- missing transition → add exact transition/guard/approval/reversal;
- stale stack reference → mark legacy or replace active reference;
- vague “configurable” → define configuration contract;
- missing KPI formula → add formula + isolation/test contract;
- stale state claim → correct state;
- stale evaluated HEAD → rerun evidence at current final substantive HEAD.

---

# 43A. FRESH CANONICAL FILE REBUILD MANDATE

At the end of this audit/remediation, **all required active project documentation must be fresh at the final repository truth**, not merely historically present.

This applies to every canonical file required for Development readiness across:

- `Governing/`
- `Foundation/`
- `Architecture/`
- `DetailedDesign/`
- `Registers/`
- `State/`
- root README/status/checkpoint/handoff/backup metadata files that participate in current truth

For each required file, make an explicit final disposition:

- `FRESH — VERIFIED UNCHANGED`
- `FRESH — TARGETEDLY CORRECTED`
- `FRESH — FULLY REWRITTEN/REBUILT`
- `HISTORICAL / NON-ACTIVE`
- `BLOCKED — EXTERNAL FACT REQUIRED`

A file is **not fresh** merely because its latest commit is recent. It is fresh only if its full substantive content has been re-read against the final Vision, authority hierarchy, Foundation, Architecture, Detailed Design, traceability, technology baseline, security model, industry model, and final corrected repository truth.

If any required active file is stale, contradictory, incomplete, misleading, or carries obsolete active semantics, you must update it in this same execution. Use targeted edits where sufficient; otherwise rewrite the entire file.

This includes, where necessary:

- Foundation files;
- Architecture files and ADR content;
- Detailed Design files;
- Industry/MS specifications;
- acceptance/test contract files;
- traceability matrices;
- decision registers;
- REVIEW_REQUIRED registers;
- audit matrices;
- state/checkpoint/manifest files;
- README/handoff/phase summaries;
- governing execution documents when they themselves contain an active inconsistency.

Do not rewrite files merely for style. Rewrite only when substantive freshness, coherence, maintainability, or authoritative clarity requires it.

Before final certification, produce a **Canonical File Freshness Matrix** with one row per required active file containing:

- path;
- authoritative role;
- final disposition;
- material corrections;
- final evidence owner;
- cross-reference status;
- traceability status;
- final freshness verdict.

Final Development readiness requires:

`REQUIRED ACTIVE FILES FRESH = 100%`

Any required active file with unresolved stale/conflicting semantics blocks `READY FOR DEVELOPMENT`.

---

# 44. COMPLETION / INVENTION BOUNDARY

Do not fabricate external law, regulations, tax rules, statutory periods, provider capabilities or contractual commitments.

If an exact implementation/product default is required and legitimately belongs to architecture/DD but the corpus does not specify it:

- use Vision-centric completion;
- label provenance;
- consider realistic alternatives;
- record trade-offs;
- select an enterprise-safe default;
- make it configurable where appropriate;
- define a security floor;
- define acceptance tests;
- preserve reversibility.

Never present a completion choice as a source fact.

---

# 45. CORRECTION PRIORITY

Fix in this priority:

**P0**
- source loss
- Tenant/security isolation failure
- fundamental architecture contradiction
- missing critical industry/MS
- materially false certification
- requirement set unable to support deterministic implementation

**P1**
- material incomplete business/workflow/data/API/security contract
- substantial industry-depth gap
- authorization ambiguity
- missing acceptance behavior
- broken requirement ownership/traceability

**P2**
- bounded non-structural design/clarity gap

**P3**
- editorial/maintenance hygiene

Do not exaggerate severity.

---

# 46. AUDIT THEN CORRECT — NEVER CERTIFY MIDWAY

During remediation, temporary state may be:

`PRE-DEVELOPMENT ULTRA-DEEP AUDIT / REMEDIATION IN PROGRESS`

Do not restore or retain `READY FOR DEVELOPMENT` merely because corrections are being made.

Only decide readiness after the final independent adversarial re-audit.

Preserve old certifications/checkpoints as history; do not delete them.

---

# 47. FINAL INDEPENDENT ADVERSARIAL RE-AUDIT

After all targeted corrections and commits are complete, perform a fresh pass using the hypothesis:

> **THE PROJECT IS STILL NOT READY FOR DEVELOPMENT.**

Do not reuse the constructive audit conclusion.

Try to prove failure by finding:

- missing requirement
- RawSource requirement stranded without canonical disposition
- branding/theme/design-system requirement loss
- shared Core engine missing deterministic contracts
- Tenant lifecycle/offboarding ambiguity
- Affiliate/Referral/Commission/Payout capability loss
- integration/provider/third-party-risk gap
- hidden assumption
- shallow/template industry design
- missing domain rule
- missing workflow transition
- missing reversal/cancellation
- missing permission
- vague ABAC
- missing index/constraint
- API/event ambiguity
- direct cross-MS DB coupling
- stale technology
- stale status
- stale evaluated HEAD
- fake traceability
- untestable requirement
- KPI without formula
- missing MS acceptance test
- sibling-industry leakage
- document/report/projection leakage
- AI privilege escalation
- offline context leakage
- ungoverned cross-context sharing
- invented legal fact
- unresolved material REVIEW_REQUIRED

If any P0/P1 survives, Development readiness fails.

---

# 48. FINAL REPOSITORY VERIFICATION

After the final correction commit:

- re-fetch current branch;
- record exact ending HEAD;
- record final substantive audited HEAD separately from later metadata-only commits;
- verify `main` unchanged/unmerged;
- compare branch against `main` and record ahead/behind truth;
- inspect open PR state and never invent a PR/merge claim;
- verify RawSourceCorpus unchanged by blob/hash comparison;
- verify no application code/migrations/deployment implementation added;
- compare state/registers against final evidence;
- verify final audit artifacts evaluate the final substantive design HEAD or clearly explain later metadata-only synchronization commits;
- verify no open PR/merge claim is invented;
- verify backup/closure state truthfully;
- verify all final state/checkpoint/audit files agree on the same evidence baseline and status.

Do not write stale repository metadata into the final checkpoint.

---

# 48A. FINAL CHECKPOINT / BACKUP / PR HOUSEKEEPING

If and only if the substantive final adversarial gate passes, complete the governing pre-development closure work in the same execution where tools permit:

1. create/update the final checkpoint and handoff using the exact verified branch state;
2. produce a recoverable **documentation/project backup package** with no secrets and no production database content;
3. record backup metadata including source branch, exact HEAD, creation time, included scope and checksum/hash where tooling permits;
4. do not commit a large binary ZIP into Git merely for convenience unless existing project governance explicitly requires repository storage; prefer a generated artifact plus authoritative `BACKUP_METADATA.json`;
5. inspect whether an open PR already exists for this branch;
6. if governance/tooling permits and no equivalent PR exists, create or update **one review PR** from `docs/architecture-branch-2` toward `main`, clearly marked as review/closure only;
7. **do not merge `main`** — merge remains separately approval-gated;
8. if backup or PR tooling is unavailable, report the housekeeping limitation truthfully; never fabricate completion.

The substantive Development-readiness decision must remain distinguishable from repository housekeeping. If the governing Definition of Done makes a missing checkpoint/backup mandatory for the claimed phase transition, keep the corresponding final status blocked until that mandatory closure evidence exists.

---

# 49. COMMIT DISCIPLINE

Use a small number of logical commits.

Possible pattern:

- `docs(audit): open ultra-deep pre-development forensic review`
- `docs(foundation): apply targeted vision-consistency corrections`
- `docs(architecture): reconcile cross-layer architecture conflicts`
- `docs(dd): close deterministic design and requirement gaps`
- `docs(traceability): rebuild affected requirement evidence`
- `docs(audit): complete final adversarial development-readiness audit`
- `docs(state): synchronize earned pre-development gate`

Actual grouping should follow real findings.

Never modify `main`.

---

# 50. REQUIRED FINAL AUDIT ARTIFACTS

Create or update authoritative artifacts for this pass, using existing repository conventions rather than blindly duplicating files.

At minimum evidence must capture:

- audit scope and evaluated HEAD;
- complete file coverage + Per-File Coverage Ledger;
- Canonical File Freshness Matrix;
- source-promotion/disposition matrix;
- defect register;
- Vision consistency matrix;
- Foundation consistency result;
- Architecture consistency result;
- Detailed Design consistency result;
- shared platform engines/extensibility result;
- Tenant lifecycle/organization result;
- integration/provider/third-party-risk result;
- branding/theme/design-system/master/seed/demo/media result;
- 9-industry result;
- all-MS result;
- requirement no-loss/traceability result;
- isolation attack matrix;
- REVIEW_REQUIRED/TODO sweep;
- Development/QA determinism;
- corrections applied;
- final adversarial audit;
- final state/gate;
- final checkpoint/backup/PR-housekeeping truth where applicable.

Do not create a new parallel source of truth when an existing register is the proper owner.

---

# 51. REQUIRED FINAL RESPONSE

Return a concise but evidence-rich final report with these sections:

## A. Repository Truth

- starting HEAD
- ending HEAD
- final substantive audited HEAD
- commits
- changed files
- `main` status
- RawSourceCorpus integrity
- code/migration/deployment changes

## B. Coverage + Canonical File Freshness

Report all files/directories actually fully audited.

Provide the Canonical File Freshness Matrix for every required active file:

- FRESH — VERIFIED UNCHANGED
- FRESH — TARGETEDLY CORRECTED
- FRESH — FULLY REWRITTEN/REBUILT
- HISTORICAL / NON-ACTIVE
- BLOCKED — EXTERNAL FACT REQUIRED

No “sampled only” certification and no blanket “directory reviewed” statement may substitute for per-file freshness evidence.

## C. Vision-Centric Consistency

Report:
- Vision conflicts found
- conflicts corrected
- unresolved conflicts

## D. Foundation

- missing requirements
- conflicts
- wrong-phase content
- corrections
- final verdict

## E. Architecture

- gaps/conflicts
- ADR consistency
- context/security/data/API/event/AI/infra consistency
- corrections
- final verdict

## F. Detailed Design

- determinism
- schemas/contracts
- workflows/rules/permissions
- tests
- corrections
- final verdict

## F1. Shared Core Engines + Tenant Lifecycle

- Workflow/Rules/Config/Metadata/Form/Feature Flag engines
- Affiliate/Referral/Commission/Payout
- Tenant lifecycle/org hierarchy
- integrations/provider risk
- final verdict

## F2. Branding / Theme / Data Defaults

- platform brand/design tokens
- Tenant branding/white-label
- Industry Experience publication model
- localization/country packs
- master/reference data
- seed/demo/media governance
- final verdict

## G. Nine Industries + Management Systems

One evidence row per industry and one per canonical MS, with:
- requirement depth
- domain authenticity
- deterministic design
- tests
- traceability
- verdict

## H. Requirement Fidelity

- source/user requirements audited
- verified
- superseded
- external inputs
- gaps
- distortions
- orphans

## I. Isolation/Security

Final attack matrix result.

## J. REVIEW_REQUIRED / Placeholder Sweep

Counts:
- RESOLVED
- LEGITIMATE_HISTORY
- EXTERNAL_CONFIGURATION_INPUT
- REAL_FOUNDATION_GAP
- REAL_ARCHITECTURE_GAP
- REAL_DD_GAP

## K. Development + QA Determinism

Nine-industry YES/NO matrix.

## L. Findings

- P0
- P1
- P2
- P3

## M. Targeted Corrections Applied

List exact files/sections corrected and why.

## N. Final Gate

Use ONLY one of these:

### PASS

`VISION-CENTRIC ULTRA-DEEP AUDIT — PASS`

`FOUNDATION CERTIFIED — SUPPORTED`

`ARCHITECTURE CERTIFIED — SUPPORTED`

`DETAILED DESIGN COMPLETE — SUPPORTED`

`READY FOR DEVELOPMENT — SUPPORTED`

### BLOCKED

`VISION-CENTRIC ULTRA-DEEP AUDIT — BLOCKED`

`DEVELOPMENT NOT AUTHORIZED`

with exact remaining blockers.

---

# 52. FINAL DEVELOPMENT-READINESS CONDITIONS

Development may be declared READY only when all are true:

- complete canonical file coverage proven by the Per-File Coverage Ledger;
- 100% of required active canonical files classified FRESH at final repository truth;
- every active RawSource requirement has a canonical disposition or recorded supersession/external classification;
- no required active file left stale merely because it was previously certified;
- Primary Vision consistency across all active files;
- no active conflicting technology stack;
- no active Healthcare-first architecture;
- 9/9 industries first-class;
- every canonical Management System substantively complete;
- Core ownership non-duplicated;
- shared Workflow/Rules/Config/Metadata/Form/Feature Flag engines deterministic;
- Affiliate/Referral/Commission/Payout requirements preserved where governed;
- Tenant lifecycle/org hierarchy deterministic;
- integration/provider/third-party-risk contracts sufficient;
- branding/theme/design-system/Tenant branding canonicalized;
- localization/master/seed/demo/media requirements canonicalized;
- Tenant + Industry Context fail-closed;
- RBAC/ABAC chain consistent;
- commercial lifecycle consistent;
- application/mobile/desktop model consistent;
- database/RLS contracts deterministic;
- workflows deterministic;
- business rules deterministic;
- KPI formulas complete;
- APIs/events/webhooks deterministic;
- documents/storage deterministic;
- AI/RAG/Agent security deterministic;
- offline behavior deterministic;
- infrastructure/recovery contracts sufficient;
- no real Foundation gap;
- no real Architecture gap;
- no real DD gap;
- no P0;
- no P1;
- no material orphan requirement/design;
- no false traceability;
- no stale certification evidence;
- 9/9 Development determinism YES;
- 9/9 QA determinism YES;
- final adversarial audit PASS;
- mandatory checkpoint/backup closure evidence complete where governing Definition of Done requires it.

Counts and checkmarks alone cannot satisfy these conditions.

---

# 53. FINAL PRINCIPLE

The purpose of this task is not to produce more documentation.

The purpose is to make the entire repository behave as **one coherent, freshly rebuilt where necessary, specification system** from Vision through Detailed Design.

**Previous certification never outranks fresh evidence. If a certified Foundation, Architecture, Detailed Design, register, audit or state file is wrong, stale, incomplete, contradictory, structurally weak or missing a Vision-required requirement, change it. If a partial edit is unsafe, rewrite it completely. If a required canonical requirement does not yet exist, add it at the correct authority layer and trace it end-to-end.**

A developer should not have to choose between conflicting files.

A QA engineer should not have to invent expected behavior.

An architect should not have to infer ownership.

A security engineer should not have to guess the enforcement boundary.

An Industry implementer should not have to copy another Industry.

A future AI agent should be able to trace every material implementation decision back to authoritative project truth.

If that condition is achieved and the final adversarial audit proves it, certify the project as READY FOR DEVELOPMENT.

If not, keep the gate blocked and report the exact remaining defects.

---

# 54. EXECUTION COMMAND

When invoked, begin by re-fetching the current remote state of:

`yadavjalsingh192/SBGlobal_Plus_Project`

branch:

`docs/architecture-branch-2`

First record the freshly fetched remote HEAD as the **Execution Start HEAD** and use it as the only operational baseline. Then execute this entire prompt autonomously in one run.

Do not ask for another user message to continue.

Do not stop at findings.

Perform the complete audit, targeted correction, fresh adversarial re-audit, repository synchronization and final gate in this single execution.
