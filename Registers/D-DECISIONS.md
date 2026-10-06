# D-DECISIONS — Decision Register (Foundation + Architecture + Truth Revalidation)
Seeded from MASTER_INSTRUCTION v2.5 §29, inherited CR/AC/DR decisions, and explicit user-directed technology/truth-audit instructions. RawSourceCorpus remains immutable.

## Inherited conflict resolutions (CR)
| ID | Conflict | Resolution (ACTIVE) |
|---|---|---|
| CR-01 | Subscription tiers: 4-tier vs 5-tier | Union adopted: Free / Starter / Pro / Premium / Enterprise |
| CR-02 | Tagline conflict | USER-DIRECTED: "One Intelligent Platform. Every Industry. Infinite Possibilities." |
| CR-03 | Industry list differences | Union adopted — 9-industry catalog ACTIVE |
| CR-04 | Phase numbering differences | Dependency-driven phase governance ACTIVE |
| CR-05 | Healthcare flagship conflict | Vision prevails; all nine industries first-class/equal |
| CR-06 | One common tenant application vs multiple | Application Surface Model + Reusable Industry Experiences |
| CR-07 | Source file/version mismatch | Source hygiene preserved; fixed file counts retired |
| CR-08 | Website roadmap vs development phases | Different scopes; both preserved and cross-referenced |

## Foundation architectural-completion decisions

These are authoritative Foundation decision records; shorthand references elsewhere cross-reference this section.

| ID | Context | Decision | Alternatives / Options | Trade-offs | Consequences | Dependencies |
|---|---|---|---|---|---|---|
| AC-01 | Downgrade can place current usage above target-plan limits. | Require impact assessment and explicit remediation before effective downgrade; never silently delete data. | Immediate hard cut; silent deletion; block downgrade entirely. | More workflow complexity; preserves tenant data and commercial integrity. | Removed capabilities become restricted/archived by policy; entitlement recompute stays atomic. | F-01 §5, F-14 §6, A-04 |
| AC-02 | Provisioning can partially fail across tenant/identity/industry/seed steps. | Make provisioning idempotent and resumable. | Non-resumable single pass; manual cleanup. | More state tracking; safer recovery. | No half-visible tenant. | F-02 W-04, A-01/A-02 |
| AC-03 | Support/compliance may require operator tenant-data access. | Purpose-bound justification + role gate + time-boxed elevation + audit. | Blanket access; total prohibition. | Operational friction for stronger trust. | Operator access is exceptional and attributable. | F-03, A-03/A-11 |
| AC-04 | Erasure rights can conflict with legal hold/mandatory retention. | If retention/legal hold applies, pseudonymize personal fields and preserve required non-personal skeleton; otherwise hard-erase per policy. | Universal delete; universal pseudonymization. | Conditional policy is more complex but legally safer. | Architecture must not force pseudonymization for every erasure request. | F-03 §6, F-04 §11, A-05 |
| AC-05 | Approved financial records need correction without history loss. | Reversal/correction entries after approval; no in-place mutation. | Edit approved record; delete/recreate. | More ledger entries; much stronger auditability. | Approved financial history append-only. | F-04 §5, A-05 |
| AC-06 | Retail POS may require resilient counter operation. | Optional offline-capable Retail POS desktop using shared synchronization policy. | Web-only POS; separate retail desktop codebase. | Offline complexity vs continuity. | Reuses shared Core/Tauri, no retail backend fork. | F-07, F-10, A-08/A-09 |
| AC-07 | Education required first-class depth despite thinner source. | Complete Education independently using domain reasoning + source anchors. | Leave shallow; copy another industry. | More documentation work; authentic semantics. | Education remains first-class without Healthcare leakage. | F-07/F-12/F-13/A-09 |
| AC-08 | Retail/Commerce required independent complete semantics. | Complete Retail/Commerce independently. | Leave shallow; template-copy. | Domain work vs false parity. | Retail semantics remain retail-owned. | F-07/F-12/F-13/A-09 |
| AC-09 | Hospitality required independent complete semantics. | Complete Hospitality independently. | Leave shallow; template-copy. | Domain work vs false parity. | Hospitality first-class. | F-08/F-12/A-09 |
| AC-10 | Manufacturing cannot be reduced to generic inventory. | Complete manufacturing-specific production/work-order semantics. | Generic inventory-only; copy Retail. | Larger scope; correct production behavior. | Manufacturing first-class. | F-08/F-12/F-13/A-09 |
| AC-11 | Professional Services cannot be reduced to CRM only. | Complete service-delivery/SLA/project semantics independently. | Generic CRM-only; copy another suite. | More explicit domain detail. | Professional Services first-class. | F-08/F-12/F-13/A-09 |
| AC-12 | Government/Public Sector needs citizen/public-approval context. | Complete public-sector semantics independently. | Generic enterprise workflow only. | More governance/compliance detail. | Government first-class. | F-09/F-12/A-09 |
| AC-13 | NGO/Temple/Trust needs donation/membership/seva/trust governance. | Complete those semantics independently. | Generic nonprofit CRM. | Broader domain detail. | NGO/Temple/Trust first-class. | F-09/F-12/F-13/A-09 |
| AC-14 | Security & Facility Management needs deployment/site/guard/facility semantics. | Complete SFM independently. | Generic workforce module only. | More operational depth. | SFM first-class. | F-09/F-12/A-09 |
| DR-01 | Source requires configurable residency but not a mechanism. | Regional Data Home under one logical Core. | Permanent single region; universal per-tenant DB; independent regional forks. | Regional ops complexity vs residency control. | Cross-region transfer/backup/failover is policy/contract/legal-basis gated. | F-11, A-02/A-05/A-10 |
| AC-15 | Desktop source was Windows-heavy and less complete than mobile. | Cross-platform desktop Foundation; Tauri 2.0 under UD-TECH-01. | Windows-only; separate native OS apps. | Cross-platform abstraction vs some native specialization. | OS packaging remains Detailed Design. | F-10/F-06/A-08 |
| AC-16 | Generic MS anatomy can create false evidence of domain depth. | F-12 common anatomy is guidance only; each MS needs its own business semantics at authoritative owner. | Inheritance counts as proof; duplicate every common clause. | Requires per-MS verification without needless duplication. | F-12 alone cannot certify an MS. | F-07…F-09/F-12/F-13 |
| AC-17 | Several discovered/thin MSs failed depth review. | Deepen named MSs in F-13 with their own workflows/states/rules/dependencies. | Remove; leave discovered; generic inheritance. | More Foundation detail. | Known MS blockers closed without changing suite equality. | F-13/A-09 |
| AC-18 | Commercial semantics were split/inconsistent. | F-14 is canonical commercial Foundation: versioned route policy + subscription/license/entitlement chain/lifecycle. | Hard-code routes; let each surface interpret plans. | Central policy adds config complexity but prevents drift. | Free/Starter self-serve; Enterprise sales-assisted; Pro/Premium dual-route. | F-01/F-02/F-04/F-14/A-04 |
| AC-19 | S2.4 requires plural physical table names, while the canonical PostgreSQL Detailed Design and the verified migration stream consistently use schema-qualified singular snake_case tables. | Preserve `snake_case` but standardize canonical **physical table names as singular** within their owning PostgreSQL schemas. The source plural-table convention remains preserved as historical/superseded naming guidance. Future physical tables follow the singular convention; domain/entity type names remain singular. | Rename all existing tables to plural; introduce plural compatibility views/aliases; retain the existing singular canonical names. | Renaming the established 48-migration schema would add high-risk migration/query/test churn without business, isolation or security benefit; permanent compatibility aliases would create dual naming and long-term drift. Singular names preserve current DD/schema/code consistency. | No data or business-semantic change and no table rename. Existing physical names remain canonical; future schema additions use singular snake_case plus explicit FK/index naming. | S2.4-U165; A-05; DD-05; current PostgreSQL migrations |

