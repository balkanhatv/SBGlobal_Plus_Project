from pathlib import Path

DD18 = Path('DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md')
DD17 = Path('DetailedDesign/DD-17_TEST_ACCEPTANCE_CONTRACTS.md')

DD108 = r'''

## DD-108 — AI Model Catalog Metadata Reader

**Decision:** Introduce a bounded exact-by-id PostgreSQL reader for global `core_ai.ai_model` catalog metadata through the existing dedicated `sbg_ai_gateway_rw` database boundary.

**Source ownership and boundary:**
- Migration `0011_ai_catalog_config.sql` defines `core_ai.ai_model` as global model-catalog persistence and migration `0014_ai_gateway_role.sql` grants the dedicated AI Gateway role SELECT authority without catalog mutation grants.
- The authorized metadata projection is limited to model `id`, `provider_id`, `code`, raw `status`, `capability_codes`, `context_window`, `max_output_tokens`, `pricing_metadata`, `residency_metadata`, positive `version`, `created_at`, and `updated_at`.
- The reader validates only schema-owned shape and preserves schema-valid raw evidence, including nullable array elements and raw status values.
- Provider/model foreign-key pairing and catalog integrity remain database facts; an exact persisted pairing is evidence only and does not select a provider/model for a request.
- Raw `ACTIVE` status does not become request eligibility, current-version selection, routing, fallback, health, cost, latency, residency, sensitivity, quota, budget, or inference authority.
- No tenant, industry, organization, branch, department, user, or synthetic `RequestContext` is invented for this global catalog read.
- No schema, migration, role, grant, RLS, verification SQL, or product-policy change is authorized by this decision.

**Runtime semantics explicitly not claimed:**
- provider/model active-version or effective/current selection;
- provider-model routing, scoring, fallback, retry, replay, or finality;
- provider health interpretation or provider credential/secret resolution;
- tenant/industry allow-list, sensitivity, residency, entitlement, quota, or budget evaluation;
- provider SDK dispatch, inference, embeddings, RAG, assistant, agent, or tool execution;
- AI provisioning snapshot compilation/current-selection or prompt/policy evaluation;
- Workflow/Automation execution or mutation semantics.

**Acceptance linkage:** `AIMODEL-PG-001` through `AIMODEL-PG-005`.
'''

ACCEPTANCE = r'''

### AIMODEL-PG-001 — Exact model catalog metadata read
Given a persisted `core_ai.ai_model` row and its exact identifier, the PostgreSQL AI model catalog metadata reader returns the authorized immutable metadata projection and preserves the exact persisted provider/model relationship and raw catalog evidence.

### AIMODEL-PG-002 — Missing and malformed identifier behavior
An exact well-formed model identifier with no matching row returns `null`; a malformed model UUID fails closed rather than being normalized into another identity.

### AIMODEL-PG-003 — Schema-valid raw evidence preservation
The reader preserves schema-valid raw text/array/JSON metadata, including nullable or empty array evidence where the schema permits it, instead of inventing normalization or request-time policy semantics.

### AIMODEL-PG-004 — Catalog state and provider pairing are not runtime selection authority
Raw model `status`, including `ACTIVE`, and the persisted provider pairing remain catalog evidence only. The reader exposes no selected/current/eligible/route/fallback/generate/infer authority and does not convert catalog facts into AI Gateway execution semantics.

### AIMODEL-PG-005 — Dedicated AI role remains read-only for model catalog
The dedicated `sbg_ai_gateway_rw` role can select model catalog metadata but has no `INSERT`, `UPDATE`, or `DELETE` authority over `core_ai.ai_model`; an attempted model update is rejected, and the bounded reader exposes no mutation methods.
'''

s18 = DD18.read_text(encoding='utf-8')
if '## DD-108 — AI Model Catalog Metadata Reader' in s18:
    raise SystemExit('DD-108 already present in DD-18')
DD18.write_text(s18.rstrip() + DD108 + '\n', encoding='utf-8')

s17 = DD17.read_text(encoding='utf-8')
if '### AIMODEL-PG-001 — Exact model catalog metadata read' in s17:
    raise SystemExit('AIMODEL acceptance already present in DD-17')
DD17.write_text(s17.rstrip() + ACCEPTANCE + '\n', encoding='utf-8')
