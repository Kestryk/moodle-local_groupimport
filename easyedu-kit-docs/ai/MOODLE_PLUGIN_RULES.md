# Moodle Plugin Rules

These rules are not a ticket log. They are durable rules learned from Moodle
plugin approval feedback and should be applied to every Moodle plugin built with
or around EasyEdu UI Kit.

## 1. User input always goes through Moodle APIs

Never read `$_GET`, `$_POST` or `$_REQUEST` directly in plugin code.

Use:

- `required_param()`
- `optional_param()`
- `required_param_array()`
- `optional_param_array()`

Use the most specific `PARAM_*` type possible.

Avoid `PARAM_RAW` and `PARAM_RAW_TRIMMED` unless there is no specific type and
the value is strictly validated immediately after reading.

## 2. User-facing text always goes through language files

All visible strings belong in `lang/*/pluginname.php`.

Do not hard-code visible text in:

- PHP output;
- Mustache templates;
- JavaScript;
- generated HTML attributes such as labels, button text or help text.

Language files should use simple assignments only:

```php
$string['identifier'] = 'Text';
```

Avoid concatenation, heredoc, nowdoc or runtime-generated string values.

## 3. Rendering should be template-oriented

Prefer Moodle output APIs and Mustache templates for reusable markup.

PHP should prepare data and perform access/security checks. Templates and SCSS
should own presentation. AMD modules should own interactive behaviour.

Inline HTML/JS/CSS in PHP is technical debt and should only remain as an
explicit transitional exception.

## 4. JavaScript must follow Moodle AMD expectations

When a plugin ships AMD build files:

- keep `amd/src` and `amd/build` synchronized;
- minified artifacts must be valid build output;
- when staging a component for a targeted Moodle Grunt build, retain its real
  plugin path (for example `local/groupimport`) and verify the generated
  `define()` module name before promoting the artifact;
- do not leave unminified code in `.min.js`;
- avoid inline page JavaScript when an AMD module can own the behaviour.

## 5. CSS should use Moodle loading and kit primitives

Do not manually require a plugin `styles.css` from pages unless there is a
documented Moodle compatibility reason.

Moodle normally aggregates plugin `styles.css`.

Reusable UI belongs in the EasyEdu kit. Plugin CSS should be scoped and should
not recreate kit primitives.

## 6. Tables and namespaces must use Frankenstyle names

Database tables should use the full plugin component prefix.

For example, component `local_course_banner_builder` should use table names like
`local_course_banner_builder_*`, not shortened variants that can collide with
another plugin.

## 7. Use Moodle APIs instead of direct core table shortcuts

Do not access core configuration tables directly when Moodle APIs exist.

Use:

- `get_config()`
- `set_config()`
- `unset_config()`

Avoid direct DML on `config_plugins`.

## 8. Large data processing must be memory-aware

Avoid loading unbounded datasets with `get_records()` when the site can contain
many rows.

Prefer recordsets for large loops:

- `get_recordset()`
- `get_recordset_select()`
- `close()` the recordset after use.

## 9. Temporary files use Moodle helpers

Use Moodle temporary/request directory helpers instead of ad hoc native temp
paths:

- `make_temp_directory()`
- `make_request_directory()`

Avoid native temp file writes such as direct writes under `$CFG->tempdir` unless
there is a documented exception.

## 10. Privacy API is mandatory

Every Moodle plugin must implement Privacy API metadata.

If the plugin stores no personal data, implement the null provider. Do not omit
Privacy API because the plugin "does not store users".

## 11. A root license file is required

The plugin package should include a root-level license file.

The license must be visible in the plugin root, not only mentioned in docs.

## 12. Development files must not leak into production packages

AI rules, development docs, tests, examples and local tooling can be committed to
Git, but they should be excluded from release archives when not intended for
Moodle production packages.

Use `.gitattributes` `export-ignore` or a release packaging script.

## 13. Import/export must be defensive

Import/export code must validate data before applying it.

Never trust imported settings blindly. Validate:

- context;
- plugin version/format;
- files and file areas;
- referenced categories/custom fields;
- JSON structure;
- enum values;
- booleans and numbers.

## 14. Moodle version compatibility must be deliberate

When supporting several Moodle versions, confirm APIs are available in all target
versions before using them.

For EasyEdu work, treat Moodle 4.5 and Moodle 5.1 compatibility as an explicit
design constraint unless the user says otherwise.
