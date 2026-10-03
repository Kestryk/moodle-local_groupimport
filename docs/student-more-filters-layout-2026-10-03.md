# Student More Filters layout and controls — 2026-10-03

## Scope

SM-30 replaces three locally painted filter controls with public Kit 0.4.73
roles:

- `easyedu-filter-disclosure` for More Filters;
- `easyedu-toggle-check` for `Groups without grouping`;
- `easyedu-filter-reset` for Reset.

The Group catalogue filter uses one full-width searchable Grouping choice on
the first row, followed by the labelled toggle and Reset action on one coherent
second row. Narrow layouts retain the same order in one column. The gap before
More Filters is increased without changing the existing disclosure controller,
timing, ARIA state or filtering business logic.

The Kit owns paint, typography, hover, focus-visible, checked and disabled
states. EasyStud retains only placement and responsive flow. The static contract
rejects a consumer redraw of the toggle track.

## Evidence status

Kit source and SCSS-only package contracts pass at 0.4.73. The first managed
Moodle pass exposed an order-dependent specificity defect: the wide public
class overrode the consumer's canonical touch-density adapter at 390 px. Kit
0.4.73 lowers only that public default selector's specificity; no local paint
override was added. The consumer Sass build and focused source/generated
contract pass. Managed run
`easystud-authenticated-20261003T215244587Z-15616` then passed at
1600/768/390 px: the disclosure measures 33.59/44/44 px, retains the 12.16 px
label and 6.72 px icon gap, and completes both disclosure directions. No
business request or fixture ran; cleanup cleared credentials and released the
lease. Foundations now publishes linked Toggle Off/On, Reset
Rest/Hover/Focus-visible and More Filters Wide/Touch components. The Standard
board and EasyStud desktop/mobile catalogue composition instantiate those
components; settled readback keeps every shape contained and the visual export
was inspected. Human acceptance remains open.

Penpot evidence is recorded in
`docs/testing/student-more-filters-layout-penpot-2026-10-04.json`.

## Safety

This lot changes presentation classes and layout only. It does not change
filter values, selection semantics, disclosure Motion or any data endpoint.
