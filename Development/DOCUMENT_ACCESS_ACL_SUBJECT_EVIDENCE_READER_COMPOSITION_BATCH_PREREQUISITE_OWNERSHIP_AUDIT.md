# Document access candidate + ACL subject evidence reader composition batch prerequisite ownership audit

**Date:** 2026-10-05  
**Baseline checkpoint:** `DEV-WEBHOOK-DELIVERY-EVENT-PAYLOAD-VALIDATED-READER-001`  
**Verified entry HEAD:** `eeb911f0ef0b4bd67ba4d854f6f5ed6b1c3af25a`  
**Verified entry tree:** `97396aebc4035a38de9601c8be603db2ec2446c6`  
**Governed batch:** DD-538 through DD-542

## Entry gate

DD-533…DD-537 canonical promotion and state closure are exact-head verified:
- Core Service Verify `37292700698` / job `111706617236`: **1411/1411 PASS**, zero failed/skipped.
- PostgreSQL same run / job `111706617605`: **536/536 PASS**, zero failed/skipped; full database bootstrap PASS.
- Database Verify `37292700651` / job `111706619030`: PASS with **48 migrations / 42 SQL verification files**.
- Web Boundary Verify `37292700477` / job `111706617132`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. RawSource remains unchanged; `main` remains unmerged.

## Post-DD537 boundary selection

Fresh reconciliation of the current Webhook line confirms there is no source-complete next execution seam after DD-537. Event-filter grammar/evaluation, endpoint verification/DNS/IP/redirect SSRF mechanics, signing canonicalization/secret runtime, Outbox claim/readiness, retry/DLQ/replay policy, EXPLICIT_CROSS_CONTEXT authorization and network dispatch remain deliberately unowned or symbolic.

Therefore no DD-538 Webhook dispatcher/filter/signer/retry/network implementation is authorized.

A fresh independent Core scan identifies one source-complete unfinished Document evidence composition from already-promoted DD-082/DD-084/DD-085 contracts:
- `DocumentAccessCandidateService.prepare(...)` owns resolved Tenant context, exact document id, RLS-bound metadata dependency, ACTIVE+CLEAN pre-access state and immutable pre-sign candidate evidence;
- `DocumentAclReadPort.loadForDocument(...)` owns exact raw ACL evidence for one visible Document under the same RequestContext;
- `DocumentAclSubjectMatcher.match(...)` owns exact PRINCIPAL/ROLE/ORG_UNIT subject matching for one caller-supplied explicit Document ACL permission while preserving raw `effect` and `validUntil`;
- DD-085 explicitly states that operation→ACL permission mapping, expiry effectiveness, DENY precedence/reducer result, source-resource fallback, final authorization, step-up/residency/sensitivity composition and signed-grant generation are not source-owned.

No new persistence source, policy grammar or product rule is required to sequence these three already-governed boundaries.

## Determination

**SOURCE-COMPLETE for one parent-first Document access candidate + raw ACL + subject-match evidence reader only.**

A successful result proves only:
1. DD-082 produced one ACTIVE+CLEAN pre-sign candidate for the exact resolved RequestContext/document id;
2. raw DD-084 ACL evidence was loaded only after that candidate succeeded;
3. DD-085 matched entries for one explicit caller-supplied ACL permission against the resolved principal/roles/OrgUnit path.

Success is **not** Document authorization and an empty/non-empty matched set is not ALLOW/DENY.

## Locked DD-538…DD-542 contracts

### DD-538 — Establish exact DD-082 access candidate first

Add `loadDocumentAccessAclSubjectEvidence(...)`.

Its first governed action is to invoke `DocumentAccessCandidateService.prepare` with the exact supplied RequestContext and document id using the exact supplied metadata port.

If DD-082 throws one of its governed candidate errors, propagate that exact error unchanged and do not call the ACL reader.

### DD-539 — Read exact raw ACL evidence only after candidate success

