# Document access candidate + physical StorageObject binding evidence reader composition batch prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-DOCUMENT-ACCESS-ACL-SUBJECT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `6d57e7b1bbd4c390f843cc5123f85dabecfbc13e`  
**Verified entry tree:** `4135dffc1f0c7d5bc9801b51bc20d2ac2af3fc16`  
**Governed batch:** DD-543 through DD-547

## Entry gate

DD-538…DD-542 canonical promotion and state closure are exact-head verified:
- Core Service Verify push run `37312179642` / job `111770013035`: **1420/1420 PASS**, zero failed/skipped.
- PostgreSQL same run / job `111770012499`: **536/536 PASS**, zero failed/skipped; full database bootstrap PASS.
- Database Verify push run `37312179665` / job `111770012244`: PASS with **48 migrations / 42 SQL verification files**.
- Web Boundary Verify push run `37312179914` / job `111770012988`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource remains unchanged; `main` remains unmerged.

## Source reconciliation

Fresh reconciliation of DD-08 §§5/12–17, DD-082, DD-083, DD-086, DD-17 `DOC-STO-PG-001…007`, the existing `DocumentAccessCandidateService`, `PostgresDocumentStorageBindingStore`, the dedicated `PostgresDocumentDatabase` role boundary and the DD-086 PostgreSQL acceptance coverage establishes one independent source-complete composition:

- DD-082 owns exact resolved Tenant context + exact document id + RLS-visible metadata + ACTIVE/CLEAN pre-sign candidate evidence;
- the candidate already carries the exact linked `storageObjectId`;
- DD-086 owns the only physical locator read and forbids arbitrary StorageObject lookup;
- DD-086 requires the exact candidate document id + storageObjectId, current RequestContext Data Home, RLS-visible DocumentMeta linkage, ACTIVE/CLEAN DocumentMeta, ACTIVE StorageObject and current exact size/checksum parity;
- `DOC-STO-PG-001…007` are already implemented and verified inside `tests/postgres/document-access-metadata-store.test.mjs`;
- physical binding output is server-internal evidence only and is explicitly non-authoritative for access.

No new database rule, permission mapping or storage policy is needed to sequence DD-082 → DD-086.

## Determination

**SOURCE-COMPLETE for one candidate-first Document access + exact physical StorageObject binding evidence reader only.**

Success proves only:
1. DD-082 produced one exact ACTIVE+CLEAN pre-sign candidate under the supplied RequestContext;
2. DD-086 returned one exact currently valid physical binding through the candidate's exact document/storage-object linkage and current Data Home;
3. the exact candidate and binding references are preserved as immutable internal evidence.

Success is **not** Document authorization and is **not** signing authority.

## Locked DD-543…DD-547 contracts

### DD-543 — Establish exact DD-082 candidate first

Add `loadDocumentAccessStorageBindingEvidence(...)`.

Its first governed action must call `DocumentAccessCandidateService.prepare` with:
- exact supplied RequestContext;
- exact supplied document id;
- exact supplied metadata reader.

Candidate errors propagate unchanged. The physical binding reader must not be invoked when DD-082 fails.

### DD-544 — Read DD-086 binding with exact candidate linkage only

After DD-082 succeeds, call the physical binding reader exactly once using:
- exact supplied RequestContext;
- `documentId === candidate.documentId`;
- `storageObjectId === candidate.storageObjectId`.

Do not accept a caller-supplied StorageObject id and do not substitute sourceResourceId, provider reference, object key or any other identifier.

### DD-545 — Preserve binding null/errors without fallback

If DD-086 returns null, return null. Do not retry, search by object id/key, choose another Data Home/provider, resolve a sibling object, or synthesize an authorization/storage error.

If the DD-086 dependency throws, propagate that exact error unchanged.

### DD-546 — Immutable exact-reference evidence

Success returns frozen evidence containing:
- exact DD-082 `candidate` reference;
- exact DD-086 `binding` reference.

Do not clone, decrypt, normalize or mutate provider reference, bucket class, key/version, size/checksum or encryption-key evidence.

### DD-547 — Stop before authorization, provider selection and signing

Do not:
- evaluate ACL effect/expiry/DENY precedence;
- infer operation→ACL permission;
- evaluate permission/entitlement/RBAC/ABAC/sensitivity/step-up/residency exceptions;
- decrypt `providerRefEncrypted`;
- choose a provider or bucket;
- create a signed URL/token/grant or TTL;
- expose download/share/delete route authority;
- dispatch StoragePort get/head/delete;
- mutate DocumentMeta/StorageObject/ACL state.

The result is internal evidence only.

## Fixed acceptance before implementation

- **DOC-STOEVID-BASE-001** exact DD-082 candidate executes first with exact RequestContext/document id/metadata dependency.
- **DOC-STOEVID-BASE-002** DD-082 governed error propagates unchanged and physical binding reader is not invoked.
- **DOC-STOEVID-READ-001** candidate success causes exactly one binding read using exact RequestContext + candidate document id + candidate storageObjectId.
- **DOC-STOEVID-READ-002** binding dependency error propagates unchanged with no retry/search/fallback.
- **DOC-STOEVID-NULL-001** DD-086 null returns null without arbitrary object/key/provider/Data Home fallback.
- **DOC-STOEVID-EVID-001** success returns frozen evidence preserving exact candidate and binding references unchanged.
- **DOC-STOEVID-EVID-002** private locator/integrity fields remain raw exact evidence; provider reference is not decrypted and no field is normalized into policy.
- **DOC-STOEVID-BOUND-001** output exposes no authorized/denied/ACL-effective/signed/provider-selected/download/share/delete/dispatch/mutation authority.

Expected executable delta: Core **1420 → 1428**. PostgreSQL remains **536/536**. Database inventory remains **48 migrations / 42 SQL verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, public route, signer, provider SDK, secret, frontend or product-policy change.

This batch does **not** implement final Document authorization, ACL effectiveness, source-resource fallback, retention/delete policy, StoragePort execution, provider selection, signed grants, public sharing or transport exposure.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-543…DD-547 and the fixed acceptances above.
