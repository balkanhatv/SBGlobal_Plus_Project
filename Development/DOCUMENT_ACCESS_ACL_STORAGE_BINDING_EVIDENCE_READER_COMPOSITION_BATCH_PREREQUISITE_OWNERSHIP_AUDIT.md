# Document ACL-subject + physical StorageObject binding evidence reader composition batch prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-DOCUMENT-ACCESS-STORAGE-BINDING-EVIDENCE-READER-001`  
**Verified entry HEAD:** `0a30200f17b56426219209ea5877582200e8dd89`  
**Verified entry tree:** `2bc32f23878df2edffa792165949355a60783f96`  
**Governed batch:** DD-548 through DD-552

## Entry gate

DD-543…DD-547 canonical promotion and state closure are exact-head verified:
- Core Service Verify push run `37340561240` / job `111866268365`: **1428/1428 PASS**, zero failed/skipped.
- PostgreSQL same run / job `111866268961`: **536/536 PASS**, zero failed/skipped; full database bootstrap PASS.
- Database Verify push run `37340561016` / job `111866267881`: PASS with **48 migrations / 42 SQL verification files**.
- Web Boundary Verify push run `37340560809` / job `111866270387`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource remains unchanged; `main` remains unmerged.

## Source reconciliation

Fresh reconciliation of DD-082, DD-084, DD-085, DD-086, DD-538…DD-547 and the current implementations establishes one independent source-complete composition:

- DD-542 already owns exact DD-082 candidate-first evidence, exact raw DD-084 ACL evidence and exact DD-085 subject-match evidence for one explicit caller-supplied DocumentAclPermission;
- DD-542 preserves the exact immutable candidate reference, including exact documentId + storageObjectId;
- DD-086 owns the exact physical binding read through RLS-visible DocumentMeta linkage and current RequestContext Data Home;
- DD-547 already proves that the physical binding is internal evidence only and carries no authorization/signing/provider-selection authority;
- therefore a new composition can reuse exact DD-542 parent evidence and extend it with one exact DD-086 binding read using the already-preserved candidate linkage, with **zero duplicate candidate/metadata read**.

No new ACL effect/expiry rule, permission mapping, persistence source, provider policy, signing policy or product rule is needed.

## Determination

**SOURCE-COMPLETE for one exact DD-542 ACL-subject parent + DD-086 physical StorageObject binding evidence reader only.**

Success proves only:
1. exact DD-542 candidate/raw-ACL/subject-match evidence already exists for the supplied RequestContext/document/explicit permission;
2. one exact DD-086 physical binding exists for the same preserved candidate linkage and current Data Home;
3. exact parent and binding references are preserved as immutable internal evidence.

Success is **not** Document authorization, ACL effectiveness, provider selection or signing authority.

## Locked DD-548…DD-552 contracts

### DD-548 — Establish exact DD-542 parent evidence first

Add `loadDocumentAccessAclStorageBindingEvidence(...)`.

Its first governed action must invoke `loadDocumentAccessAclSubjectEvidence(...)` with:
- exact supplied RequestContext;
- exact supplied document id;
- exact explicit caller-supplied DocumentAclPermission;
- exact supplied metadata/ACL/matcher dependencies.

Parent errors propagate unchanged. The physical binding reader must not be invoked after parent failure.

### DD-549 — Read DD-086 binding from exact preserved candidate linkage

After DD-542 succeeds, invoke the physical binding reader exactly once with:
- exact supplied RequestContext;
- `documentId === parent.candidate.documentId`;
- `storageObjectId === parent.candidate.storageObjectId`.

Do not rerun DD-082 and do not accept/substitute any caller-supplied StorageObject id, sourceResourceId, provider reference, object key or alternate locator.

### DD-550 — Preserve binding null/errors without fallback

If DD-086 returns null, return null. Do not retry/search by object id/key, choose another provider/Data Home, use source/owner fallback or synthesize an authorization/storage decision.

If DD-086 throws, propagate the exact error unchanged.

### DD-551 — Immutable combined exact-reference evidence

Success returns frozen `{ parent, binding }` preserving:
- exact DD-542 parent reference;
- exact DD-086 binding reference.

Do not clone/normalize/reduce raw ACL entries, matched ACL entries, explicit permission, provider ciphertext, bucket/key/version, size/checksum or encryption-key evidence. An empty matched ACL set remains valid evidence and is not converted to deny/null.

### DD-552 — Stop before ACL effectiveness, final authorization, provider selection and signing

Do not:
- interpret ACL effect/validUntil or DENY precedence;
- infer operation→ACL permission or source/owner fallback;
- evaluate entitlement/RBAC/ABAC/sensitivity/step-up/residency-exception policy;
- decrypt providerRefEncrypted or choose provider/bucket;
- create signed URL/token/grant/TTL;
- expose download/share/delete authority;
- dispatch StoragePort operations;
- mutate DocumentMeta/StorageObject/ACL state.

The result is internal evidence only.

## Fixed acceptance before implementation

- **DOC-ACLSTO-BASE-001** exact DD-542 parent executes first with exact RequestContext/document/permission and exact dependencies.
- **DOC-ACLSTO-BASE-002** DD-542 error propagates unchanged and physical binding reader is not invoked.
- **DOC-ACLSTO-READ-001** parent success causes exactly one DD-086 binding read using exact RequestContext + parent.candidate documentId/storageObjectId with no duplicate candidate read.
- **DOC-ACLSTO-READ-002** binding dependency error propagates unchanged with no retry/search/fallback.
- **DOC-ACLSTO-NULL-001** DD-086 null returns null without authorization synthesis or alternate locator/provider/Data Home fallback.
- **DOC-ACLSTO-EVID-001** success returns frozen evidence preserving exact DD-542 parent and exact DD-086 binding references.
- **DOC-ACLSTO-EVID-002** empty/non-empty ACL subject evidence plus raw physical locator/integrity facts remain unchanged and uninterpreted.
- **DOC-ACLSTO-BOUND-001** output exposes no effective/authorized/denied/signed/provider-selected/download/share/delete/dispatch/mutation authority.

Expected executable delta: Core **1428 → 1436**. PostgreSQL remains **536/536**. Database inventory remains **48 migrations / 42 SQL verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, public route, signer, provider SDK, secret, frontend or product-policy change.

This batch does **not** define ACL effectiveness, operation→ACL permission mapping, source/owner fallback, final Document authorization, sensitivity/step-up/residency policy, provider selection, signed access, public sharing, StoragePort execution or mutation.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-548…DD-552 and the fixed acceptances above.
