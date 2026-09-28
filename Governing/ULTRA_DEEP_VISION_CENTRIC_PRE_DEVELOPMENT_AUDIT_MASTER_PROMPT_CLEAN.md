# SBGlobal Plus — Clean Ultra-Deep Vision-Centric Pre-Development Audit Master Prompt

**Status:** ACTIVE CANONICAL EXECUTION CONTROL  
**Supersedes:** Governing/ULTRA_DEEP_VISION_CENTRIC_PRE_DEVELOPMENT_AUDIT_MASTER_PROMPT.md  
**Repository:** yadavjalsingh192/SBGlobal_Plus_Project  
**Authorized branch:** docs/architecture-branch-2  
**Purpose:** In one execution, freshly audit the complete project documentation from Vision through Detailed Design, correct every permitted defect, rebuild affected downstream evidence, and issue an evidence-based Development-readiness verdict.

---

# 1. MISSION

Act as an independent Principal Requirements Auditor, Enterprise Architect, Multi-Tenant/Multi-Industry SaaS Architect, Detailed Design Auditor, Data/RLS Architect, API/Event/Integration Architect, Identity/RBAC/ABAC/Security Architect, AI/RAG/Agent Security Architect, Web/Mobile/Desktop Architect, Industry Domain Auditor, QA/Acceptance/Traceability Auditor, Documentation Governance Auditor, and Git/Evidence Integrity Reviewer.

Do not trust previous CERTIFIED / COMPLETE / PASS / READY labels. Treat every required active canonical file as freshly auditable.

The goal is not to produce more documentation or restore a green status. The goal is to leave one coherent specification system in which Development and QA do not need to invent material product behavior.

---

# 2. PRIMARY VISION

Highest product direction:

**SBGlobal Plus is an AI-Ready, AI-Extensible, AI-Powered, Enterprise-Grade, Multi-Tenant, Multi-Industry SaaS Platform.**

Canonical model:

**One Unified Enterprise Core  
→ Multiple Equal First-Class Industry Suites  
→ Tenants  
→ one Primary + optional Enabled Industries  
→ Branch / Department / Team / Location  
→ Users / Roles / Permissions  
→ Management Systems  
→ Modules / Submodules  
→ Workflows / Transactions  
→ Reports / Analytics  
→ AI-Powered Operations**

All nine current industries are equal first-class suites. Healthcare is never the flagship, benchmark, default, template, or source for inventing sibling-industry requirements.

---

# 3. AUTHORITY AND PHASE OWNERSHIP

Use this precedence:

1. Primary Vision
2. Current explicit invoking-user direction, when compatible with the Vision
3. Governing/MASTER_INSTRUCTION_v2_5.md
4. Governing/MASTER_PROMPT_v2_5.md
5. RawSourceCorpus as immutable source/provenance, using its governed internal source tiers
6. Canonical phase owners after source reconciliation:
   - Foundation = WHAT / WHY / WHO
   - Architecture + ADRs = system-level HOW
   - Detailed Design + DD decisions = exact implementation contract
7. Registers / State / audits / checkpoints = evidence projections only; they never outrank substantive canonical owners

RawSourceCorpus is not active architecture by itself. Preserve it unchanged, classify conflicting legacy content, and promote only valid/current knowledge into canonical files.

The audit prompt itself is a control artifact, not a product-requirement source.

---

# 4. EXECUTION-CONTRACT FREEZE

At runtime:

- fetch this clean prompt and record its blob/content SHA;
- that fetched version is the immutable execution contract for the current run;
- this file may be corrected for future runs, but edits made during the run do not change the current run rules;
- do not recursively restart because the prompt itself changed;
- never use this prompt as circular evidence for a new product requirement.

Every substantive requirement must be grounded in Vision, explicit user direction, governing documents, valid source knowledge, current canonical truth, or properly labelled governed completion.

---

# 5. SINGLE-MESSAGE AUTONOMOUS MODE

Complete the whole sequence in one user-message cycle:

**Fetch → Inventory → Audit → Classify → Correct → Trace → Revalidate → Adversarial Re-Audit → Synchronize State → Commit → Verify → Final Gate**

Do not stop only because the task is large. Continue every unaffected item.

If a necessary external/legal/contractual fact cannot be truthfully invented, block only the dependent item, record the exact dependency, and continue elsewhere.

A single-message requirement never permits fabricated coverage or fabricated PASS claims.

---

# 6. REQUIRED APPROVALS ARE NOT WAIVED

Do not perform an approval-gated action unless the invoking user explicitly approved that specific action.

Approval-gated actions include at least:

- production deployment;
- merge to main;
- Critical/Foundational Management System count exception outside the governed 2–8 range;
- resolution of a REVIEW_REQUIRED item that materially changes Vision-level scope;
- resolution that materially changes security posture;
- resolution that materially changes Tenant/Industry data-boundary semantics;
- any other action the current governing documents explicitly require approval for.

For an approval-blocked item: audit fully, propose the exact correction/options, record evidence, continue unaffected work, and block only the dependent final claim.

This prompt is not blanket approval.

---

# 7. GIT AND REPOSITORY SAFETY

Work only on docs/architecture-branch-2.

Before edits:

- fetch and record the current remote branch HEAD as Execution Start HEAD;
- verify main;
- enumerate the repository tree;
- record the RawSourceCorpus tree/blob identities;
- identify open PR state;
- use SHA-safe/optimistic-concurrency-safe writes;
- if the branch moves concurrently, reconcile before writing and never overwrite blindly.

Never:

- modify or merge main;
- force-push or rewrite history;
- mutate RawSourceCorpus;
- commit secrets/tokens/private keys;
- create production application code;
- create executable SQL/ORM migrations;
- create infrastructure-as-code deployment implementation;
- deploy;
- claim executable tests ran when they did not.

Documentation schemas, payloads, pseudocode, state tables and examples are allowed only as non-executable specification evidence.

External/reference repositories are inspiration-only unless governing truth explicitly authorizes otherwise. Do not copy external code, import incompatible licensing, or treat reference-repository behavior as project truth without provenance and approval.

