# EED-UI-2026-0039-RF1 - EasyStud Administration hierarchy

## Scope

This source-only correction harmonises the EasyStud Administration page with
the semantic typography and icon sizing already used by Student Management.
It covers the page title, panel headings, section headings, explanatory body
copy, setting labels and the small icon tiles in `local_groupimport`.

The identifier explanation panel no longer uses the stronger radial/diagonal
visual family. It uses the quiet shared panel surface and the same restrained
icon tile proportions as the EasyStud management cards. Text, setting names,
Moodle form markup, storage and all administrator controls remain unchanged.

## Mapping and preservation

| Administration element | Kit role or treatment |
| --- | --- |
| Settings page heading | `type-page-identity` |
| Moodle setting and identifier headings | `type-panel-title` |
| Identifier/custom-field headings | `type-section-title` |
| Explanations and helper body copy | `type-body` |
| Setting labels and hint lead-ins | `type-control-label` |
| Identifier chip metadata and empty state | `type-caption` |
| Hero icon tiles | Student Management 2.55rem tile proportions |

The native multiselect `User fields allowed for identification` keeps its
existing selector, dimensions, options, focus ring and Moodle submission
semantics. No settings or logic were changed.

The More filters disclosure receives a local `type-more-filters-label` alias
to the existing Kit eyebrow tier. It preserves the current 0.03em compact
tracking and only gives the selector a reusable semantic name; toggle markup,
state, disclosure behaviour and panel independence are untouched. No shared
UI Kit source was changed because this is a consumer-only naming alias.

## Validation boundary

- Sass is rebuilt from `scss/easystud.scss` into `styles.css`.
- `tools/release/test-typography-identity-contract.ps1` checks the source,
  generated CSS, icon dimensions, More filters alias and multiselect boundary.
- `git diff --check` and the plugin release validation are run.
- No browser, runtime lease, cache purge or preview is run in this source-only
  lot. Human visual review remains a separate preview gate.
