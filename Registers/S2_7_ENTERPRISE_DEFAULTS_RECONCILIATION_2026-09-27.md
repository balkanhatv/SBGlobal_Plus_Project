# S2.7 ENTERPRISE DEFAULT STANDARDS RECONCILIATION — 2026-09-27

**Scope:** S2.7-U239…U271 in the immutable Enterprise Default Standards source.

## Active platform defaults

SBGlobal Plus remains the active product name. The source tagline “AI-Powered Enterprise Intelligence. One Core. Unlimited Possibilities.” is preserved as historical/alternative source text; the active primary tagline is governed by F-06 §6.1 / CR-02.

The source brand colors, Inter/Poppins/Roboto typography defaults, semantic radii, layout, table/form defaults and company identity remain Platform defaults. Company/contact data is governed configuration, not a compile-time constant.

## Healthcare-scoped defaults

S2.7's own Vertical Suite Note explicitly scopes the following source defaults to Healthcare & Diagnostics:

- Tenant Web Portal operational defaults
- Healthcare dashboard/KPIs
- Patient-facing modules
- Doctor-facing modules
- LIS
- Invoice template
- Laboratory report template

These source defaults do not define the cross-industry Tenant Management Application and do not become templates for the other eight Current Supported Industries.

## Mixed master/config/role seeds

Master Dropdowns and Setting Modules contain both reusable Core defaults and Healthcare-only items. General country/location/language/currency/status/organization references remain shared. Doctor, Patient, Sample, Test, Specimen, Machine, LIS and similar items remain Healthcare-owned and materialize only when applicable to the enabled scope.

Default role seeds likewise contain shared Platform/Tenant roles plus Healthcare roles. The source statement that other Industries will receive their own sets “as they are built out” is historical; all nine Current Supported Industries are first-class and applicable role/config seed packs are governed by their suite owners plus BR-DATA-03.

## Schema and localization normalization

The source standard master-column list is a baseline. Industry-owned masters also require Industry Context ownership or an equivalent immutable relation under A-05/DD-05.

India remains the default baseline: Asia/Kolkata, dd-MM-yyyy, INR, English/Hindi. Country Packs/Tenant configuration may override permitted locale/currency/time defaults without hard-coding another country into Core. Feature defaults never bypass entitlement, authorization, security or data-lifecycle rules.

## Boundary

This reconciliation changes traceability/evidence only. No runtime, configuration payload, schema, RLS, role/grant or executable test is modified. DD-208 remains the latest governed development checkpoint.
