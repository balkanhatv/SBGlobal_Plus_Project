# CORE SERVICE CHECKPOINT — DEV-CREDENTIAL-METADATA-READ-001
**Updated:** 2026-09-22 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `5586ebbed06671a70d241f6bd2726aba55364529` / tree `e3dc43ada666ff28ad2cd0e2c29111d01e9961e2`: **311/311 Core**, **126/126 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **476 blobs / 194 Markdown / 112 source / 68 test files**.

## Implemented boundary

DD-096 adds a tenant-scoped CredentialReference metadata-only PostgreSQL reader. It returns RLS-visible scope, secret-store provider, credential type, key version, raw status and rotation/expiry metadata while deliberately excluding `secret_reference` from both SQL projection and Core contract. Secret locator/material access remains separate, purpose-bound and audited.

INT-CRED-META-PG-001…005 prove same-context metadata fidelity, sibling/foreign isolation, Tenant Core same-Tenant visibility, rotation/expiry preservation and malformed/route-mismatch fail-closed behavior. Tests explicitly verify that no secret locator/material field is returned.

DD-095 TenantIntegration, DD-094 ProviderAdapter, DD-093 IntegrationCapability, DD-092 IntegrationDefinition and earlier Integration/Document/Core checkpoints remain covered.

## Remaining scope

Credential metadata is not secret access or provider execution authority. Platform-global credential reads, `secret_reference` retrieval, secret-store access and credential usability/rotation policy remain unclaimed.

Next: Source-audit SyncCursor raw persistence as the next independent Integration slice. Cursor evidence must remain opaque/encrypted persistence only; sync execution/resume decisions, CredentialReference secret retrieval, ProviderAdapter runtime selection/execution, TenantIntegration enablement/health decisions, webhook network/signing/filter/retry runtime, event dispatch mutation/retry/DLQ, Document policy/signing, REST exposure, DD-076 evaluator and concrete AI Gateway remain unfinished on their named prerequisites.

Evidence: `Registers/DEVELOPMENT_DD096_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
