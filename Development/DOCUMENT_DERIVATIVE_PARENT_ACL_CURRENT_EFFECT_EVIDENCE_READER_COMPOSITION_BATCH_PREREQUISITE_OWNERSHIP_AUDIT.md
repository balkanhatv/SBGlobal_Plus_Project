# Document derivative-parent paired ACL current-effect evidence reader composition batch prerequisite ownership audit

**Date:** 2026-10-06  
**Baseline checkpoint:** `DEV-DOCUMENT-DERIVATIVE-PARENT-RAW-ACL-EVIDENCE-READER-001`  
**Verified entry HEAD:** `441a9f7e4b9e96ba4fcbc19c0cfc5a971b357f2c`  
**Verified entry tree:** `0b4d4e7a881f8a2b609f87e2973be115f60f3cbf`  
**Governed batch:** DD-588 through DD-592

## Entry gate

DD-583…DD-587 canonical promotion and state closure are exact-head verified. Push Core Service Verify run `37449571321`: Core job `112222568507` **1491/1491 PASS**, PostgreSQL job `112222568395` **540/540 PASS**, fail/skip 0; full database bootstrap PASS. Database run `37449571538` / job `112222569344` PASS with unchanged **48 migrations / 42 SQL verification files**. Web run `37449571641` / job `112222568841` PASS.

This closes DD-583…DD-587 at its bounded raw paired-ACL evidence scope. PR #2 remains open/draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled source ownership

- DD-587 owns exact DD-582 derivative-parent current evidence plus exact raw DD-084 ACL arrays for derivative and parent, with exact document binding and no ACL interpretation.
- DD-085 owns exact PRINCIPAL / ROLE / ORG_UNIT subject matching for one caller-supplied explicit `DocumentAclPermission` under one resolved RequestContext. It preserves persisted ALLOW/DENY and optional `validUntil`.
- DD-558…DD-562 own one explicit trusted `currentTimeIso` floor, expiry/currentness partition, and DD-08's explicit-DENY-wins reducer for already-matched ACL rows. The result is ACL-layer effect evidence only, not final access authorization.
- DD-08 §8 says a derivative cannot widen ACL, but the repository still does **not** define complete parent-child ACL comparison/inheritance semantics, including how explicit ACL interacts with source-resource inheritance, how subject universes are compared globally, or a canonical broader/equal/narrower reducer.
- Therefore DD-08's non-widening statement cannot yet be promoted into a final parent-child ACL verdict without inventing policy.
- The existing DD-562 expiry/effect implementation is currently embedded in one access reader. A pure helper may be extracted only if existing DD-558…DD-562 behavior and tests remain unchanged.

**SOURCE-COMPLETE:** extend exact DD-587 paired raw ACL evidence by applying the already-governed DD-085 subject-match semantics independently to derivative and parent for the **same exact supplied RequestContext and explicit ACL permission**, then apply the already-governed DD-558…DD-561 currentness/effect semantics independently to each matched set using the **same exact trusted currentTimeIso**. Preserve both sides as evidence only. Do not compare the two effect results or claim ACL non-widening.

## Frozen decisions

**DD-588 — exact DD-587 parent evidence first.** Add `loadDocumentDerivativeParentAclCurrentEffectEvidence(...)`. Invoke DD-587 once with exact RequestContext, derivativeDocumentId, parentDocumentId and unchanged dependencies. Parent null remains null; dependency errors propagate unchanged. No subject/effect interpretation occurs before DD-587 success.

**DD-589 — one exact explicit permission applied independently to both raw ACL sets.** Use the existing DD-085 `DocumentAclSubjectMatcher` with the exact supplied RequestContext and the same exact caller-supplied `DocumentAclPermission`. Match derivative rows against the persisted derivative id and parent rows against the persisted parent id. Preserve DD-085 validation/errors unchanged. Do not infer permission from route, OperationContract, derivative type, source resource or storage metadata.

**DD-590 — one exact trusted current instant applied independently to both matched sets.** Use the same supplied `currentTimeIso` for derivative and parent. No wall-clock read is permitted. Extract/reuse one pure DD-558…DD-561 helper if needed so existing DD-562 and this paired path share identical parsing/currentness/DENY precedence semantics.

**DD-591 — immutable paired current/effect evidence without cross-side comparison.** Preserve exact DD-587 parent/raw arrays, the exact matcher-returned derivative/parent matched arrays, and independently derived frozen current/expired arrays plus `ALLOW | DENY | NONE` evidence for each side. Do not merge, inherit, intersect, subtract, normalize subjects or compare derivative versus parent.

**DD-592 — paired effects are not derivative ACL non-widening or final authorization.** Do not expose broader/equal/narrower, compliant/non-compliant or non-widening verdicts. Do not choose explicit ACL versus source-resource inheritance, map OperationContract→ACL permission, evaluate RBAC/ABAC/entitlement/commercial/sensitivity/residency/step-up, sign/grant/download/share/delete, dispatch StoragePort, mutate DocumentMeta/document_acl or emit events.

## Fixed acceptance before implementation

- **DOC-DERIVEFFECT-BASE-001** exact DD-587 parent evidence executes first; only after success do subject/current-effect operations begin.
- **DOC-DERIVEFFECT-BASE-002** DD-587 null/error short-circuits or propagates before matcher/effect interpretation.
- **DOC-DERIVEFFECT-MATCH-001** derivative then parent matching use the same exact RequestContext and explicit ACL permission with exact persisted side document ids.
- **DOC-DERIVEFFECT-MATCH-002** DD-085 validation/malformed/cross-document errors propagate unchanged; no alternate permission/source/fallback is attempted.
- **DOC-DERIVEFFECT-TIME-001** derivative and parent use the same exact trusted currentTimeIso and DD-558…DD-561 current/expired boundary semantics.
- **DOC-DERIVEFFECT-EFFECT-001** each side independently applies current-entry explicit-DENY-wins, then ALLOW, else NONE; neither side influences the other's reducer.
- **DOC-DERIVEFFECT-EFFECT-002** malformed currentTimeIso or matched validUntil evidence fails closed under the shared DD-558…DD-561 helper with no wall-clock fallback.
- **DOC-DERIVEFFECT-EVID-001** success preserves exact DD-587 parent/raw ACL references plus immutable branch-specific matched/current/expired/effect evidence without mutating inputs.
- **DOC-DERIVEFFECT-BOUND-001** output exposes no derivative-vs-parent ACL comparison/non-widening verdict, source-resource fallback, final authorization, signing/storage dispatch, mutation or event authority.

Expected executable delta: Core **1491 → 1500**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 SQL verification files**. Web remains unchanged.

## Explicit exclusions / unresolved source requirements

No schema, migration, SQL verification, role, grant, RLS policy, route, signer, provider SDK, frontend, worker, scheduler or RawSource change.

This batch does **not**:
- define the derivative-parent ACL non-widening algorithm;
- decide whether derivative ACL is broader/equal/narrower than parent ACL;
- compare ACL subject universes across principals, roles or OrgUnits;
- define inheritance/copy/merge/reduction behavior;
- choose explicit ACL versus source-resource authorization;
- map an operation to a Document ACL permission;
- establish final access authorization or signed access;
- dispatch StoragePort, mutate DocumentMeta/document_acl or emit events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-588…DD-592 and the fixed acceptances above.
