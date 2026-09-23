# OperatorElevation verified PLATFORM_OPERATOR identity floor prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-OPERATOR-ELEVATION-SUBJECT-TARGET-FLOOR-001`  
**Verified synchronized basis:** `c4004ebe3dcc424a74db8a34ab9d9cfc3743dc20` / tree `c4bd2791812a4059cea9cbab3829c909bc1983f5`  
**Scope:** next bounded OperatorElevation runtime prerequisite after DD-149.

## Source reconciliation

DD-03 and the current Identity contracts establish:

- `PLATFORM_OPERATOR` is a first-class principal type;
- `IdentityPort.verifyHumanSession(...)` returns `VerifiedIdentityEvidence`;
- Platform Operators do not receive persistent Tenant roles and instead use
  DD-05 time-bounded elevation;
- Platform Operators cannot substitute API credentials for interactive platform
  identity/elevation;
- `VerifiedMachineEvidence` can represent only `API_CLIENT | SERVICE`, not
  `PLATFORM_OPERATOR`;
- the current Clerk human-session adapter accepts only directory principal types
  `HUMAN | PLATFORM_OPERATOR` after provider token/session verification.

DD-146 exposes persisted `operatorPrincipalId`. DD-149 separately owns the raw
subject/Tenant/optional-Industry target binding floor.

## Determination

One narrow verified-identity prerequisite is source-complete:

> Given already-loaded OperatorElevation metadata plus IdentityPort-produced
> `VerifiedIdentityEvidence`, determine only whether the evidence represents
> the exact persisted interactive PLATFORM_OPERATOR principal.

This is a necessary identity floor only. It does not prove current elevation
time, target, permissions, approval/purpose policy, step-up/MFA policy or final
authorization.

## Authorized DD-150 boundary

Implement only deterministic Core helper:

`matchesOperatorElevationVerifiedPlatformOperatorFloor(metadata,evidence)`.

It must:

1. require `evidence.principalType === 'PLATFORM_OPERATOR'`;
2. require valid UUID shape for persisted `operatorPrincipalId` and verified
   `evidence.principalId`;
3. require exact persisted/evidence principal-id equality;
4. not treat HUMAN, API_CLIENT or SERVICE evidence as an operator elevation
   identity even if the id matches;
5. not inspect/interpret authStrength, sessionVersion, deviceId or provider
   metadata as elevation policy;
6. not inspect Tenant/Industry/time/status/purpose/approval/profile fields;
7. not mutate metadata/evidence.

## Acceptance target

- **OPELEV-ID-001** — exact verified PLATFORM_OPERATOR principal matches.
- **OPELEV-ID-002** — HUMAN with the same principal id fails.
- **OPELEV-ID-003** — API_CLIENT/SERVICE-shaped principal types fail.
- **OPELEV-ID-004** — different PLATFORM_OPERATOR principal id fails.
- **OPELEV-ID-005** — malformed persisted or evidence principal UUID fails closed.
- **OPELEV-ID-006** — auth strength/session/device/provider metadata does not strengthen or weaken this floor.
- **OPELEV-ID-007** — Tenant/Industry/time/status/purpose/approval/profile fields are ignored and inputs remain unchanged.

Expected Core suite delta: +7, from 325 to 332. PostgreSQL remains 469.

## Explicitly unclaimed

DD-150 does **not**:

- select/load/trust an elevation id;
- call an Identity provider or verify a raw session token itself;
- require or decide MFA/step-up policy;
- evaluate DD-148 time/status floor;
- evaluate DD-149 Tenant/Industry target floor on the caller's behalf;
- interpret `permission_profile_id`;
- decide approval/purpose/ticket policy;
- set `app.operator_elevation_id`;
- modify RequestContext/RequestScopedSql;
- grant access or return AuthorizationDecision;
- emit mandatory elevation-use audit;
- mutate elevation state;
- change migrations/RLS/roles/grants/product policy.

## Next dependency boundary

After DD-148/DD-149/DD-150, request-time elevation still requires trusted
elevation-id selection, composition of the independent necessary floors,
permission-profile evaluation, approval/purpose policy, immutable RequestContext
integration, transaction-local SQL elevation setting and mandatory audit.