Use small logical commits.

---

# 8. CANONICAL SCOPE MANIFEST + LINE-BY-LINE COVERAGE

Before substantive auditing, classify every relevant repository file as:

- ACTIVE_CANONICAL
- ACTIVE_CONTROL / EXECUTION
- ACTIVE_EVIDENCE / REGISTER / STATE
- HISTORICAL / SUPERSEDED
- RAW_SOURCE_IMMUTABLE
- GENERATED_BACKUP / ARTIFACT
- NON_DOCUMENTATION / OUT_OF_SCOPE_FOR_THIS_GATE

Do not exclude files merely to reduce work.

Do not force arbitrary document/file counts, phase counts, module counts, or artificial decomposition merely to satisfy a historical roadmap/volume target. Structure must follow current dependency, ownership, domain and maintainability needs. Historical volume targets are not completion evidence.

Fully inspect every required active text/structured-data file:

- Governing/
- Foundation/
- Architecture/
- DetailedDesign/
- DetailedDesign/Industries/
- Registers/
- State/
- README/current root status material
- BACKUP_METADATA.json
- RawSourceCorpus for source fidelity/no-loss

For every required active file create a Per-File Coverage Ledger with:

- path
- blob/content SHA
- size
- line count or structured-record count
- exact full-read coverage
- role/classification
- findings
- correction disposition
- downstream revalidation status

If retrieval is truncated, continue by explicit ranges until full coverage is proven.

Search results, summaries, matrices, headings or prior audits never substitute for reading the actual source file.

For binary/generated artifacts, audit metadata/hash/provenance as appropriate; do not pretend they received line-by-line text review.

---

# 9. AUDIT STANDARD FOR EVERY MATERIAL STATEMENT

For every material requirement/rule/decision/contract evaluate:

- Vision alignment
- authority/provenance
- active vs historical status
- phase ownership
- domain owner
- Tenant scope
- Industry Context scope
- clarity
- atomicity
- completeness
- consistency
- feasibility
- testability
- traceability
- duplication/conflict
- security/privacy/residency
- commercial/entitlement impact
- configuration behavior
- failure/exception behavior
- acceptance evidence
- implementation determinism

Use defect classes such as:

MISSING_REQUIREMENT, PARTIAL_REQUIREMENT, DISTORTED_REQUIREMENT, DUPLICATE_REQUIREMENT, COMPETING_TRUTH, CONTRADICTION, WRONG_SCOPE, WRONG_PHASE, WRONG_OWNER, STALE_TECH, STALE_STATUS, STALE_HEAD_EVIDENCE, AMBIGUOUS, UNTESTABLE, NON_DETERMINISTIC, PLACEHOLDER, BROKEN_TRACEABILITY, FALSE_TRACEABILITY, ORPHAN_REQUIREMENT, ORPHAN_DESIGN, SECURITY_GAP, TENANT_ISOLATION_GAP, INDUSTRY_ISOLATION_GAP, CROSS_INDUSTRY_LEAKAGE, CORE_DUPLICATION, INDUSTRY_LEAKAGE, INVALID_CERTIFICATION, EXTERNAL_CONFIGURATION_INPUT, LEGITIMATE_HISTORY.

Do not label style preferences as functional defects.

---

# 10. REQUIRED EXECUTION ORDER

Audit/remediate in dependency order:

1. Repository truth + RawSource integrity
2. Governing Vision/authority/technology/approval truth
3. RawSource + user-requirement inventory and source disposition
4. Foundation fresh audit/rebuild
5. Architecture + ADR fresh audit/rebuild
6. Detailed Design + Industry/MS + acceptance-contract fresh audit/rebuild
7. Registers / traceability / state reconstruction
8. Cross-layer consistency re-scan
9. Development/QA determinism + isolation attacks
10. Independent adversarial final audit
11. Final state/checkpoint/backup/PR housekeeping
12. Final repository verification and Development-readiness gate

Any upstream material correction invalidates dependent downstream certifications until revalidated:

- Governing change → revalidate Foundation + Architecture + DD + evidence/state
- Foundation change → revalidate Architecture + DD + tests + traceability/state
- Architecture/ADR change → revalidate DD + tests + traceability/state
- DD change → revalidate acceptance tests + determinism + traceability/readiness

Never leave downstream CERTIFIED/PASS/COMPLETE/READY unquestioned after its upstream basis materially changed.

---

# 11. SOURCE FIDELITY + RAW SOURCE PROMOTION

## Mandatory First-Pass RawSource No-Loss Reconciliation

**Before treating the existing Foundation, Architecture or Detailed Design as complete input, perform a fresh first-pass reconciliation of the entire RawSourceCorpus.**

The purpose is to catch anything that earlier phases may have missed, compressed too aggressively, placed in the wrong layer, left only in RawSourceCorpus, or incorrectly marked complete.

For every material RawSource knowledge unit:

1. identify the exact source/provenance;
2. determine whether it is still valid under the Primary Vision and current governing decisions;
3. compare it against the current canonical Foundation;
4. classify it as already preserved, correctly refined, superseded, duplicated, partially preserved, missing, distorted, wrongly scoped, wrongly phased, or external/configuration input;
5. if missing or incomplete, add/correct it **first at the proper canonical owner and in dependency sequence**:
   - **Foundation** for WHAT / WHY / WHO;
   - then **Architecture / ADR** for required system-level HOW;
   - then **Detailed Design** for exact deterministic implementation contracts;
   - then **Acceptance/Test Contracts**;
   - then **Traceability / Registers / State**;
6. do not jump directly from RawSourceCorpus to DD if a missing Foundation requirement must exist first;
7. do not add the same source requirement independently to multiple layers—establish one authoritative owner and propagate/cross-reference downstream;
8. after insertion or correction, revalidate every affected downstream artifact and temporarily invalidate stale certification evidence until the dependency chain is re-audited;
9. preserve the original RawSource text unchanged;
10. ensure the final no-loss evidence shows where every active source requirement now lives.

Required propagation path for a newly recovered source requirement:

**RawSource Knowledge Unit  
→ Vision/Authority Check  
→ Canonical Foundation Owner  
→ Architecture/ADR Impact  
→ Detailed Design Contract  
→ Acceptance/Test Evidence  
→ Requirement Traceability  
→ State/Checkpoint**

A source requirement is **not considered recovered** merely because it is mentioned in a register or audit matrix. Its substantive requirement must exist at the appropriate canonical layer, with downstream design/test evidence where implementation depends on it.

This first-pass reconciliation must explicitly include requirements that are easy to lose during architecture-focused work, including branding, colors/theme/design-system values, company/tagline/default content, website requirements, Tenant website/branding, master/reference/localization data, seed/demo/media rules, security controls, operational/support requirements, commercial/referral/commission rules, integrations/providers, mobile/desktop/device requirements, reports/KPIs, and industry-specific workflows/business rules.

Only after this RawSource no-loss reconciliation is complete may the normal Foundation → Architecture → Detailed Design fresh audit proceed.

Read RawSourceCorpus deeply but never edit it.

For each source knowledge unit determine:

- ACTIVE-CANONICAL
- REFINED_CORRECTLY
- SUPERSEDED_WITH_AUTHORITY
- LEGITIMATE_HISTORY
- REQUIRES_VISION_CENTRIC_COMPLETION
- EXTERNAL_CONFIGURATION_INPUT
- PARTIAL
- DISTORTED
- DUPLICATED
- GAP / ORPHAN

Actively mine valid missing knowledge, including:

- business/product requirements
- workflows/rules
- branding and brand story
- canonical colors/tokens
- typography, radius, shadow, layout
- UI design system
- light/dark/theme behavior
- website content/defaults
- Tenant branding/white-label
- invoice/report/print defaults
- company/contact/tagline metadata
- master/reference data
- localization/country packs
- seed/demo data
- media/assets/provenance
- support/operations requirements

Promote active source knowledge into the correct canonical owner and propagate it through Architecture/DD/tests where implementation depends on it.

Never silently treat model/common-domain knowledge as SOURCE-DERIVED. Use governed completion provenance for knowledge added beyond inspectable source evidence.

Do not pretend prior chat-only requirements are available unless preserved in the current invocation or repository evidence.

---

# 12. GOVERNING DOCUMENT AUDIT

Audit MASTER_INSTRUCTION_v2_5.md and MASTER_PROMPT_v2_5.md line-by-line against each other and the Vision.

Verify:

- version lockstep
- Vision wording
- authority hierarchy
- equal-industry rule
- RawSource immutability
- Foundation/Architecture/DD boundaries
- certification/evidence rules
- approval gates
- RBAC-primary + ABAC-complementary rule
- Tenant + Industry Context rule
- application surfaces
- two-Tenant-mobile-app policy
- technology/deployment baseline
- REVIEW_REQUIRED and completion provenance
- Git/checkpoint/backup/PR rules

MASTER INSTRUCTION wins if the pair diverges, but both remain auditable against higher Vision/user authority.

If a governing correction is needed, keep the pair coherent and preserve amendment/history evidence. Never change Vision/security/data-boundary rules without required approval.

---

# 13. CURRENT PRODUCT/TECHNOLOGY EXPECTATIONS

Derive current truth at runtime from authoritative canonical owners. The following are expected current values, not independent immutable authority.

Expected stack:

- Next.js 15
- React 19
- TypeScript 5.x
- Node.js 22+
- Tailwind + Shadcn UI
- PostgreSQL
- Payload CMS 3
- Refine only where explicitly assigned/justified
- Next.js server capabilities by default
- NestJS only for justified service boundaries
- tRPC for first-party typed APIs
- REST/OpenAPI for external interoperability
- Clerk preferred; Auth.js fallback behind the same identity boundary
- React Native + Expo
- Tauri 2.0
- Expo Push / OneSignal abstraction
- webhooks
- PostgreSQL outbox/event dispatcher
- pgvector where supported
- Vercel for suitable workloads
- Coolify + Dockerized VPS for self-hosted/regional workloads

Historical Laravel/PHP/Filament, MySQL-primary, Flutter, Windows-only desktop, PM2/cPanel-only, FCM-only, REST-only, JWT-refresh-primary assumptions must not remain active unless a higher-authority decision explicitly reintroduces them.

If technology truth legitimately changes, update all affected canonical files and this control prompt; never force the project back to a stale list.

Technology-stack changes are not inferred from convenience or agent preference. They require the explicit user/governing decision mechanism currently defined by MASTER_INSTRUCTION and must be recorded in the authoritative decision register.

---

# 14. CORE PLATFORM + TENANT MODEL AUDIT

Verify one Core owner and deterministic contracts for reusable capabilities:

- IAM/SSO/MFA/RBAC/ABAC
- Tenant/org/branch/department/team/location
- subscription/license/entitlement
- Affiliate/Referral/Commission/Payout
- workflow engine
- rules/policy engine
- configuration engine
- metadata engine
- form builder/dynamic fields
- feature flags/controlled rollout
- documents/storage
- notifications/communications
- reporting/BI
- audit/logging
- search/indexing
- tasks/inbox/scheduling
- queue/workers/scheduler
- automation
- API/integration/webhooks/event bus
- AI Gateway/providers/models/RAG/agents/tools
- device/sync/offline foundations
- localization/country packs
- CMS/branding
- marketplace/plugins/provider extensions
- support/operator elevation
- observability/security/backup/deployment
- master/reference/lookup data framework
- seed/demo/media data frameworks

For each shared engine/framework verify purpose, owner, scope, version/config hierarchy, permissions/entitlements, API/events, idempotency/concurrency where relevant, audit/observability, tests, and no per-industry reimplementation.

For dynamic forms/rules/metadata, verify versioning, validation, publish/activate/rollback, safe expression execution and no arbitrary-code path.

For feature flags, verify scope/targeting/default/rollout history/security/retirement.

Tenant lifecycle must cover onboarding/provisioning, status, exactly one Primary Industry, optional Enabled Industries, Industry Context enable/disable, org hierarchy, membership, Data Home, domain/subdomain, branding/config init, commercial init, suspension/grace, export/offboarding, retention/legal hold, closure/deletion and recovery where applicable.