## Current user-directed technology decision
| ID | Scope | Decision | Status |
|---|---|---|---|
| UD-TECH-01 | Current project Architecture technology | **Next.js 15 · NestJS where a dedicated backend/service boundary is required · TypeScript 5.x / Node.js 22+ · React 19 · Tailwind CSS + Shadcn UI · PostgreSQL · Payload CMS 3 · Refine where an internal CRUD/admin console is more appropriate than Payload · React Native + Expo · Tauri 2.0 for Windows/macOS/Linux · tRPC for typed first-party APIs where appropriate · REST/OpenAPI for external interoperability · Clerk preferred managed identity boundary · Auth.js where Clerk is not architecturally suitable · Webhooks · Expo Push Notifications / OneSignal · Vercel for suitable web workloads · Coolify + Dockerized VPS for self-hosted workloads.** | ACTIVE — USER-DIRECTED |

**Technology rule:** UD-TECH-01 is the current technology authority. Existing RawSourceCorpus technology references remain immutable historical/source material. Current Architecture and implementation-facing documentation must align to UD-TECH-01. Any approved alternative requires rationale/trade-offs in the Architecture decision record. Laravel/PHP/Filament/Flutter/MySQL-primary/PM2/cPanel assumptions are not authoritative for current Architecture.

## 2026-09-10 Project Truth decisions
| ID | Context | Decision | Consequences / trade-offs |
|---|---|---|---|
| UD-TRUTH-01 | User explicitly rejected gate-label-only certification and required actual canonical evidence | **A gate, status label, prior audit summary, registry row, reference or count never proves substantive completion by itself. Current truth is determined by repository-resident content/evidence.** | CP-F1-005 remains historical; Foundation current status reopened under F-15 until substantive evidence is re-earned. More revalidation work is required, but false certainty is avoided. |
| UD-TRUTH-02 | Foundation files may map source requirements only by summary/reference/generic inheritance | **Foundation must contain canonical WHAT/WHY/WHO at the owning scope; cross-references are allowed only when the authoritative owner contains the actual required detail.** | F-12 generic inheritance cannot independently satisfy MS-specific evidence. Atomic source→canonical verification is required. |
| UD-TRUTH-03 | RawSourceCorpus branch content diverged while governance declared it immutable | **Restore active RawSourceCorpus to the accepted `main` source blobs; preserve divergent variants in Git history rather than as current source.** | Applied in commit `548e643ffba1c4c7a0e4fbcbaa5b15c58b0a708c`; source boundary becomes stable again without history rewrite. |
| UD-TRUTH-04 | Current Architecture A-00…A-09 was built against a Foundation status now under revalidation | **Retain Architecture content but treat it as provisional until Foundation truth is stable and the Architecture is revalidated.** | Avoids discarding useful work while preventing inheritance of an unsupported Foundation gate. A-10…A-12 and Architecture evidence still remain future work. |

## Architecture decisions
**A-12 is the authoritative Architecture ADR register.** ADR-001 through ADR-018 are current and contain Context, Decision, Alternatives/Options, trade-offs, Consequences, risks, dependencies, affected documents and reversibility/evolution seams where relevant. A-00…A-11 cross-reference those records and do not create competing ADR authorities. Architecture certification evidence is completed by `ARCHITECTURE_TRACEABILITY_MATRIX.md`, `ARCHITECTURE_NO_LOSS_AUDIT.md` and `ARCHITECTURE_FINAL_AUDIT.md`.


## 2026-09-11 Targeted Reconciliation Decisions

