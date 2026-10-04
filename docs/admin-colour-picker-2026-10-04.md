# EasyStud administration colour picker — 2026-10-04

## Scope

This slice consumes UI Kit `0.4.79` for the two existing participant-badge
colour settings. It does not yet add the broader semantic plugin-colour
settings requested in SM24 and it does not modify Course Banner Builder.

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

## Verification

- `tools/release/test-admin-color-picker-contract.ps1`
- PHP lint for `settings.php` and both language files
- JavaScript syntax check for `js/admin_settings_loading.js`
- full EasyStud Sass compilation and generated CSS parity

Native browser proof remains blocked by the independently recorded Moodle 5.1
MariaDB failure. Penpot propagation and human visual acceptance remain open.