Disabled context must never silently default to another Tenant/Industry.

---

# 15. TENANT + INDUSTRY ISOLATION / IDENTITY / AUTHORIZATION

Verify Tenant + active Industry Context is preserved across:

RequestContext, DB rows/RLS, repositories, services, APIs, events, webhooks, documents/signed URLs, reports/projections, cache, mobile/desktop storage, offline queues, AI/RAG metadata, agent/tool calls, observability/audit and residency routing.

industryContextId = null must never mean all industries.

Same-Tenant sibling Industry access is denied unless governed EXPLICIT_CROSS_CONTEXT exists.

Verify one IdentityPort abstraction and the effective-access chain:

Authenticate  
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
→ Effective Access

RBAC is primary. ABAC may narrow/contextualize RBAC but never create access after RBAC denial. UI hiding is never authorization.

Audit the full active Core Identity & Access capability set where governed, including:

- users/credentials and account lifecycle
- OTP/passwordless/magic-link/QR login
- passkeys/FIDO2/WebAuthn
- authenticator/TOTP and hardware keys
- biometrics as a device/platform factor where appropriate
- MFA/step-up
- SSO, OAuth 2.0, OIDC, SAML 2.0 and LDAP/AD where supported
- sessions/access tokens, API credentials and service accounts
- device identity/registration/trust
- adaptive/risk authentication, impossible-travel, geo/time/session restrictions
- revocation and concurrent-session policy
- digital identity/signature/trust-provider integration where governed, including Aadhaar eSign, DigiLocker, DSC/PKI/eToken-style providers through governed adapters rather than Core hard-coding
- certificate/trust validation such as OCSP/CRL/non-repudiation where applicable
- support/operator elevation

Normalize legacy JWT-refresh wording to the current Clerk session/access-token model for first-party user sessions; keep API keys/service accounts as separate credential classes. Do not reactivate superseded token architecture merely because RawSourceCorpus contains it.

---

# 16. COMMERCIAL MODEL

Derive current commercial truth from canonical owners.

Expected plans: Free, Starter, Pro, Premium, Enterprise.

Expected subscription lifecycle:

PENDING → TRIAL → ACTIVE → GRACE → SUSPENDED → EXPIRED/CANCELLED

Renewed is an event/re-entry behavior, not a resting state. PAST_DUE is not the canonical resting state unless higher-authority truth changed.

Audit plan/version, route policy, trials, subscription, license, entitlement definition/snapshot, add-ons, overrides, usage metering, upgrade/downgrade, grace/dunning/recovery/cancellation/expiry.

Audit Affiliate/Referral/Commission/Payout for attribution, eligibility, anti-abuse, rule/version, earning state, reversal/clawback, payout state, Tenant config, permission, audit and reporting.

No Industry DD may hard-code commercial behavior that belongs to Core.

---

# 17. APPLICATION / EXPERIENCE MODEL

Derive the active Application Surface Model; current expected surfaces are exactly:

1. Public SaaS Website
2. Platform Application
3. Tenant Management Application
4. Reusable Industry Experiences

Verify the current role/channel boundary:

- Public SaaS Website = public marketing/product/industry/security/pricing/docs/demo/contact/signup/onboarding; no normal public Platform-admin login exposure
- Platform Application = Platform Owner, Super Admin, Platform Staff, Platform Developer and other platform roles; Web/Mobile/Desktop where governed
- Tenant Management Application = Tenant Owner/Admin management surface; currently Web
- Industry Experience = Industry Website/Web App + Tenant Staff Mobile + Tenant User Mobile + optional Desktop

Login entry points are not extra application surfaces and never imply separate identity systems.

Tenant Management is administration/configuration/commercial/security oriented; operational Industry transactions belong to Industry Experiences.

Reusable experience model:

Industry Experience Definition  
→ Tenant Experience Configuration  
→ Published Tenant Experience Instance

Tenant branding/configuration must never create a per-Tenant source-code fork.

Mobile policy for every Tenant + enabled Industry Experience:

- exactly two logical Tenant mobile apps:
  - Tenant User App
  - Tenant Staff App
- no Patient/Doctor/Teacher/Student/Cashier/Guard role-specific binaries
- reusable React Native/Expo shells/codebases
- role/permission/context/feature/configuration determines experience
- separate Platform Application is not one of these two Tenant apps

Desktop: Tauri 2.0, Windows/macOS/Linux where enabled, one reusable governed desktop shell, allowlisted native capabilities, secure IPC/keychain/local DB/update/offline controls, no unrestricted shell/process/filesystem bridge.

---

# 18. WEBSITE + BRANDING + THEME + DATA DEFAULTS

Audit the Public SaaS Website for all governed requirements, including:

Home, Platform/Features/Solutions, Industries, Pricing/Plans/Trials, Signup/Demo/Quote, Company/Team/Careers/Contact, FAQ, testimonials/reviews/case studies, Blog/Articles, Knowledge Base/Docs/Downloads/Resources/Help, Trust/Status/Compliance posture, Privacy/Terms/Cookies/Refund/SLA/DPA, Media/Gallery/Video/Events/Newsletter, forms/landing pages/CMS, consent, live/AI chat where governed, SEO, analytics, localization and accessibility.

Audit and canonicalize:

- product/company brand identity and tagline
- logo rules
- primary/secondary/accent and semantic tokens
- light/dark theme behavior
- typography
- spacing/radii/shadows/layout/breakpoints
- forms/tables/reports/charts
- focus/hover/disabled/error/success/warning states
- animation/reduced-motion
- accessibility/contrast
- Tenant white-label branding
- domain/subdomain/favicon/app icon
- invoice/report/receipt/email/SMS/push branding
- version/preview/publish/rollback
- entitlement-gated branding
- Tenant/Industry Website navigation, content, enabled services/public modules, login buttons, language, notifications and analytics where supported

Theme hierarchy should enforce:

Platform accessibility/security floor  
→ Platform brand default  
→ allowed Industry Experience overrides  
→ Tenant branding/white-label  
→ user presentation preference