### UD-PHASE-01 — Phase-evidence boundary
**Context:** earlier §9A wording could be interpreted as requiring Detailed-Design-level schemas and exact endpoint/payload evidence before Foundation closure.  
**Decision:** Foundation proves WHAT/WHY/WHO and required interactions; Architecture proves HOW-level boundaries/responsibilities/data flow/interface behavior; Detailed Design owns exact schemas, field dictionaries, endpoint paths/methods and payload contracts.  
**Alternatives:** one depth standard for every phase; weaken evidence generally.  
**Trade-offs:** phase-aware evidence is more nuanced but prevents both shallow certification and premature implementation design.  
**Consequences:** Foundation certification does not depend on implementation contracts; Architecture remains substantive HOW.  
**Dependencies:** MI §9A/§26B, MASTER_PROMPT, F-15, Architecture evidence.

### UD-SOURCE-01 — Active immutable source baseline
**Context:** Git history contains earlier divergent RawSourceCorpus variants.  
**Decision:** accepted S1/S2 blobs are the immutable active baseline; earlier variants remain Git history. Explicit user decisions may supersede active interpretation without rewriting source history.  
**Alternatives:** rewrite source; treat every historical variant as co-authoritative.  
**Trade-offs:** requires explicit supersession traceability; preserves provenance and one current baseline.  
**Consequences:** UD-TECH-01 can supersede historical stack requirements while source bytes remain unchanged.  
**Dependencies:** SOURCE_REGISTRY, atomic traceability, F-01 §8, Architecture.

### UD-COMM-01 — Commercial route/lifecycle canonicalization
**Context:** older wording made all tiers above Starter sales-assisted and A-04 introduced PAST_DUE despite F-14's Active→Grace model.  
**Decision:** Free/Starter self-serve; Enterprise sales-assisted; Pro/Premium governed dual-route. Resting states: Pending/Trial/Active/Grace/Suspended/Expired/Cancelled; Renewed is an event; failed renewal triggers Active→Grace.  
**Alternatives:** hard-code all paid tiers to sales; add PAST_DUE resting state.  
**Trade-offs:** policy configuration adds governance but prevents channel/market code drift.  
**Consequences:** F-01/F-02/F-04/F-14 and A-04 use one model.  
**Dependencies:** F-14, billing/entitlement architecture, public signup UX.


## 2026-09-11 Independent Remediation Closure

| ID | Context | Decision | Consequences / evidence |
|---|---|---|---|
| UD-REM-01 | Heading-level traceability was incorrectly treated as atomic requirement proof. | Preserve the 372 parent units and add separate requirement-level child evidence; never certify from parent counts. | `TRACEABILITY_MATRIX_REQUIREMENTS.md`: 2,962 children, 0 GAP after remediation. |
| UD-REM-02 | Same-tenant sibling industries required a fail-closed boundary beyond tenant-only isolation. | Active Tenant + Industry Context is mandatory for industry-scoped service/data/document/event/webhook/offline/AI operations; missing/wrong context denies. | A-01/A-02/A-05/A-06/A-08/A-09; ADR-002/006/008/009/012; isolation attack matrix PASS. |
| UD-REM-03 | Multiple effective-access representations could drift. | One canonical server-authoritative chain: principal → Tenant → Industry Context → subscription/license → credential/device/session → entitlement snapshot → RBAC → ABAC/context → security/compliance/residency → resource/workflow rules. | A-01/A-03/A-04; ADR-004. |
| UD-REM-04 | A-08 carried competing surface interpretations. | One four-surface responsibility model: Public Website; Platform Application; Tenant Management Web; Reusable Industry Experiences. | A-08 §1/§9A. |
| UD-REM-05 | Certification was reopened by independent audit. | Restore Foundation/Architecture certification only after fresh No-Loss + adversarial passes and zero unresolved P0/P1. | Fresh audits at remediation closure PASS; Detailed Design becomes next authorized phase, not completed. |


## 2026-09-13 User-Directed Pre-Development Backup Waiver

### UD-BACKUP-01 — Manual owner backup; physical ZIP is not a Development gate
**Context:** The final pre-development audit had one governance-only blocker because this execution environment could not materialize and verify a physical repository ZIP. An exact Git recovery manifest already exists. The owner explicitly directed that no AI-created backup ZIP is needed, that any desired backup will be downloaded manually from the repository clone, and that work must continue on the current branch without merging to main.

**Decision:** For this pre-development transition, a physical AI-generated checkpoint ZIP is not required to authorize Development. The exact Git recovery manifest remains evidence. The physical ZIP remains truthfully uncreated by this session.

**Branch constraint:** Continue on `docs/architecture-branch-2`. Do not merge `main` without a future explicit owner instruction.

**Consequences:** `CLOSURE-BACKUP-01` is closed by explicit user direction, not by claiming a backup occurred. All substantive Phase 1–4 and final adversarial PASS evidence remains unchanged.

**Scope:** This waiver applies to the pre-development checkpoint only. It does not remove future release/deployment/production backup and recovery requirements.


## 2026-09-13 Database Implementation Completion Decisions

### DEV-DB-AC-001 — Global evidence identity with monthly partitioned detail
**Context:** DD-05 requires monthly RANGE partitioning for audit/outbox/webhook-delivery evidence, while DD-07/DD-15 require stable UUID identity and webhook attempt idempotency. PostgreSQL partitioned-table uniqueness requires the partition key to participate in parent-level unique/primary constraints.

**Decision:** Preserve global UUID/idempotency through small unpartitioned identity registries, while storing the full evidence rows in monthly RANGE-partitioned detail tables. Each registry stores the global ID plus the canonical partition timestamp and enforces global uniqueness. Each partitioned detail row has a composite `(id, partition_time)` primary key and composite FK to the registry, so one global ID resolves to exactly one canonical partition timestamp. Webhook identity registry additionally enforces `UNIQUE(subscription_id,event_id,attempt_no)`.

**Consequences:** Stable event/audit/delivery IDs and idempotency remain database-enforced; monthly partitioning remains compliant with PartitionPolicy v1; Tenant/Industry RLS stays on the parent detail table; future monthly partitions are created through a governed helper.

**Trade-off:** An additional identity-registry write is required in the same transaction as each evidence row.

**Status:** ACTIVE — implementation completion decision.


