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
contract pass. Fresh managed Moodle proof and paired Foundation/Product Penpot
publication remain pending. Human acceptance remains open in the combined
checklist.

## Safety

This lot changes presentation classes and layout only. It does not change
filter values, selection semantics, disclosure Motion or any data endpoint.
