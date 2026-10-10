# COMMERCIAL INITIAL PLAN-CHANGE ASSESSMENT PREPARATION SOURCE AUDIT

**Date:** 2026-09-21  
**Baseline:** `51f6ea026cefdbb3598cd858e6f865347caa3fd9` / `a2ad4153c1073d534e5ee0daf91db6ecaf62f64a`  
**Scope:** DD-075 final preview → DD-066 initial assessment boundary.

## Governing evidence

- F-01 BR-SUB-04 and F-14 §6 require downgrade impact/remediation before effect when current usage exceeds target limits.
- DD-04 §13.2 requires immutable server-owned assessment evidence with route, impact/diff references, blocking codes, remediation state and source fingerprint.
- DD-066/migration 0045 already persists versioned assessment evidence, revalidates the exact Subscription/source/target/version tuple and route-policy binding, and prohibits an initial assessment from claiming remediation SATISFIED.
- DD-075 now provides deterministic target-preview facts plus exact DD-073 usage-blocking evidence.
- DD-04 explicitly requires `blockingImpactCodes[]` to be governed deterministic codes, but the repository does **not** define the concrete code vocabulary.
- F-14 requires an entitlement/impact preview, but the repository does **not** define an immutable entitlement-diff evidence document schema/reference producer.
- DD-04 names a source fingerprint, but the repository does **not** define the canonical Commercial serialization/hash algorithm for the complete plan/license/adjustment/restriction input set.
- Route policy persistence can enable self-serve and/or sales-assisted paths, but no current source defines a deterministic chooser when more than one route is valid.

## Safe DD-076 boundary

DD-076 therefore establishes a server-owned `CommercialInitialAssessmentEvaluatorPort` and a strict preparation service.

The evaluator receives:
- trusted SERVICE + TENANT_CORE RequestContext;
- exact Subscription/source PlanVersion/target PlanVersion/expected version;
- exact effective timing;
- the immutable DD-075 final preview.

The normalized evaluator decision must return:
- the same exact target PlanVersion;
- server-derived route class + route-policy id/version;
- immutable impact and entitlement-diff references;
- governed blocking-impact codes;
- an opaque bounded source fingerprint.

The preparation service:
- never accepts client route/payment/approval/remediation/fingerprint authority;
- rejects target mismatch, malformed evidence, duplicate/invalid blockers and invalid route binding;
- sorts blocking codes deterministically;
- derives initial remediation state only as `PENDING` when blockers exist, otherwise `NOT_REQUIRED`;
- never permits initial `SATISFIED`;
- requires at least one governed blocking code whenever DD-073 says usage exceeds target, preventing a known downgrade blocker from disappearing.

## Deliberate boundary

DD-076 does **not** invent the missing blocking-code vocabulary, entitlement-diff document format, source-fingerprint algorithm or dual-route selection policy. It does not record the assessment itself, produce remediation evidence, consume Billing/Workflow route resolution, materialize snapshot facts or call DD-065 publication.

A concrete production evaluator remains required before the public plan-change orchestration can create authoritative DD-066 assessment evidence.