### DEV-DB-AC-002 — Database runtime role classes
**Context:** DD-14 requires distinct application, migration/admin, backup/WAL, and monitoring database roles; DD-16 requires runtime roles that cannot bypass RLS. Canonical documents define the role classes but not implementation role names.

**Decision:** Define reusable PostgreSQL NOLOGIN group roles:
- `sbg_app_rw` — application data-plane DML, NOBYPASSRLS;
- `sbg_worker_rw` — worker/outbox/document pipeline DML, NOBYPASSRLS;
- `sbg_monitor_ro` — observability/read-only metadata access, NOBYPASSRLS;
- `sbg_migration_admin` — migration/DDL administration role, never assigned to runtime workloads;
- `sbg_backup_operator` — reserved backup/restore group role; runtime application identities never inherit it.

Concrete deployment login/service identities are environment-specific and receive only the appropriate group membership. No shared root credential is introduced.

**Consequences:** application and worker workloads remain unable to bypass forced RLS; privileged migration/backup capability is segregated from runtime identities.

**Status:** ACTIVE — implementation completion decision.


### DEV-DB-AC-003 — Canonical AI database schema ownership
**Context:** DD-09 defines exact AI provider/model/config/RAG/assistant/agent/memory/usage persistence, but DD-05 originally omitted a schema owner for those tables.
**Decision:** Add `core_ai` as the canonical shared PostgreSQL schema owned by the AI Gateway/RAG/Agent platform. Rows remain PLATFORM_GLOBAL, TENANT_CORE or TENANT_INDUSTRY according to their own scope fields; schema name is not an authorization boundary.
**Consequence:** AI data is not scattered across unrelated schemas and remains subject to the same RequestContext/RLS/entitlement/residency rules.
**Status:** ACTIVE — development completion decision.


### DEV-DB-AC-004 — Dedicated AI Gateway database role
**Context:** DD-09 requires one AI Gateway choke point and prohibits domain/client direct provider or AI persistence access. Database implementation therefore must not expose `core_ai` broadly through the general application role.
**Decision:** Add `sbg_ai_gateway_rw` as a NOLOGIN, NOBYPASSRLS database group role. It alone receives operational access to `core_ai` plus the minimum supporting schema reads required by the AI Gateway. The ordinary `sbg_app_rw` role receives no direct `core_ai` privileges.
**Consequence:** application/domain modules must traverse the AI Gateway contract instead of coupling directly to AI/RAG tables.
**Status:** ACTIVE.


### DEV-DB-AC-005 — Workflow / Automation / Notification physical persistence
**Context:** Core ownership and lifecycle were certified, but exact database fields for Workflow/Automation/Notification were not sufficiently deterministic for implementation.
**Decision:** DD-05 §3B is the exact shared persistence contract. Workflow state names remain versioned definition data rather than Core business enums; transition and delivery-attempt evidence is append-only; automation may invoke only governed OperationContracts/Workflow definitions; notification provider secrets remain in Integration CredentialReference, never notification rows.
**Consequence:** shared engines remain Industry-neutral and implementable without inventing Industry semantics or bypassing authorization/integration boundaries.
**Status:** ACTIVE.


### DEV-DB-AC-006 — Workflow and Notification worker database roles
**Context:** Workflow/Automation and Notification persistence is shared Core infrastructure. Background execution requires table access but must not use migration/admin credentials or bypass RLS; transition/delivery-attempt evidence must remain append-only.
**Decision:** Add dedicated NOLOGIN, NOBYPASSRLS group roles `sbg_workflow_worker_rw` and `sbg_notification_worker_rw`. Workflow workers may mutate instances/tasks/runs and append transitions, but cannot update/delete transition evidence. Notification workers may mutate delivery state and append attempts, but cannot update/delete attempt evidence. Neither role receives secret-store credential-reference access.
**Consequence:** asynchronous shared-engine execution stays least-privilege and context-scoped.
**Status:** ACTIVE.


### DEV-DB-AC-007 — Dedicated Document and Integration database service roles
**Context:** Physical storage metadata is intentionally hidden from the general application role, and Integration credential/provider metadata must remain behind the Integration boundary. Both modules still require implementable service identities.
**Decision:** Add NOLOGIN, NOBYPASSRLS roles `sbg_document_service_rw` and `sbg_integration_service_rw`. Document service alone may access `StorageObject` plus logical document tables; Integration service alone may manage TenantIntegration/CredentialReference/SyncCursor while reading the global Integration catalog. Both receive only minimum supporting Core reads and append-only audit access.
**Consequence:** private storage/provider boundaries are implementable without re-granting broad access to `sbg_app_rw`.
**Status:** ACTIVE.


## 2026-09-14 Current audit reconciliation

DD-18 owns the existing Development completion decisions `DEV-DB-AC-008…010` / `DD-036…039`; DD-17 owns `DBA-001…013`. They specify identity/elevation and Control Plane roles, exact same-scope dependencies, prompt/tool set persistence and platform-definition writes. SQL 0029…0032 realizes these contracts and the current all-stages report records the failed and successful verification runs. This register does not create a new user decision or weaken approval/security requirements. Prior design-only isolation and historical traceability counts above are read with the current source-owner and executable-evidence overlay, never as proof of an unbuilt application.

## DEV-CORE-AC-001 — Concrete SQL adapter continuation (2026-09-14)
The authoritative decision is `../DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md#dd-040--concrete-sql-driver-and-truthful-repository-binding-dev-core-ac`. Physical mapping and deferred read-side dependencies are in `../Development/CORE_PERSISTENCE_ADAPTER_MAP.md`. This implementation completion preserves the existing Tenant/Industry/region security boundary and does not resolve a Vision-level approval item.

## 2026-09-21 audit enforcement and continuation disposition

