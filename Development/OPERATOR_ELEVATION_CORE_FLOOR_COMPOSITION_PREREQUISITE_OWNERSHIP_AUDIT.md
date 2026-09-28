# OperatorElevation core necessary-floor composition prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-OPERATOR-ELEVATION-SELECTED-ID-FLOOR-001`  
**Verified synchronized basis:** `3058a1ccd45d3ee500d0ca2de27acf6c5c5c5c98` / tree `d05cf88e6a1eff024738dfb50dfae402ad4ae18f`  
**Scope:** next bounded OperatorElevation runtime prerequisite after DD-151.

## Source reconciliation

The repository now owns four independently verified necessary floors:

- DD-148: migration-0029 current ACTIVE/time-window floor;
- DD-149: migration-0029 operator/Tenant/optional-Industry binding floor;
- DD-150: DD-03 verified interactive PLATFORM_OPERATOR identity floor;
- DD-151: migration-0029 exact selected elevation-id equality floor.

Migration 0029 requires the selected-id, subject/target and ACTIVE/time predicates
together for ordinary application row visibility. DD-03 separately requires
interactive PLATFORM_OPERATOR identity rather than persistent Tenant-role or
machine-credential substitution.

The source still does not identify a complete trusted transport/control-plane
flow that chooses the selected elevation id and makes it authoritative. That
selection trust must remain outside this slice.

## Determination

One pure deterministic prerequisite is source-complete:

> Given already-loaded OperatorElevation metadata, an already server-owned
> selected elevation id, IdentityPort-produced verified human evidence, trusted
> server-owned operator/Tenant/optional-Industry identifiers, and an explicit
> server-owned evaluation instant, determine only whether DD-148, DD-149,
> DD-150 and DD-151 all match.

This remains a set of necessary floors, not final elevation authorization.

## Authorized DD-152 boundary

Implement only deterministic Core helper:

`matchesOperatorElevationCoreNecessaryFloors(metadata,input)`.

Input owns:

- `selectedElevationId`;
- `verifiedIdentity`;
- `subjectTarget`;
- `evaluatedAt`.

The helper must:

1. compose DD-151 selected-id equality;
2. compose DD-150 verified PLATFORM_OPERATOR identity;
3. compose DD-149 subject/target binding;
4. compose DD-148 current ACTIVE/time-window floor;
5. return true only when all four return true;
6. remain side-effect free and mutate no input.

## Acceptance target

- **OPELEV-CORE-001** — all four floors true -> true.
- **OPELEV-CORE-002** — selected-id floor false -> false.
- **OPELEV-CORE-003** — verified PLATFORM_OPERATOR floor false -> false.
- **OPELEV-CORE-004** — subject/target floor false -> false.
- **OPELEV-CORE-005** — status/time floor false -> false.
- **OPELEV-CORE-006** — multiple malformed/failed floors remain false with no fallback.
- **OPELEV-CORE-007** — permission profile, approval/purpose/ticket, step-up/session extras and other unrelated fields remain uninterpreted; inputs are not mutated.

Expected Core suite delta: +7, from 339 to 346. PostgreSQL remains 469.

## Explicitly unclaimed

DD-152 does **not**:

- choose/discover/mint/trust the selected elevation id;
- accept client-selected ids as authoritative;
- load an elevation row;
- call IdentityPort or verify a raw session itself;
- decide MFA/step-up policy;
- interpret `permission_profile_id`;
- decide approval/purpose/ticket policy;
- construct final effective permissions or AuthorizationDecision;
- set `app.operator_elevation_id`;
- modify RequestContext/RequestScopedSql;
- grant Tenant/Industry access;
- emit mandatory elevation-use audit;
- mutate elevation state;
- change migrations/RLS/roles/grants/product policy.

## Next dependency boundary

After DD-152, request-time elevation remains blocked on source-owned trusted
selection, step-up/profile/approval policy, effective-permission evaluation,
immutable RequestContext integration, transaction-local SQL elevation-id
injection and mandatory audit.
