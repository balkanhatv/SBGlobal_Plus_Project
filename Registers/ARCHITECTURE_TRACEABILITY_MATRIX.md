# ARCHITECTURE TRACEABILITY MATRIX — PHASE 2 FRESH REVALIDATION
**Status:** PASS · **Date:** 2026-09-12 · **Evaluated substantive HEAD:** `9453ebb0140670984753cec9e66613475789610b`
**Upstream Foundation:** `PHASE1-RAWSOURCE-FOUNDATION-RECONCILED`

This matrix supersedes the current-status effect of the 2026-09-11 matrix while preserving its historical evidence in Git history.

| Foundation concern | Architecture HOW owner | Evidence | ADR | DD deferral |
|---|---|---|---|---|
| Unified Core | A-00 §3–§5; A-01 §1–§7 | one modular Core; explicit shared-engine ownership | ADR-001/019 | service signatures/internal packages |
| Configuration/Metadata/Rules/Form/Workflow | A-01 §2/§7 | distinct Core contracts; no per-industry private engines; safe declarative rules | ADR-019 | schemas/publish/rollback/expression contracts |
| Future Industry Framework | A-09 §1A/§4 | separate future state; explicit promotion gate before live Tenant enablement | ADR-020 | promotion checklist/catalog schema |
| Tenant + Industry Context | A-01 §3/§5; A-02 §2–§4; A-05 §3; A-09 §3 | fail-closed active Industry Context for industry resources | ADR-002/012 | exact RLS/policy expressions |
| Identity | A-03 §1–§2 | one Identity boundary; Clerk preferred/Auth.js fallback | ADR-003 | SDK/token contracts |
| Canonical effective access | A-01 §3; A-03 §3; A-04 §5 | Authenticate→Tenant→Industry→Subscription→License→credential/device/session→EntitlementSnapshot→RBAC→ABAC→security/residency→resource/workflow | ADR-004/007 | acceptance contract matrix |
| Commercial lifecycle | A-04 §1–§7 | no PAST_DUE resting state; Renewed event; compiled entitlements | ADR-007 | exact timings/formulas |
| Country/localization packs | A-01 §2/§7; A-05 §2/§9 | versioned reference/config packs; no Core code fork or India-hardcoding | ADR-008/019 | pack schemas/override rules |
| Data access/export/portability | A-05 §7 | governed export/access pipeline with authorization, sensitivity and residency | ADR-008 | operation/payload contracts |
| API | A-06 §1–§3 | tRPC first-party; REST/OpenAPI external; same guard | ADR-005 | endpoints/DTOs |
| Events/outbox | A-06 §4 | Tenant+Industry context envelope, idempotent consumers | ADR-006 | exact schemas/catalog |
| Webhooks | A-06 §5 | context-filtered, signed, entitlement/permission gated | ADR-009 | retry/payload values |
| Documents/storage | A-05 §5; A-02 §4 | canonical metadata authorization before signed URL | ADR-002/008 | DocumentMeta fields |
| AI Gateway/provider abstraction | A-07 §1–§3 | one AI choke point/provider registry | ADR-010 | adapter/model schemas |
| AI API/provisioning | A-07 §3 | API projections + AIProvisioningSnapshot, no provider bypass | ADR-010 | exact API/provisioning schemas |
| RAG/memory/document intelligence | A-07 §4–§6 | authorization-before-ranking, scoped memory/doc intelligence | ADR-008/010 | chunk/memory/doc schemas |
| AI media/prompt management | A-07 §5 | governed media generation + versioned prompt config | ADR-010 | provider routing/provenance contracts |
| Public/Platform/Tenant/Industry surfaces | A-08 §1–§2 | exactly four application responsibilities | ADR-011 | routes/screens |
| Exactly two Tenant mobile apps | A-08 §1/§4/§8 | Tenant Staff App + Tenant User App; Platform Mobile excluded; no role binaries | ADR-014 | route/package matrices |
| Brand/theme hierarchy | A-08 §3 | Platform defaults → bounded Industry/Tenant overrides; accessibility/security floor | ADR-011 | exact token dictionary/allowlist |
| Desktop | A-08 §7 | Tauri 2.0, context-safe offline/native adapters | ADR-015 | local/native contracts |
| Offline | A-08 §7–§8 | origin Tenant+Industry preserved; server reauthorization | ADR-002/004/012 | conflict matrix |
| Current 9 Industry Suites | A-09 §1–§6 | equal first-class; 41 MS consumed from suite-specific Foundation | ADR-012 | per-MS contracts |
| Infrastructure/residency | A-02 §5/§8; A-10 | Regional Data Homes + Vercel/Coolify/Docker topology | ADR-017/018 | provider/IaC/runbooks |
| Observability/reliability | A-11 | context-attributed telemetry, incident/recovery/release evidence | ADR-017 | thresholds/vendor config |

**Result:** all substantive Phase-1 Foundation corrections have explicit Architecture HOW ownership or a valid Detailed Design deferral. No recovered Foundation requirement is stranded at the Architecture boundary.
