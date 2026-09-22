# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-22 · **Checkpoint:** `DEV-SYNC-CURSOR-READ-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified executable `9271010240d06eac21dbf750172b4a987a9dddb7` / tree `f4b0375255740ca3a94243d120beac4e94d21f6f`: **311/311 Core**, **131/131 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **480 blobs / 196 Markdown / 114 source / 68 test files**.

DD-097 adds an exact raw SyncCursor PostgreSQL reader through the fixed Integration service role + RequestScopedSql. It reads only the unique TenantIntegration + capability + nullable Industry Context tuple, preserves opaque/encrypted cursor, watermark/source-version and updated-at evidence, and relies on parent TenantIntegration FORCE-RLS for isolation. It deliberately does not decode/decrypt cursor data or decide sync resume/execution.

Read `Development/SYNC_CURSOR_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` before extending sync behavior. DD-097 is exact raw persistence only: `cursorEncryptedOrOpaque` is server-internal evidence, not decoded data or resume authorization.

Next: Source-audit NotificationDelivery raw persistence as the next independent source-complete Core slice. Notification send/provider/retry decisions, CredentialReference secret retrieval, ProviderAdapter runtime selection/execution, TenantIntegration enablement/health decisions, webhook network/signing/filter/retry runtime, event dispatch mutation/retry/DLQ, Document policy/signing, REST exposure, DD-076 evaluator and concrete AI Gateway remain unfinished on their named prerequisites.

Evidence: `Registers/DEVELOPMENT_DD097_VERIFICATION_2026-09-22.md`.

RawSource accepted blobs unchanged; main remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; PR #2 remains draft/unmerged.
