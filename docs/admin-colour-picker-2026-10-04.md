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
isolated colour-picker browser interaction and SCSS build evidence. It is
served in local Moodle 5.1 at preview HEAD
`9d6ed6768d53dc7022df7faf0bfe9536329d20f2` after a cache purge.
Read-only native run `easystud-authenticated-20261004T150423519Z-9736`
passes at 1600/768/390: the custom light Hex reveals the warning with
Foundation surface/border/ink, returning to the primary default hides it,
and the canonical grouping default shows no warning. Settings POST is blocked;
no configuration value was saved. Credentials and lease were released.
The whole mixed-background contrast matrix and human visual acceptance remain
open. Penpot product specimen `cf371b29-2e8e-8011-8008-bd1dadea4968`
links to Foundation Inline notification / Warning; the full responsive board
propagation has not been claimed.

## Foundation M geometry successor

The three Administration product boards use linked Foundation M/Default colour
picker instances that are 160px wide, with a 49.6px swatch and 12.48px Hex
value. Kit `0.4.86` (`a72c4cb`) fixes the public regular mixin to that width,
uses the strong field-border token and allows the authoritative Hex lane to
shrink within the control. The same `_forms.scss` is embedded in EasyStud and
`styles.css` was rebuilt. Small/large widths remain separate design contracts;
the existing native colour validation, defaults and contrast behaviour are
unchanged. A new guarded native test measures all seven settings controls at
1600/768/390; it must pass on the served candidate before calling this
runtime-verified. Human visual acceptance remains open.

The linked Administration boards put “Default” on the same line as the picker:
24px to its right on desktop and 16px on tablet/mobile. Kit `0.4.87` adds a
public Moodle admin-setting layout adapter for those generated siblings.
EasyStud opts in for all seven colour rows without changing the native input
names, Hex synchronization or warning condition. The responsive browser test
now checks the picker/default horizontal and vertical relationship, plus
warning and help containment. Native promotion is still required for this
new layout candidate; previous preview evidence applies only to Kit `0.4.86`.
