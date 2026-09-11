# ARCHITECTURE TRACEABILITY MATRIX — POST-REMEDIATION
**Status:** PASS · **Date:** 2026-09-11 · **Evaluated HEAD:** `df1f72412044751ac30c184315d05e4d72e0099a`

This matrix maps verified Foundation concern → exact Architecture HOW owner → decision/behavior → valid Detailed Design deferral.

| Foundation concern | Architecture HOW owner | Evidence | ADR | Detailed Design deferral |
|---|---|---|---|---|
| Unified Core | A-00 §3–§5; A-01 §1–§5 | one modular Core, kernel/module boundaries | ADR-001 | package/service signatures |
| Tenant isolation | A-02 §2–§4; A-05 §3 | tenant RLS + repository/application defense | ADR-002/018 | table policy catalog |
| Industry Context | A-01 §3/§5; A-02 §2–§4; A-09 §3 | active Industry Context required for industry-scoped operations; wrong/missing context fails closed | ADR-002/012 | exact policy expressions |
| Identity | A-03 §1–§2; A-06 §6 | one Core IdentityPort; Clerk preferred, Auth.js fallback | ADR-003 | SDK/token wiring |
| RBAC | A-03 §3 | primary permission model | ADR-004 | exhaustive matrix |
| ABAC | A-03 §3 | complementary context policy, deny can narrow | ADR-004 | policy language |
| Subscription | A-04 §1–§4 | lifecycle/commercial inputs feed snapshot | ADR-007 | tables/timing |
| License | A-04 §1/§4 | applicable grants compiled and validated | ADR-007 | exact grant schema |
| Entitlement | A-04 §4–§5 | versioned server-authoritative snapshot | ADR-007 | counter/entity design |
| Effective access | A-01 §3; A-03 §3; A-04 §5 | one canonical chain through business/resource guard | ADR-004/007 | contract tests |
| Data ownership | A-05 §2–§3 | tenant + Industry Context for industry data; Core classification explicit | ADR-002/008 | exact tables |
| Residency | A-02 §5/§8; A-05 §8; A-10 §1/§9–§11 | Regional Data Home + residency-qualified recovery | ADR-017/018 | provider topology/scripts |
| Retention/erasure | A-05 §7 | legal-hold/retention conditional pseudonymize vs hard erase | ADR-008 context | retention values/runbooks |
| API | A-06 §1–§3 | tRPC first-party; REST/OpenAPI external, same guard | ADR-005 | endpoints/DTOs |
| Events | A-06 §4 | transactional outbox with Tenant+Industry context envelope | ADR-006 | exact event schema/catalog |
| Webhooks | A-06 §5 | context-filtered, signed, retry/DLQ, permission/entitlement gated | ADR-009 | payload/retry values |
| Documents/storage | A-05 §5; A-02 §4 | metadata ownership/ACL/residency validated before signed URL | ADR-002/008 | physical key/schema |
| AI Gateway | A-07 §1–§3 | single AI choke point/provider abstraction | ADR-010 | adapters/config |
| RAG | A-07 §4 | tenant + Industry Context + ACL + entitlement/security/residency | ADR-008/010 | vector/chunk schema |
| Agents/tools | A-07 §5 | acting-user full kernel guard; no privilege amplification | ADR-010 | tool contracts/run-state |
| Public Website | A-08 §1 | distinct public responsibility | ADR-011 | page inventory |
| Platform App | A-08 §1 | platform operator application, same Core | ADR-011/003 | navigation/screens |
| Tenant Management | A-08 §1 | tenant admin Web responsibility | ADR-011/003 | screens/forms |
| Industry Experiences | A-08 §1/§4; A-09 §3–§4 | reusable tenant-bound industry packages | ADR-012/014/015 | screen inventories |
| Mobile | A-08 §8 | React Native+Expo, shared sync contract | ADR-014/016 | native/build config |
| Desktop | A-08 §7 | Tauri 2, context-preserving offline queue/replay | ADR-015 | local schema/signing |
| Offline sync | A-08 §7–§8; A-01 §3 | origin Tenant+Industry context preserved and independently revalidated | ADR-002/004/012 | conflict matrices |
| Nine Industry Suites | A-09 §1–§6 | 41 MS mapped to equal module anatomy without Healthcare template | ADR-012 | per-MS exact contracts |
| Deployment | A-10 §1–§8 | Vercel suitable workloads + Coolify/Docker VPS regional cells | ADR-013/017 | IaC/vendor config |
| Backup/DR | A-10 §9–§10; A-11 §10 | in-region default, governed cross-region, restore exercises | ADR-017 | numeric RPO/RTO/runbooks |
| Observability | A-11 §1–§14 | logs/metrics/traces/audit/SLO/incident/cost | ADR-017 | vendor dashboards/thresholds |

**Result:** no Foundation concern above relies on an absent A-document or a heading-only Architecture claim. Exact implementation contracts remain correctly deferred.
