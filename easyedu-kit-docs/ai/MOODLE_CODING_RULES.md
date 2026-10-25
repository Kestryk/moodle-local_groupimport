# Moodle Coding Rules For EasyEdu UI Work

This file summarizes Moodle rules that matter when integrating EasyEdu UI Kit
changes into Moodle plugins.

## Security and input

- Do not read `$_GET`, `$_POST` or `$_REQUEST` directly in plugin code.
- Use `required_param()`, `optional_param()` or array-specific Moodle helpers.
- Avoid `PARAM_RAW` unless there is no specific safe type and strict validation
  happens immediately after reading.
- Validate JSON payloads and constrained option names before using them.

## Strings

- User-facing strings belong in `lang/*/pluginname.php`.
- Do not hard-code visible strings in PHP, Mustache or JS.
- Language files must contain simple `$string['id'] = 'value';` assignments.
- Keep language files ordered if the target plugin enforces that standard.

## Rendering

- Prefer Mustache templates and output data arrays for reusable markup.
- Keep PHP focused on access checks, data preparation and Moodle APIs.
- Keep presentation in templates and SCSS.
- Keep dynamic behaviour in AMD modules.

## JavaScript

- Moodle plugin JavaScript should be AMD-compatible.
- Source and build artifacts must stay in sync when the plugin ships build
  files.
- Avoid inline JavaScript unless the target plugin has a deliberate transitional
  exception.

## SCSS and CSS

- Scope component styles under plugin or kit roots.
- Do not introduce global style leakage.
- Avoid inline styles for reusable UI.
- Prefer kit tokens, variables and mixins.
- Do not manually require plugin `styles.css` in Moodle pages when Moodle loads
  it automatically, unless the plugin documents a specific compatibility reason.

## Files and privacy

- Use Moodle file APIs and temp helpers instead of native ad hoc temp paths when
  plugin code handles files.
- Plugins must implement the Privacy API, even when they store no personal data.

## Database and config

- Plugin tables should use the full Frankenstyle prefix.
- Use Moodle config APIs (`get_config`, `set_config`, `unset_config`) instead of
  direct `config_plugins` DML.

## Release packaging

- Development-only docs, AI rules, tests and examples can stay in Git.
- Exclude development-only files from release archives with `.gitattributes`
  `export-ignore` or a release build script.

