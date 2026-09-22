# CORE SERVICE CHECKPOINT — DEV-SYNC-CURSOR-READ-001
**Updated:** 2026-09-22 · **Branch:** `docs/architecture-branch-2`

## Verified executable basis

Verified executable `9271010240d06eac21dbf750172b4a987a9dddb7` / tree `f4b0375255740ca3a94243d120beac4e94d21f6f`: **311/311 Core**, **131/131 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **480 blobs / 196 Markdown / 114 source / 68 test files**.

## Implemented boundary

DD-097 adds an exact raw SyncCursor PostgreSQL reader through the fixed Integration service role + RequestScopedSql. It reads only the unique TenantIntegration + capability + nullable Industry Context tuple, preserves opaque/encrypted cursor, watermark/source-version and updated-at evidence, and relies on parent TenantIntegration FORCE-RLS for isolation. It deliberately does not decode/decrypt cursor data or decide sync resume/execution.

INT-CURSOR-PG-001…005 prove exact tuple fidelity, sibling/foreign isolation, Tenant Core same-Tenant visibility, historical raw evidence after parent PAUSED, exact no-fallback semantics and fail-closed malformed/route-mismatch handling.

DD-096 credential metadata, DD-095 TenantIntegration and earlier Integration/document/event slices remain covered.

## CI-discovered cleanup

Two merge/composition defects were corrected before promotion:
- duplicate DD-097 owner/decision blocks caused REPO-004 decision uniqueness failure;
- duplicate SyncCursor test import/store declaration caused PostgreSQL test-file parse failure.

Both were removed without changing runtime contracts, SQL schema, roles or RLS.

## Remaining scope

Raw cursor persistence is not sync authority. Cursor decode/decrypt, provider-specific semantics, resume/replay decisions and cursor mutation are not claimed.

Next: Source-audit NotificationDelivery raw persistence as the next independent source-complete Core slice. Notification send/provider/retry decisions, CredentialReference secret retrieval, ProviderAdapter runtime selection/execution, TenantIntegration enablement/health decisions, webhook network/signing/filter/retry runtime, event dispatch mutation/retry/DLQ, Document policy/signing, REST exposure, DD-076 evaluator and concrete AI Gateway remain unfinished on their named prerequisites.

Evidence: `Registers/DEVELOPMENT_DD097_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