Lower layers may not weaken accessibility or security/warning semantics.

Audit master/reference/localization defaults, India-default where governed, country packs, currency/locale/timezone/date-number/language/address-phone-tax abstractions and Tenant/Industry overrides.

Explicitly reconcile the active Enterprise Default Standards rather than losing them during architecture normalization. Current source-defined platform defaults include, subject to higher-authority change: Asia/Kolkata timezone, dd-MM-yyyy date format, INR currency and English/Hindi language baseline. Also audit source-defined table/form defaults, standard columns, setting modules, statuses, role seeds, master-dropdown seeds, session-format defaults and invoice/report defaults. Industry-specific defaults must remain scoped to their Industry Suite rather than leaking into Core.

Audit seed/demo data: deterministic, synthetic, resettable, Tenant-scoped, DEMO-flagged where applicable, no real PII, Current-Supported-Industry coverage, localized, entitlement-aware.

Audit media assets for provenance/licensing, optimization, alt text, scope, malware scanning, versioning, retention and CMS linkage.

No material source branding/theme/data-default requirement may remain stranded only in RawSourceCorpus without canonical disposition.

---

# 19. CURRENT INDUSTRIES + MANAGEMENT SYSTEMS

Derive the Current Supported Industry set from authoritative governance/Foundation.

Current expected industries:

1. Healthcare & Diagnostics
2. Education
3. eCommerce / Retail & Commerce
4. Hospitality
5. Manufacturing
6. Professional Services
7. Government & Public Sector
8. NGO / Temple / Trust
9. Security & Facility Management

If a higher-authority explicit user decision legitimately changed this set, audit and propagate that change; do not let this control file override it.

Audit the **Future Industry Framework** separately from the Current Supported Industry set. A future industry is not automatically a tenth Current Supported Industry. Promotion to Current Supported status requires explicit user direction and full satisfaction of the governed Industry Specification Certification standard before live-Tenant enablement.

Independently recount Management Systems from active Foundation. Do not trust “41” merely because prior evidence says 41.

If a required Industry count would fall outside governed 2–8 Critical/Foundational MS range, propose the exception but do not enact without explicit approval.

For every Industry and every canonical MS verify substantive domain-specific:

- vision/scope/personas/actors
- organization/branch/location context
- modules/submodules
- master/reference data
- entities/fields/relationships
- constraints/indexes
- Tenant/Industry ownership
- states/workflows/transitions
- forbidden transitions
- reversal/cancellation/correction
- business rules/validation
- approvals
- permissions/ABAC
- documents/templates
- notifications
- reports/dashboards
- KPI formulas
- APIs
- events/webhooks
- integrations
- AI/RAG/tools
- website/web/mobile/desktop
- offline where applicable
- configuration
- entitlements/licensing
- audit
- acceptance/test IDs
- traceability

Reject generic CRUD/template filler, copied state machines, copied Healthcare semantics, meaningless KPI names and “AI-powered” claims without concrete capability.

Equal status does not require equal module/MS counts; it requires equal evidence discipline and domain authenticity.

---

# 20. DETAILED DESIGN DETERMINISM

For every material entity/table verify:

owner, name, fields, types, nullability, defaults, PK/FK, uniqueness, checks, exact indexes, concurrency/versioning where needed, sensitivity, retention, Tenant ownership, Industry ownership, status/state and audit.

RLS must fail closed for Tenant + Industry Context and remain safe with pooled PostgreSQL connections, workers and service roles.

For every material workflow require:

Current State → Trigger → Preconditions → Permission → Approval → Next State → Side Effects → Event → Notification → Audit → Reversal/Cancel

Unlisted transitions must deterministically deny unless an explicit reopen/reversal operation exists.

For every material business rule require:

Rule ID, inputs, trigger/condition, decision, result, error/deny behavior, permission, configuration, events, audit and acceptance test.

Vague terms such as appropriate, where needed, where justified, configurable, flexible, dynamic, advanced or intelligent are acceptable only when a concrete contract defines them.

Every named computable KPI must have stable ID, formula, numerator/denominator where applicable, aggregation, time basis, inclusions/exclusions, filters, sources/projection, Tenant/Industry scope, permission, refresh owner, test fixture and isolation test.

---

# 21. API / EVENT / INTEGRATION / DOCUMENT CONTRACTS

Verify one authoritative OperationContract model. First-party tRPC and external REST/OpenAPI must project the same domain behavior.

Material operation contracts require:

operation ID, input/output, router/procedure or method/path, authorization, context, entitlement, validation, error taxonomy, idempotency, pagination/versioning/concurrency where applicable, side effects/events and audit.

Verify one EventEnvelope + transactional outbox with:

event ID/type/version, scope, Tenant, Industry Context, explicit source/target contexts for cross-context, actor, source module/resource, aggregate version, correlation/causation, sensitivity, residency, payload schema/version and idempotency.

Webhooks require endpoint verification, signatures/HMAC, secret rotation, Tenant/Industry filters, retries, DLQ, replay controls, minimization and audit.

Integration/provider layer requires registry/adapter ownership, credential references, authentication/signature, normalized errors, timeout/retry/circuit-breaker, idempotency, sync cursor/context, callbacks through governed operations/events—not direct DB writes—residency, fallback, observability, revocation/rotation and third-party/vendor risk where sensitive data is handled.

Document/storage model requires Tenant, Industry Context, source resource, object reference, checksum, ACL, sensitivity, retention, residency, malware status, version/lineage, lifecycle and signed-URL authorization. Path/key is never authorization.

Audit governed data-lifecycle operations where applicable: import, validation, export, user/right-to-access fulfillment, portability, erasure, retention, legal hold and deletion. Every import/export path must preserve Tenant + Industry Context, authorization, sensitivity/residency policy and audit; bulk transfer is never a bypass around normal access control.

---

# 22. AI / RAG / AGENTS

AI remains Core infrastructure.

Derive and reconcile the canonical AI provider/capability registry from the active AI owner and RawSource provenance; do not silently lose source-defined providers/capabilities or freeze a stale provider count.

