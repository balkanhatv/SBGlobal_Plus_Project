# Document ACL subject-match prerequisite ownership audit

**Date:** 2026-09-21  
**Baseline:** `99c725e163d17f228bc4f43b22fda2f1a4887299`  
**Scope:** next independent Core slice after DD-084 raw ACL persistence.

## Source reconciliation

DD-08 §6, DD-03 RequestContext/resource authorization, DD-084, migration 0006 ACL
grammar and the concrete RequestContext resolver were reconciled.

The repository owns these exact subject identities:

- PRINCIPAL ACL subject id compares to resolved `RequestContext.principalId`;
- ROLE ACL subject id compares to resolved `RequestContext.roleIds`;
- ORG_UNIT ACL subject id compares to resolved `RequestContext.orgUnitPath`;
- the PostgreSQL TenantContext adapter builds `orgUnitPath` from the selected
  OrgUnit plus its ancestor OrgUnit UUIDs, not client text selectors;
- ACL permission values are already exact persisted enum values
  `VIEW | DOWNLOAD | SHARE | DELETE_VERSION`.

## Determination

A pure Core **subject-match evidence** layer is source-complete.

It may accept one explicit Document ACL permission chosen by a later governed
operation mapping, the already-resolved RequestContext, one document id and raw
DD-084 entries, then return only entries whose document/permission and subject match
the resolved context.

This layer is **not an authorization evaluator**.

## Deliberately unresolved / excluded

The current source still does not own all semantics needed for final ACL
authorization:

- exact operation → Document ACL permission mapping;
- whether/how source-resource authorization falls back when no explicit ALLOW exists;
- exact `valid_until` boundary semantics for every policy decision;
- final effectiveness filtering, DENY precedence/reducer result and audit reason;
- step-up/residency/sensitivity composition;
- signed-grant TTL/provider generation.

Therefore DD-085 must preserve `effect` and `validUntil` on matched evidence and
must not interpret either one.

## Authorized implementation boundary

Implement a reusable Core matcher that:

1. accepts Tenant Core / Tenant Industry resolved RequestContext only;
2. validates document id and explicit ACL permission;
3. requires every supplied raw ACL entry to belong to that document;
4. matches PRINCIPAL against principalId;
5. matches ROLE against roleIds;
6. matches ORG_UNIT against orgUnitPath (which includes current unit and ancestors);
7. returns immutable matching entries in input order without filtering expiry or
   reducing ALLOW/DENY;
8. fails closed on malformed context or cross-document evidence.

No SQL, permission catalog, operation mapping, authorization decision, signer or
route is authorized.

Acceptance: DOC-ACL-MATCH-001…006.
