# EED-UI-2026-0030 to 0033 Platform-wave human validation

## One validation bundle

This is the sole human-validation bundle for the cumulative source candidate:
`EED-UI-2026-0030`, `EED-UI-2026-0032`, `EED-UI-2026-0033`, and the 0030 QA
audit. Do not split it into independent preview requests or run a broader
matrix before this bundle is reviewed.

The exact source-owned scenario is
`platform-wave-0030-0033.spec.js` / `EED-UI-2026-0030-0033 Platform wave:
global controls plus Mass Import and Administration no-script lifecycle`.
It is `local-supervised`: it needs one authenticated Moodle 5.1 runtime but
does not create or edit fixtures, settings, groups, users, cache or data.

## Required sequence

1. On Student Management, review the 0030 controls at 1440 x 1000 then at
   390 x 844: centred enabled and disabled top actions, the `Groups without
   grouping` surface/disclosure, bottom-of-block pagination and compact
   pagination-arrow focus. At desktop, activate Complete (`both`) for
   Participants and the visible Groupings tree, Participants for Groups
   Complete, then Structure for Groups Structure and the Groupings tree; the
   panels are intentionally hidden outside their owning layout mode. The
   Groupings tree is not a pagination owner in Complete mode. In Structure
   mode its pagination is threshold-based: a list that fits one page may have
   no pager (or only the top placeholder), while a list over the ten-item
   limit must have top and bottom pagers.
2. On Mass Import, review its normal JavaScript lifecycle (ready real content,
   no visible loading Skeleton) and then a JavaScript-disabled page (native
   navigation and form are visible; only the decorative Skeleton is hidden).
3. On Administration settings, review its normal JavaScript lifecycle (native
   settings after the bounded loading lifecycle) and then a JavaScript-disabled
   page (native settings are visible; only the decorative Skeleton is hidden).

The bottom pagination remains the final managed child of each paginated list.
Dynamic empty and filtered-empty states are inserted immediately before it, so
late lifecycle updates cannot push the pagination back into the card flow. A
subsequent pagination synchronization also moves an already-existing bottom
navigation back to the final-child position instead of only enforcing this
order when the navigation is first created.

The test uses one browser context for normal lifecycle checks and an isolated
JavaScript-disabled context for both no-script checks. It closes that isolated
context in `finally`; the supervised runner still owns credentials, runtime
lease and external artifacts.

Normal JavaScript captures are written only after the corresponding root is
ready and its real content or layout-specific assertions have passed. The
desktop capture therefore records the settled Complete layout, the mobile
capture records the active Groups workspace with its focused pagination arrow,
and the Mass Import and Administration captures cannot preserve a transient
loading Skeleton as human-review evidence.

## Required external captures

- `0030-global-controls-desktop.png`
- `0030-global-controls-mobile.png`
- `0032-mass-import-normal-lifecycle.png`
- `0032-mass-import-no-script.png`
- `0033-admin-normal-lifecycle.png`
- `0033-admin-no-script.png`

All captures belong in the external manifest-backed artifact directory, never
in Git. This source-only preparation does not authorize a runtime promotion,
cache purge, browser launch, lease, fixture mutation or human acceptance.
