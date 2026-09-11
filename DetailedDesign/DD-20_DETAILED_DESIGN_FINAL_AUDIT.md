# DD-20 — DETAILED DESIGN AUDIT HIERARCHY
**Date:** 2026-09-11 · **Current status:** REMEDIATION / RECERTIFICATION REQUIRED

This file is the authoritative audit hierarchy. The previous combined DD-20 content is preserved unchanged in `DD-20H_LEGACY_COMBINED_AUDIT_HISTORY.md` and is historical evidence only.

## Audit scopes
| Audit | Artifact | Status | Certification authority |
|---|---|---|---|
| Wave 1 historical audit | DD-20A_WAVE1_AUDIT.md | HISTORICAL | no current overall certification |
| Wave 2 historical audit | DD-20B_WAVE2_AUDIT.md | HISTORICAL | no current overall certification |
| Wave 3 fresh audit | DD-20C_WAVE3_F5_AUDIT.md | PENDING fresh remediation audit | Wave-3 evidence only |
| Overall DD fresh audit | DD-20D_OVERALL_F5_AUDIT.md | PENDING fresh remediation audit | sole current final DD certification audit |

## Supersession rule
The fresh Overall audit may certify Detailed Design only after Wave-3 audit, requirement-ID traceability, fresh final isolation audit, determinism audit and REVIEW_REQUIRED sweep pass with P0=0 and P1=0. Historical PASS text never overrides a current blocker.

## Current gate
**DETAILED DESIGN REMEDIATION REQUIRED · DEVELOPMENT BLOCKED**.
