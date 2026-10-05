# DD-538…DD-542 verification — Document access ACL subject evidence composition

**Date:** 2026-10-05  
**Source audit:** `Development/DOCUMENT_ACCESS_ACL_SUBJECT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD:** `23b3b1c5b0e3a0a3b2d64c7cbd7a321c2f740dd4`  
**Implementation HEAD/tree:** `85c4ac385fad6b6900fd08c1c4c8f3f5034e1f30` / `d38598c36e1b384984516f59b3a5a7e07fca90d1`

## Entry gate

DD-533…DD-537 state closure `eeb911f0ef0b4bd67ba4d854f6f5ed6b1c3af25a` / tree `97396aebc4035a38de9601c8be603db2ec2446c6` passed exact-head Core **1411/1411**, PostgreSQL **536/536** plus bootstrap, Database **48 migrations / 42 SQL verification files**, and Web. The DD-538…DD-542 source-audit HEAD passed both push and pull-request Core/PostgreSQL/Database/Web gates before implementation.

## Exact-head implementation verification

Implementation HEAD `85c4ac385fad6b6900fd08c1c4c8f3f5034e1f30` / tree `d38598c36e1b384984516f59b3a5a7e07fca90d1` passed:
- Core push run `37294040373` / job `111710956216`: **1420/1420 PASS**, fail/skip 0.
- PostgreSQL same run / job `111710956094`: **536/536 PASS**, fail/skip 0; full database bootstrap PASS.
- Database push run `37294040196` / job `111710955444`: PASS; database inventory remains **48 migrations / 42 SQL verification files**.
- Web push run `37294040132` / job `111710955566`: PASS.
- Pull-request Core/Database/Web workflows on the same implementation HEAD also passed.

## Bounded implementation result

The reader sequences only existing DD-082 → DD-084 → DD-085 boundaries. Candidate evidence is established first; raw ACL evidence is loaded once for the exact candidate document; subject matching uses one explicit caller-supplied ACL permission. Success preserves exact candidate/raw ACL/matched-array references and the explicit permission in a frozen evidence envelope.

Empty matches are valid evidence and do not synthesize deny. Non-empty matches preserve raw ALLOW/DENY and validUntil facts without expiry/effect reduction. No operation→ACL permission mapping, source-resource/owner fallback, final authorization, sensitivity/step-up/residency composition, storage signing/TTL/provider selection, download/share/delete route, dispatch or mutation authority is added. No schema/RLS/role/grant/public-route/frontend/RawSource change occurred.

## Promotion gate

Canonical DD/traceability/state promotion must independently pass exact-head Core/PostgreSQL/Database/Web before DD-538…DD-542 can be closed.
