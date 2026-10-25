# K23-48 ? Grouping coverage verified on the integrated state

The requested extension is already present. Commit `960ba61a` is explicitly
"preserve grouping title space before More actions" and its durable note
`card-title-priority-2026-10-24.md` already describes both card families.
`ensureNestedGroupActionMenus` collects Group and Grouping cards, reserves the
same 7.5rem title budget, overflows secondary actions, then applies the shared
`card-header-readable-fallback`. Constrained responsive Groupings additionally
reuse `identity-card-action-clearance($flow: true)` and the terminal overflow
slot. Adding another implementation would duplicate the existing policy.

Replayed the existing strict native title/overflow candidate on the current
integrated source (20724e26), without product changes. FR/EN, widths
1600/1280/1150/1050/390, drawer closed/open, short/long titles, one to six
original actions. Presentation-only stress overrides restore each original
name/action state and do not write course records. At mobile, an open native
drawer is a blocking overlay, observed separately; clicks through it are not
claimed as usable interactions.

434 observations: 432 card cases plus two mobile drawer-overlay observations.
All strict title-budget, action accounting, collision/containment assertions
pass. All 12 menu open / Escape / outside-click / viewport checks pass.
Group terminal count stays after More: minimum measured gap 5.59375px.
No JS page error. No Group/Card controller, template or card CSS was modified.

Long Grouping title available width (ranges across locale/drawer/action count):

| Viewport | Title width | Header control overflow | Result |
| --- | --- | --- | --- |
| 1600 | 120.19?406.69px | 0.00px | PASS |
| 1280 | 120.19?246.69px | 0.00px | PASS |
| 1150 | 153.69?193.69px | 0.00px | PASS |
| 1050 | 112.78?143.69px | 0.00px | PASS |
| 390 | 143.16?143.16px | 0.00px | PASS |

The short title is intentionally intrinsic, so it is not required to fill 120px.
The long-title minimum is capped by physical mandatory selector/chevron space,
as in the unchanged original oracle. A 390px fallback is a separate title row.

No corrective runtime commit is necessary for this request. The following
Guide hover repair is a separate component and must not be described as a
Grouping overflow fix. Native proof remains in the external review report.
