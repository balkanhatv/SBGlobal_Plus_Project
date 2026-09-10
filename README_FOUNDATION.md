# SBGlobal Plus — Project Foundation / Architecture Branch

**Status: FOUNDATION CERTIFIED + ARCHITECTURE BASELINE STARTED** — Foundation certification remains valid for CP-F1-005. Architecture baseline **CP-A1-001** is now present on `docs/architecture-branch-2` with A-00…A-03 currently available. This branch does not claim A-04…A-12 are complete or present. Governed by MASTER_INSTRUCTION v2.5 + MASTER_PROMPT v2.5 (unchanged).

**04-09-2026 correction history:** commit `b83bea9` (unnecessary brand/color canonicalization — F-06 §6.1, AC-19, RR-03) was reverted via history-preserving revert `efd16eb6`; F-06 was restored to v0.1 and RR-03 withdrawn. The owner-directed corpus edit `a811a1ab` remains intact as ACTIVE owner intent. No history rewrite; `main` not merged.

> "SBGlobal Plus is an AI-Ready, AI-Extensible, AI-Powered, Enterprise-Grade, Multi-Tenant, Multi-Industry SaaS Platform."
> Tagline: **One Intelligent Platform. Every Industry. Infinite Possibilities.**

## Package layout
- `Foundation/` — canonical Foundation documents F-00…F-14 (F-13 MS depth completion; F-14 Commercial Foundation)
- `Architecture/` — **current architecture baseline A-00…A-03**; A-04…A-12 are planned and not yet present in this branch
- `Registers/` — Foundation governance registers; architecture-specific registers are not yet present under `Architecture/`
- `State/` — PROJECT_STATE, PHASE_SUMMARY, HANDOFF_NOTE, PROJECT_MANIFEST
- `Governing/` — MASTER_INSTRUCTION v2.5, MASTER_PROMPT v2.5 (preserved verbatim)
- `RawSourceCorpus/` — immutable historical/source corpus; old technology references remain unchanged by design
- `BACKUP_METADATA.json` — Foundation recovery package record

## Current technology baseline
The active user-directed Architecture-branch baseline is recorded as `UD-TECH-01` in `Registers/D-DECISIONS.md`: Next.js 15 · TypeScript 5.x / Node.js 22 · React 19 · Tailwind CSS + Shadcn UI · PostgreSQL · Payload CMS 3 · React Native + Expo · Expo Push / FCM · Tauri 2.0 · Clerk identity boundary · tRPC primary internal API · REST/OpenAPI for external interoperability · webhooks · PM2-compatible VPS deployment; Optional Docker/Vercel etc. dependency.

## Verified Foundation evidence
Unit-level traceability 372 units / 2,965 items / 0 unmapped · No-Loss PASS · dual final audit records · all 9 industry suites and every Foundational MS specified at Foundation depth · full commercial model (F-14).

## Current Architecture state
- Architecture baseline: **STARTED / CP-A1-001**
- Available architecture documents: **A-00, A-01, A-02, A-03**
- A-04…A-12: **PLANNED / NOT PRESENT**
- Architecture-specific traceability/audit package: **PENDING** until the corresponding governance artifacts are created
- RawSourceCorpus: **UNCHANGED / IMMUTABLE**
- Merge to `main`: **not performed; explicit approval remains required**
