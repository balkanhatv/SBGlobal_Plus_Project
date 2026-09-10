# ARCHITECTURE REVALIDATION NOTICE — 2026-09-10

**Current Architecture status:** **IN PROGRESS / PROVISIONAL** on `docs/architecture-branch-2`.

This notice is the current status qualifier for A-00…A-09. Any earlier header/status wording such as `ARCHITECTURE COMPLETE (CP-A1-002)` records the state claimed when that document was authored; it is **not a current Architecture gate claim** after the Project Truth Audit.

## Reason
Architecture A-00…A-09 was produced against a Foundation baseline then treated as certified. `Foundation/F-15_FOUNDATION_TRUTH_REVALIDATION.md` and `Registers/PROJECT_TRUTH_AUDIT_2026-09-10.md` reopened the whole Foundation for substantive truth revalidation. Architecture therefore cannot inherit completion/certification from that historical Foundation gate.

## Retained value
A-00…A-09 contain substantial useful high-level design and are **not discarded**. They must be revalidated against the corrected Foundation WHAT/WHY/WHO and current `UD-TECH-01` technology direction. Where a contradiction exists, preserve valid architecture and apply the minimum coherent correction with a recorded decision/trade-off.

## Current inventory
Present: A-00, A-01, A-02, A-03, A-04, A-05, A-06, A-07, A-08, A-09.

Not present: A-10, A-11, A-12.

Also still required before any Architecture gate claim: consolidated ADR evidence, Architecture-specific traceability, Architecture No-Loss/depth audit, cross-document consistency review, and final gate evidence.

## Technology authority
Current active baseline is `UD-TECH-01`: Next.js 15; TypeScript 5.x/Node.js 22+; React 19; Tailwind/Shadcn; PostgreSQL; Payload CMS 3; Refine where suitable; NestJS where a dedicated backend/service boundary is justified; tRPC for first-party typed APIs where appropriate; REST/OpenAPI for external interoperability; Clerk preferred with Auth.js fallback where unsuitable; React Native + Expo; Tauri 2.0 Windows/macOS/Linux; Expo Push Notifications / OneSignal; Vercel; Coolify + Dockerized VPS.

Old Laravel/PHP/Filament/MySQL-primary/Flutter/PM2/cPanel assumptions are not current Architecture.

## Phase boundary
This revalidation does not authorize Detailed Design or production/application code. Foundation truth must stabilize first, then A-00…A-09 must be revalidated and remaining Architecture work continued. `main` must not be modified or merged without explicit approval.
