# COMMERCIAL ATOMIC EVIDENCE→PUBLICATION SOURCE AUDIT

**Date:** 2026-09-21  
**Baseline:** `c61161c704e99c4bf0d4e5f328d79943dee8ac30` / `ac4629ed5507118c7bff26b34773e1c5664e309c`  
**Scope:** DD-077 persisted evidence gate → DD-065 publication transaction.

## Governing evidence

DD-04 §13.4 requires assessment/remediation/route evidence checks and Subscription mutation to succeed in the same authoritative transaction. DD-077 intentionally left a transaction gap. DD-065 already performs Subscription, target PlanVersion, current snapshot, entitlement-definition, Industry Context, outbox and audit checks under `sbg_commercial_transition_compiler_rw`.

Migration 0045 already grants that compiler role read-only access to all DD-066 evidence families. No new Commercial business table, writer role or RLS policy is required.

## Concurrency finding

A same-transaction evidence SELECT alone is insufficient because DD-066 evidence is append-only: a newer reassessment or route-resolution row could otherwise be appended after validation but before publication commit.

DD-078 therefore adds one implementation-only serialization primitive:
- a transaction-scoped advisory lock keyed by Tenant + assessment id;
- BEFORE INSERT triggers on all three DD-066 evidence families acquire the same lock;
- DD-065 publication acquires that lock before reading evidence.

Hash-key collision can only over-serialize unrelated assessments; it cannot grant access or widen authority.

## Atomic validation

Inside the publication transaction DD-078 requires:
- the supplied assessment id/version exists and is latest for that assessment id;
- exact Subscription/source/target/version and opaque source-fingerprint equality;
- no blocking impacts / no PENDING remediation;
- prior Commercial remediation evidence when a reassessment is SATISFIED;
- current ACTIVE/effective target PlanVersion + route-policy id/version/route enablement;
- latest route resolution is SATISFIED and Billing-owned for SELF_SERVE or Workflow-owned for SALES_ASSISTED;
- NEXT_RENEWAL route effectiveAt has arrived and exactly equals publication effectiveAt.

Only then may the existing DD-065 Subscription/snapshot/outbox/audit mutation continue.

## Deliberate boundary

DD-078 closes the DD-066 evidence-append race for one assessment during publication. It does not create the missing production DD-076 evaluator, DD-066 assessment orchestration, Billing/payment/proration producer, Workflow approval producer, marker-to-snapshot materializer or public `core.commercial.subscription.changePlan`.

Existing DD-065 target/snapshot/definition/Tenant revalidation remains intact. No claim is made that unrelated Control-Plane catalog writers use the new assessment advisory lock.
