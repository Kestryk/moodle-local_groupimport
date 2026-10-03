# Entity body fields - source-preserving extraction

Batch `EED-UI-2026-0073`. Canonical Kit checkpoint
`0e1466d2f9ecb7087c59c8b831207f78d8390d3d`; consumer base `660840e`.
This increment transfers existing paint, not a new body design or release.

## What moved

`scss/easyedu/components/_entity-fields.scss` is byte-equivalent to canonical
Kit source (Git blob `856b660320140982af0fc2091a3adbf1233e66ed`). The aggregator
exports the five reusable recipes. EasyStud `_settings-modal.scss` now calls
them for editable settings, readonly/count fields and Participant metadata,
removing 89 local lines without changing native selectors or markup.

Caption/value case, weight and colour, readonly and empty states, field radius,
padding and existing focus are preserved. Conditional Group image/enrolment
key, Grouping configuration, Participant readonly data, layout and Motion are
not rewritten. This is a Sass adapter step, not a whole-plugin class-only claim.

## Preservation proof

- External pre-extraction CSS:
  `%LOCALAPPDATA%/EasyEdu/handoff-snapshots/student-completion-20261003/entity-field-baseline/before.css`.
  Its hash was verified before source changes.
- Recompiled Git CSS blob remains exactly
  `c7b7945a536938555cbc77a917d3eb8df69be7e4`.
- All 12,973 emitted selector/property sequences match; no layout/paint drift.
- `test-student-entity-field-extraction-contract.ps1 -KitRoot <Kit checkout>
  -BaselineCssPath <external before.css>` checks canonical modules, pins, pure
  adapters and whole-CSS equivalence. Kit's compile fixture checks anatomy.
- Managed consumer promotion and fresh entity-dialog field checks are the next
  gate. Existing browser proof keeps its original revision and scope.

## Penpot differences explicitly still open

Live product Participant specimen `cef95197-06bc-809e-8008-aeffada5eafe`, page
`cef95197-06bc-809e-8008-aeff9a955b2c`, retains six Inter 12px caption examples.
The Username caption `cef95197-06bc-809e-8008-af34edcd9b9b` is `#173F53`, in an
ordinary field host without a linked provider. Runtime's extracted quiet
caption is `#62788E`; density follows the existing Kit token. This readback is
not acceptance and no field was recoloured to hide the mismatch. Reconcile
Standard/Library and every consuming body before declaring pixel parity.

Further work: public-class adoption, image/file/CSV controls and metadata-list
recipes, generic Close, member-row catalogue density, full translated/RTL/
forced-colour states. Human global checklist remains unchecked.
