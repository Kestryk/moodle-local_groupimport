# Group member rows — public Foundation classes

EasyStud's static and dynamically created Group member rows now consume the
Kit 0.4.78 public related-person class family. The existing Kit recipes and
visual output remain authoritative; product-only selector adapters no longer
re-emit their paint.

## Ownership

- Kit/Foundation classes own the row surface, selection lane, subordinate name
  typography and compact removal control.
- EasyStud retains member identifiers, selection semantics, removal commands,
  disclosure/fade Motion, pagination and responsive routing.
- The Mustache compositions and `createMemberItem` use the same four classes,
  preventing AJAX-created rows from drifting from initial server rendering.

Static contracts and targeted Sass/AMD builds pass. Managed run
`easystud-authenticated-20261004T002421409Z-648` verifies the four public
classes, contained geometry, 13px/600 subordinate name role, hover and keyboard
focus at 1600/768/390 without activating Remove. Measurements are stored in
`docs/testing/student-member-row-public-classes-preview-2026-10-04.json`.
Existing Penpot member-row publication is retained; human acceptance remains
open.

## Emplacements à réviser

- `scss/easyedu/_foundation-classes.scss`
- `scss/easyedu/components/_cards.scss`
- `scss/components/_structure.scss`
- `templates/manage.mustache`
- `amd/src/course_manager.js`
- `amd/build/course_manager.min.js`
- `tools/release/test-student-member-row-contract.ps1`
- `tools/playwright/student-member-row-foundations.spec.js`
- `docs/testing/student-member-row-public-classes-preview-2026-10-04.json`
- Foundations related-person/member-row family
- EasyStud Group and Grouping member-row compositions
