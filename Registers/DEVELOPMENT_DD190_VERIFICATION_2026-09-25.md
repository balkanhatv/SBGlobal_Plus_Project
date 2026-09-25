# DD-190 verification — Document AI-generated provenance raw reader

**Date:** 2026-09-25 · **Repository:** `balkanhatv/SBGlobal_Plus_Project`
**Source audit:** `Development/DOCUMENT_AI_GENERATED_PROVENANCE_RAW_READER_PREREQUISITE_OWNERSHIP_AUDIT.md`

DD-190 exposes only existing persisted Document AI provenance evidence through the existing Document FORCE-RLS / RequestScopedSql read boundary. It grants no generated-media provenance verdict, Provider/Model authority, moderation/licensing approval, Document authorization or AI execution authority.

## Source-audit gate

Source-audit commit `0067ac921c28dd73e76a902716f8eb8c10bd04c1` / tree `6faf7217db1dccc5e1e934a7698b0dfeb2dfd64f` passed exact-head Core **573/573**, PostgreSQL **497/497** plus database bootstrap, Database Verify and Web. Runs: Core `36131359658` (jobs `108059122676`, `108059122403`), Database `36131359566` (job `108059121844`), Web `36131359633` (job `108059122105`).

## Observed implementation evidence

Implementation `4fa07cab31cfa5b67939c007e95c27842c93ed6b` / tree `807bd258e46c461412749e5ac833dd6a34939daa`:
- Core Service Verify `36131728895`, Core job `108060304839`: **573/573 PASS**, zero failed/skipped.
- PostgreSQL job `108060304912`: **504/504 PASS**, zero failed/skipped, database bootstrap PASS. `DOCAIPROV-PG-001…007` all pass.
- Database Verify `36131728835`, job `108060304877`: PASS.
- Web Boundary Verify `36131728818`, job `108060304437`: PASS.

All four logs assert the exact implementation commit/tree above. Database inventory remains **48 migrations / 42 SQL verification files**. No schema/RLS/role/grant change was introduced.

## Bounded result

The reader preserves exact persisted id/scope/sensitivity/residency, generated flag, MediaRequest/Provider/Model ids and immutable JSON evidence. It does not perform the later migration-owned generated Document → completed AIMediaRequest recheck and does not make Provider/Model or moderation/licensing/currentness decisions.

Canonical promotion uses the implementation HEAD above as the verified executable basis. The promotion commit must pass its own exact-head Core/PostgreSQL/Database/Web gate before the next DD/source audit opens.
