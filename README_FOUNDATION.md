# SBGlobal Plus — Project Foundation / Architecture Branch

**Current status: FOUNDATION CERTIFIED + ARCHITECTURE CERTIFIED — READY FOR DETAILED DESIGN** on `docs/architecture-branch-2`.

> **SBGlobal Plus — A World-Class, AI-Ready, AI-Extensible, AI-Powered, Enterprise-Grade, Multi-Tenant, Multi-Industry SaaS Platform.**
>
> **One Unified Enterprise Core → Multiple First-Class Industries → Multiple Tenants → Configurable & Modular Management Systems → Secure Web/Mobile/Desktop Experiences → AI-Powered Business Operations.**

All nine supported industries are equal first-class suites. Healthcare is not a template, benchmark or default.

## Current truth
The 2026-09-10 truth audit was closed through repository-resident revalidation. Foundation evidence now includes 372 atomic source rows with no external-ZIP dependency plus a fresh No-Loss/adversarial audit. Architecture A-00…A-12 was then revalidated and completed with an Architecture traceability matrix, No-Loss/depth audit and final adversarial audit.

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
- Foundation atomic traceability: `Registers/TRACEABILITY_MATRIX_UNIT.md`.
- Foundation No-Loss/adversarial audit: `Registers/NO_LOSS_AUDIT.md`.
- Architecture traceability: `Registers/ARCHITECTURE_TRACEABILITY_MATRIX.md`.
- Architecture No-Loss/depth audit: `Registers/ARCHITECTURE_NO_LOSS_AUDIT.md`.
- Architecture final/adversarial audit: `Registers/ARCHITECTURE_FINAL_AUDIT.md`.
- Architecture ADR authority: `Architecture/A-12_ARCHITECTURE_DECISIONS_CONSTRAINTS_DEPENDENCIES_TRADEOFFS.md`.

## Next phase
Detailed Design owns exact schemas, endpoints, payloads, permission matrices, screen inventories, infrastructure/vendor configuration and implementation mechanics. Development follows only after each relevant scope reaches DETAILED DESIGN COMPLETE.

Do not modify or merge `main` without explicit approval.