Audit provider/model/capability registries, TenantAIConfig, IndustryAIConfig, policy, routing, sensitivity, residency, allowlist, cost/budget, metering, observability and audit.

Also audit the governed Enterprise AI Platform capability families where active:

- assistants and agents
- skills/tools
- knowledge/RAG
- governed memory
- document intelligence
- AI API platform
- provider provisioning
- prompt/template management
- media generation
- workflow/automation integration
- REST/SDK/Webhook/MCP integration boundaries
- AI observability/evaluation

Keep product-level AI provider/model routing distinct from any build-execution/model-selection workflow used by documentation agents.

RAG must preserve Tenant, Industry Context, ACL, source, sensitivity, residency, retention, document/version and embedding/model version. Authorization filters must apply before semantic ranking.

Agent permission must never exceed acting-principal permission.

Every state-changing AI tool must bind a governed operation contract, permission, approval where required, idempotency and audit.

Attack:

- cross-Tenant RAG
- sibling-Industry RAG
- prompt injection
- hallucinated resource IDs
- approval bypass
- unauthorized tool
- provider fallback violating residency

---

# 23. OFFLINE / SYNC

Queued operations must preserve:

Tenant, Industry Context, principal, device, MS/module, resource, operation, base version, payload version, idempotency, correlation and sensitivity.

Replay must re-evaluate current identity, membership, Tenant, Industry Context, device, commercial entitlement, RBAC, ABAC, security/residency, resource/version and business validation.

Offline authorization is never permanent authorization.

No naive last-write-wins for financial, inventory, regulated, security or critical workflow state.

---

# 24. SECURITY / PRIVACY / COMPLIANCE POSTURE

Audit actual contracts for:

- auth/session/MFA/SSO
- device trust
- API credentials/service principals
- RBAC/ABAC
- Tenant/Industry isolation/RLS
- encryption/key/secret management
- CSRF/XSS/CSP/SSRF/injection
- uploads/malware
- API gateway/rate limit/WAF/DDoS/bot-abuse
- adaptive/risk auth, geo/time/session restrictions where governed
- webhooks
- vulnerability management and penetration-test cadence/readiness
- responsible disclosure
- incident response and breach-notification workflow/SLA
- support/operator elevation
- digital identity/signature/trust-service boundaries where governed
- erasure/export
- retention/legal hold
- residency/cross-border
- privacy-safe logging
- AI prompt/RAG/tool security
- vendor/third-party security risk

Explicitly reconcile active compliance/privacy posture requirements, including GDPR, India DPDP Act 2023, Healthcare HIPAA-readiness where applicable, SOC 2 Type II readiness/posture, ISO 27001 readiness/posture, consent management, DPAs and right-to-access/erasure. Do not convert readiness language into a certification claim.

Audit data residency/sovereignty, per-Tenant/per-region storage policy, cross-border data-flow mapping, encryption at rest/in transit and field-level protection where governed.

Do not claim regulatory certification without evidence. Use readiness/posture language where certification is not proven.

---

# 25. INFRASTRUCTURE / OPERATIONS / NFR

Audit design-level contracts for:

Development/Staging/Production separation, CI/CD/release governance, Vercel-suitable workloads, Coolify + Dockerized VPS/regional workloads, workers/scheduler, PostgreSQL/pooler, object storage, regional Data Homes, secrets, TLS/SSL and domains/subdomains, health/readiness checks, migration-preflight/rollback design, release stages, backup/PITR, restore exercises, failover, observability, RPO/RTO and post-deployment verification contracts.

No deployment occurs in this task.

Verify measurable/testable NFRs for performance, availability, scalability, resilience, recoverability, observability, security, privacy, accessibility, localization, maintainability, provider portability and cost awareness.

“Enterprise-grade”, “secure”, “scalable” or “robust” alone is not evidence.

---

# 26. REQUIREMENT TRACEABILITY / NO-LOSS

Trace every material active requirement through:

Source / Explicit User Requirement  
→ Knowledge Unit / Provenance  
→ Foundation  
→ Architecture  
→ ADR/Decision  
→ Shared DD  
→ Industry/MS DD where applicable  
→ Acceptance/Test Contract

Preserve governed provenance classifications such as SOURCE-DERIVED, PLATFORM-REUSABLE, USER-DIRECTED, ARCHITECTURAL-COMPLETION, REVIEW_REQUIRED and DD-AC/equivalent.

Do not accept broad section pointers as sufficient proof when a requirement-level link is needed.

Distinguish authoritative traceability ownership from large generated/derived matrices; duplicated rows must not inflate counts or become false independent evidence.

Target: no material GAP, DISTORTION or ORPHAN at the Development-ready gate.

---

# 27. REVIEW_REQUIRED / PLACEHOLDER / COMPETING-TRUTH SWEEP

Search all active canonical content for:

REVIEW_REQUIRED, TBD, TBC, TODO, OPEN, unresolved, placeholder, later, future decision, as appropriate, where appropriate, where justified, if needed, module policy, developer decides, implementation decides and equivalent ambiguity.

Classify each:

- RESOLVED
- LEGITIMATE_HISTORY
- EXTERNAL_CONFIGURATION_INPUT
- APPROVAL_BLOCKED
- REAL_FOUNDATION_GAP
- REAL_ARCHITECTURE_GAP
- REAL_DD_GAP

Do not hide a design gap as external configuration.

Also find competing active definitions of Vision, stack, Tenant, Industry Context, RequestContext, scope classes, IdentityPort, authorization chain, commercial lifecycle, entitlement snapshot, OperationContract, EventEnvelope, DocumentMeta, application surfaces, mobile model, offline operation, AI Gateway, RAG access, MS IDs, KPI definitions, rate/security policy, RPO/RTO and storage abstraction.

One authoritative owner; other locations cross-reference it.

---

# 28. STABLE IDS + CHANGE IMPACT

Full-file rewrite is allowed, but stable canonical IDs must not churn without reason.

Preserve requirement, Foundation, Architecture/ADR, DD decision/test, Industry, MS, module/capability, permission, API operation, event/version, KPI, workflow/state and configuration/catalog IDs where semantics remain the same.

