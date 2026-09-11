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
