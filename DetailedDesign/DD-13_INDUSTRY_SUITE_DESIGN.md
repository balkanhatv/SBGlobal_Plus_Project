# DD-13 — INDUSTRY SUITE / MANAGEMENT SYSTEM DETAILED DESIGN
**Wave:** 3 · **Status:** IN PROGRESS — FRAMEWORK ESTABLISHED · **Date:** 2026-09-11  
**Traces:** F-07/F-08/F-09/F-12/F-13 · A-09 · ADR-012 · DD-01…DD-12/DD-14…DD-18

## 1. Purpose
DD-13 is the authoritative Wave-3 index for implementation-ready Detailed Design of all 41 certified Management Systems. Each industry has a modular file under `DetailedDesign/Industries/`; Healthcare is not a template and every suite receives equal design discipline.

## 2. Canonical count
| Industry | Count | Artifact |
|---|---:|---|
| Healthcare & Diagnostics | 5 | `Industries/Healthcare/HLT-00_DETAILED_DESIGN.md` |
| Education | 5 | `Industries/Education/EDU-00_DETAILED_DESIGN.md` |
| Retail & Commerce | 5 | `Industries/Retail/RTL-00_DETAILED_DESIGN.md` |
| Hospitality | 4 | `Industries/Hospitality/HSP-00_DETAILED_DESIGN.md` |
| Manufacturing | 5 | `Industries/Manufacturing/MFG-00_DETAILED_DESIGN.md` |
| Professional Services | 5 | `Industries/ProfessionalServices/PSV-00_DETAILED_DESIGN.md` |
| Government & Public Sector | 4 | `Industries/Government/GOV-00_DETAILED_DESIGN.md` |
| NGO / Temple / Trust | 4 | `Industries/NGO-Temple-Trust/NGO-00_DETAILED_DESIGN.md` |
| Security & Facility Management | 4 | `Industries/Security-Facility/SFM-00_DETAILED_DESIGN.md` |
| **Total** | **41** | |

## 3. Wave-3 invariant
Every industry-owned entity, command, event, document, projection, AI source/tool and offline operation is `TENANT_INDUSTRY` and requires immutable `tenant_id + industry_context_id`. Null Industry Context never means all industries.

Cross-MS access uses service/API/event/projection contracts; direct cross-MS table reads are prohibited. Cross-industry access requires DD-02 `EXPLICIT_CROSS_CONTEXT`.

## 4. Entity baseline
Every mutable industry entity carries:
`id uuid PK, tenant_id uuid NOT NULL, industry_context_id uuid NOT NULL, row_version bigint NOT NULL, status/state where applicable, created_at timestamptz, created_by uuid, updated_at timestamptz, updated_by uuid, is_demo boolean default false`.

Indexes begin with `(tenant_id, industry_context_id,...)`. Ownership columns are immutable. Sensitive/financial/regulated history uses append-only ledger/history entities rather than destructive edits.

## 5. Per-MS completion standard
Each MS file section must define: purpose/domain owner; actors; modules; exact entity/storage/fields/PK/FK/unique/check/index; state/workflow matrices and invalid transitions; business rules; approvals; capability permissions; ABAC; documents; notifications; KPIs/reports; tRPC + selective REST; events; integrations; AI/RAG/tools/approval/prohibited autonomy; web/mobile/desktop/offline; configuration; entitlements; dependencies; audit; positive/negative/isolation/entitlement/workflow/offline/AI/document/event tests; acceptance.

## 6. Shared contracts consumed, never duplicated
Identity/DD-03 · Commercial/DD-04 · RLS/DD-05 · OperationContract/DD-06 · EventEnvelope/DD-07 · DocumentMeta/DD-08 · AI/DD-09 · Shells/DD-10 · Offline/DD-11 · Desktop/DD-12 · Infrastructure/DD-14 · Observability/DD-15 · Security/DD-16.

## 7. Permission grammar
`<industry>.<ms>.<capability>.<action>`; CRUD verbs are used only for true data maintenance. Approval/publish/dispense/collect/issue/settle/etc. use domain verbs.

## 8. API/event convention
tRPC router `ind.<industry>.<ms>`. REST exists only for real external interoperability. Both project the same DD-06 OperationContract. Event types `<industry>.<ms>.<aggregate>.<action>` use DD-07 EventEnvelope v1 and carry Tenant + Industry Context.

## 9. Experience convention
Shared DD-10 shell. Web route prefix `/app/<industry>/<ms>`; mobile uses same package capability manifest; desktop is added only for operational/peripheral/offline value. No separate authentication/application Core per MS.

## 10. Offline classes
`ONLINE_ONLY`, `READ_OFFLINE`, `CONTROLLED_OFFLINE_MUTATION`, `OFFLINE_OPERATIONAL_CRITICAL`. Financial, stock and regulated transitions never use naive LWW.

## 11. Wave-3 gate
All 41 sections must be COMPLETE, cross-industry audit must pass, DD-19 must report 0 orphan required contracts, DD-20 must have no open P0/P1, and avoidable DD REVIEW_REQUIRED must be 0 before overall DD certification.