After DD-082 success, invoke `DocumentAclReadPort.loadForDocument` exactly once with:
- the exact supplied RequestContext;
- `documentId === candidate.documentId`.

Do not substitute sourceResourceId, storageObjectId or any other identifier.

ACL dependency/persistence errors propagate unchanged. Do not retry, search, fallback or normalize them into authorization outcomes.

### DD-540 — Apply DD-085 subject matching for one explicit permission

Invoke only `DocumentAclSubjectMatcher.match` with:
- exact supplied RequestContext;
- exact candidate document id;
- exact caller-supplied `DocumentAclPermission`;
- exact raw ACL evidence set returned by DD-084.

The explicit permission is input evidence only. Do not infer it from an OperationContract, route, source resource, media type or sensitivity.

Preserve DD-085 errors unchanged.

### DD-541 — Immutable evidence-only result

On success return frozen evidence containing:
- the exact DD-082 `candidate` reference;
- the exact raw ACL evidence array reference from DD-084;
- the exact immutable matched-entry array returned by DD-085;
- the exact explicit permission value.

An empty matched-entry array is a valid evidence result and must not be converted to null/deny. Non-empty matched entries must not be reduced to allow/deny.

Inputs/raw entries/candidate must remain unchanged.

### DD-542 — Stop before ACL effectiveness, authorization and signing

Do not interpret:
- `DocumentAclEntry.effect`;
- `validUntil`;
- DENY precedence;
- source-resource fallback;
- owner fallback;
- OperationContract→ACL permission mapping;
- sensitivity/step-up/residency policy;
- entitlement/RBAC/ABAC authorization;
- storage binding/signing/TTL/provider selection;
- download/share/delete operation authority.

Do not call GuardPipeline/AuthorizationDecisionService, StoragePort, signer/provider, route/transport or mutation code.

## Fixed acceptance before implementation

- **DOC-ACLEVID-BASE-001** exact DD-082 candidate executes first with exact RequestContext/document id/metadata dependency.
- **DOC-ACLEVID-BASE-002** DD-082 governed error propagates unchanged and ACL reader/matcher are not invoked.
- **DOC-ACLEVID-READ-001** candidate success causes exactly one DD-084 ACL read using exact RequestContext + candidate document id.
- **DOC-ACLEVID-READ-002** ACL dependency error propagates unchanged with no retry/search/fallback or authorization synthesis.
- **DOC-ACLEVID-MATCH-001** exact caller-supplied permission and raw ACL array are delegated to DD-085 once; PRINCIPAL/ROLE/ORG_UNIT matching semantics remain DD-085-owned.
- **DOC-ACLEVID-MATCH-002** DD-085 malformed/context/cross-document errors propagate unchanged.
- **DOC-ACLEVID-EVID-001** empty matched set succeeds as immutable evidence and preserves exact candidate/raw ACL references without deny synthesis.
- **DOC-ACLEVID-EVID-002** non-empty matched evidence preserves raw ALLOW/DENY + validUntil facts and exact input ordering without reducer/effectiveness interpretation.
- **DOC-ACLEVID-BOUND-001** output exposes no authorized/denied/effective/expired/step-up/signed/download/share/delete/dispatch/mutation authority.

Expected executable delta: Core **1411 → 1420**. PostgreSQL remains **536/536**. Database inventory remains **48 migrations / 42 SQL verification files**. Web remains unchanged.

## Explicit exclusions

No schema, migration, SQL verification, RLS, role, grant, public route, storage-provider/signer, secret, frontend or product-policy change.

This batch does **not**:
- define operation→Document ACL permission mapping;
- interpret ACL expiry or effect precedence;
- implement final Document ACL/resource authorization;
- evaluate permission/entitlement/ABAC/sensitivity/step-up policy;
- resolve source-resource fallback;
- load physical StorageObject evidence;
- create signed URL/token/grant or TTL;
- expose a download/share/delete route;
- mutate Document/ACL/Storage rows;
- implement public/anonymous sharing.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-538…DD-542 and the fixed acceptances above.
