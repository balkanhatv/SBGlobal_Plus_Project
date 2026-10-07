# DD-618…DD-622 verification — Generated Document provider-row relationship evidence

**Date:** 2026-10-07  
**Source audit:** `Development/DOCUMENT_AI_GENERATED_MODEL_PROVIDER_ROW_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD/tree:** `4a83455610506916fe363177619c212e0b128ada` / `cb69b5bcd3609668336e64ded9e0a352ff9673f5`  
**Corrected implementation HEAD/tree:** `52c5a3d7e82de97681c5eb495ea78962a4bb4fae` / `e432e50ea18cb7e2fdd7d03e50e460c617d2ec49`

## Entry gate

DD-613…DD-617 state closure `744fcecb0e21a089f63fdd5ccf2751951f85bcc6` / tree `91cb587ce529fe5874b857c12b7868efd93dabb1` passed exact-head Core **1544/1544**, PostgreSQL **540/540** plus bootstrap, Database **48 migrations / 42 SQL verification files**, and Web. DD-618…DD-622 source-audit HEAD `4a83455610506916fe363177619c212e0b128ada` subsequently passed its exact-head governance gates before implementation.

## Forward-only correction history

Initial implementation `db24ffd8758c5343ddcdc535f04eecc68fd9cefb` correctly preserved the DD-617-first reader ordering but one acceptance expected a Provider read after malformed AIModel.providerId evidence. Core rejected that expectation: DD-617/DD-192 already fails malformed Model identity evidence before DD-618 may read Provider metadata.

Forward-only correction `52c5a3d7e82de97681c5eb495ea78962a4bb4fae` updated only the source-audit clarification and executable acceptance expectation: malformed Model identity evidence remains parent-fail-closed with zero Provider reads; wrong/malformed loaded Provider evidence still fails through DD-200. Reader semantics were unchanged.

## Exact-head corrected implementation verification

Corrected HEAD `52c5a3d7e82de97681c5eb495ea78962a4bb4fae` / tree `e432e50ea18cb7e2fdd7d03e50e460c617d2ec49` passed:
- Core push run `37575860163` / job `112644486801`: **1553/1553 PASS**, fail/skip 0.
- PostgreSQL same run / job `112644486586`: **540/540 PASS**, fail/skip 0; full database bootstrap PASS.
- Database run `37575860161` / job `112644486238`: PASS; inventory remains **48 migrations / 42 SQL verification files**.
- Web run `37575860159` / job `112644486594`: PASS.
- Pull-request verification on the same corrected HEAD is also required/observed by repository governance; promotion itself remains separately gated.

## Bounded implementation result

The reader reuses exact DD-617 evidence. Non-AI/model-absent evidence performs zero Provider reads. Model-bound evidence reads exactly preserved AIModel.providerId once and applies only DD-200 direct Model→Provider foreign-key continuity. Success preserves exact parent/Provider references.

Provider/Model currentness, lifecycle, health, credentials, capability/residency/sensitivity compatibility, allowlists/provisioning, entitlement/budget, moderation/licensing, request-principal currentness, Document ACL/storage/signing, publication, mutation/events and AI execution remain separately governed.

## Canonical promotion gate

This promotion records DD-17 acceptance contracts, DD-18 decisions, DD-19 traceability, state/register projections and machine evidence. The promotion's own exact-head Core/PostgreSQL/Database/Web gate must pass before DD-618…DD-622 state closure or another source audit.
