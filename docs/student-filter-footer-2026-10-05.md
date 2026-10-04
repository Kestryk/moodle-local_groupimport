# SM-43A — More Filters footer

Scope: hover and minimum clearance only. The binary Groups without grouping
toggle is SM-43B, still pending; human combined checklist stays OPEN.

## Diagnosis and contract

Native baseline `easystud-authenticated-20261004T231353640Z-24236` passes
9 available routes at 1600/768/390 and records the deliberately hidden desktop
Groupings disclosure. Desktop gaps were 3.52/4/5.59px; compact buttons were
roughly 102–114px wide instead of filling their 269–535px lane.

Kit 0.4.99 uses transparent Hover/Expanded, primary-strong text and an underline
on the hovered label only. Original font 12.16px/400, 6.72px chevron gap,
keyboard ring, disabled state and all panel/arrow Motion are retained.
Wide/Touch fill the available width; embedded Compact remains natural-width.
The public footer row reserves 16px internal padding even when equal-height
product shells retain their auto margin.

Four Mustache row classes consume the Kit. Two obsolete private row blocks
are removed; native layout/focus adapters and the intentionally hidden desktop
Groupings row remain. No PHP/AMD/native filtering/action changes.

## Penpot crosswalk and reversibility

Foundations file `40e06342-8830-80d6-8008-96572effc11c`:
Standard 08.5 `d0d0680d-7d36-80da-8008-97a6a5b5b9d6`,
Library 08.5.1 `3ade82ad-bce8-8059-8008-9c07259b5c06`.
Five Wide + five Touch recursive pairs pass geometry/type/paint comparison.
Touch catalogue now demonstrates the same 544px available lane without board
overlap. Existing paired action-row duplicates are aligned; toggle unchanged.
Shared footer providers demonstrate actual 16px inset above the linked trigger.
Exact IDs: `testing/filter-footer-foundations-2026-10-05.json`.

All 20 effective-visible EasyStud consumers are on 03 Student management.
Readback: no glyph/text containment or painted centre/gap issue. Three compact
filter surfaces grow 12.4px; following siblings shift by the same amount.
One canonical small composition receives 5px extra clearance within its existing
parent. Other text, commands and card appearance remain intact.
Exact geometry and flow deltas: `testing/filter-footer-product-2026-10-05.json`.
Plugin data `sm43Before` / `sm43FlowBefore` retain the prior values; no material
design deletion. A library-update click timed out after applying; readback
confirmed it before proceeding, and only the two owned CDP helpers were stopped.

## Proof boundaries

- `tools/release/test-filter-footer-successor-source.js`: PASS against
  `64d5bf5`, canonical byte parity, exact class-only template, unchanged
  equal-height layout, PHP/AMD/Motion and entire unrelated CSS. Arrow selectors
  are explicitly not excluded from the CSS comparison.
- Isolated `filter-footer-20261005-b`: PASS 12 cases (3 widths ×
  Wide/Touch/Compact/legacy), rest/hover/focus/open/disabled and 16px padding.
  First `-a` preserves a harness blur/focus failure; successor moves focus to
  the actual next control and asserts it. No recipe relaxation.
- SCSS-only distribution contract PASS: no internal agent/doc files.
- Native served successor: pending promotion and fresh supervised run.
- Full view parity, reduced-motion native routes, binary-toggle redesign and
  human acceptance are NOT inferred.

External media remains manifested under the owned Kit/native runs. Retention
is dry-run only, zero deletions. No fixture request or business POST.
