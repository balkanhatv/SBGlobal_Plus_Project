# DD-588…DD-592 verification — derivative-parent paired ACL current-effect evidence

**Date:** 2026-10-06  
**Source audit:** `Development/DOCUMENT_DERIVATIVE_PARENT_ACL_CURRENT_EFFECT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD/tree:** `ceacd70e503161748bfded3e29e91400dfb49b06` / `b6706d514ad69b7ba47149cab63895079a8222eb`  
**Verified implementation HEAD/tree:** `b9f82b467742b6a89353423f3348630647d82c9f` / `e41dc0294c52f9c9a3db0078ce451d2beeae6b89`

## Entry gate

DD-583…DD-587 state closure `441a9f7e4b9e96ba4fcbc19c0cfc5a971b357f2c` / tree `0b4d4e7a881f8a2b609f87e2973be115f60f3cbf` passed Core **1491/1491**, PostgreSQL **540/540** plus bootstrap, Database 48/42 and Web. DD-588…DD-592 source-audit HEAD subsequently passed exact-head Core/PostgreSQL/Database/Web before implementation.

## Exact-head implementation verification

Implementation HEAD `b9f82b467742b6a89353423f3348630647d82c9f` / tree `e41dc0294c52f9c9a3db0078ce451d2beeae6b89` passed:
- Core push run `37450744311` / job `112226433676`: **1500/1500 PASS**, fail/skip 0.
- PostgreSQL same run / job `112226434194`: **540/540 PASS**, fail/skip 0; full database bootstrap PASS.
- Database run `37450744351` / job `112226434345`: PASS with unchanged **48 migrations / 42 SQL verification files**.
- Web run `37450744322` / job `112226433807`: PASS.
- Pull-request Core/Database/Web workflows on the same implementation HEAD also passed.

## Bounded implementation result

A shared pure DD-558…DD-561 current-effect helper now owns the trusted-time parsing/currentness partition/explicit-DENY-wins reducer and DD-562 consumes it without semantic widening. The new paired reader reuses exact DD-587 raw derivative/parent ACL evidence, applies DD-085 independently to both sides with one explicit permission and exact same RequestContext, then applies the same trusted currentTimeIso independently to both matched sets.

Success preserves the exact DD-587 parent/raw evidence and exact matcher-returned arrays plus immutable current/expired/effect evidence for each side. The implementation does not compare the sides and does not define derivative ACL non-widening, source-resource inheritance/fallback, final authorization, signing/grant/storage dispatch, mutation or event authority. No schema/RLS/route/frontend/RawSource change occurred.

## Promotion gate

Canonical DD/traceability/state promotion must independently pass exact-head Core/PostgreSQL/Database/Web before DD-588…DD-592 can be closed.

## Canonical promotion verified; state closure staged — 2026-10-06

Canonical promotion HEAD `06c99d9b5b48b522b7788dac6a0a260d51a8c48b` / tree `f463c2608eca4a85c557e5f3f5db177d9c00cefb` passed exact-head push gates:
- Core run `37452309407` / job `112231520741`: **1500/1500 PASS**, fail/skip 0.
- PostgreSQL same run / job `112231520293`: **540/540 PASS**, fail/skip 0; full database bootstrap PASS.
- Database run `37452309411` / job `112231519944`: PASS with unchanged **48 migrations / 42 SQL verification files**.
- Web run `37452309380` / job `112231519831`: PASS.
- Pull-request Core/Database/Web workflows on the same promotion HEAD also passed.

This state-closure commit must independently pass Core/PostgreSQL/Database/Web before DD-588…DD-592 is closed and another source audit may open.
