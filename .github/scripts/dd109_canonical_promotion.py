from pathlib import Path

DD18 = Path('DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md')
DD17 = Path('DetailedDesign/DD-17_TEST_ACCEPTANCE_CONTRACTS.md')

DD109 = r'''

## DD-109 — AI Capability catalog metadata is readable as raw global evidence without creating capability-authorization authority

**Context:** DD-107 and DD-108 established bounded global AI Provider and AI Model catalog metadata readers through the dedicated AI Gateway database role. Migration 0011 also defines `core_ai.ai_capability` as global catalog persistence; migration 0014 grants `sbg_ai_gateway_rw` SELECT without capability-catalog DML; DD-09 owns the capability entity shape. Migration 0031 consumes capability code/id plus `status='ACTIVE'` in persisted relationship-integrity predicates, while A-07 and DD-09 keep request-time entitlement, policy, provisioning, routing and execution behind the AI Gateway. A catalog row is therefore evidence, not standalone authorization.

**Decision:** add an exact-by-id immutable `AICapabilityCatalogMetadataReadPort` and `PostgresAICapabilityCatalogMetadataStore` through the existing `PostgresAIGatewayDatabase` boundary. The reader projects only schema-owned raw capability evidence: `id`, `code`, constrained `category`, nullable raw `requiredEntitlement`, raw `defaultPolicyClass`, positive `schemaVersion`, and raw `status`. Schema-valid empty text and NULL entitlement evidence are preserved instead of strengthened. Missing rows return null; malformed ids, malformed rows, or ambiguous exact-id results fail closed.

**Security / trade-off:** the fixed `sbg_ai_gateway_rw` role remains SELECT-only for `core_ai.ai_capability`; no INSERT/UPDATE/DELETE authority or mutation method is added. `status='ACTIVE'`, `requiredEntitlement`, and `defaultPolicyClass` remain catalog evidence only and do not mean eligible, entitled, permitted, selected, routable, or executable. No Tenant/Industry RequestContext is invented for this global catalog read.

**Boundary:** DD-109 does not evaluate entitlement or `default_policy_class`; resolve effective Tenant/Industry allowed-capability configuration; compile/select an `AIProvisioningSnapshot`; select or route providers/models; perform capability-to-model suitability decisions; enforce sensitivity/residency/quota/budget; resolve credentials; call provider SDKs; execute inference, embedding, rerank, OCR, media generation, RAG, assistants, agents or tools; evaluate prompts/policies; expose a public route; implement Workflow/Automation runtime semantics; or change any migration/schema/verification SQL/role/grant/RLS/product policy.

**Acceptance:** `AICAP-PG-001` through `AICAP-PG-005` in DD-17 and `tests/postgres/ai-capability-catalog-metadata-store.test.mjs`.
'''

ACCEPTANCE = r'''

## DD-109 AI Capability Catalog Metadata Reader Acceptance

### AICAP-PG-001 — Exact immutable capability catalog evidence
Exact capability-id lookup returns only the bounded AI Capability metadata contract, preserving code, constrained category, nullable required-entitlement evidence, default-policy-class evidence, positive schema version, and raw status as an immutable/frozen result.

### AICAP-PG-002 — Absence and malformed identity fail closed
An absent well-formed UUID returns `null`; a malformed capability UUID fails closed rather than being normalized into another identity or unbounded query.

### AICAP-PG-003 — Schema-valid nullable and empty evidence is preserved
`required_entitlement=NULL`, schema-valid empty text, and raw status evidence remain distinct persisted facts and are not strengthened into invented non-empty entitlement/policy rules.

### AICAP-PG-004 — Catalog facts are not authorization, routing, or execution authority
Raw `ACTIVE`, `required_entitlement`, `default_policy_class`, category, or schema-version facts do not create eligible/entitled/allowed/selected/route/policy-decision authority. The store exposes no entitlement evaluator, policy evaluator, route selector, or AI execution operation.

### AICAP-PG-005 — Dedicated AI role remains read-only for capability catalog
`sbg_ai_gateway_rw` can SELECT the capability catalog but cannot INSERT/UPDATE/DELETE; a mutation attempt is rejected, and the bounded store exposes no create/update/delete methods.
'''

s18 = DD18.read_text(encoding='utf-8')
if '## DD-109 — AI Capability catalog metadata is readable as raw global evidence without creating capability-authorization authority' in s18:
    raise SystemExit('DD-109 already present in DD-18')
if '## DD-108 — AI Model catalog metadata is readable as raw global evidence without creating model-selection authority' not in s18:
    raise SystemExit('DD-108 anchor missing from DD-18')
DD18.write_text(s18.rstrip() + DD109 + '\n', encoding='utf-8')

s17 = DD17.read_text(encoding='utf-8')
if '## DD-109 AI Capability Catalog Metadata Reader Acceptance' in s17:
    raise SystemExit('DD-109 acceptance already present in DD-17')
if '## DD-108 AI Model Catalog Metadata Reader Acceptance' not in s17:
    raise SystemExit('DD-108 acceptance anchor missing from DD-17')
DD17.write_text(s17.rstrip() + ACCEPTANCE + '\n', encoding='utf-8')
