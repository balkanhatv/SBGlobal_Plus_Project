# SBGlobal Plus — Canonical Development Branch

**Current checkpoint:** `DEV-COMMERCIAL-ADJUSTMENT-PRECEDENCE-001`  
**Branch:** `docs/architecture-branch-2`

Verified feature executable basis `1c8844ec982ef91cacc3545576d102fbac3fcaf9` / `0792a28622e000beba2e785ce1f0a3282b1fff96`:
- **207/207 Core PASS**
- **56/56 PostgreSQL PASS**
- **46 migrations / 40 verification files bootstrap PASS**
- **Next.js 15.5.25 production build PASS**
- **9 Industries / 41 canonical MS / 181 Industry tables**
- **DD-001…DD-071 contiguous**

DD-071 adds the bounded deterministic Commercial precedence stage: PlanVersion baseline → approved/effective override → resolver-ELIGIBLE quota-additive add-ons, with deny-wins and fail-closed missing/ambiguous meter mapping.

This is **not** a final target preview or public plan-change implementation. Concrete eligibility, compliance/security restriction input, usage impact, lifecycle overlay, Billing/payment/proration, Workflow approval and public `core.commercial.subscription.changePlan` remain unfinished.

Next governed work: **server-owned compliance/security restriction input contract**.

Evidence: `Registers/DEVELOPMENT_DD071_VERIFICATION_2026-09-21.md`.
