# SBGlobal Plus — Project Foundation / Architecture Branch

**Current status: FOUNDATION CERTIFIED · ARCHITECTURE CERTIFIED · READY FOR DETAILED DESIGN** on `docs/architecture-branch-2`.

> **SBGlobal Plus — A World-Class, AI-Ready, AI-Extensible, AI-Powered, Enterprise-Grade, Multi-Tenant, Multi-Industry SaaS Platform.**
>
> **One Unified Enterprise Core → Multiple First-Class Industries → Multiple Tenants → Configurable & Modular Management Systems → Secure Web/Mobile/Desktop Experiences → AI-Powered Business Operations.**

All nine supported industries are equal first-class suites. Healthcare is not a template, benchmark or default.

## Current truth
The 2026-09-11 independent forensic audit reopened certification, triggered targeted remediation, and certification was restored only after fresh evidence passed. Current evidence is requirement-level rather than count-only: 372 parent source units + 2,962 child requirements (0 GAP), all 41 Management Systems with specific substantive owners, Tenant + Industry Context fail-closed Architecture, reconciled access/surface/identity models, complete ADR evidence, and fresh Foundation/Architecture adversarial PASS results.

## Repository layout
- `Governing/` — MASTER_INSTRUCTION / MASTER_PROMPT v2.5 with current phase/technology reconciliation.
- `RawSourceCorpus/` — immutable source/history baseline.
- `Foundation/` — F-00…F-15, canonical WHAT/WHY/WHO.
- `Architecture/` — A-00…A-12, canonical HOW.
- `Registers/` — source/decision/traceability/audit/checkpoint evidence.
- `State/` — current continuation state.

## Active technology — UD-TECH-01
Next.js 15 · TypeScript 5.x / Node.js 22+ · React 19 · Tailwind/Shadcn · PostgreSQL · Payload CMS 3 · Refine where suitable · Next.js server by default · NestJS only where justified · tRPC first-party · REST/OpenAPI external · Clerk preferred/Auth.js fallback · React Native+Expo · Tauri 2.0 Windows/macOS/Linux · Expo Push/OneSignal · Vercel · Coolify + Dockerized VPS.

Historical Laravel/PHP/Filament/MySQL-primary/Flutter/PM2/cPanel assumptions remain source/history only where preserved.

## Evidence
- Foundation parent source inventory: `Registers/TRACEABILITY_MATRIX_UNIT.md`.\n- Requirement-level evidence: `Registers/TRACEABILITY_MATRIX_REQUIREMENTS.md`.\n- 41-MS completeness: `Registers/MS_COMPLETENESS_MATRIX.md`.
- Foundation No-Loss/adversarial audit: `Registers/NO_LOSS_AUDIT.md`.
- Architecture traceability: `Registers/ARCHITECTURE_TRACEABILITY_MATRIX.md`.
- Architecture No-Loss/depth audit: `Registers/ARCHITECTURE_NO_LOSS_AUDIT.md`.
- Architecture final/adversarial audit: `Registers/ARCHITECTURE_FINAL_AUDIT.md`.
- Architecture ADR authority: `Architecture/A-12_ARCHITECTURE_DECISIONS_CONSTRAINTS_DEPENDENCIES_TRADEOFFS.md`.

## Next phase
Detailed Design is now the next authorized phase. It owns exact schemas, endpoint/payload contracts, policy expressions, permission matrices, screen inventories, infrastructure/vendor configuration, migration/runbook mechanics and implementation test contracts. Development follows only after each build scope reaches DETAILED DESIGN COMPLETE.

Do not modify or merge `main` without explicit approval.