VC-01–04 enforce existing scope/session/value/evidence requirements; no new product
rule or DD identifier is created. The current DD-076 prerequisite ownership audit
records unresolved production semantics under their existing canonical owners.
REPO-001–006 implement existing source/identifier/checkpoint preservation requirements
in Core CI. Current user direction authorizes targeted corrections and safe
continuation, not invention of missing commercial policy.

## 2026-09-21 — DD-080 disposition
The external REST plane reuses the canonical OperationExecutor and DD-052 projector through a metadata-only preflight boundary. Concrete routes and credential syntax require separate source-complete registration; the adapter is not public exposure authority.

## 2026-10-02 — WorkflowTransition visible-parent evidence disposition

DD-363…DD-367 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own this bounded composition over DD-102/DD-104/DD-174. Source audit: `Development/WORKFLOW_TRANSITION_VISIBLE_INSTANCE_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. This reuses existing source-owned policy and does not resolve a Vision-level or security-boundary approval item.

DD-368…DD-372 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded visible AutomationRun→AutomationDefinition evidence composition over DD-105/DD-106/DD-175. Source audit: `Development/AUTOMATION_RUN_VISIBLE_DEFINITION_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. This reuses existing source-owned persistence/relationship policy, forbids PLATFORM_GLOBAL fallback, and does not resolve a Vision-level or security-boundary approval item.

DD-373…DD-377 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded visible AutomationDefinition→WorkflowDefinition containment evidence composition over DD-101/DD-105/DD-176. Source audit: `Development/AUTOMATION_DEFINITION_VISIBLE_WORKFLOW_CONTAINMENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. This reuses existing source-owned containment policy, forbids PLATFORM_GLOBAL fallback and does not resolve a Vision-level or security-boundary approval item.

DD-378…DD-382 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded AutomationRun→AutomationDefinition→optional WorkflowDefinition evidence composition over DD-372/DD-176. Source audit: `Development/AUTOMATION_RUN_VISIBLE_DEFINITION_WORKFLOW_CONTAINMENT_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It preserves the DD-372 envelope, avoids duplicate AutomationDefinition reads, forbids PLATFORM_GLOBAL fallback and adds no runtime execution policy.

DD-383…DD-387 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded DD-382 + optional exact OperationContract registry-evidence composition. Source audit: `Development/AUTOMATION_RUN_VISIBLE_DEFINITION_WORKFLOW_OPERATION_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Registry identity is evidence only; compatibility/admission/dispatch/execution policy remains unresolved and separately governed.

DD-388…DD-392 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded visible AgentRun→AgentDefinition current-evidence composition over DD-118/DD-130/DD-181. Source audit: `Development/AI_AGENT_RUN_VISIBLE_DEFINITION_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. This reuses existing source-owned persistence/visibility/binding policy, forbids PLATFORM_GLOBAL fallback and adds no AI execution authority.

DD-393…DD-397 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded AgentRun→AgentDefinition→ToolSet visible current-evidence composition over DD-392/DD-111/DD-180. Source audit: `Development/AI_AGENT_RUN_VISIBLE_DEFINITION_TOOL_SET_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It preserves the DD-392 envelope, forbids PLATFORM_GLOBAL fallback and adds no ToolSet-member, authorization or AI execution policy.

DD-398…DD-402 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded visible AgentStep→DD-397 parent→conditional persisted tool-binding evidence composition over DD-131/DD-397/DD-113/DD-110/DD-182. Source audit: `Development/AI_AGENT_STEP_VISIBLE_RUN_DEFINITION_TOOL_SET_TOOL_BINDING_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. This reuses source-owned persisted relationships and adds no permission/entitlement/approval, OperationContract, provider/model or AI/tool execution policy.

DD-403…DD-407 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded AgentStep→optional AgentApproval evidence composition over DD-402/DD-132/DD-183/DD-184. Source audit: `Development/AI_AGENT_STEP_VISIBLE_PARENT_APPROVAL_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It preserves exact parent evidence and adds no approval satisfaction, approver authorization, resume or tool/AI execution policy.

DD-408…DD-412 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded AgentStep→optional AgentApproval→conditional exact OperationContract registry evidence composition over DD-407/DD-402/DD-09/DD-06. Source audit: `Development/AI_AGENT_STEP_VISIBLE_PARENT_APPROVAL_OPERATION_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It preserves exact parent/registry identities and adds no compatibility, authorization, approval-currentness, admission, dispatch or AI/tool execution policy.

DD-413…DD-417 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own exact-by-code AICapability persistence lookup plus bounded DD-412 AgentStep→OperationContract→capability FK current evidence using DD-203 continuity. Source audit: `Development/AI_AGENT_STEP_VISIBLE_PARENT_APPROVAL_OPERATION_CAPABILITY_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Capability lifecycle/entitlement/policy facts remain evidence only and add no authorization, admission, routing, dispatch or AI/tool execution authority.

DD-418…DD-422 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded persisted-APPROVED + trusted approver-RequestContext continuity evidence over DD-417/DD-02/migrations 0013 and 0031. Source audit: `Development/AI_AGENT_STEP_APPROVED_APPROVER_CONTEXT_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It adds no required-permission authorization, approval-satisfaction, GuardPipeline, resume/cancel, dispatch or AI/tool execution authority.

DD-423…DD-427 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded AgentApproval-first visible AgentRun/AgentStep parent evidence composition over DD-132/DD-130/DD-131/DD-184 and migration 0031. Source audit: `Development/AI_AGENT_APPROVAL_VISIBLE_PARENT_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It preserves raw historical approval/parent evidence and adds no APPROVED/current-approver, reciprocal-backlink, permission, transition, admission, dispatch or AI/tool execution authority.

DD-428…DD-432 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded AgentApproval-first persisted-APPROVED + explicit trusted approver-RequestContext evidence composition over DD-427/DD-419. Source audit: `Development/AI_AGENT_APPROVAL_APPROVED_APPROVER_CONTEXT_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It adds no RequestContext synthesis, required-permission authorization, approval-satisfaction, GuardPipeline, transition, dispatch or AI/tool execution authority.

