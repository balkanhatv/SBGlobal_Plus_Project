from pathlib import Path

DD18 = Path("DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md")
DD17 = Path("DetailedDesign/DD-17_TEST_ACCEPTANCE_CONTRACTS.md")

DD108 = r'''

## DD-108 — AI Model Catalog Metadata Reader

**Decision:** Introduce a bounded exact-by-id PostgreSQL reader for global `core_ai.ai_model` catalog metadata through the existing dedicated `sbg_ai_gateway_rw` database boundary.

**Source ownership and boundary:**
- DD-107 established a bounded global AI Provider catalog reader without creating provider-selection, routing, secret-resolution, or inference authority. DD-108 applies the same separation to the model catalog.
- AI catalog migrations define `core_ai.ai_model` as global catalog data and grant the dedicated AI Gateway role read authority without model-catalog mutation grants.
- The authorized projection is limited to schema-owned model metadata: `id`, `providerId`, `modelCode`, `displayName`, `capabilities`, `contextWindowClass`, `inputModalities`, `outputModalities`, `residencyRegions`, `sensitivityCeiling`, `costClass`, `latencyClass`, raw `status`, positive `version`, and `metadata`.
- The reader preserves schema-valid raw text, nullable array entries, provider linkage, sensitivity ceiling, version, and JSON metadata. Raw `ACTIVE` status or provider linkage remains catalog evidence only and does not become selection, eligibility, routing, or execution authority.
- No tenant, industry, organization, branch, department, user, or staff `RequestContext` is invented for this global catalog read.
- The existing `PostgresAIGatewayDatabase` and `sbg_ai_gateway_rw` role are reused. No schema, migration, role, grant, RLS, or product-policy change is authorized by this decision.

**Runtime semantics explicitly not claimed:**
- active/current/effective model selection or request eligibility;
- provider/model pair request authorization, preferred-model selection, or provider routing;
- health/cost/latency scoring, fallback, retry, replay, or finality;
- tenant/industry allow-list, sensitivity, residency, entitlement, quota, budget, or policy evaluation;
- credential or secret resolution, provider SDK dispatch, inference, embedding, RAG, assistant, agent, or tool execution;
- AI provisioning snapshot compilation/current-selection or prompt/policy evaluation;
- Workflow/Automation execution or mutation semantics.

**Acceptance linkage:** `AIMODEL-PG-001` through `AIMODEL-PG-005`.
'''

ACCEPTANCE = r'''

### AIMODEL-PG-001 — Exact model catalog metadata read
Given a persisted `core_ai.ai_model` row and its exact identifier, the PostgreSQL AI model catalog metadata reader returns the authorized immutable/frozen metadata projection and preserves schema-owned provider, capability, modality, residency, sensitivity, cost, latency, raw status, version, and metadata evidence.

### AIMODEL-PG-002 — Missing and malformed identifier behavior
An exact well-formed model identifier with no matching row returns `null`; a malformed model UUID fails closed rather than being normalized into another identity.

### AIMODEL-PG-003 — Schema-valid raw evidence preservation
The reader preserves schema-valid empty text values and nullable/empty array elements instead of inventing non-empty normalization or runtime policy semantics not owned by the source schema.

### AIMODEL-PG-004 — Catalog state is not runtime routing or execution authority
Raw model `status`, sensitivity ceiling, cost/latency classes, capabilities, residency metadata, and provider relationship remain catalog evidence only. `ACTIVE` does not become selected/current/eligible/preferred/route/fallback authority, and the reader exposes no model selection, generation, embedding, or inference operation.

### AIMODEL-PG-005 — Dedicated AI role remains read-only for model catalog
The dedicated `sbg_ai_gateway_rw` role can select model catalog metadata but has no `INSERT`, `UPDATE`, or `DELETE` authority over `core_ai.ai_model`; an attempted model update is rejected, the provider relation is preserved as evidence, and the bounded reader exposes no mutation methods.
'''

def append_once(path: Path, marker: str, payload: str) -> None:
    text = path.read_text(encoding="utf-8")
    if marker in text:
        return
    if marker == "## DD-108" and "AIMODEL-PG-001" in text:
        raise SystemExit("DD-108 canonical markers are inconsistent")
    if marker == "### AIMODEL-PG-001" and "## DD-108" in text and path == DD17:
        raise SystemExit("DD-108 acceptance markers are inconsistent")
    path.write_text(text.rstrip() + payload + "\n", encoding="utf-8")

append_once(DD18, "## DD-108", DD108)
append_once(DD17, "### AIMODEL-PG-001", ACCEPTANCE)
