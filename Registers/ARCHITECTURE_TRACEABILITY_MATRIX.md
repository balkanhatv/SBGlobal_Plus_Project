# ARCHITECTURE TRACEABILITY MATRIX
**Status:** ACTIVE · **Date:** 2026-09-11

This matrix maps verified Foundation requirement/decision → Architecture owner → section/behavior → ADR → valid Detailed Design deferral.

| Foundation requirement / decision | Architecture owner | HOW evidence | ADR | Detailed Design deferral |
|---|---|---|---|---|
| One Unified Enterprise Core | A-00, A-01 | layered model, modular Core, kernel/module boundaries | ADR-001 | exact package/module layout |
| Tenant + Industry Context | A-02, A-03, A-09 | request context resolution, RLS/context isolation, suite activation | ADR-002, ADR-004, ADR-012 | exact policy expressions/DB policies |
| Primary + optional enabled industries | A-02, A-09 | activation/context model | ADR-012 | exact activation schemas |
| Clerk preferred/Auth.js fallback; one identity boundary | A-03 | provider-isolated Identity contract | ADR-003 | SDK/token wiring |
| RBAC primary + ABAC complementary | A-03 | entitlement→RBAC→ABAC/security decision order | ADR-004 | exhaustive permission matrix/policy language |
| Commercial route/lifecycle F-14 | A-04 | compiled entitlements, canonical lifecycle, billing integration | ADR-007 | plan tables, proration/dunning numbers |
| Data categories/lifecycle | A-05 | storage classes, ownership, migration, retention/erasure | ADR-002, ADR-008, ADR-018 | exact tables/indexes/retention values |
| Regional Data Home / residency | A-02, A-05, A-10 | routing/storage placement, residency-qualified backup/failover | ADR-017, ADR-018 | provider regions/scripts |
| tRPC first-party / REST external | A-06 | dual interface projections from same service contracts | ADR-005 | exact endpoint paths/methods/DTOs |
| Domain events reliable publication | A-06, A-10 | transactional outbox + dispatcher/worker | ADR-006 | outbox schema/worker config |
| Webhook interoperability | A-06, A-10, A-11 | signed at-least-once delivery, retry/DLQ/monitoring | ADR-009 | exact payload schemas/retry numbers |
| AI provider abstraction | A-07 | AI Gateway + registry/adapters | ADR-010 | provider credentials/model config |
| RAG Tenant + Industry Context isolation | A-07 | tenant+industry vector scope, ACL, entitlement/security/residency gates | ADR-008, ADR-010 | exact vector schema/chunking/rerank config |
| Public SaaS Website | A-08 | separate public surface, Payload/content rendering | ADR-011 | page/screen inventory |
| Platform Application Web/Mobile/Desktop | A-08 | shared shell/contracts/context | ADR-003, ADR-011, ADR-014, ADR-015 | navigation/screen inventories |
| Tenant Management Application Web | A-08 | separate tenant-admin surface on same Core | ADR-003, ADR-011 | screen/forms inventory |
| Reusable Industry Experiences | A-08, A-09 | industry experience packages + tenant configuration | ADR-012, ADR-014, ADR-015 | exact screens/device adapters |
| React Native + Expo | A-08 | mobile shell/packages, offline/sync boundary | ADR-014 | native module/build config |
| Tauri 2.0 Windows/macOS/Linux | A-08 | desktop shell/local capability layer | ADR-015 | signing/notarization/installers |
| Expo Push/OneSignal | A-06, A-08 | PushPort abstraction | ADR-016 | provider credentials/template contracts |
| Nine equal first-class suites | A-09 | independent suite/MS module architecture | ADR-012 | exact entity/API/UI design per MS |
| Healthcare not sibling template | A-09 | Foundation-specific evidence consumption rule | ADR-012 | none; continuing constraint |
| Next.js default / NestJS justified boundary | A-01, A-10 | workload/service-boundary rule | ADR-013 | exact service extraction topology |
| Vercel + Coolify/Docker VPS | A-10 | hybrid workload placement/regional cells | ADR-017 | IaC/vendor config |
| Shared RLS vs dedicated DB option | A-02, A-05, A-10 | common logical schema with governed topology choice | ADR-002, ADR-018 | migration/provisioning mechanics |
| Backup/recovery | A-10, A-11 | PITR/base/object versioning + verification restores | ADR-017 | schedules/numeric RPO/RTO/runbooks |
| Observability/SLO/incident operations | A-11 | logs/metrics/traces, error budgets, incident flow | ADR-017 | vendor dashboards/thresholds/runbooks |

## Reference validation
- Architecture documents present: **A-00 through A-12**.
- Authoritative Architecture ADRs present: **ADR-001 through ADR-018**, all owned by A-12.
- No Architecture requirement is satisfied only by an absent file.
- Exact schemas/endpoints/payloads/commands remain explicit Detailed Design deferrals under UD-PHASE-01.
