# S2.8 ENTERPRISE UI DESIGN SYSTEM RECONCILIATION — 2026-09-27

**Scope:** S2.8-U272…U319 in the immutable Enterprise UI Design System source.

## Shared Core design system preserved

The source grid, container widths, spacing, radius scale, buttons, inputs, selects, file controls, cards, tables, badges, modals, drawers, navigation, search, alerts/toasts/loaders, charts, icons, forms, themes, accessibility and responsive breakpoints remain reusable Platform design-system primitives under F-06 → A-08 → DD-10.

## Security/authorization boundary

UI capabilities do not grant server authority. Table actions such as Edit/Delete/Archive/Restore execute only when the owning OperationContract, current resource state, permission/entitlement/security and data-lifecycle rules allow them. File components route through the governed Document upload/security pipeline.

## Scoped source examples

Several source items are not universal Platform semantics:

- Doctor and Report filters are Healthcare examples.
- Patient and Sample timelines are Healthcare-specific.
- Report Colors and H/L/HH/LL/Critical flags are Healthcare laboratory conventions.
- Patients, Doctors, Today's Collection, Pending Reports, Sample Status and Top Tests are Healthcare dashboard defaults.

The shared UI library remains reusable; the domain meaning is owned by Healthcare.

## Jurisdiction-sensitive validation

Required, Unique, Email, Phone, UUID, Slug, Age and Password Strength can be generic validators. GST, PAN and Aadhaar are India/jurisdiction/identity-provider-specific and must be activated through the relevant Country Pack/trust-service policy rather than hard-coded as global validation rules.

## Accessibility

Source status colors remain presentation tokens only. Canonical accessibility requires visible semantic labels/text and prohibits color-only state. The source Keyboard Navigation, High Contrast, ARIA Labels, Focus Ring and Screen Reader Support baseline is preserved and strengthened by the canonical WCAG 2.1 AA/reduced-motion rules.

## Boundary

This is source-owner/traceability reconciliation only. No UI implementation, token payload, runtime, schema/RLS or executable test changes. DD-208 remains the latest governed development checkpoint.
