# Moodle Plugin Review Checklist

Use this checklist before sending a plugin to Moodle review or before merging a
large EasyEdu plugin change.

## Security

- [ ] No direct `$_GET`, `$_POST` or `$_REQUEST` access remains.
- [ ] Parameter reads use Moodle `required_param*` / `optional_param*` helpers.
- [ ] `PARAM_RAW` usage is absent or documented with immediate strict
      validation.
- [ ] Imported JSON/settings are validated before use.
- [ ] Form actions check `sesskey` when they mutate state.

## Strings

- [ ] User-facing strings are in language files.
- [ ] Language files are simple `$string['id'] = 'value';` assignments.
- [ ] Language strings are ordered if the plugin coding workflow expects it.
- [ ] JS-visible strings are passed through Moodle string APIs.

## Rendering and UI

- [ ] Reusable UI comes from EasyEdu UI Kit or is added to the kit first.
- [ ] Templates are used for reusable markup where practical.
- [ ] No new inline CSS/JS was added for reusable behaviour.
- [ ] Custom help/tooltip components do not duplicate native `title` tooltips.
- [ ] SCSS is scoped to plugin or kit roots.

## JavaScript

- [ ] AMD source passes syntax check.
- [ ] AMD build artifacts are regenerated when source changes.
- [ ] `.min.js` files are actually minified build output.
- [ ] Page inline JS is avoided or documented as transitional.

## CSS

- [ ] Plugin pages do not manually require plugin `styles.css` unless documented.
- [ ] SCSS compiles.
- [ ] `git diff --check` passes.
- [ ] EasyEdu audit strict mode passes when kit files changed.

## Database and APIs

- [ ] Plugin table names use the full Frankenstyle component prefix.
- [ ] Core config uses `get_config`, `set_config`, `unset_config`.
- [ ] Large loops use recordsets when datasets can grow.
- [ ] Temporary files use Moodle temp/request helpers.

## Privacy, license and packaging

- [ ] Privacy API provider exists.
- [ ] Root `LICENSE` exists.
- [ ] Development-only files are excluded from release packages.
- [ ] Package does not contain local screenshots, debug logs or test artifacts.

## Compatibility

- [ ] Target Moodle versions are listed.
- [ ] API usage is compatible with supported Moodle versions.
- [ ] Upgrade steps handle already-installed data.
- [ ] Fresh install and upgrade from previous version are both considered.

## Final report

Before merge/release, report:

- commands run;
- issues fixed;
- remaining manual review points;
- unsupported or intentionally deferred rules.

