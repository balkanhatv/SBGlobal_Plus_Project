# DD-598…DD-602 verification — AIMediaRequest capability current evidence

**Date:** 2026-10-06  
**Source audit:** `Development/AI_MEDIA_REQUEST_CAPABILITY_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD/tree:** `9b793b3d24ce41b199725b62d57766ee4f056c72` / `035f8b97562fffa73b0f3a3818c9886649a11827`  
**Corrected implementation HEAD/tree:** `8ab7f7ee6ab6e439e17f75d674a06948d09afe8f` / `49e4febadfbdce76e0f6f9baeb9db12c033ce888`

## Entry gate

DD-593…DD-597 state closure `9ca4308f0f1049b1738ab6f806298d514b9f2f51` / tree `4acd8f4c0e06c8d0968651cef718dd3d532dd418` passed exact-head Core **1509/1509**, PostgreSQL **540/540** plus bootstrap, Database **48 migrations / 42 SQL verification files**, and Web. DD-598…DD-602 source-audit HEAD subsequently passed exact-head Core/PostgreSQL/Database/Web before implementation.

## Forward-only implementation correction

Initial implementation `6bbd096d7ae556204e7539ab8f40db6d361f773c` added the bounded reader and eight fixed acceptances, but an index export contained a literal `\\n` token. A source-level sanity check detected this immediately. Forward-only correction `8ab7f7ee6ab6e439e17f75d674a06948d09afe8f` repaired only that export newline; reader/test semantics were unchanged.

## Exact-head implementation verification

Corrected implementation HEAD `8ab7f7ee6ab6e439e17f75d674a06948d09afe8f` / tree `49e4febadfbdce76e0f6f9baeb9db12c033ce888` passed:
- Core push run `37495171810` / job `112377742310`: **1517/1517 PASS**, fail/skip 0.
- PostgreSQL same run / job `112377741656`: **540/540 PASS**, fail/skip 0; full database bootstrap PASS.
- Database pull-request run `37495180419` / job `112377769287`: PASS on the exact corrected HEAD; repository inventory remains **48 migrations / 42 SQL verification files**.
- Web push run `37495171609` / job `112377741857`: PASS.

## Bounded result

The reader loads one exact AIMediaRequest, then exactly one global AICapability row by the request's persisted capabilityCode and applies only the existing DD-202 exact code-binding floor. Success preserves exact immutable request/capability references.

Capability status/category/requiredEntitlement/defaultPolicyClass/schemaVersion remain raw evidence. No capability eligibility/currentness, entitlement/policy/allowlist decision, prompt/document authorization, moderation/provisioning/provider/model routing, budget/quota, media execution/publication, mutation/event, schema/RLS/route/frontend/RawSource authority is added.

## Promotion gate

Canonical DD/traceability/state promotion must independently pass exact-head Core/PostgreSQL/Database/Web before DD-598…DD-602 can be closed.
