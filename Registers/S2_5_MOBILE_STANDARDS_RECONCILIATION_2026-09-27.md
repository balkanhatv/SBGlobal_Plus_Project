# S2.5 MOBILE ARCHITECTURE STANDARDS RECONCILIATION — 2026-09-27

**Scope:** S2.5-U174…U206 in the immutable Mobile Architecture Standards source.

## Canonical mobile model

The source mobile knowledge is preserved under the current product model:

- exactly **two logical Tenant mobile apps**: `TENANT_STAFF_APP` and `TENANT_USER_APP`;
- Platform Owner/Super Admin mobile capability belongs to the separate **Platform Application / Platform Mobile** channel and is not counted as a Tenant app;
- roles such as Patient, Doctor, Student, Technician, Cashier and Guard remain context/RBAC-driven experiences inside those two Tenant app classes;
- React Native + Expo is the active mobile stack under UD-TECH-01.

## Source normalization

Flutter/Dart, Riverpod/Bloc/Cubit, Hive/SharedPreferences, direct FCM and direct JWT/refresh-token wording are historical implementation choices where they conflict with the active stack. Their underlying capability requirements—state, local/secure storage, push, sessions and offline operation—remain preserved.

Offline “automatic conflict resolution” is not interpreted as unconditional automatic merge. DD-11 permits declared safe strategies for low-risk data, requires reconciliation for controlled conflicts and prohibits naive last-write-wins for financial, stock, regulated and comparable high-integrity records.

The source Tenant User/Staff module lists are Healthcare mobile experience content. They mount in the reusable User/Staff app classes; they are not platform-wide module definitions or a template for the eight other current Industries. The source “flagship” posture is historical.

The source Super Admin app list maps to Platform Application capability inventory. A capability reaches Platform Mobile only through DD-10 PlatformChannelEligibilityPolicy with Product/Security approval and equivalent controls.

## Boundary

This is source-owner reconciliation, not mobile implementation or deployment certification. It changes no runtime/dependency/workflow and does not claim the mobile executable test suite or release pipeline is complete. DD-208 remains the latest governed development checkpoint.
