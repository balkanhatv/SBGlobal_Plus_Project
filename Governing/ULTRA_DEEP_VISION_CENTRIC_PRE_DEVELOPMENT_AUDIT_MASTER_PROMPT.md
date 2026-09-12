# SBGlobal Plus — Ultra-Deep Vision-Centric Pre-Development Audit + Targeted Correction Master Prompt

**Document Type:** Execution-only audit/remediation master prompt  
**Repository:** `yadavjalsingh192/SBGlobal_Plus_Project`  
**Authorized Branch:** `docs/architecture-branch-2`  
**Baseline branch HEAD before this prompt was committed:** `8d8b95d9f204cdf0c983ce90e22b276d1f2b6b7b`  
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

# 3. AUTHORITY HIERARCHY

Use the actual repository authority model. At minimum:

1. Primary Vision
2. Current explicit user direction embodied by this execution
3. `MASTER_INSTRUCTION_v2_5.md`
4. `MASTER_PROMPT_v2_5.md`
5. Canonical certified Foundation
6. Canonical certified Architecture + ADRs
7. Canonical Detailed Design and DD decisions
8. RawSourceCorpus as immutable knowledge/history according to the governing hierarchy
9. Registers / State files as evidence summaries only, never as stronger truth than the substantive documents they summarize

Where authorities conflict, higher authority governs.

Do not treat an old source statement as active merely because it is older or more detailed.

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

For **every canonical text file in scope**, inspect substantive content line-by-line / section-by-section / table-row-by-table-row / requirement-by-requirement.

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

MASTER_INSTRUCTION governs.

Apply only targeted reconciliation.

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
- Refine where appropriately justified by current governance
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
- workflow/rules/config/metadata
- forms/dynamic fields
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
- localization
- CMS/branding
- marketplace/plugins
- observability/security/backup/deployment

Find:

- duplicate ownership;
- no owner;
- multiple competing Core definitions;
- direct MS table coupling where a Core/API/event contract should exist.

Correct by consolidation/cross-reference, not by destructive rewrite.

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

For tenant-facing industries, enforce the governing policy of exactly two tenant mobile app roles/surfaces where applicable:

- Tenant User App — external users
- Tenant Staff App — internal staff

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
- webhooks
- support/operator elevation
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

Classify:

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
- revoked session/device/API credential
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
- verify `main` unchanged/unmerged;
- verify RawSourceCorpus unchanged;
- verify no application code/migrations/deployment implementation added;
- compare state/registers against final evidence;
- verify final audit artifacts evaluate the final substantive design HEAD or clearly explain later metadata-only synchronization commits;
- verify no open PR/merge claim is invented;
- verify backup/closure state truthfully.

Do not write stale repository metadata into the final checkpoint.

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
- complete file coverage;
- defect register;
- Vision consistency matrix;
- Foundation consistency result;
- Architecture consistency result;
- Detailed Design consistency result;
- 9-industry result;
- all-MS result;
- requirement no-loss/traceability result;
- isolation attack matrix;
- REVIEW_REQUIRED/TODO sweep;
- Development/QA determinism;
- corrections applied;
- final adversarial audit;
- final state/gate.

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

- complete canonical file coverage;
- 100% of required active canonical files classified FRESH at final repository truth;
- no required active file left stale merely because it was previously certified;
- Primary Vision consistency across all active files;
- no active conflicting technology stack;
- no active Healthcare-first architecture;
- 9/9 industries first-class;
- every canonical Management System substantively complete;
- Core ownership non-duplicated;
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
- final adversarial audit PASS.

Counts and checkmarks alone cannot satisfy these conditions.

---

# 53. FINAL PRINCIPLE

The purpose of this task is not to produce more documentation.

The purpose is to make the entire repository behave as **one coherent specification system** from Vision through Detailed Design.

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

Then execute this entire prompt autonomously in one run.

Do not ask for another user message to continue.

Do not stop at findings.

Perform the complete audit, targeted correction, fresh adversarial re-audit, repository synchronization and final gate in this single execution.
