# DD-196 verification — TokenUsage AIModel/Provider exact pair floor

**Date:** 2026-09-25 · **Repository:** `balkanhatv/SBGlobal_Plus_Project`
**Source audit:** `Development/AI_TOKEN_USAGE_MODEL_PROVIDER_PAIR_BINDING_PREREQUISITE_OWNERSHIP_AUDIT.md`

DD-196 re-evaluates only migrations 0012/0031's persisted TokenUsage `modelId/providerId` → AIModel `id/providerId` exact composite-pair relationship.

## Source-audit gate

Source-audit commit `b6460c3d2391fcafb88ef64e3bc7f79070118a99` / tree `e7c159666f86175dc27be4247eadd64128710ce5`:
- Core Service Verify `36157080255`, Core job `108144134452`: **612/612 PASS**, zero failed/skipped.
- PostgreSQL job `108144134678`: **504/504 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36157080219`, job `108144130653`: PASS.
- Web Boundary Verify `36157080218`, job `108144130511`: PASS.

## Observed implementation evidence

Implementation `609508642c21ce3337018f911814826cbe2f73dd` / tree `fc6a8a7206cfea38cb29422f171d6dbcc72bd606`:
- Core Service Verify `36157370893`, Core job `108145102572`: **619/619 PASS**, zero failed/skipped; `AIUSAGE-MODEL-CUR-001…007` all pass; REPO-007/008 pass.
- PostgreSQL job `108145102225`: **504/504 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36157370882`, job `108145102103`: PASS.
- Web Boundary Verify `36157370802`, job `108145102214`: PASS.

All four implementation logs assert the exact implementation commit/tree above. Database inventory remains **48 migrations / 42 SQL verification files**. No schema/RLS/role/grant change was introduced.

## Bounded result

A true helper result proves only exact persisted model/provider pair continuity. It does not prove Model/Provider currentness, principal currentness, capability eligibility, routing, entitlement/quota/budget, cost/billing or AI execution authority.

Canonical promotion uses the implementation HEAD above as verified executable basis. The promotion commit must pass its own exact-head Core/PostgreSQL/Database/Web gate before another DD/source audit opens.


## Canonical promotion exact-head gate

Canonical promotion `a4366228f1194d751a555be609a282879b4cb2d3` / tree `4a8b456750f8a356ac6ff87c02323798c93a6079` independently passed all required workflows:
- Core Service Verify `36157948796`, Core job `108147040398`: **619/619 PASS**, zero failed/skipped; REPO-007 and REPO-008 PASS.
- PostgreSQL job `108147040927`: **504/504 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36157948614`, job `108147039962`: PASS.
- Web Boundary Verify `36157948344`, job `108147039209`: PASS.

All four logs assert the exact promotion commit/tree above. This authorizes DD-196 state closure only; the closure commit must independently pass the same required workflows before another DD/source audit opens.


## State-closure exact-head gate

State closure `983256dfa32a76f3df4b6f31f431356f53abb0a4` / tree `c2fc6b69323804c371dc624ad2b7e80dec46d17d` independently passed all required workflows:
- Core Service Verify `36158501991`, Core job `108148883675`: **619/619 PASS**, zero failed/skipped; REPO-007 and REPO-008 PASS.
- PostgreSQL job `108148883642`: **504/504 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify `36158502045`, job `108148884855`: PASS.
- Web Boundary Verify `36158501915`, job `108148883267`: PASS.

All four logs assert the exact closure commit/tree above. This satisfies the recorded gate to open the next source-owned prerequisite audit.
