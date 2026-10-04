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

## Neutral action continuation, 4 October 2026

The desktop capsule's Clear selection button now opts into the linked
Foundation Selection action / Small / Neutral outline skin. The existing
capsule geometry and selection command are unchanged. EasyStud Penpot page 03
has a dedicated `Student management — Desktop / Sticky clear selection` board
(`cf371b29-2e8e-8011-8008-bd2decf669f1`); its button remains linked to
the Foundation component, with the circle-xmark icon and Clear selection
label. The exported board was inspected and its descendants are contained.

Native run `easystud-authenticated-20261004T155851126Z-3644` passes at
1600/1100: the neutral label is 12.48px/600, the capsule has zero centring
delta, bottom pagination stays unobscured and Clear selection closes the
surface. No plugin business request was issued. This is local preview and
visual-source evidence, not human acceptance. The combined checklist stays
open.

## Emplacements à réviser

### Paired catalogue successor, 4 October 2026

Foundations now publishes the shared Desktop selection recovery / Visible
component on 08.12 Standard and 08.12.1 Library. EasyStud page 03 consumes that
linked capsule (`cf371b29-2e8e-8011-8008-bd5e281d5df1`), rather than its earlier
ordinary composition. The old shape remains hidden and recoverable in the same
board. The new specimen has zero horizontal centre delta, a 30.4px compact
neutral button and a centred circle-xmark in the same muted colour as its label.
The public capsule padding/gap and soft shadow now match the existing source
recipe. Source/Standard paint fingerprints match; exported Standard was inspected.

No SCSS, Mustache, controller or selection-command change is required: native
already used these Kit recipes. The focused native test now additionally records
button size, capsule padding, count typography and icon colour. Its fresh result
is pending managed execution; the earlier preview runs remain historical proof.
Human acceptance is not implied by the linked publication.

Evidence: `docs/testing/student-sticky-selection-publication-2026-10-04.json`.

- `scss/easyedu/components/_panels.scss`
- `scss/components/_layout.scss`
- `templates/manage.mustache`
- `tools/release/test-student-sticky-selection-contract.ps1`
- `tools/playwright/student-sticky-selection-preview.spec.js`
- `docs/testing/student-sticky-selection-preview-2026-10-04.json`
- Foundations selection-action surface board
- EasyStud Student Management desktop selection compositions
