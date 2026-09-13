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
