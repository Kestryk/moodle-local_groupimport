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
