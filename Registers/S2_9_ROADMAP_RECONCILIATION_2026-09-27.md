# S2.9 ENTERPRISE DEVELOPMENT ROADMAP RECONCILIATION — 2026-09-27

**Scope:** S2.9-U320…U335 in the immutable Enterprise Development Roadmap source.

## Authority boundary

S2.9 is a Tier-5 roadmap. Its Phase 01–14 headings are thematic construction groupings and volume/checklist targets. They do not control current phase order, checkpoint status, or certification. Current phase governance is dependency-driven under the Governing Master Instruction and CR-04.

The source roadmap's own preface retains older phase-number wording; this is historical source text and does not override current MI v2.5 governance.

## Volume targets preserved

The following remain roadmap targets rather than current-state counts or completion claims:

- 500+ tables
- 250+ masters
- 1000+ dropdown values
- 100+ settings pages
- 200+ LIS settings
- 1000+ permissions

Exact current inventories and implementation evidence are owned by the active Architecture/Detailed Design/Development/state registers.

## Domain-scope normalization

The roadmap mixes reusable platform capabilities with Healthcare examples. Patient, Doctor, Laboratory, LIS, Sample, Medical/Lab Report, Machine and related items remain Healthcare-owned. In particular, Phase 06 Complete LIS Configuration is Healthcare-only.

Workflow, template, audit and analytics phase lists are thematic examples, not global canonical catalogs.

## Technology and surface normalization

The Phase 11 API checklist is source history plus target intent. Active API architecture follows UD-TECH-01/A-06: tRPC for first-party typed application APIs and REST/OpenAPI for external interoperability. Source JWT/Swagger wording does not reintroduce a separate application-owned JWT stack or change active interface authority.

The Final Target checklist is aspirational. Legacy Super Admin Portal/Tenant Web Portal and Windows Desktop labels normalize to the current Application Surface Model and cross-platform Tauri desktop architecture. LIS/Billing/Inventory are domain capabilities, not proof of platform-wide completion.

## Status boundary

“Production Ready” in the roadmap is a target item only. Current project status is controlled by MI §27/§33A and repository evidence; the roadmap checkbox/list does not grant TESTED, SECURITY VALIDATED, PRODUCTION READY, DEPLOYED or OPERATIONAL status.

## Boundary

This is source-owner/roadmap-state reconciliation only. No runtime, schema/RLS, role/grant, workflow or executable test is changed. DD-208 remains the latest governed development checkpoint.
