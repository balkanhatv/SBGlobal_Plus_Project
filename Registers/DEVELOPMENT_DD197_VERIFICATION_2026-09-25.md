# DD-197 verification — TokenUsage AICapability exact-code floor

**Date:** 2026-09-25 · **Repository:** `balkanhatv/SBGlobal_Plus_Project`
**Source audit:** `Development/AI_TOKEN_USAGE_CAPABILITY_BINDING_PREREQUISITE_OWNERSHIP_AUDIT.md`

DD-197 re-evaluates only migration 0012's persisted TokenUsage `capabilityCode` → AICapability `code` exact foreign-key relationship. It does not establish capability currentness, entitlement/policy, principal currentness, billing or AI execution authority.

## Source-audit gate

Source-audit commit `6008f41f3ba2f5fa6d17f1c033c3991b75fa51c9` / tree `682285796222a2ba1ecd67bf333c1fdf80ec14f2`:
- Core Service Verify `36159641546`, Core job `108152726322`: **619/619 PASS**, zero failed/skipped; REPO-007/008 pass.
- PostgreSQL job `108152725835`: **504/504 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36159641561`, job `108152725833`: PASS.
- Web Boundary Verify `36159641526`, job `108152726049`: PASS.

## Observed implementation evidence

Implementation `a4d12bb3a0683ad218d6b1a5c4bedccafae99cdf` / tree `51d94b76c82aff0be0b946d858f887e36ff3ac51`:
- Core Service Verify `36159912811`, Core job `108153632327`: **626/626 PASS**, zero failed/skipped; `AIUSAGE-CAP-CUR-001…007` all pass; REPO-007/008 pass.
- PostgreSQL job `108153631892`: **504/504 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36159912926`, job `108153632353`: PASS.
- Web Boundary Verify `36159912919`, job `108153632059`: PASS.

All four implementation logs assert the exact implementation commit/tree above. Database inventory remains **48 migrations / 42 SQL verification files**. No schema/RLS/role/grant change was introduced.

## Bounded result

A true helper result proves only exact persisted capability-code continuity. Capability status/category/entitlement/default policy, principal currentness, model/provider compatibility, routing, quota/budget, cost/billing and AI execution remain unclaimed.

Canonical promotion uses the implementation HEAD above as verified executable basis. The promotion commit must pass its own exact-head Core/PostgreSQL/Database/Web gate before another DD/source audit opens.
