# Development DD-108 Verification — 2026-09-22

## Scope

DD-108 adds only a bounded exact-by-id PostgreSQL metadata reader for the global `core_ai.ai_model` catalog. It does not implement concrete AI Gateway provider/model selection, routing, credential use, or execution semantics.

## Baseline and source ownership audit

- Prior promoted checkpoint: `DEV-AI-PROVIDER-CATALOG-READ-001`.
- Source audit commit: `cf4b15ec4913e2d8bd3e74e9175345adf68dd13d`.
- Audit artifact: `Development/AI_MODEL_CATALOG_METADATA_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`.
- Migrations 0011/0014/0031 plus A-07 and DD-09 establish global model catalog persistence, dedicated SELECT-only AI role, and provider/model integrity while leaving request-time model selection/routing as separate runtime semantics.
- No Tenant/Industry RequestContext is invented for this global catalog reader.

## Executable implementation basis

- Implementation commit: `e1e53969a3a2869e2c4612e45c65a7a3c66d2d58`.
- Implementation tree: `f057bef288113ff61bd3575239cbabc44c756c9a`.
- Added bounded contract: `src/core/ai/model-catalog-metadata.ts`.
- Added PostgreSQL adapter: `src/server/ai/postgres-ai-model-catalog-metadata-store.ts`.
- Added acceptance suite: `tests/postgres/ai-model-catalog-metadata-store.test.mjs`.
- Updated only the Core export in `src/core/index.ts` beyond those files.
- Existing `PostgresAIGatewayDatabase` and fixed `sbg_ai_gateway_rw` boundary are reused.
- No migration, schema, database verification SQL, role, grant, RLS, or product-policy file changed in the implementation commit.

## Implementation-head CI evidence

Exact tested head: `e1e53969a3a2869e2c4612e45c65a7a3c66d2d58` / tree `f057bef288113ff61bd3575239cbabc44c756c9a`.

- Core Service Verify run `35738071363`, Core job `106780341230`: **311/311 PASS**.
- Same Core Service Verify run, PostgreSQL/RLS job `106780341587`: **195/195 PASS**, including `AIMODEL-PG-001…005`.
- Database Verify run `35738071402`: **PASS**, **47 migrations / 41 verification SQL files** and database bootstrap verification PASS.
- Web Boundary Verify run `35738071341`: **PASS**, production build compiled successfully.

## Acceptance contracts

- `AIMODEL-PG-001`: exact model metadata read preserves immutable raw catalog evidence.
- `AIMODEL-PG-002`: absent model returns null and malformed UUID fails closed.
- `AIMODEL-PG-003`: schema-valid empty text and nullable array evidence is preserved.
- `AIMODEL-PG-004`: raw catalog status/sensitivity evidence does not become routing or execution authority.
- `AIMODEL-PG-005`: provider relation is preserved and dedicated AI role has no model mutation authority.

## Explicitly unclaimed runtime semantics

DD-108 does not claim active/current/eligible/preferred model selection, provider/model routing, credential resolution, fallback/retry, provider SDK calls, inference or embedding, Tenant/Industry allowlist evaluation, sensitivity/residency runtime decisions, quota/budget execution, AIProvisioningSnapshot compilation/current selection, prompt/policy evaluation, RAG/assistant/agent/tool execution, or any public/API route.

## Canonical traceability promotion

- Canonical DD-108 / DD-17 traceability is present at current canonical head `51cf83a0c3e8e06e0116a2db169620365cda4a96` / tree `52ae1b85e3d91762b7301f39191d5c2bb26ded81`.
- Earlier corrected self-removing helper run `35740499869` produced the same DD-108 canonical traceability content; subsequent helper cleanup is absent from the current tree.
- Net comparison from executable implementation head to the current canonical head changes only `DetailedDesign/DD-17_TEST_ACCEPTANCE_CONTRACTS.md`, `DetailedDesign/DD-18_DETAILED_DESIGN_DECISIONS.md`, and this DD-108 verification register; temporary promotion helpers are absent from the resulting tree.

## Promotion evidence

- Invariant gate: pending exact CI on the connector-authored canonical/register head created by this update.
- Promoted checkpoint: pending `DEV-AI-MODEL-CATALOG-READ-001`.
- State promotion commit/tree: pending.
- Final exact promotion-head CI: pending.
- Final safety verification: pending.
