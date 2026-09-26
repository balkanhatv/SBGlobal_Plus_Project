# COMMERCIAL PREPARED ASSESSMENT → DD-066 PERSISTENCE SOURCE AUDIT

**Date:** 2026-09-21  
**Baseline:** `578292ee145742d2069fd8cf0f4fc62c7822e7c2` / `e47590783acbb3bb88c1fb7fe73ec0171cbea557`  
**Scope:** DD-076 prepared initial assessment → DD-066 persisted assessment.

## Governing evidence

DD-076 already produces every non-server-identity field required by the DD-066 initial assessment contract:
- assessmentVersion=1;
- Subscription/source PlanVersion/target PlanVersion;
- effective timing and expected Subscription version;
- route class + route-policy id/version;
- immutable impact/diff references;
- governed blocker codes + initial remediation state;
- opaque source fingerprint.

DD-066 already owns:
- Tenant binding from SERVICE + TENANT_CORE RequestContext;
- server-generated assessment id;
- correlation binding;
- server time / createdAt;
- payload normalization;
- current Subscription/source/version/Tenant-pointer revalidation;
- target PlanVersion/route-policy revalidation;
- FORCE-RLS append-only persistence through `sbg_commercial_plan_change_evidence_rw`.

Migration 0047 additionally serializes evidence appends with DD-078 publication for the same Tenant+assessment. No new DB table, role, privilege or lock is needed for this bridge.

## Safe DD-079 mapping

DD-079 may therefore perform a lossless one-to-one handoff:
1. accept only SERVICE + TENANT_CORE and an actual DD-076 version-1 prepared shape;
2. revalidate DD-076 deterministic blocker/remediation invariants at the orchestration boundary;
3. pass every prepared field unchanged to `PlanChangeEvidenceService.recordAssessment`;
4. intentionally omit `assessmentId` so DD-066 remains the identity owner;
5. accept DD-066 as authority for persistence/current-state failures;
6. fail closed if the returned persisted record drifts from the prepared binding, Tenant or correlation.

## Deliberate boundary

DD-079 does not implement or reinterpret:
- blocker vocabulary;
- entitlement-diff document format;
- source-fingerprint algorithm;
- route-selection policy;
- remediation completion/reassessment;
- Billing/payment/proration;
- Workflow approval;
- final snapshot-fact materialization;
- public `core.commercial.subscription.changePlan`.

It closes only the already-defined prepared-initial-assessment → persisted-initial-assessment bridge.
