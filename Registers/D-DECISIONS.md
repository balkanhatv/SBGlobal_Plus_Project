# D-DECISIONS — Decision Register (Foundation Builds 1–2 + Architecture)
Seeded from MASTER_INSTRUCTION v2.5 §29, inherited CR/AC/DR decisions, and user-directed Architecture technology decisions. RawSourceCorpus remains immutable.

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
| AC-15 | F-10 | Desktop implementation deferred to Architecture; technology selected here |
| AC-16 | F-12 | Remaining §9 dimensions completed for all nine suites |
| AC-17 | F-13 | MS depth completion across required suites |
| AC-18 | F-14 | Commercial Foundation depth completion |

## Architecture technology decision
| ID | Scope | Decision | Status |
|---|---|---|---|
| UD-TECH-01 | Current Architecture branch | **Next.js 15 · NestJS where a dedicated backend/service boundary is required · TypeScript 5.x / Node.js 22+ · React 19 · Tailwind CSS + Shadcn UI · PostgreSQL · Payload CMS 3 · Refine where an internal CRUD/admin console is more appropriate than Payload · React Native + Expo · Tauri 2.0 for Windows/macOS/Linux · tRPC for typed first-party APIs where appropriate · REST/OpenAPI for external interoperability · Clerk as preferred managed identity boundary · Auth.js where Clerk is not architecturally suitable · Webhooks · Expo Push Notifications / OneSignal · Vercel for suitable web workloads · Coolify + Dockerized VPS for self-hosted workloads.** | ACTIVE — USER-DIRECTED |

**Technology rule:** this is the current canonical Architecture technology baseline. Existing RawSourceCorpus technology references remain immutable historical/source material. Architecture documents must align to this baseline. Where an approved alternative is selected, the rationale and trade-off must be recorded in the Architecture decision record. No old Laravel/PHP/Filament/Flutter/MySQL/PM2 baseline is authoritative for current Architecture.

## Architecture decisions
ADR-001 through ADR-016 referenced by A-00…A-09 are Architecture decisions and must be consolidated with Context, Decision, Alternatives/trade-offs and Consequences in A-12.