DD-433…DD-437 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded AgentApproval-first persisted-APPROVED + explicit trusted approver-RequestContext + current compiled RBAC necessary-evidence composition over DD-432/DD-03/DD-045/DD-048. Source audit: `Development/AI_AGENT_APPROVAL_APPROVED_APPROVER_RBAC_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It performs one exact Authorization read for persisted requiredPermission, requires exact current Tenant scope/version/ordered-role parity plus exact RBAC ALLOW, preserves applicable ABAC as raw evidence, and adds no full AuthorizationDecision, commercial/resource admission, approval-satisfaction, transition, dispatch or AI/tool execution authority.

DD-438…DD-442 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded DD-437 + DD-183 reciprocal-backlink evidence composition. Source audit: `Development/AI_AGENT_APPROVAL_APPROVED_APPROVER_RBAC_BACKLINK_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. The batch reuses exact already-loaded AgentApproval/AgentStep evidence, requires the persisted reciprocal step.approvalId relation to remain exact, performs zero additional reads, returns frozen `{ parent }`, and adds no full AuthorizationDecision, ABAC/commercial/resource admission, approval satisfaction, state transition, dispatch, mutation or AI/tool execution authority.

DD-443…DD-447 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded DD-422 step-centered persisted-APPROVED/trusted-approver-context + current approver-RBAC necessary-evidence composition. Source audit: `Development/AI_AGENT_STEP_APPROVED_APPROVER_RBAC_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. The no-approval branch performs zero Authorization reads; the approval branch reads exact persisted AgentApproval.requiredPermission under the preserved trusted approver context and applies the shared current Tenant RBAC ALLOW floor. ToolDefinition/OperationContract/capability/ABAC evidence remains raw and no permission compatibility, full authorization, approval satisfaction, transition, dispatch or execution authority is added.

DD-448…DD-452 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded DD-447 + acting-principal TOOL current-RBAC necessary-evidence composition. Source audit: `Development/AI_AGENT_STEP_ACTING_TOOL_RBAC_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Non-TOOL evidence performs zero new acting Authorization reads; TOOL evidence reads exact ToolDefinition.requiredPermission under the unchanged acting RequestContext and applies the generic protected-Tenant current RBAC ALLOW floor. AgentApproval.requiredPermission, OperationContract.permissionCode, capability and ABAC evidence remain raw/separate; no compatibility, full authorization, approval satisfaction, resource/commercial/entitlement admission, transition, dispatch or AI/tool execution authority is added.

DD-453…DD-457 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded DD-452 + acting-principal canonical OperationContract current-RBAC necessary-evidence composition. Source audit: `Development/AI_AGENT_STEP_ACTING_OPERATION_RBAC_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Non-TOOL evidence performs zero new OperationContract-permission reads; TOOL evidence performs one additional exact acting-context read for preserved OperationContract.permissionCode and applies the generic protected-Tenant current RBAC ALLOW floor. ToolDefinition/OperationContract/AgentApproval permission metadata remain independently evidenced and are not equated; no full authorization, approval satisfaction, commercial/resource/entitlement admission, transition, dispatch or AI/tool execution authority is added.

DD-463…DD-467 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded resource-free GuardPipeline authorization evidence composition over exact DD-462 parent evidence. Missing operations and operations with resourceResolver remain parent-only with zero GuardPipeline calls; resource-free canonical operations use the existing GuardPipeline-compatible surface exactly once with unchanged acting RequestContext and no resourceReference. GuardResult is preserved as generic protected-operation authorization evidence only; approval satisfaction, usage/budget/quota, dispatch, provider/model/credential and AI/tool execution remain separate.

DD-468…DD-472 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded AutomationRun resource-free GuardPipeline authorization-evidence composition over exact DD-387 parent evidence. Source audit: `Development/AUTOMATION_RUN_RESOURCE_FREE_GUARD_AUTHORIZATION_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Missing operations and resource-resolved operations remain parent-only with zero GuardPipeline calls; resource-free canonical operations authorize exactly once using the unchanged RequestContext and exact OperationContract with no resourceReference. GuardResult is preserved as generic protected-operation authorization evidence only; no trigger/state-machine, transition/retry, approval, rate/idempotency, scheduler/worker, dispatch, mutation/event or automation execution-completion authority is added.

DD-473…DD-477 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded WorkflowTask→WorkflowInstance + acting-principal current-RBAC necessary-evidence composition. Source audit: `Development/WORKFLOW_TASK_ACTING_RBAC_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. The batch reads exact persisted WorkflowTask.permissionCode under the unchanged RequestContext, uses the Authorization-owned generic protected-Tenant exact-one-ALLOW floor, preserves raw ABAC/task/instance evidence, and adds no assignee/task-action/transition/full-authorization/GuardPipeline/mutation/worker/execution authority.

DD-478…DD-482 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded WorkflowTask→WorkflowInstance→visible current WorkflowDefinition evidence composition over DD-362/DD-173/DD-357. Source audit: `Development/WORKFLOW_TASK_VISIBLE_DEFINITION_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It reads exactly the instance's persisted definition id once under the same RequestContext, reapplies exact ACTIVE/version/owner-scope applicability, preserves no-PLATFORM_GLOBAL fallback, and adds no assignment/action/effective-date/state-machine/transition/mutation/worker/execution authority.

DD-483…DD-487 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded WorkflowTask visible WorkflowDefinition + acting-principal current-RBAC necessary-evidence composition over DD-482/DD-475. Source audit: `Development/WORKFLOW_TASK_VISIBLE_DEFINITION_ACTING_RBAC_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It performs no duplicate task/instance/definition reads, performs one exact Authorization read for persisted WorkflowTask.permissionCode, preserves definition and applicable ABAC evidence raw, and adds no assignment/action/state-machine/transition/execution authority.

DD-488…DD-492 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded WorkflowTransition historical + current WorkflowInstance/WorkflowDefinition evidence composition over DD-367/DD-173. Source audit: `Development/WORKFLOW_TRANSITION_VISIBLE_INSTANCE_DEFINITION_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It performs one exact same-RequestContext definition read for the already-loaded current parent and preserves historical transition evidence without actor/action/state-machine/replay/transition/execution authority.

