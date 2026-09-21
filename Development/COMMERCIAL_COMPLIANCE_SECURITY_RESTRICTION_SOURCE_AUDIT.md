# COMMERCIAL COMPLIANCE / SECURITY RESTRICTION SOURCE AUDIT

**Date:** 2026-09-21  
**Baseline:** `06a86199d8da64e33317124095e8313e961c80b5` / `baac7797b5e16125f9d101b6cfc66b6a93cce983`  
**Scope:** next safe Commercial target-preview prerequisite after DD-071.

## Governing evidence

- F-14 §4 fixes compliance/security as the final entitlement-source precedence input and states that it may only restrict, never expand.
- A-04/DD-04 place compliance/security after plan/license/override/add-on/usage inputs and before lifecycle overlay; deny remains final.
- F-03/A-03 define runtime security/compliance constraints in the effective-access chain.
- DD-03 explicitly records that persisted ABAC `RESTRICT` currently has no governed restriction payload/reducer; the executable PDP therefore fails it closed as DENY rather than inventing opaque restriction semantics.
- DD-16 defines security/compliance controls, evidence, residency and security-floor behavior, but does not define a Commercial entitlement-restriction persistence schema or a concrete target-plan entitlement reducer.

## Current implementation finding

The current source tree contains no authoritative Commercial compliance/security restriction store or production resolver that can safely be interpreted as target-plan entitlement mutation input. Existing identity/session security, Authorization ABAC, residency, rate-limit and security-control contracts are runtime enforcement domains; reusing them as an implicit Commercial compiler source would create competing authority.

Therefore DD-072 introduces **no migration, table, legal/regulatory rule, limit-cap formula, generic RESTRICT reducer or client-supplied policy document**.

## Safe bounded continuation

`CommercialComplianceSecurityRestrictionResolverPort` is server-owned and receives only the authoritative Tenant-Core RequestContext, target PlanVersion id and exact DD-071 intermediate preview. Its normalized v1 output may contain only exact existing entitlement `DENY` targets with a control code plus versioned evidence. The preparation service rejects missing targets, fan-out guesses, ALLOW, numeric/opaque effects, duplicate control-target tuples, malformed evidence and stale target binding.

This is an ownership/input boundary only. It does not yet apply the DENY set to produce a final target preview, does not consume usage meters, does not apply lifecycle state, and does not authorize publication or public `changePlan`.

## Next dependency

Bind a concrete governed compliance/security resolver source when an authoritative policy owner is available. Until then production composition remains intentionally incomplete. The next compiler work must not invent that source; after a real prepared restriction input exists, restriction application and usage-meter impact can proceed under separate acceptance evidence.
