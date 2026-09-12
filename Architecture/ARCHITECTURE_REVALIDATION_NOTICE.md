# ARCHITECTURE REVALIDATION NOTICE — 2026-09-11

**Current Architecture status:** **REVALIDATION REQUIRED** on `docs/architecture-branch-2` after the 2026-09-12 Phase-1 Foundation corrections.

The 2026-09-11 Architecture certification below remains historical evidence. Current authority is the 2026-09-12 Phase-1 RawSource→Foundation reconciliation, which changed upstream Foundation truth and therefore requires a fresh Architecture/ADR revalidation before certification can be re-earned.

## Revalidation result
Foundation truth was first re-earned using repository-resident atomic evidence. A-00…A-09 were then re-read and corrected only where current Foundation/UD-TECH-01 exposed contradictions. A-10, A-11 and A-12 were created at Architecture HOW depth.

## Current inventory
Present and current: **A-00 through A-12**.

Current Architecture evidence:
- `Registers/ARCHITECTURE_TRACEABILITY_MATRIX.md`
- `Registers/ARCHITECTURE_NO_LOSS_AUDIT.md`
- `Registers/ARCHITECTURE_FINAL_AUDIT.md`
- authoritative ADR-001…ADR-018 in A-12.

## Key reconciliations
Commercial lifecycle no longer invents PAST_DUE; retention/erasure is conditional on legal hold/mandatory retention; cross-region backup/failover is residency-policy gated; AI/RAG enforces Tenant + Industry Context + ACL + entitlement + security/residency; canonical four-surface separation is explicit; Clerk/Auth.js remain behind one identity boundary; Next.js is default with NestJS only for justified service boundaries.

## Phase boundary
Architecture is certified only. Exact schemas, endpoint paths/methods, payloads, permission matrices, screen inventories, IaC/vendor configuration and implementation mechanics belong to Detailed Design. No application code, migrations or deployment scripts were introduced.

`main` currently points to historical merge commit `3911590ff2020993ce51b32d7b091efd6f5f466f` from PR #1 (2026-09-04). No `main` merge was performed by the 2026-09-12 Phase-1 run. The historical Foundation backup exists, but no current full Architecture/DD closure backup has been produced.
