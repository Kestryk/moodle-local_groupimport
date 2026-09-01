# EasyStud Wave 10 RF1 exact control parity

Date: 2026-09-01

Lots: `EED-UI-2026-0038-RF7` and `EED-UI-2026-0034-RF2`.

## Correction

- Group and Grouping contextual help now uses the accepted CCB Slideshow
  button structure, 1.15 rem circle, non-underlined states and visible focus.
- Enrollment-key help uses a shorter English/French message suited to the
  modal instead of the complete core help paragraph.
- The Group image control now uses the accepted stateful toggle contract:
  hidden submitted value, button, `aria-pressed`, on/off icon and label, visible
  transition and reduced-motion fallback.
- Administration reuses the existing Mass Import identity roles and hides the
  duplicate native settings heading, leaving one EasyStud identity.

The reference fixture records the exact CCB source commit and control geometry.
The focused contract compares the consumer structure and includes negative
guards for the retired long help and duplicate identity.

## Validation

- official Sass build;
- canonical Course Manager AMD build and generated source map;
- Wave 10 RF1 exact-parity, Wave 9 modal/panel, Administration Skeleton and
  typography/identity contracts;
- AMD runtime-format and JavaScript syntax checks;
- PHP syntax for settings, manager data and both language packs;
- release validation and `git diff --check`.

No browser, fixture data, Moodle cache or runtime preview was used in the source
worktree. Human review remains required for computed appearance and Motion.