DD-493…DD-497 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded generic TenantIntegration current-integrity evidence composition over DD-095/DD-096/DD-092/DD-093/DD-165/DD-166/DD-167. Source audit: `Development/TENANT_INTEGRATION_CURRENT_INTEGRITY_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It reads the exact visible integration, exact same-context credential metadata, exact Definition and exact persisted enabled Capability sequence, applies only DD-167, and adds no lifecycle/health/profile/secret/provider/OperationContract/event/sync/network/GuardPipeline/execution authority.

DD-498…DD-502 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded exact SyncCursor→TenantIntegration→IntegrationCapability current-binding evidence composition over DD-097/DD-095/DD-093/DD-164. Source audit: `Development/SYNC_CURSOR_CURRENT_BINDING_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It performs no cursor decryption/freshness interpretation, does not compose DD-497 automatically, and adds no resume/replay/synchronization, provider/secret, GuardPipeline/Commercial, network/dispatch/mutation authority.

DD-503…DD-507 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded SyncCursor current-binding + parent TenantIntegration persisted-integrity evidence composition over DD-502/DD-165/DD-166/DD-167. Source audit: `Development/SYNC_CURSOR_CURRENT_INTEGRITY_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. The batch reuses exact DD-502 cursor/integration/cursor-capability evidence, reads exact CredentialReference metadata and Definition, reuses the exact cursor capability object in the persisted enabled-capability sequence, reads each remaining enabled code once, and applies only DD-167 at the supplied evaluatedAt. It adds no cursor freshness/resume/replay, secret/provider selection, health/profile approval, GuardPipeline/Commercial, sync/network/dispatch/mutation/event authority.

DD-508…DD-512 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded ordinary single-context WebhookDelivery current-evidence composition over DD-089/DD-088/DD-090/DD-091/DD-163. Source audit: `Development/WEBHOOK_DELIVERY_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It reads exact persisted Delivery→Subscription/Event identities, one exact EventCatalog tuple and applies only DD-163. Event filters, endpoint/SSRF safety, signing/secret material, retry/DLQ/replay, EXPLICIT_CROSS_CONTEXT, dispatch/network, GuardPipeline/Commercial and mutation/event authority remain explicitly out of scope.

DD-513…DD-517 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded DD-512 WebhookDelivery + shared persisted Outbox envelope current-evidence composition. Source audit: `Development/WEBHOOK_DELIVERY_EVENT_ENVELOPE_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. The batch extracts generic DD-321/DD-323…DD-325 pure envelope semantics into Integration ownership, preserves historical Notification wrappers, performs zero new reads after DD-512, and adds no current-residency/payload/filter/endpoint/signing/retry/cross-context/network/dispatch/mutation authority.

DD-518…DD-522 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded DD-517 Webhook source-event envelope + current authoritative Tenant residency evidence composition. Source audit: `Development/WEBHOOK_DELIVERY_EVENT_CURRENT_RESIDENCY_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. The batch adds an Integration-owned current Tenant residency read under existing Integration-service RLS, shares exact current-residency equality semantics with historical Notification wrappers, performs one exact residency read after DD-517, and adds no historical-residency, payload/filter/endpoint/signing/retry/cross-context/network/dispatch/mutation authority.

DD-523…DD-527 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded WebhookDelivery source-event pre-payload structural composition over exact DD-522 evidence. Source audit: `Development/WEBHOOK_DELIVERY_EVENT_PRE_PAYLOAD_STRUCTURE_EVIDENCE_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. The batch re-applies current-residency coherence, requires strict calendar-valid occurredAt plus recursive JSON-safe persisted payload and EventCatalog payloadSchema structure, and returns immutable exact-reference evidence with zero reads and zero payload-validator calls. It does not establish payload-schema validity, catalog lifecycle, filter, endpoint/SSRF, signing, retry/DLQ/replay, EXPLICIT_CROSS_CONTEXT, network dispatch or mutation authority.

DD-528…DD-532 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded WebhookDelivery source-event payload-validation composition over exact DD-527 evidence and the existing DD-081 `EventEnvelopeCatalogValidator`. It projects only ordinary Tenant persistence-binding facts already proven by DD-527 and delegates payload semantics to the injected `EventPayloadValidatorPort`, preserving DD-081 safe failure semantics. EventCatalog lifecycle, filters, endpoint/SSRF, signing/secrets, readiness/retry/DLQ/replay, cross-context dispatch, network execution and mutation remain separately governed.

DD-533…DD-537 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded parent-first WebhookDelivery payload-validated reader composition over exact DD-522→DD-527→DD-532 evidence. Source audit: `Development/WEBHOOK_DELIVERY_EVENT_PAYLOAD_VALIDATED_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It adds no primitive delivery semantics and preserves catalog lifecycle, filters, endpoint/SSRF, signing/secrets, readiness/retry/DLQ/replay, EXPLICIT_CROSS_CONTEXT, network/dispatch and mutation as separately governed boundaries.

DD-538…DD-542 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded Document access candidate + raw ACL subject-match evidence composition over DD-082/DD-084/DD-085. Source audit: `Development/DOCUMENT_ACCESS_ACL_SUBJECT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Candidate evidence is established first, raw ACL evidence is read exactly once for candidate.documentId, and one explicit caller-supplied ACL permission is subject-matched without effect/expiry reduction. Empty/non-empty matches remain evidence only; operation→ACL mapping, DENY precedence, source/owner fallback, final authorization, sensitivity/step-up/residency, signing/storage and download/share/delete/dispatch/mutation authority remain explicitly unowned by this batch.

DD-543…DD-547 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded DD-082 candidate-first + DD-086 exact physical StorageObject binding evidence composition. Source audit: `Development/DOCUMENT_ACCESS_STORAGE_BINDING_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Exact candidate linkage is preserved, null/errors fail closed without arbitrary locator/provider/Data Home fallback, and private binding facts remain raw server-internal evidence. Authorization, signing/provider selection, StoragePort execution and mutation remain separate.

