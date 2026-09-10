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
| ID | Location | Decision |
|---|---|---|
| AC-01 | F-01 | Entitlement-chain downgrade guard |
| AC-02 | F-02 | Idempotent/resumable tenant provisioning |
| AC-03 | F-03 | Justification required for operator tenant-data access |
| AC-04 | F-03 | Erasure/retention reconciliation via pseudonymization + audit skeleton |
| AC-05 | F-04 | Financial records immutable post-approval; reversal-only correction |
| AC-06 | F-07 | Offline-first POS Desktop candidate for Retail |
| AC-07..AC-14 | F-07..F-09 | Equal-depth operational specifications for all sibling suites |
| DR-01 | F-11 | Regional Data Home residency model |
| AC-15 | F-10 | Desktop requirement completion; current framework direction governed by UD-TECH-01 |
| AC-16 | F-12 | Cross-suite/MS coverage/deepening; generic inherited rows are not standalone MS-specific evidence after 2026-09-10 truth audit |
| AC-17 | F-13 | Selected MS depth completion across required suites |
| AC-18 | F-14 | Commercial Foundation depth completion |

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
ADR-001 through ADR-016 referenced by A-00…A-09 are Architecture decisions and must be consolidated with **Context, Decision, Alternatives/Options and trade-offs, Consequences** in A-12 before any Architecture gate claim. Until then, references to those ADR IDs are provisional decision anchors rather than complete ADR evidence.
