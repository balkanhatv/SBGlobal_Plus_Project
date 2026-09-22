# CORE SERVICE CHECKPOINT — DEV-INTEGRATION-CAPABILITY-READ-001
**Updated:** 2026-09-22 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `31ff08fb962c09167b9c4e545593755a2b7111df` / tree `c6762fa966eba0754db56273de619af93985cf5f`: **311/311 Core**, **112/112 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **464 blobs / 188 Markdown / 106 source / 68 test files**.

## Implemented boundary

DD-093 adds an exact IntegrationCapability PostgreSQL reader keyed by IntegrationDefinition id + capability code. It preserves immutable direction, optional OperationContract reference, event types and raw data/idempotency/rate/status metadata without turning registry evidence into Tenant enablement, provider selection, dispatch or authorization.

INT-CAP-PG-001…004 prove exact tuple fidelity, immutable event types, raw RETIRED/direction/rate evidence, no cross-definition fallback and malformed-input fail-closed behavior. OperationContract/event ids remain references only.

DD-092 IntegrationDefinition, DD-091 Event Catalog and earlier Integration/Document/Core checkpoints remain covered.

## Remaining scope

Capability registry rows are not execution authority. No TenantIntegration enablement, ProviderAdapter selection, OperationContract/event dispatch, rate/idempotency policy or credential access is claimed.

Next: ProviderAdapter exact definition+adapter+contract-version registry persistence is the next independent source-complete candidate for source audit. Provider execution/selection, CredentialReference secret access, TenantIntegration enablement/health policy, webhook network/signing/filter/retry runtime, event dispatch mutation/retry/DLQ, Document policy/signing, REST exposure, DD-076 evaluator and concrete AI Gateway remain unfinished on their named prerequisites.

Evidence: `Registers/DEVELOPMENT_DD093_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
