# SBGlobal Plus — A-09 INDUSTRY SUITE ARCHITECTURE
**Document ID:** A-09 · **Version:** 1.1 · **Status:** PHASE 2 REVALIDATED ARCHITECTURE · **Date:** 09-09-2026
**Traces to:** F-07…F-09 (nine suites), F-12 (MS Specification Standard + §9 dimensions), F-13 (MS depth completion), F-00 §5 (canonical chain), LG-03/LG-04 (no flagship; equal depth) · **Decisions:** ADR-012 (→ A-12)

---

## 1. First-Class Equality (ADR-012)
All nine suites — **Healthcare & Diagnostics (HLT), Education (EDU), eCommerce/Retail (RTL), Hospitality (HSP), Manufacturing (MFG), Professional Services (PSV), Government & Public Sector (GOV), NGO/Temple/Trust (NGO), Security & Facility Management (SFM)** — are architecturally identical citizens: same module anatomy (§3), same activation model (§4), same integration and AI patterns. Healthcare is **not** the template: the anatomy below is derived from the cross-suite MS Specification Standard (F-12), which all nine satisfy independently. Suite-specific behavior comes only from that suite's own Foundation specification. There are no suite forks of Core code, schema conventions, or experience shells. The nine named suites are the **Current Supported Industry** set. A future industry uses the Future Industry Framework and does not become Current Supported merely because a module group or document exists.

## 1A. Future Industry Promotion Architecture
A future-industry definition lives in a separate catalog state (`DRAFT_FUTURE` / equivalent governance state) and may reuse Core extension seams for design/prototyping. Promotion to Current Supported requires explicit user/governance approval plus completion of the same Foundation specification, MS inventory/depth, architecture isolation/ownership, experience, AI/integration, acceptance and traceability gates as existing industries. Until promotion, it cannot be licensed/enabled for live Tenant production contexts. Promotion adds catalog/module/experience/configuration artifacts only; it does not fork Core, copy Healthcare semantics or silently expand global permissions.

## 2. Suite → Architecture Mapping
| Suite | Module group | Schema (A-05 §3) | Experience packages (A-08 §4) | Integration ports (A-06 §6) |
|---|---|---|---|---|
| HLT | `ind.hlt.*` MS per F-07 §1/F-13 §1 | `ind_hlt_*` | HLT packages | Lab devices, insurance, e-prescription |
| EDU | `ind.edu.*` per F-07 §2/F-13 §2.1 | `ind_edu_*` | EDU packages | Exam boards, payment rails, LMS content |
| RTL | `ind.rtl.*` per F-07 §3/F-13 §2.2 | `ind_rtl_*` | RTL packages (incl. POS desktop scope, AC-06) | Payment, logistics, marketplaces |
| HSP | `ind.hsp.*` per F-08 §1 | `ind_hsp_*` | HSP packages | Channel managers, payment |
| MFG | `ind.mfg.*` per F-08 §2/F-13 §2.3 | `ind_mfg_*` | MFG packages | Machine/IoT gateways, logistics |
| PSV | `ind.psv.*` per F-08 §3/F-13 §2.4 | `ind_psv_*` | PSV packages | e-sign, accounting exports |
| GOV | `ind.gov.*` per F-09 §1 | `ind_gov_*` | GOV packages | Government registries/e-filing |
| NGO | `ind.ngo.*` per F-09 §2/F-13 §2.5 | `ind_ngo_*` | NGO packages | Donation gateways, statutory reporting |
| SFM | `ind.sfm.*` per F-09 §3 | `ind_sfm_*` | SFM packages | Access-control hardware, attendance devices |
Each cell's content is owned by the suite's Foundation documents; this table is placement only (non-duplication, A-00 §1).

## 3. Management System (MS) Module Anatomy
Every MS is one architectural unit with a standard anatomy (structural convention, not content template):
```
MS module = domain services (typed contracts, A-01 §4)
          + workflow definitions (F-12 states/transitions → Workflow module)
          + business rules (trigger·condition·action·authority·audit → rule
            bindings on services/workflows)
          + masters + seed pack (A-05 §2; per-industry demo data, F-04 §9)
          + permission set (`<suite>.<ms>.<action>` → A-03 §3 catalog)
          + event contributions (Tenant + Industry Context outbox catalog, A-06 §4)
          + experience package(s) (A-08 §4; mobile/desktop scope per suite)
          + AI capability declarations (→ A-07 §5 tools/skills)
          + compliance profile hooks (A-03 §6)
          + KPI/projection definitions (A-05 §6)
```
**Context invariant:** every industry MS service, entity, event, document and experience operation is bound to one active Tenant + Industry Context. Same-tenant sibling industries do not become mutually readable merely because both are enabled. Explicit Core/shared capabilities may span contexts only through governed contracts that preserve source ownership.

Dependency rules: MS → platform modules: allowed. MS → MS within a suite: via contracts/events. MS across suites: **events only** (no direct contract coupling — keeps suites independently activatable). Platform → MS: never (A-01 §4).

## 4. Activation Model
```
Current Supported Industry catalog (global directory) → tenant primary industry (+ optional
enabled industries, F-00 §5) → plan/entitlement grants suite + MS set
(A-04 §4) → tenant activation workflow: register activation → run seed
pack → mount routers (A-06 §2) + experience packages (A-08 §4) → assign
role templates → activation audit record
```
Deactivation reverses visibility without destroying data (retention per A-05 §7). Activation is idempotent and per-OrgUnit-scopeable where a suite defines branch-level MS enablement (F-12 dimension).

## 5. Cross-Industry Shared Capabilities
Recurring operational patterns — scheduling/appointments, inventory movements, billing counters, queue/token management, asset registers — exist once as **platform capability primitives** (Core modules or shared libraries with their own schemas). Suites *compose and configure* primitives under their own domain semantics; a primitive never embeds industry vocabulary or industry rules (those live in the MS layer). This is how equal depth avoids nine re-implementations without making any suite the template (LG-03/LG-04 preserved architecturally).

## 6. Suite AI & Offline Scopes
Each suite declares (per its Foundation spec, executed via A-07/A-08 patterns): AI tools/skills exposed to assistants (permission-bound, A-07 §5) and offline-capable module scope (e.g. RTL POS per AC-06). These declarations are catalog data, uniform across suites.

## 7. Deferred to Detailed Design
Per-MS service contract signatures, workflow definitions, rule bindings, seed packs, permission instantiation, experience screen inventories, integration adapter specs; Future Industry promotion-state schema/checklist — all per suite from its own F-07…F-09/F-12/F-13 content (§26A/§26B boundary).

## 8. Evidence consumption rule
Common Management-System anatomy defines architectural shape only; it is **not proof of business depth**. A suite/MS enters Architecture as verified Foundation truth from its own F-07…F-09/F-13 business semantics. All nine industries consume the same architectural discipline independently. Healthcare-specific workflows, masters, events or compliance semantics may not be inferred into sibling suites.
