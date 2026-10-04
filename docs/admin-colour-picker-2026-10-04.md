# EasyStud administration colour picker — 2026-10-04

## Scope

The base colour-picker slice consumed UI Kit `0.4.79`; the nonblocking warning
successor consumes Kit `0.4.84`. The two existing participant-badge colour
settings remain, alongside the five SM24 semantic plugin colours: Primary,
Accent, Participant, Group and Grouping. It does not modify Course Banner
Builder.

## Ownership

- UI Kit owns S/M/L geometry and resting, hover, focus, invalid, read-only and
  disabled paint through public `easyedu-color-picker*` classes.
- EasyStud owns Moodle setting validation, persistence and the small
  swatch/Hex synchronization controller.
- The named editable Hex field is authoritative. The native colour swatch is
  unnamed, so it cannot overwrite an incomplete or invalid typed value during
  form submission.
- No colour-picker presentation mixin remains in the EasyStud administration
  view stylesheet.
- Six-digit Hex is the only hard validation. Malformed direct database values
  still fall back to the canonical Kit defaults, while valid light colours stay
  saved and visible in the native swatch. Text/action semantic tokens are
  darkened to at least 4.5:1 against white; soft surfaces retain the chosen
  colour. The Kit warning notice explains a live adjustment without blocking
  Save. This is a scoped contrast guarantee, not proof for every composite
  surface or native theme.
- Canonical default Hex values are not labelled as an administrator-made
  adjustment; only a different, valid light choice shows the notice.
- Both Student Management and Mass Import receive the same validated custom
  properties. Strong, soft and rail variants are derived with CSS `color-mix`
  rather than duplicated PHP presentation values.

## Verification

- `tools/release/test-admin-color-picker-contract.ps1`
- `php tools/release/test-theme-palette-standalone.php` (no database or form write)
- PHP lint for `settings.php` and both language files
- PHPUnit coverage for defaults, invalid values, generated properties and
  contrast endpoints in `tests/lib_test.php`
- JavaScript syntax check for `js/admin_settings_loading.js`
- full EasyStud Sass compilation and generated CSS parity

The initial native browser blocker is historical; Moodle 5.1 administration
controls passed a read-only three-width preview on the preceding strict-guard
revision. This lighter-palette successor has PHP lint, static contract,
isolated colour-picker browser interaction and SCSS build evidence. Its own
native responsive colour proof and Penpot warning propagation remain open.
