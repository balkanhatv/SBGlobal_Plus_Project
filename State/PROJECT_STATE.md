# PROJECT_STATE — SBGlobal Plus
**Updated:** 2026-09-23 · **Checkpoint:** `DEV-ORG-UNIT-INDUSTRY-READ-001`

Branch: `docs/architecture-branch-2`. Development remains **IN PROGRESS**.

Verified executable `28546f407042f2839d5861cd40d4f679675c6484` / tree `2934474535016628be15c6be5d855646af184225`: **311/311 Core**, **434/434 PostgreSQL**, **47 migrations / 41 SQL verification files**, Next.js build and Database Verify PASS. Zero failed/skipped tests.

Promotion invariant gate `6a65e113a1cdc6e2011b297943eb7ca76bdb900d` / tree `26db1b2b26e530180ade6ae1a2262e388893baf3`: Core run `35883193670` (Core job `107256589373`, PostgreSQL job `107256589090`), Database run `35883193683` (job `107256589481`), Web run `35883193664` (job `107256589992`) — SUCCESS; **142 unique DD definitions**, 9 Industries, 41 canonical MS, 181 Industry tables, 2,962 preserved requirements.

DD-142 adds an exact OrgUnit linkage reader for `core_tenancy.org_unit_industry` through the existing `RequestScopedSql` boundary. Exact Tenant + Industry FORCE-RLS exposes only the current Industry link; raw `ACTIVE | SUSPENDED | ARCHIVED` status and immutable config JSON remain persistence evidence only. The reader does not become OrgUnit/Industry activation, hierarchy, config-resolution, document-ACL or workflow-assignment authority.

Invariants remain **9 Industries / 41 canonical MS / 181 registered Industry tables**, **2,962 unchanged source requirement IDs/text**, and contiguous **ADR-001–020 / DD-001–142**.

Next: Fresh source-audit the next independent source-complete Core persistence slice. Keep OrgUnitIndustry mutation/status transitions, current/effective link selection, OrgUnit hierarchy/inheritance, OrgUnit/Industry lifecycle revalidation, config interpretation/materialization, document/workflow authorization and pre-context visibility outside scope unless separately source-owned.

Evidence: `Registers/DEVELOPMENT_DD142_VERIFICATION_2026-09-23.md`.

RawSource accepted blobs remain immutable; `main` remains unmerged; PR #2 remains draft/unmerged.
