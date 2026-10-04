# Mass Import balance — 2026-10-04

This successor to `EED-UI-2026-0073` narrows only the visual hierarchy of the
initial Mass Import composition. It does not change upload, preview, import,
report, rollback or navigation behavior.

## Source decisions

- Page, section and body typography retain the measured Penpot roles already
  documented for the board: 16 px section titles and 14.4 px body copy.
- The two major panel identities use UI Kit `0.4.81` compact icon tiles
  (35.2 px) and the matching compact header track.
- The file-deposit and automatic-identification artwork remain on the regular
  40.8 px family so the upload task keeps its stronger internal landmark and
  both subcomponents remain aligned.
- The initial two-column layout retains its 44/56 ratio but both tracks now use
  a zero minimum, avoiding artificial width pressure before the documented
  one-column breakpoint.
- The initial no-results state grows through product composition only; its
  border, typography, icon and dash recipe still come from the shared Kit.

## Validation boundary

The focused static contract and generated Sass prove source composition only.
Penpot publication is pending because no Penpot connector is available. Native
browser and human visual acceptance are also pending while the local Moodle
database is unavailable. No upload or import action is executed by this lot.

## Empty-state typography successor

The historical validation boundary above is from the first balance candidate.
The current Penpot connection is available. Foundation Standard 08.13 and
Library 08.13.1 now give Default, Inline and Search empty descriptions the
12.16px caption role. The linked EasyStud Mass Import Default copy uses that
role on Desktop, Tablette 1024 and Mobile 390. Settled readback retains links,
centred vertical paint and containment; the mobile empty-state export was
visually inspected. UI Kit 0.4.85 maps `.easyedu-empty p` to the same public
caption mixin, without a product font override. The fixed SVG dash cadence,
outer geometry and icon remain untouched. Native Moodle proof and human review
remain separate gates.
The compiled-CSS isolated Chromium scenario
`tools/release/test-mass-import-empty-caption-browser.js` passes at
1600/768/390 for font size, 11px/11px SVG dash cadence and text containment.
It does not replace a real course-view browser check.
The read-only native Moodle candidate
`tools/playwright/mass-import-empty-caption-readonly.spec.js` checks that
course 5 renders the caption and fixed dash at 1600/768/390, with no upload
or POST; its result must be recorded separately after the managed run.
Moodle 5.1 now serves preview HEAD `e0102e7d1372a14187d72308f293cd3f34f646e7`.
Managed read-only run `easystud-authenticated-20261004T152059921Z-13888`
passes all three widths, shows 12.16px native copy and the 11px/11px SVG dash,
with text contained and no horizontal overflow/page error. The mobile capture
was visually inspected; no upload or POST occurred. Credentials and runtime
lease were cleared. Human acceptance remains open.
