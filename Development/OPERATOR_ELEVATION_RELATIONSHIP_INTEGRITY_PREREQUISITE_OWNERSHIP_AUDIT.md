# OperatorElevation persisted relationship-integrity prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-OPERATOR-ELEVATION-RLS-PARITY-001`  
**Verified synchronized basis:** `5ad64ffeb1090728c2567517bc3b121d0260cfa8` / tree `5236449cf252207d7c31de16fcf9e27d85387daa`  
**Scope:** next bounded database-integrity acceptance after DD-153.

## Source reconciliation

Migration 0031 owns `core_authz.validate_operator_elevation()` and the
`operator_elevation_relationship_integrity` BEFORE INSERT/UPDATE trigger.

The trigger requires:

- every persisted elevation operator principal to exist as an ACTIVE
  `PLATFORM_OPERATOR`;
- every `status='ACTIVE'` elevation to carry `approved_by`;
- the approver to differ from the operator principal;
- the approver to exist as an ACTIVE `PLATFORM_OPERATOR` or `SERVICE`.

DD-153's first disposable ACTIVE fixture surfaced this trigger exactly as
designed. The corrected fixture then passed the physical RLS acceptance suite.

DD-16 still says broader approval policy may depend on sensitivity and tenant /
compliance policy. Migration 0031 does not encode that broader policy.

## Determination

One bounded acceptance prerequisite is source-complete:

> Prove the persisted OperatorElevation relationship trigger on a real migrated
> PostgreSQL database, including insert and update behavior, without treating it
> as complete request-time approval authorization.

## Authorized DD-154 boundary

Add one PostgreSQL acceptance file only.

It must prove:

1. ACTIVE PLATFORM_OPERATOR + distinct ACTIVE PLATFORM_OPERATOR approver is accepted;
2. ACTIVE PLATFORM_OPERATOR + distinct ACTIVE SERVICE approver is accepted;
3. ACTIVE + NULL approver is rejected;
4. ACTIVE self-approval is rejected;
5. ACTIVE + inactive approver is rejected;
6. non-PLATFORM_OPERATOR or inactive operator principal is rejected;
7. PENDING may remain unapproved, but promotion/update to ACTIVE without a valid
   independent approver is rejected.

Expected suite delta: Core remains 346; PostgreSQL increases 476 -> 483.

## Explicitly unclaimed

DD-154 does **not**:

- implement elevation create/approve/activate APIs;
- decide who may approve a particular request;
- enforce tenant/compliance approval policy;
- interpret purpose/ticket semantics;
- require request-time revalidation of approver status;
- interpret `permission_profile_id`;
- decide step-up/MFA;
- choose/trust selected elevation ids;
- inject RequestContext/SQL elevation scope;
- grant access or emit mandatory use audit;
- change migrations, RLS, roles/grants or product policy.

## Next dependency boundary

After DD-154, persisted operator/approver relationship integrity is verified.
Request-time elevation remains blocked on trusted selection, governed
step-up/profile/approval policy, RequestContext/SQL integration and mandatory
elevation-use audit.
