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
- Managed source `6a549b6` is applied at clean Moodle 5.1 `b3d3a41`, cache
  refreshed. CSS/AMD blobs are unchanged. Nine fresh entity-dialog field cases
  PASS at 1600/768/390. Nine final captures inspected, eighteen media pinned;
  scoped retention dry-run: no deletion, no eligible files/errors. Credentials
  cleared, lease released, child stopped, no fixture or business write.
- Field captions: Inter 12.16px/600 `#62788E`; readonly values 14.08px/400,
  editing controls 13.76px. Native contents, lists/footer and Participant return
  focus remain present. Group/Grouping entry is desktop then resize, not an
  invented mobile entry. Proof: `testing/student-completion-preview-2026-10-03.json`,
  run `easystud-authenticated-20261003T065918964Z-32192`.
- Foreign CCB sticky controls still overlap narrow body/footer edges in captures;
  tested action centres remain clear. This is a scoped field/content PASS,
  not full-body or human visual acceptance.

The extended entity scenario is pinned separately at
`09b2eea5b96f49fc470e4005968a575f3d58ba9f`. The footer gate now uses this explicit
successor while preserving the historical scenario/readback pin. A stale source
pin failure was caught and repaired, not bypassed by removing an assertion.

## Penpot differences explicitly still open

Live product Participant specimen `cef95197-06bc-809e-8008-aeffada5eafe`, page
`cef95197-06bc-809e-8008-aeff9a955b2c`, retains six Inter 12px caption examples.
The Username caption `cef95197-06bc-809e-8008-af34edcd9b9b` is `#173F53`, in an
ordinary field host without a linked provider. Runtime's extracted quiet
caption is 12.16px/600 `#62788E`; density follows the existing Kit token. This readback is
not acceptance and no field was recoloured to hide the mismatch. Reconcile
Standard/Library and every consuming body before declaring pixel parity.

Further work: public-class adoption, image/file/CSV controls and metadata-list
recipes, generic Close, member-row catalogue density, full translated/RTL/
forced-colour states. Human global checklist remains unchecked.

## Efficiency notes

No reliable token/billing telemetry is available, so no consumption figure is
invented. The useful optimisations are exact owned allowlists, bounded readbacks,
single-test discovery, a reusable canonical compile fixture and whole-CSS
equivalence before browser work. Failures here came from scenario routing or
stale source pins, not reasons to change working UI. Avoid broad recursive
artifact inventory and guessed file names; target the versioned registry and
exact run directory. Future parallel work must use explicit independent scopes
and worktrees; no other window's dirty Platform files were edited.