DD-548…DD-552 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded exact DD-542 candidate/raw-ACL/subject-match + DD-086 physical StorageObject binding evidence composition. Source audit: `Development/DOCUMENT_ACCESS_ACL_STORAGE_BINDING_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. The batch reuses the preserved candidate linkage, performs one exact binding read with zero duplicate candidate read, preserves raw ACL and private physical facts, and adds no ACL-effect/final authorization, operation→ACL mapping, provider selection/decryption, signed access, StoragePort dispatch or mutation authority.

DD-553…DD-557 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded DocumentUploadSession raw-read + protected Tenant scope + acting-principal ownership evidence composition over DD-087 and migration-0006 RLS ownership semantics. Source audit: `Development/DOCUMENT_UPLOAD_SESSION_ACTING_PRINCIPAL_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Expiry/status/media-size/checksum/temp-object/current-principal-activity/authorization/signing/StoragePort/mutation semantics remain separately governed.

DD-558…DD-562 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded DD-542 matched-ACL → validUntil currentness → explicit-DENY-wins ACL-layer evidence composition. Source audit: `Development/DOCUMENT_ACCESS_ACL_CURRENT_EFFECT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It does not choose source-resource fallback or establish final authorization/signing/download/share/delete/mutation authority.

DD-563…DD-567 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded Document ACL current-effect + physical StorageObject binding composition over DD-562/DD-086. Source audit: `Development/DOCUMENT_ACCESS_ACL_CURRENT_EFFECT_STORAGE_BINDING_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It performs one exact binding read from the preserved candidate linkage and preserves exact references; ACL NONE/source-resource choice, final authorization, provider selection/decryption, signing/grants/download/share/delete/dispatch/mutation remain separate.

DD-568…DD-572 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded DD-567 Document ACL current-effect + physical StorageObject binding → pure access-path evidence composition. Source audit: `Development/DOCUMENT_ACCESS_ACL_CURRENT_EFFECT_STORAGE_ACCESS_PATH_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Exact DENY maps to EXPLICIT_ACL_DENY and cannot fall through to source-resource inheritance; ALLOW maps to bounded explicit-ACL positive evidence only; NONE maps to SOURCE_RESOURCE_AUTHORIZATION_REQUIRED without executing that path. The batch performs zero new reads and adds no operation→ACL mapping, final authorization, permission/entitlement/security-policy, provider/signing/grant/StoragePort or mutation authority.

DD-573…DD-577 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded DD-572 → exact persisted Document source-resource identity projection. Source audit: `Development/DOCUMENT_ACCESS_SOURCE_RESOURCE_IDENTITY_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Explicit ACL DENY/ALLOW remain parent-only; SOURCE_RESOURCE_AUTHORIZATION_REQUIRED projects exact candidate Tenant/Industry/scope + sourceModule/sourceResourceType/sourceResourceId with zero additional reads. No ResourceDescriptor, resolver/load, OperationContract/permission mapping, final authorization/policy evaluation, provider/signing/grant/download/share/delete/StoragePort dispatch or mutation authority is added.

DD-578…DD-582 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded Document derivative-parent current evidence seam: one exact persisted derivative→parent read under the resolved RequestContext, exact linkage/derivativeType, parent ACTIVE+CLEAN, Tenant/scope/Industry/residency continuity, and migration-0031 sensitivity non-lowering. Parent-child ACL non-widening remains unresolved/source-incomplete; no final authorization/signing/StoragePort/derivative-mutation authority is inferred.

DD-583…DD-587 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded Document derivative-parent raw paired ACL evidence composition over DD-582 + DD-084. It reads exact derivative and parent ACL arrays under the same RequestContext, requires only exact row/document binding, preserves exact references, and deliberately adds no ACL comparison/non-widening decision, subject/effect/currentness interpretation, source-resource choice, final authorization, signing/storage dispatch or mutation authority. Source audit: `Development/DOCUMENT_DERIVATIVE_PARENT_RAW_ACL_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`.

DD-588…DD-592 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded derivative-parent paired ACL subject/current-effect evidence composition over DD-587/DD-085/DD-558…DD-562. Source audit: `Development/DOCUMENT_DERIVATIVE_PARENT_ACL_CURRENT_EFFECT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Both sides use the same exact RequestContext, explicit ACL permission and trusted currentTimeIso; each side independently produces current/expired + DENY/ALLOW/NONE evidence. No cross-side comparison or derivative ACL non-widening verdict is defined.

DD-593…DD-597 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded AIMediaRequest optional PromptTemplate current-binding reader composition over DD-125/DD-115/DD-188. Source audit: `Development/AI_MEDIA_REQUEST_PROMPT_TEMPLATE_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. The unbound branch performs zero PromptTemplate reads; the bound branch reads exactly persisted promptTemplateId under the same RequestContext and applies only existing id/version/ACTIVE/applicability semantics. Prompt selection/rendering/approval/authorization and media execution remain separate.

DD-598…DD-602 in `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md` own the bounded AIMediaRequest-first + exact global AICapability-by-code current evidence composition over DD-125/DD-109/DD-202. Source audit: `Development/AI_MEDIA_REQUEST_CAPABILITY_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. It performs one exact request read and one exact capability `loadByCode(request.capabilityCode)`, applies only DD-202 persisted binding equality and preserves raw capability lifecycle/category/entitlement/default-policy/schema metadata without eligibility, authorization, routing or execution claims.
