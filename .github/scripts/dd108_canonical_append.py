from pathlib import Path

DD18 = Path('DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md')
DD17 = Path('DetailedDesign/DD-17_TEST_ACCEPTANCE_CONTRACTS.md')

DD108 = r'''

## DD-108 — AI Model Catalog Metadata Reader

**Decision:** Introduce a bounded exact-by-id PostgreSQL reader for global `core_ai.ai_model` catalog metadata through the existing dedicated `sbg_ai_gateway_rw` database boundary.

**Source ownership and boundary:**
- The AI catalog schema defines `core_ai.ai_model` as global registry data with persisted `id`, `provider_id`, `model_code`, `display_name`, raw capabilities/context-window/input/output/residency metadata, `sensitivity_ceiling`, raw cost/latency/status evidence, positive `version`, and `metadata_json`.
- Migration 0014 grants `sbg_ai_gateway_rw` SELECT authority over the model catalog without catalog INSERT/UPDATE/DELETE grants. No tenant or industry `RequestContext` is invented for this global catalog read.
- Migration 0031 owns provider/model-pair integrity and consumes active rows in database integrity predicates. Those predicates do not define live model selection, request eligibility, routing, fallback, provider preference, or inference semantics.
- The reader preserves schema-valid raw evidence, including empty text and nullable array elements, deep-normalizes JSON only as immutable evidence, and does not strengthen persistence semantics beyond source-owned constraints.
- `provider_id` is preserved as relationship evidence only; it does not select a provider or authorize a request route.
- No schema, migration, role, grant, RLS, or product-policy change is authorized by this decision.

**Runtime semantics explicitly not claimed:**
- active/current model-version selection or interpreting raw `status='ACTIVE'` as request eligibility;
- provider/model ranking, provider health interpretation, capability suitability, model-class mapping, context-window or modality authorization;
- tenant/industry allow-list, sensitivity/residency, quota/budget, cost/latency policy or scoring decisions;
- fallback, retry, replay, circuit behavior, credential resolution, provider SDK invocation;
- inference, embedding, rerank, RAG, assistant, agent, or tool execution;
- AI provisioning snapshot compilation/current-selection or prompt/policy evaluator execution;
- public/API route creation or Workflow/Automation runtime semantics.

**Acceptance linkage:** `AIMODEL-PG-001` through `AIMODEL-PG-005`.
'''

ACCEPTANCE = r'''

### AIMODEL-PG-001 — Exact model catalog metadata read
Given a persisted `core_ai.ai_model` row and its exact identifier, the PostgreSQL AI model catalog metadata reader returns the authorized metadata projection, preserves provider/model relationship and raw schema-owned evidence, deep-freezes the returned contract and nested JSON/array values, and does not reinterpret catalog metadata as runtime policy.

### AIMODEL-PG-002 — Missing and malformed identifier behavior
An exact well-formed model identifier with no matching row returns `null`; a malformed model UUID fails closed rather than being normalized into another identity.

### AIMODEL-PG-003 — Schema-valid raw evidence preservation
The reader preserves schema-valid empty text values and nullable/empty array elements instead of inventing non-empty normalization, enumerated runtime policy, or stronger persistence constraints not owned by the source schema.

### AIMODEL-PG-004 — Catalog metadata is not routing or execution authority
Raw model `status`, capability, sensitivity, context-window, modality, cost and latency evidence, including `ACTIVE`, remain catalog evidence only. The reader exposes no selected/eligible/current/preferred/route/fallback/generate/embed authority and does not convert model metadata into AI Gateway execution semantics.

### AIMODEL-PG-005 — Provider relation is evidence and dedicated AI role remains read-only
The exact persisted `provider_id` relationship is preserved without selecting or invoking the provider. The dedicated `sbg_ai_gateway_rw` role can SELECT model catalog metadata but has no `INSERT`, `UPDATE`, or `DELETE` authority over `core_ai.ai_model`; attempted mutation is rejected and the reader exposes no mutation methods.
'''

def append_once(path: Path, marker: str, block: str) -> None:
    text = path.read_text(encoding='utf-8')
    if marker in text:
        return
    path.write_text(text.rstrip() + block + '\n', encoding='utf-8')

append_once(DD18, '## DD-108 — AI Model Catalog Metadata Reader', DD108)
append_once(DD17, '### AIMODEL-PG-001 — Exact model catalog metadata read', ACCEPTANCE)
