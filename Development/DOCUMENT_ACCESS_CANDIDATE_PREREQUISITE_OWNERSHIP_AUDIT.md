# Document access candidate prerequisite ownership audit

**Date:** 2026-09-21  
**Baseline:** `57d4ac3d1a95d80bd9026e629cbd3017a9e0728b`  
**Scope:** next independent source-complete work after `DEV-EVENT-ENVELOPE-001`.

## Source reconciliation

DD-08 §§1–6/10–12, DD-16 §§2/14/18/20, DD-17 DOC-002/003/005/006 and
P2-STO-001/003, migrations 0006/0028/0030/0031 and the current RequestContext /
GuardPipeline contracts were read against the current executable source.

| Concern | Existing owner | Current determination |
|---|---|---|
| Metadata authority | DD-08 §§1–2 | DocumentMeta is the authorization owner; storage keys are never authority |
| Physical isolation | migration 0006 | DocumentMeta is FORCE-RLS by Tenant + optional exact Industry Context |
| Service identity | migration 0028 | `sbg_document_service_rw` is the dedicated NOBYPASSRLS Document service role |
| Safe download state | DD-08 §§1/5/11 | only ACTIVE + CLEAN metadata may progress toward signed access |
| Source/context checks | DD-08 §5; DD-16 §5 | RequestContext resolves before metadata; wrong Tenant/Industry must fail without storage-key bypass |
| Authorization | DD-08 §§5–6; DD-03 | ACL, permission, entitlement, sensitivity, residency and optional step-up remain the existing authorization/policy chain |
| Signing | DD-08 §§5/12 | one-object short-lived signed access is required, but concrete TTL/provider signing configuration is not fixed here |
| External sharing | DD-08 §10 | anonymous/public sharing is disabled; no public object ACL or ShareGrant exists |

## Determination

The **pre-sign Document access candidate boundary** is source-complete. It may:

1. accept only a resolved Tenant RequestContext and a server-owned document id;
2. load DocumentMeta through an injected RLS-bound metadata port;
3. fail closed when metadata is missing, foreign, wrong-Industry, non-ACTIVE or non-CLEAN;
4. emit an immutable internal candidate containing only the metadata needed by the
   existing authorization chain and a later StoragePort signer;
5. keep storage object identifiers internal and never emit an external URL/token,
   provider reference, object key or credential.

This closes the metadata/state floor required before DD-03/DD-04/document policy
checks. It **does not itself authorize download**.

## Deliberately unresolved / excluded

A complete signed-download operation is not source-complete at this checkpoint because
the repository does not yet bind an exact public OperationContract/permission code,
the policy-specific step-up decision for each sensitivity class, a concrete signed
grant TTL/configuration value, or provider signer composition.

Therefore this slice must not invent:

- a signed URL/token, TTL, bucket/provider, object key, credential or public route;
- a new Document permission code or entitlement;
- ACL allow/deny evaluation outside the existing Authorization/resource-rule chain;
- sensitivity-to-step-up or residency exceptions;
- public/anonymous sharing.

## Authorized implementation boundary

Implement a reusable Core `DocumentAccessCandidateService` with an injected
metadata reader. It validates resolved Tenant/Industry ownership and ACTIVE/CLEAN
state, then returns an immutable internal candidate carrying document id,
storage-object id, source resource identity, owner, sensitivity, residency, media
type and safe display filename for later governed authorization/signing.

Unknown reader failures normalize to a safe dependency error. No SQL, role,
privilege, RLS policy, route, signer or storage provider change is authorized.

Acceptance: DOC-PRE-001…006. Full DD-08 signed access remains a later source-audited
composition after its missing bindings are owned.
