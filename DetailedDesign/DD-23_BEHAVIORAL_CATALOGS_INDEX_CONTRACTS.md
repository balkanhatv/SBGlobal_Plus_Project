# DD-23 — BEHAVIORAL ENUMS, VERSIONED CATALOGS & INDEX CONTRACTS
**Status:** ACTIVE REMEDIATION EVIDENCE · **Date:** 2026-09-11
**Authority:** Fable 5 remediation mandate · DD-05 · all 41 MS DDs

## 1. No arbitrary branching text
A field that controls validation, routing, approval, SLA, pricing, escalation, workflow, report grouping or integration behavior MUST be either a product-defined enum or a governed catalog reference. Free text remains allowed only for human narrative that does not drive branching.

## 2. Product-defined enums
- `PriorityClass = LOW | NORMAL | HIGH | URGENT | CRITICAL`.
- `SeverityClass = LOW | MEDIUM | HIGH | CRITICAL`.
- `CatalogLifecycle = DRAFT | ACTIVE | RETIRED`.
- `OverrideDisposition = ALLOW | DENY | REQUIRE_APPROVAL`.
These meanings are stable; tenant labels may localize display text but may not redefine semantics.

## 3. Versioned catalog schema
`BehaviorCatalog{id uuid PK, catalog_code text, tenant_id uuid?, industry_context_id uuid?, version int, lifecycle CatalogLifecycle, effective_from timestamptz, effective_to timestamptz?, owner_module text, configuration_scope enum(PLATFORM_SEED,TENANT,INDUSTRY), created_by uuid, approved_by uuid?, created_at timestamptz}`.
`BehaviorCatalogEntry{id uuid PK, catalog_id uuid, code text, display_name text, semantic_meaning text, parent_entry_id uuid?, sort_order int, behavior_json jsonb, active boolean, effective_from timestamptz, effective_to timestamptz?, migration_target_code text?}`.
Constraints: `UNIQUE (catalog_id, code)`; `INDEX (tenant_id, industry_context_id, catalog_code, lifecycle, effective_from)`; retired code cannot be reused with different meaning; persisted business records retain catalog/version snapshot; migration is explicit and audited.

## 4. Canonical catalog owners
| Catalog | Owner | Configuration scope | Typical fields |
|---|---|---|---|
| CORE-REASON | Core Configuration | platform seed + tenant/industry extension | reason_code |
| CORE-CHANNEL | Core Communication | platform seed | channel |
| EDU-ATTENDANCE-PERIOD | EDU | tenant/industry | attendance period/type |
| EDU-GRADE-SCALE | EDU | tenant/industry/version | grade/pass/moderation |
| RTL-CHECKLIST | RTL-RSM | tenant/industry | checklist_code,item_code |
| RTL-PRICE-OVERRIDE-REASON | RTL-POS | tenant/industry | override reason |
| HSP-RATE/CANCEL-POLICY | HSP-RBM/HMS | tenant/industry | rate/cancel/no-show |
| MFG-OPERATION | MFG-PMS | tenant/industry/version | operation_code/routing |
| MFG-DEFECT | MFG-QMS | tenant/industry/version | defect_code |
| PSV-ACTIVITY-TYPE | PSV-CRM | tenant/industry | activity_type_code |
| GOV-SERVICE | GOV-CSM | jurisdiction+tenant | service_code |
| GOV-ACTION-TYPE | GOV-CSM | jurisdiction+tenant | action_type_code |
| GOV-SLA-CATEGORY | GOV-CSM | jurisdiction+tenant | category_code/SLA class |
| NGO-FUND-PURPOSE | NGO-DFM | tenant/industry | purpose_code |
| SFM-INCIDENT-CATEGORY | SFM-PMS | tenant/industry | category_code |
| SFM-FACILITY-CATEGORY | SFM-FMM | tenant/industry | category_code |
| SFM-PATROL-CHECKPOINT | SFM-PMS | tenant/industry/version | checkpoint_code |

## 5. Validation hierarchy
Platform immutable security semantics → jurisdiction/contract policy where applicable → tenant catalog version → Industry Context catalog version → record snapshot. An Industry/Tenant catalog may add/retire configured values but cannot repurpose a platform-reserved code or lower a security/business floor.

## 6. Exact index rule
All `TENANT_INDUSTRY` business-table primary lookup/unique/index clauses are physically scoped by `tenant_id, industry_context_id`. The nine industry canonical files have been normalized so placeholder `context` and `context-first indexes` phrases are replaced by exact field names. Any future MS table MUST state concrete fields, uniqueness and partial predicate where used.

## 7. Catalog tests
- CAT-T001 unknown behavior code → `VALIDATION_FAILED`; no mutation.
- CAT-T002 RETIRED code on new transaction → `VALIDATION_FAILED`; historical records remain readable with original version.
- CAT-T003 same code reused with changed semantic meaning in same catalog lineage → reject catalog publication.
- CAT-T004 sibling-industry catalog entry supplied → `INDUSTRY_CONTEXT_MISMATCH`.
- CAT-T005 tenant tries to weaken platform security-reserved behavior → `POLICY_DENIED`.
