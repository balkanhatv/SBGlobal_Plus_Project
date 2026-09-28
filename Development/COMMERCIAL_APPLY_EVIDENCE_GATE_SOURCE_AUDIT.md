# COMMERCIAL PERSISTED APPLY-EVIDENCE GATE SOURCE AUDIT

**Date:** 2026-09-21  
**Baseline:** `03098bbc0abe3278fe0e2420b097d50bf9b5044f` / `109dd8959c971766ee2c7750c9cb0b4aa541433d`  
**Scope:** persisted DD-066 evidence → bounded read-only DD-065 apply-evidence authorization.

## Governing evidence

DD-04 §13.4 already defines the apply invariant: exact current Subscription version/source PlanVersion, current target route, current assessment version, no unresolved remediation blocker, SATISFIED producer-owned route resolution, and server-owned NEXT_RENEWAL effectiveAt before publication.

DD-066/migration 0045 provides append-only FORCE-RLS evidence for assessment, remediation and route resolution. It already grants `sbg_commercial_transition_compiler_rw` SELECT on all three evidence families. Migration 0044 grants the same compiler role same-Tenant Tenant reads; migration 0043 already grants Subscription/PlanVersion/route reads. Therefore DD-077 requires no new role, table, RLS policy or migration.

## Safe DD-077 semantics

The store runs through the existing Commercial compiler role and revalidates in one read transaction:
- exact requested assessment id/version exists and is the latest version for that assessment id;
- assessment core binding equals Subscription/source/target/version input;
- Tenant `current_subscription_id` still selects that Subscription;
- current Subscription version/source PlanVersion and usable lifecycle remain unchanged;
- target PlanVersion/Plan/route policy are still ACTIVE/effective at evaluation time;
- route-policy id/version and enabled route still equal the assessment;
- latest route-resolution evidence for that assessment version;
- for a SATISFIED reassessment, prior-version Commercial remediation evidence exists.

The Core gate then:
- compares the opaque current compiler fingerprint to the persisted assessment fingerprint without inventing a hash algorithm;
- blocks PENDING remediation;
- treats no route/latest PENDING as route-pending;
- treats latest REJECTED as rejected;
- requires SATISFIED route evidence from Billing for SELF_SERVE and Workflow for SALES_ASSISTED;
- requires NEXT_RENEWAL `effectiveAt` and blocks until that server-owned time arrives;
- returns ALLOW only when the persisted evidence chain is currently satisfied.

## Deliberate boundary

DD-077 is **read-only authorization evidence**, not the atomic publication transaction. It does not call DD-065 and does not claim to eliminate the time-of-check/time-of-use gap between this gate and a later publication call. The publication store still independently revalidates Subscription, target PlanVersion and current snapshot, but evidence consumption is not yet inside the same mutation transaction required by DD-04 §13.4.

DD-077 also does not create the missing production DD-076 evaluator, Billing/Workflow producers, snapshot-fact materializer, public command or any new financial/approval semantics.

A later governed slice must bind the satisfied evidence read into the DD-065 publication transaction before public `changePlan` can be considered safe.
