# SBGlobal Plus — PROJECT TRUTH AUDIT (2026-09-10)

**Scope:** current repository state on `docs/architecture-branch-2` · **Purpose:** Vision-centric evidence audit and targeted correction · **Status:** ACTIVE audit record.

## 1. Governing rule
A gate label, prior certification, checklist, summary, registry row, document count, or source reference is never substantive evidence by itself. Current project truth is determined from repository-resident content and traceable evidence. Historical checkpoints remain history; they do not override later contradictory evidence.

North Star: **SBGlobal Plus — A World-Class, AI-Ready, AI-Extensible, AI-Powered, Enterprise-Grade, Multi-Tenant, Multi-Industry SaaS Platform.** Canonical model: **One Unified Enterprise Core → Multiple First-Class Industries → Multiple Tenants → Configurable & Modular Management Systems → Secure Web/Mobile/Desktop Experiences → AI-Powered Business Operations.** All nine industries are first-class; Healthcare is not a template.

## 2. Findings

| ID | Priority | Finding | Current disposition |
|---|---|---|---|
| TA-01 | P0 | Both `RawSourceCorpus` files had diverged from the `main` source baseline although governance calls them immutable. This invalidated the branch's current “corpus untouched” assertions. | **CORRECTED:** restored both paths to the exact `main` blobs in commit `548e643ffba1c4c7a0e4fbcbaa5b15c58b0a708c`. Historical owner/source edits remain available in Git history; the active RawSourceCorpus is again immutable source material. |
| TA-02 | P0 | `TRACEABILITY_MATRIX_UNIT.md` claims 372 unit-level rows / 2,965 items / 0 unmapped, but S2 is represented mainly by grouped unit ranges and explicitly points to a recovery ZIP for the full per-unit rows. That is not repository-resident atomic traceability evidence. | **OPEN:** prior numeric totals remain historical accounting only. Foundation-wide substantive certification is suspended until atomic repository-resident source→canonical mappings are verified. |
| TA-03 | P0 | CP-F1-005 relied partly on document presence, inherited generic dimensions, grouped traceability, and cross-references. Several Foundation files are substantive, but the repository does not currently prove that every meaningful source requirement has substantive canonical WHAT/WHY/WHO content rather than only summary/reference coverage. | **OPEN:** Foundation whole returns to **IN PROGRESS / TRUTH REVALIDATION**. CP-F1-005 remains a historical gate event, not current substantive certification evidence. |
| TA-04 | P1 | Active technology/deployment wording drifted across Foundation/governance/state: PM2/cPanel/VPS assumptions, REST-for-every-MS wording, and Windows-only desktop wording conflict with the user-directed stack. | **TARGETED CORRECTION REQUIRED/IN PROGRESS:** canonical current baseline is UD-TECH-01; historical source stack remains only in RawSourceCorpus. |
| TA-05 | P1 | State/index/handoff files report stale Architecture inventory (A-00…A-03) while A-00…A-09 exist, and several files still assert Foundation certification as current truth. | **TARGETED CORRECTION REQUIRED/IN PROGRESS.** |
| TA-06 | P1 | Architecture A-00/A-09 depend on the prior Foundation certification claim. Their design may remain useful, but Architecture cannot inherit a status from a Foundation baseline that is under substantive revalidation. | **OPEN:** Architecture remains in progress/provisional; revalidate it against the corrected Foundation truth before any Architecture gate claim. |
| TA-07 | P1 | A-10, A-11, A-12, consolidated ADR evidence, Architecture traceability, Architecture No-Loss audit, and final cross-document gate evidence are absent. | **OPEN genuine Architecture work**, not manufactured by this audit. |

## 3. Active technology baseline (UD-TECH-01)
Next.js 15 · TypeScript 5.x · Node.js 22+ · React 19 · Tailwind CSS + Shadcn UI · PostgreSQL · Payload CMS 3 · Refine where internal CRUD/admin is more appropriate · Next.js server capabilities with NestJS where a dedicated backend/service boundary is justified · tRPC for first-party typed APIs where appropriate · REST/OpenAPI for external interoperability · Clerk preferred, Auth.js where Clerk is unsuitable · React Native + Expo · Tauri 2.0 for Windows/macOS/Linux · Expo Push Notifications / OneSignal · Vercel for suitable web workloads · Coolify + Dockerized VPS for self-hosted workloads.

Old Laravel/PHP/Filament/MySQL-primary/Flutter/PM2/cPanel assumptions are not current architecture. They may remain inside immutable historical source text.

## 4. Substantive Foundation revalidation criteria
Foundation may regain a substantive Foundation status only when all of the following are evidenced in the repository itself:

1. Every meaningful RawSourceCorpus requirement is atomically traceable to a canonical destination, a recorded supersession/legacy decision, a justified future-phase deferral, or an explicit unresolved item.
2. A mapping to a heading, generic inheritance row, summary sentence, or external ZIP is not sufficient. The destination must contain the actual Foundation-level canonical requirement where the requirement belongs to Foundation.
3. Foundation contains canonical **WHAT / WHY / WHO** for platform, tenant, industry, Management System, workflow/rule, identity/security, data, commercial, AI, experience, configuration and other applicable requirements; implementation HOW remains Architecture/Detailed Design.
4. All nine industries satisfy the same evidence discipline independently; equal depth never means identical functionality and Healthcare is never copied as the template.
5. RawSourceCorpus is byte-stable against the accepted immutable source baseline.
6. Conflicts and user-directed completions are explicitly classified and recorded with rationale/trade-offs where material.
7. A fresh no-loss/depth audit verifies substantive destinations, not only counts.
8. State, registers, indexes and handoff files match actual repository evidence.

## 5. Architecture consequence
A-00…A-09 are retained as useful Architecture work, but are **provisional while Foundation truth revalidation is open**. No application code or Detailed Design is authorized by this audit. A-10…A-12 and Architecture-specific evidence remain later Architecture work.

## 6. Change discipline
Preserve valid content and history. Correct only contradictions, stale active assumptions, false status claims, and missing evidence controls. Do not rewrite immutable RawSourceCorpus to match the active technology stack. Do not merge to `main`. No backup ZIP is required by this user-directed audit.
