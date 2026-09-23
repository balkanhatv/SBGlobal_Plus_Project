# HANDOFF_NOTE — SBGlobal Plus
**Updated:** 2026-09-23 · **Checkpoint:** `DEV-DATA-EXPORT-REQUEST-READ-001`

Fresh-fetch remote branch/HEAD/tree/checks before further work.

Verified executable `f516a4cd8731708ce101e24ca06b8175a4deabf3` / tree `a6d22783b0c0f5bd8d599526adedf9efa1ff8418`: **311/311 Core**, **420/420 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS. Zero failed/skipped tests.

Promotion invariant gate `b541f53a6881708d0326fcc7fe40c8ac264e685a` / tree `66f25de6cd656a392e9d95ee3c783037a866360a`: Core run `35879257481` (Core job `107243141049`, PostgreSQL job `107243141323`), Database run `35879257689` (job `107243142502`), Web run `35879257587` (job `107243141812`) — SUCCESS; **140 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-140 adds an exact-by-id `core_config.data_export_request` raw persistence reader through the existing `PostgresDatabase` + `RequestScopedSql` boundary. Final FORCE-RLS preserves exact Tenant Core / Tenant Industry scope; raw requester/subject/resource-class/residency/sensitivity/status/approval/document/expiry evidence remains non-authorizing persistence data. Write-time membership/document integrity is preserved without turning the reader into approval, generation, download, current-authorization or cross-context export authority.

Read `Development/DATA_EXPORT_REQUEST_RAW_PERSISTENCE_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` and `Registers/DEVELOPMENT_DD140_VERIFICATION_2026-09-23.md` before extending data-export behavior.

Next: Fresh source-audit the next independent source-complete Core persistence slice. Keep export creation/validation/approval/generation/cancellation/download, current requester/subject authorization, current Document revalidation/access, resource-class query construction, residency-policy resolution, expiry enforcement and cross-context export outside scope unless separately source-owned.

RawSource accepted blobs remain immutable; `main` remains unmerged; PR #2 remains draft/unmerged.
