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

### Compact sibling successor, 2026-10-04

Kit 0.4.89 (`f0f5e33`) maps the existing borderless Foundation Filter toggle
Off/On providers to public `easyedu-filter-toggle`, separately from the generic
framed `easyedu-toggle-check` used in the Move dialog. The two catalogue labels
consume this class only: native input, commands and predicates are untouched.
The shared track is 36x20px, thumb 14px, label gap 12px, type 12.16px and hit
row 44px. Reset uses caption 12.16px and 30.4px desktop / 44px touch minima.
The four changed canonical SCSS sources are byte-identical in the consumer.
Shared run `filter-controls-20261004-182400` passes geometry, keyboard, disabled
preservation and RTL travel at 1600/768/390; no Moodle/data is involved.

Desktop Toggle/Reset composition now centres both controls on the same row.
The mobile controller clears Desktop Structure focus, so the Groups workspace
must explicitly reveal its own catalogue filters; otherwise More Filters
opened an empty shell. This visibility correction is scoped to responsive
Groups only, not desktop Complete or the Groupings workspace.

EasyStud page 03's existing linked touch hosts are retained:
Toggle `df1dc7b5-2b58-807e-8008-bc370e996517` and Reset
`df1dc7b5-2b58-807e-8008-bc370f07f6c0` now use 324x44px rows with centred
content. Desktop hosts keep their original shared dimensions. The Foundation
On track still has historical fixed blue `#1476c8`; catalogue follow-up must
map it to the shared configurable primary role. A dedicated linked touch Reset
source specimen must also be published in Standard/Library. Product host
resizing is not certification of those source changes. Human checklist remains
open. Native successor is the write-guarded
`student-compact-filter-controls-preview.spec.js`; its result is recorded
separately after managed preview, not inferred from the isolated test.

The Filter-controls static contract now allows later additive Kit revisions
instead of requiring historical 0.4.73. It still rejects private toggle paint
and verifies public classes and the two-row catalogue composition.

This lot changes presentation classes and layout only. It does not change
filter values, selection semantics, disclosure Motion or any data endpoint.
