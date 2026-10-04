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

## Native balance and product header successor

Runtime `f98f214a7e11d7d82da9118b3beb3b0ab70552a8` serves Kit 0.4.88.
Read-only run `easystud-authenticated-20261004T180319650Z-36912` passes
at 1600/768/390 with the file picker ready before capturing. It measures both
35.2px compact tiles, 16px titles, 14.4px descriptions, desktop 44/56 tracks,
responsive stacking and aligned text lanes. The 390px header centres its title
alongside the icon and moves the description to a full-width row. No upload,
import, settings POST, fixture or page error occurred. Earlier run
`easystud-authenticated-20261004T175925728Z-13136` proves the same header
geometry but its capture preceded picker readiness; it is not the finished
deposit specimen. Both runs and cleanup records remain preserved externally.

EasyStud page 01's six initial/uploading compositions now use the matching
35.2px tile and 17px linked glyph roots. Desktop/tablet copy shares a 46.4px
text offset; mobile uses a 51.2px title offset, centred 19.2px title line and
full-width description. Existing tile paint, semantic colours, icon links,
other subcomponents and outer boards are preserved. Board IDs:

- Desktop initial `5daf2376-ada4-8014-8008-ad9c0e35b6c1`;
- Desktop uploading `01e728c3-f1ef-80b3-8008-b5077a35e3e4`;
- Tablet initial `01e728c3-f1ef-80b3-8008-b30ccf0c8730`;
- Tablet uploading `01e728c3-f1ef-80b3-8008-b5087f48418c`;
- Mobile initial `01e728c3-f1ef-80b3-8008-b30dbbe5ee83`;
- Mobile uploading `01e728c3-f1ef-80b3-8008-b50884f1204f`.

The 454px mobile outer board intentionally contains a 390px course viewport
with 32px margins: do not shrink that outer documentation frame to 390px.
Foundation's connected catalogue contains semantic panel shells and linked
icons, but no section-icon-tile provider for the existing canonical SCSS
regular/compact roles. Publishing that missing shared provider in Foundations
Standard/Library, then linking these existing product wrappers, remains OPEN.
No competing EasyStud library control was created. Preview/report/validation
headers outside these six boards, the full state matrix and human acceptance
remain separate propagation gates.

The static balance contract retains its exact family commit pin while allowing
later additive Kit versions; an equality check against historical 0.4.81 would
incorrectly reject the current 0.4.88 consumer.

### Settled compact rail correction

The collapsed CSV position still subtracted the old 40.8px tile while the
public compact tile is 35.2px. A new compiled-CSS browser regression fails on
the served predecessor with a measured 2.8125px centre delta. The composition
now reads `--easyedu-section-icon-size-compact` rather than the stale 2.55rem
literal. This is layout only: shared paint, track size, animation controller,
duration/easing and opening/closing sequencing are unchanged. The isolated
1600/1440px settled-rail test is not native timed-disclosure proof. Preserve
that separate gate; do not upload a test file merely to obtain a screenshot.
Sass and the isolated successor pass. Generated CSS changes one declaration
only; the existing `_layout.scss:101` Sass deprecation warning is unchanged.
The native successor applies and restores temporary preview/collapsed classes
on the real initial DOM solely to measure settled framing. It reports that
scope explicitly and never creates a file, preview transaction or import.
