# Desktop sticky Clear selection — Kit 0.4.77 consumer proof

EasyStud now consumes the shared Kit recovery capsule for clearing a desktop
selection. The surface is centred on Moodle's rendered canvas, remains fully
contained, and reserves enough document space for the final list row and bottom
pagination.

## Verified behavior

- the capsule appears after selecting a participant at desktop widths;
- the surface uses the shared quiet border, full capsule radius and soft shadow,
  without the former gradient or heavy left rail;
- the capsule is centred with zero measured delta at 1600 px and 1100 px;
- 80 px of bottom clearance keeps the final content and pagination reachable;
- activating Clear selection hides the capsule and removes the selected state;
- no plugin business request is emitted.

Managed run `easystud-authenticated-20261004T000853019Z-41124` passes at
1600/1100. Durable measurements are in
`docs/testing/student-sticky-selection-preview-2026-10-04.json`.

This closes source and managed-preview proof only. Foundation/EasyStud Penpot
publication and human acceptance remain open.

## Emplacements à réviser

- `scss/easyedu/components/_panels.scss`
- `scss/components/_layout.scss`
- `templates/manage.mustache`
- `tools/release/test-student-sticky-selection-contract.ps1`
- `tools/playwright/student-sticky-selection-preview.spec.js`
- `docs/testing/student-sticky-selection-preview-2026-10-04.json`
- Foundations selection-action surface board
- EasyStud Student Management desktop selection compositions
