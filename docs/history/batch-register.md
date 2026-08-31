# EasyStud batch register

## Waves RF6 - AMD runtime format repair

- Date: 2026-08-31
- Cause: RF4 shipped Course Manager as raw ESM, so Moodle RequireJS aggregation
  parsed a top-level `import` while loading unrelated Core modules.
- Correction: rebuild the exact RF4 source with Moodle Grunt and Node 22.11;
  require every generated EasyStud bundle to start with its AMD `define` call
  and contain no top-level module declarations.
- Validation: `tools/release/test-amd-runtime-format-contract.ps1`, RF4/RF5 and
  RF3 contracts, Node syntax and `git diff --check`; no browser scenario.

## Waves 1-3 corrective RF4/RF5

- Date: 2026-08-31
- Lots: `UI0038-RF4` Participant/Group/Grouping modal parity and `UI0049-RF5`
  Mass Import operational copy.
- Scope: exact Participant native-profile footer reference; shared compact
  Group/Grouping titles, labels, values, badges and proportions; local CCB
  Slideshow-compatible help control; explicitly named compact Mass Import
  paragraphs.
- Preservation: entity/modal semantics, form values, disclosure Motion,
  accepted page identity/introduction and all import workflow logic.
- Exclusions: shared Kit/CCB source, runtime, preview, cache, fixtures and
  browser checks.
- Validation: official Sass/AMD builds, focused RF4/RF5 contract, syntax and
  `git diff --check`.

## Waves 1-3 corrective RF3

- Date: 2026-08-31
- Lots: corrective follow-up for `EED-UI-2026-0038`, `0039`, `0049` and
  intro-spacing `0051`.
- Scope: quiet Administration hierarchy; left-aligned disclosure chevrons and
  compact labels, values, counters, help and checkbox treatment across the
  three entity modal families; compact Mass Import operational copy and a
  visible introduction-to-navigation gap.
- Preservation: native settings controls/storage, entity persistence, modal
  Motion/reduced-motion behavior and all Mass Import actions remain unchanged.
- Exclusions: shared Kit migration, preview/cache/fixtures and browser checks.
- Validation: official Sass/AMD builds, focused RF3 and established regression
  contracts, PHP/JavaScript syntax, release validation and `git diff --check`.

## Waves 1-3 corrective RF2

- Date: 2026-08-30
- Lots: `EED-UI-2026-0038-RF2`, `0039-RF2`, `0041-RF2`, `0049-RF3` and
  shared-title `0048-RF2`.
- Scope: repair only the human-rejected modal, Administration, Import history,
  Mass Import body/result and ungrouped-title surfaces from preview `f0bc74f`.
- Preservation: native multiselect and settings storage, import Restore/Export,
  modal scrolling/profile action, entity persistence and accepted page title
  and introduction remain unchanged.
- Exclusions: stale-data rehydration, page intro/navigation order, Filepicker,
  global Kit modal migration, preview/cache/fixtures and browser validation.
- Validation: official Sass/AMD builds, focused RF2 and existing regression
  contracts, PHP syntax and `git diff --check`.

## EED-UI-2026-0041 - Import history actions

- Date: 2026-08-30
- Scope: consumer-only static alignment for Restore this import and Export
  annotated Excel in the Import history list.
- Correction: both controls share the Kit compact action geometry, baseline and
  minimum height; their row wraps cleanly to full-width controls below 30rem.
  Existing Bootstrap semantic variants, labels and import/export behavior are
  preserved.
- Validation: Sass build, focused Import history action contract and
  `git diff --check`; no browser or preview run was performed.

## EED-UI-2026-0039-RF1 - Administration hierarchy

- Date: 2026-08-30
- Repository: `local_groupimport`
- Scope: static Administration typography and icon harmonisation, plus a
  naming alias for the existing More filters compact label treatment.
- Preservation: the identifier explanation text, native multiselect markup,
  options, settings storage and all disclosure behaviour remain unchanged.
- Validation: Sass build, focused typography contract, plugin release checks
  and `git diff --check`; no browser or preview.

## EED-UI-2026-0049 RF2 — visible Mass Import hierarchy

- Date: 2026-08-30
- Cause: RF1 reused the same card/section roles already present in the accepted
  stylesheet, so its principal Mass Import headings could not visibly soften.
- Correction: map panel-card titles to the shared compact control-label tier
  and upload form labels to the eyebrow/caption tiers used by Student
  Management. Page identity and the larger introductory description remain.
- Validation: Sass build, focused typography contract and `git diff --check`;
  browser acceptance remains human and separate.

## EED-UI-2026-0049 — typography convergence

- Date: 2026-08-30
- Repository: `local_groupimport`
- Scope: static SCSS/CSS convergence for Simplified student management and Mass
  Import chrome, including the `Import file (CSV or Excel)` card and Groups
  inside Groups without grouping.
- Base: accepted preview `EED-UI-2026-0048`.
- Result: a late consumer typography partial uses the embedded EasyEdu roles;
  `styles.css` is rebuilt and covered by a source/generated CSS contract.
- Validation: Sass build, `tools/release/test-typography-contract.ps1` and
  `git diff --check`. Browser review remains human and separate.
- Wave 4 EasyStud typography correction

  - Date: 2026-08-31
  - Lots: `EED-UI-2026-0038-RF5` and `EED-UI-2026-0054-RF1`.
  - Scope: CCB-compatible contextual help controls, Group/Grouping accordion
    counter density and scoped Administration operational copy convergence.
  - Preservation: Participant reference, modal behavior, native controls,
    Mass Import page identity/introduction and import logic.
  - Validation: official Sass/AMD build and focused static/release contracts;
    no runtime, cache, fixture or browser activity.