If semantics require a new ID:

- create new ID;
- preserve old ID as superseded/history;
- map old → new;
- update all references;
- update tests/traceability;
- prove no dangling reference remains.

Before every material correction create a Change Impact / Blast-Radius entry containing:

- authority/source of change
- affected upstream/downstream files
- affected stable IDs
- security/tenancy/commercial/industry impact
- required test/traceability updates
- certifications temporarily invalidated

---

# 29. CORRECTION AUTHORITY

Previous certification never protects a file from correction.

For every non-RawSource canonical file, use the correction depth the evidence requires:

- targeted line/section correction
- structural rewrite
- multi-file reconciliation
- complete file rewrite/rebuild
- new supporting canonical artifact only when no correct owner exists

Full rewrite is appropriate when local patching would leave mixed old/new truth, layered ambiguity, pervasive stale technology/scope, fragmented traceability or structural incompleteness.

When rewriting:

- preserve valid knowledge
- preserve history/provenance
- do not silently delete requirements
- keep stable IDs where semantics remain
- update all references
- re-run traceability/tests
- revalidate downstream dependencies

Never fix a substantive defect merely by changing a PASS/COMPLETE label, count, matrix cell or checkpoint. Evidence changes first; status follows.

---

# 30. VISION-CENTRIC COMPLETION BOUNDARY

If an exact product/architecture/DD choice is required for deterministic implementation and source truth is silent, governed completion is allowed when not approval-gated.

Use:

Upstream Truth  
→ Enterprise Constraint  
→ Design Choice  
→ Alternatives  
→ Trade-off  
→ Configurability  
→ Security Floor  
→ Test Contract  
→ Provenance label

Do not fabricate law, regulation, statutory retention, tax/medical/legal/government requirement, contract promise or provider guarantee.

External/jurisdictional values should use configurable policy abstractions and safe product defaults only when legitimate.

Never present completion as a source fact.

---

# 31. DEVELOPMENT + QA DETERMINISM

Run representative end-to-end flows for every Current Supported Industry. Under the current nine-industry model include at minimum:

- Healthcare: visit/order → sample/exam/dispense as applicable → result/report
- Education: exam → marks → moderation → publication → correction
- Retail: sale → payment → stock → refund → reconciliation
- Hospitality: reservation → check-in → folio/night-audit → checkout
- Manufacturing: production order → material → execution → QC → stock/closure
- Professional Services: project → allocation → timesheet → milestone/billing
- Government: application → deficiency/verification → SLA → approval/permit → appeal
- NGO/Temple/Trust: donation/pledge → fund allocation → receipt/certificate/service
- Security/Facility: shift → attendance → patrol/checkpoint → incident/maintenance escalation

For each flow answer:

- Can Development implement it without inventing a material entity/field/state/rule/permission/API/event/screen/formula?
- Can QA test it without inventing expected behavior?

Both must be YES for every Current Supported Industry.

---

# 32. CROSS-LAYER ISOLATION ATTACKS

Against the final substantive corrected HEAD test at minimum:

- Tenant A → Tenant B
- same Tenant, Industry A → Industry B
- wrong-context resource ID
- wrong-context document
- wrong-context event consumer
- wrong-context webhook
- wrong-context report/projection/export
- offline wrong-context replay
- stale entitlement
- disabled Industry/MS/module
- revoked session/device/API credential
- support/operator elevation outside approved scope
- pooled DB context carry-over
- worker missing persisted context
- AI cross-Tenant retrieval
- AI sibling-Industry retrieval
- unauthorized AI tool
- prompt injection
- EXPLICIT_CROSS_CONTEXT missing source/target permission/policy/audit

For each attack record enforcement owner, exact contract, test ID, expected result and evidence result.

---

# 33. FINAL ADVERSARIAL RE-AUDIT

After all substantive corrections are committed, run a separate pass with the hypothesis:

**THE PROJECT IS STILL NOT READY FOR DEVELOPMENT.**

Try to prove failure by finding:

- missing/stranded source requirement
- Vision inconsistency
- stale technology/status/evaluated HEAD
- shallow/template Industry/MS design
- missing domain rule
- missing workflow transition/reversal
- missing permission/ABAC guard
- missing index/constraint
- API/event/document ambiguity
- direct cross-MS DB coupling
- KPI without formula
- missing acceptance test
- sibling-industry leakage
- report/document/offline/AI leakage
- AI privilege escalation
- Tenant lifecycle ambiguity
- shared-engine gap
- branding/theme/data-default loss
- Affiliate/Referral/Commission/Payout loss
- integration/provider/third-party risk gap
- false/broad traceability
- invented legal/source fact
- unresolved material REVIEW_REQUIRED
- broken file/anchor/ID/JSON reference

P0 or P1 surviving means Development readiness fails.

---

# 34. STATE / MANIFEST / REPOSITORY INTEGRITY

Audit current state across:

PROJECT_STATE, PROJECT_MANIFEST, phase summaries, handoff, checkpoints, indexes, changelogs, DD state/review files, traceability, audit artifacts, README and backup metadata.

Validate active machine-readable artifacts such as State/PROJECT_MANIFEST.json and BACKUP_METADATA.json:

- parse successfully
- no contradictory keys
- referenced files/IDs exist
- status matches canonical truth
- branch/SHA values are current
- counts are evidence-derived

Validate Markdown file paths, anchors, relative links and canonical IDs after rewrites.

Record separately:

- Final Substantive Audited HEAD
- Final Metadata/Closure HEAD

Later metadata-only commits are allowed only if they do not change material product/design behavior. Any later material design change invalidates the prior substantive audit and requires rerun.

At the end verify:

- exact ending branch HEAD
- main unchanged/unmerged
- ahead/behind truth
- open PR truth
- RawSourceCorpus tree identity + every blob SHA unchanged from Execution Start
- no executable implementation/migration/IaC/deployment/test suite added
- all state/checkpoint/audit files agree

---

# 35. CHECKPOINT / BACKUP / PR HOUSEKEEPING

Only after the substantive adversarial gate passes:

- synchronize checkpoint/state/handoff from verified truth;
- create the required recoverable documentation/project backup package with no secrets and no production DB;
- record branch, exact HEAD, creation time, included scope and checksum/hash where tooling permits;
- do not commit a large ZIP merely for convenience unless governance explicitly requires repository storage;
- inspect existing PRs;
- if governance/tools permit and no equivalent PR exists, create/update one review PR from docs/architecture-branch-2 to main;
- never merge main without explicit approval.

If mandatory backup/checkpoint evidence cannot be produced, keep the corresponding phase-transition/closure claim blocked and report the exact limitation.

---

# 36. REQUIRED AUDIT EVIDENCE

Use existing canonical owners where possible; do not create parallel competing truths.

Final evidence must include:

- Canonical Scope Manifest
- Per-File Coverage Ledger
- Canonical File Freshness Matrix
- source-promotion/disposition matrix
- defect register
- Vision consistency result
- Foundation result
- Architecture/ADR result
- Detailed Design result
- shared-platform-engine result
- Tenant lifecycle/org result
- integration/provider-risk result
- branding/theme/master/seed/demo/media result
- Current-Supported-Industry result
- every-MS result
- requirement-level no-loss/traceability result
- REVIEW_REQUIRED/placeholder result
- Development/QA determinism result
- isolation attack matrix
- machine-readable manifest validation
- cross-reference/dangling-link validation
- stable-ID migration/supersession mappings if any
- blast-radius/change-impact register
- final adversarial audit
- final repository/closure truth

For each required active file classify:

- FRESH — VERIFIED UNCHANGED
- FRESH — TARGETEDLY CORRECTED
- FRESH — FULLY REWRITTEN/REBUILT
- HISTORICAL / NON-ACTIVE
- BLOCKED — EXTERNAL FACT REQUIRED

Required active files must be 100% FRESH for READY FOR DEVELOPMENT.

---

# 37. SEVERITY

P0:
- source loss
- security/Tenant/Industry isolation failure
- fundamental architecture contradiction
- missing critical Industry/MS
- materially false certification
- non-deterministic critical design

P1:
- material incomplete business/workflow/data/API/security contract
- substantial Industry/MS depth gap
- authorization ambiguity
- missing acceptance behavior
- broken requirement ownership/traceability

P2:
- bounded non-structural design/clarity gap

P3:
- editorial/maintainability issue

Do not exaggerate severity.

---

# 38. FINAL DEVELOPMENT-READINESS GATE

READY FOR DEVELOPMENT is allowed only if all are true:

- complete Per-File Coverage Ledger
- every required active file FRESH
- every active source requirement has canonical disposition
- no active Vision conflict
- no unauthorized technology drift
- every Current Supported Industry first-class
- Future Industry Framework remains separate and promotion-gated
- every canonical MS substantively complete
- no Core duplication
- shared engines deterministic
- Tenant lifecycle deterministic
- branding/theme/localization/master/seed/demo/media and Enterprise Default Standards canonicalized
- Tenant + Industry Context fail-closed
- RBAC/ABAC/access chain consistent
- commercial model consistent
- application/mobile/desktop model consistent
- data/RLS deterministic
- workflows/rules deterministic
- KPI formulas complete
- API/events/webhooks/integrations deterministic
- document/storage deterministic
- AI/RAG/agent security deterministic
- offline deterministic
- infrastructure/recovery/NFR contracts sufficient
- no REAL_FOUNDATION_GAP
- no REAL_ARCHITECTURE_GAP
- no REAL_DD_GAP
- no unresolved approval-blocked item affecting claimed scope
- P0 = 0
- P1 = 0
- no material orphan/false traceability
- no stale certification evidence
- Development determinism YES for every Current Supported Industry
- QA determinism YES for every Current Supported Industry
- final isolation audit PASS
- final adversarial audit PASS
- mandatory checkpoint/backup evidence complete where governance requires it

Counts/checkmarks alone never satisfy the gate.

---

# 39. FINAL RESPONSE

Return a concise evidence-rich report:

1. Repository Truth — start/end/substantive/closure HEADs, commits, changed files, main, RawSource integrity, code/migration/deployment status
2. Coverage — scope manifest + full-file coverage/freshness totals
3. Vision/Governing — conflicts, corrections, unresolved approval items
4. Foundation — findings/corrections/verdict
5. Architecture/ADRs — findings/corrections/verdict
6. Detailed Design — schemas/workflows/rules/tests/determinism verdict
7. Shared Core/Tenant/Integration — engines, lifecycle, provider risk
8. Branding/Theme/Data Defaults — final canonical status
9. Industries/MS — one row per Current Supported Industry and every canonical MS
10. Requirement Fidelity — verified/superseded/external/gaps/distortions/orphans
11. Isolation/Security — attack result
12. REVIEW_REQUIRED — resolved/history/external/approval-blocked/real gaps
13. Development + QA Determinism — YES/NO per Industry
14. P0/P1/P2/P3
15. Corrections Applied — exact files/sections + blast radius
16. Closure — checkpoint/backup/PR truth
17. Final Gate

Final Gate must be exactly one of:

**PASS**
- VISION-CENTRIC ULTRA-DEEP AUDIT — PASS
- FOUNDATION CERTIFIED — SUPPORTED
- ARCHITECTURE CERTIFIED — SUPPORTED
- DETAILED DESIGN COMPLETE — SUPPORTED
- READY FOR DEVELOPMENT — SUPPORTED

or

**BLOCKED**
- VISION-CENTRIC ULTRA-DEEP AUDIT — BLOCKED
- DEVELOPMENT NOT AUTHORIZED
- exact remaining blockers

---

# 40. EXECUTION COMMAND

Begin by re-fetching the current remote state of yadavjalsingh192/SBGlobal_Plus_Project on docs/architecture-branch-2.

Record the freshly fetched remote HEAD as Execution Start HEAD.

Then execute this entire clean prompt from start to finish in one run.

Do not stop at findings. Perform permitted corrections/rebuilds, downstream revalidation, fresh adversarial audit, commits, state synchronization, closure verification and final evidence-based gate.

Do not modify or merge main.
