# AI ProvisioningSnapshot admission-prerequisite batch ownership audit

**Date:** 2026-09-28
**Entry HEAD:** `d16a710389e918c9d6e64be89455a29509912a5a`
**Entry tree:** `e61934c55dfd5179b6ce3f7c33095d41f88d7a5a`
**Governed batch:** DD-220 through DD-224
**Batch basis:** DD-219 lifecycle implementation is present and exact-head Core/Database/Web workflows are green at entry.

## Purpose

Continue the ProvisioningSnapshot subsystem in one substantial governed batch without promoting any helper into complete AI authorization.

Fresh source reconciliation uses:
- `Architecture/A-07_AI_PLATFORM_ARCHITECTURE.md` — every AI request traverses Context → entitlement/quota → policy → route → execute → meter → audit; provisioning only enables capability definitions and execution remains subject to live Gateway authorization.
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md` — ProvisioningSnapshot persists `allowed_capability_ids`, `allowed_api_classes`, `allowed_provider_ids`, `allowed_model_classes`, lifecycle status and validity timestamps; API class absent from the snapshot must not reach a provider call.
- `database/migrations/0011_ai_catalog_config.sql` — exact ProvisioningSnapshot field shapes, ACTIVE/SUPERSEDED/REVOKED lifecycle vocabulary, one ACTIVE row per Tenant/Industry scope, and validity ordering.
- `database/migrations/0031_document_workflow_ai_integrity.sql` — governed API-class vocabulary, duplicate-free capability/provider sets, referenced ACTIVE capabilities, referenced enabled TenantAIConfig and provider subset integrity.
- DD-124 raw persistence reader plus DD-211/DD-212/DD-218/DD-219 bounded helpers — persisted evidence is not runtime authorization.

This batch is therefore source-complete only for five **necessary admission prerequisites**. It does not implement the complete Gateway pipeline.

## DD-220 — current lifecycle admission prerequisite

Authorize pure helper:

`matchesAIProvisioningSnapshotCurrentLifecycleAdmissionFloor(snapshot, evaluatedAt)`

Required behavior:
1. Reuse DD-219 intrinsic lifecycle/validity integrity.
2. `evaluatedAt` must be a finite timestamp string.
3. Require exact `status === "ACTIVE"`.
4. Reject a snapshot whose `compiledAt` instant is after `evaluatedAt`.
5. With no `validUntil`, lifecycle admission may pass.
6. With `validUntil`, require `evaluatedAt < validUntil`; equality is expired.
7. This is only lifecycle currentness, not current/latest snapshot selection or authorization.

## DD-221 — API-class admission prerequisite

Authorize pure helper:

`matchesAIProvisioningSnapshotApiClassAdmissionFloor(snapshot, apiClass)`

Required behavior:
1. Require UUID-shaped snapshot and Tenant identities.
2. Require snapshot API classes to be a duplicate-free text set.
3. Every persisted class must belong to the exact governed vocabulary:
   `INTERNAL_FIRST_PARTY | TENANT_API | PARTNER_API | PUBLIC_DEVELOPER_API`.
4. Candidate API class must be one exact governed value and present in the snapshot set.
5. No case/whitespace normalization and no entitlement/permission inference.

## DD-222 — capability admission prerequisite

Authorize pure helper:

`matchesAIProvisioningSnapshotCapabilityAdmissionFloor(snapshot, capability)`

Required behavior:
1. Require duplicate-free UUID `allowedCapabilityIds`.
2. Require UUID capability id, non-empty code and raw status.
3. Require exact capability id membership and `status === "ACTIVE"`.
4. Do not infer entitlement, permission, policy or capability-to-model suitability.

## DD-223 — provider admission prerequisite

Authorize pure helper:

`matchesAIProvisioningSnapshotProviderAdmissionFloor(snapshot, provider)`

Required behavior:
1. Require duplicate-free UUID `allowedProviderIds`.
2. Require UUID provider id and raw status.
3. Require exact provider id membership and `status === "ACTIVE"`.
4. Provider health, residency, capability support, cost, credential resolution, model compatibility and fallback remain separate routing layers.

## DD-224 — model-class admission prerequisite

Authorize pure helper:

`matchesAIProvisioningSnapshotModelClassAdmissionFloor(snapshot, modelClass)`

Required behavior:
1. Require `allowedModelClasses` to be a duplicate-free text set.
2. Candidate model class must be a non-empty string and exact member.
3. Do not invent a closed model-class vocabulary beyond persisted source evidence.
4. Model catalog binding, plan ceiling, sensitivity/residency and routing remain separate.

## Fixed acceptance

- `AIPROVSNAP-ADM-CUR-001..005`: ACTIVE/current-time lifecycle passes only inside its compile/expiry window; malformed evaluation time, future compile, inactive lifecycle and expiry boundary fail closed.
- `AIPROVSNAP-ADM-API-001..003`: exact governed membership passes; absent/normalized/unknown classes and malformed/duplicate persisted sets fail.
- `AIPROVSNAP-ADM-CAP-001..003`: exact ACTIVE capability membership passes; absent/inactive/foreign/malformed capability evidence fails.
- `AIPROVSNAP-ADM-PROV-001..003`: exact ACTIVE provider membership passes; absent/inactive/foreign/malformed provider evidence fails.
- `AIPROVSNAP-ADM-MODEL-001..003`: exact non-empty model-class membership passes; absent/normalized/non-string and malformed/duplicate persisted sets fail.
- `AIPROVSNAP-ADM-IMM-001`: helpers are pure and do not mutate evidence.

## Explicit exclusions

No helper in DD-220..224 proves or performs:
- current/latest snapshot selection;
- Subscription or EntitlementSnapshot validity/sufficiency;
- RBAC/ABAC permission;
- quota or budget reservation;
- Tenant/Industry policy evaluation;
- sensitivity/redaction/residency enforcement;
- provider health/fallback, credential resolution or provider SDK invocation;
- concrete model selection/model compatibility;
- prompt/RAG/assistant/agent/tool execution;
- metering, output guardrails or audit append;
- public route exposure;
- schema, migration, RLS, role or grant changes.

These exclusions preserve A-07's mandatory AI Gateway choke point and keep this batch a fail-closed prerequisite layer only.
