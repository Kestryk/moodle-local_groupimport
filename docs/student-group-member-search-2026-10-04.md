# Group-card member search — canonical responsive continuation

This continuation closes the source/runtime gap recorded for the magnifier on a
Group card. It does not close the combined human checklist or claim a Penpot
propagation that was not performed.

## Result

- The generated member-search field now consumes the same public
  `easyedu-search-field` class as the source Group-in-Grouping search.
- Desktop keeps the direct magnifier in the Group header.
- At responsive widths, where direct header actions are intentionally hidden,
  the existing card action menu now exposes `Search participants` and forwards
  to the same card-owned panel.
- Typing filters members only inside the owning Group card. It does not reinsert
  the card through pagination on every keystroke.
- No-result feedback and Cancel use the existing card-local behavior; Cancel
  clears the query, restores all member rows and closes the panel.
- No private inline style or new visual primitive was introduced.

## Evidence boundary

Static contracts:

- `tools/release/test-student-group-member-search-contract.ps1`
- `tools/release/test-student-selected-members-contract.ps1`
- PHP lint on `manage.php`
- targeted Moodle Rollup for `amd/src/course_manager.js`

Managed local preview:

- first run `easystud-authenticated-20261003T232633811Z-31512` failed at 768px
  because the responsive action sheet did not contain member search. This was a
  real product gap, not retried unchanged.
- successor run `easystud-authenticated-20261003T233009655Z-46664` passes at
  1600, 768 and 390px. It covers direct and responsive-menu entry, focus,
  matching and empty queries, equal field/Cancel height, Cancel restoration and
  zero plugin business requests.
- durable measurements are recorded in
  `docs/testing/student-group-member-search-preview-2026-10-04.json`.

No member, membership, group or course data was created or changed. Human
acceptance and the matching EasyStud Penpot responsive-menu composition remain
open for the combined checklist.

## Kit action continuation, 4 October 2026

The Group and Grouping inline-search Cancel actions now use the public
`easyedu-button easyedu-button--secondary` class in both Mustache and generated
cards. The EasyStud Penpot page 03 already uses a linked Foundation secondary
M action next to the linked search field in these inline-search compositions;
no new visual variant was created.

- Native Group search run `easystud-authenticated-20261004T153417127Z-33204`
  passes at 1600/768/390. Field/Cancel heights match (38/38 on desktop and
  42.390625/42.390625 at responsive widths); search and Cancel issue no
  business request.
- Native Grouping search run `easystud-authenticated-20261004T154948855Z-31868`
  passes: field and Cancel both measure 38px at desktop, share the same top
  coordinate, and Cancel clears and hides the search panel. The direct trigger
  remains hidden at 768/390 per the existing responsive contract. No business
  request was issued.
- A broader legacy inline-feedback test was attempted twice. Both runs stop
  before the updated search assertion because Moodle's `main-inner` intercepts
  the Grouping disclosure click. This is a distinct unresolved test/viewport
  issue, not evidence that the new Grouping search failed. Runs:
  `easystud-authenticated-20261004T154441760Z-29492` and
  `easystud-authenticated-20261004T155042606Z-19312`.

The managed preview is Moodle 5.1 local only. No participant/group data or
settings were changed. The combined human checklist remains open.

## Emplacements à réviser

- `amd/src/course_manager.js`
- `manage.php`
- `tools/playwright/student-group-member-search-preview.spec.js`
- `tools/release/test-student-group-member-search-contract.ps1`
- `docs/testing/student-group-member-search-preview-2026-10-04.json`
- EasyStud Penpot page 03: Group card responsive action-menu state
