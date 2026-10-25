# Searchable multiple filter clear-all — Kit 0.4.76 consumer proof

EasyStud now consumes the shared Kit clear-all control in Role, Group, Grouping
and catalogue multiple filters. The native `<select multiple>` remains the
authoritative state.

## Verified behavior

- the control appears only when at least one option is selected;
- it clears both visible and currently filtered-out selected options;
- it emits one native `change` for the clear operation;
- an open choice panel stays open and focus returns to its search field;
- the summary and pressed rows update from the native select;
- the glyph is centred with zero measured delta in 28px desktop and 36px
  responsive targets, contained by the field;
- no plugin business request is emitted.

Managed run `easystud-authenticated-20261003T235744575Z-47956` passes at
1600/768/390. Durable measurements are in
`docs/testing/student-searchable-filter-clear-preview-2026-10-04.json`.

This closes source and managed-preview proof only. Foundation/EasyStud Penpot
publication of the selected/clearable state and human acceptance remain open.

## Emplacements à réviser

- `amd/src/searchable_choices.js`
- `scss/easyedu/components/_searchable-choices.scss`
- `amd/src/course_manager.js`
- `manage.php`
- `lang/en/local_groupimport.php`
- `lang/fr/local_groupimport.php`
- `tools/playwright/student-searchable-filter-clear-preview.spec.js`
- `docs/testing/student-searchable-filter-clear-preview-2026-10-04.json`
- Foundations 08.4/08.4.1 selected multiple state
- EasyStud page 03 More Filters selected state

## Foundation and product publication successor

Kit catalogue commit `3a5b401d5415c0e5867802331e2c5b219d133616` reconciles
the existing 0.4.90 recipe, without another SCSS/controller change. Foundation
08.4/08.4.1 publishes eight linked clear states: Desktop 28px, Touch 36px,
Rest/Hover/Focus-visible/Disabled. Twelve selected multiple-choice source
variants and twelve Standard specimens consume these providers. Regular M and
Responsive previously omitted the action; compact ordinary controls are hidden
recoverably. Muted, hover and disabled ink match Kit roles. The source-preserving
linked X paints at 12.505859375px within its 24px master. Circular focus uses a
2.88px outer Primary ring at .22 opacity, rather than a glyph-shaped shadow.
All eight Standard/Library fingerprints match and the settled export was inspected.

EasyStud page 03 updates fourteen effective visible consumers. Six selected
choices show one linked action; eight Empty/Any choices hide it. New inherited
children are positioned against each actual width (184/284/294/360px), not the
source 360px. Responsive 44px fields use the 36px Touch provider even when their
outer source is S. Chevron end inset remains 14px; summary/clear lanes do not
overlap and glyph centres/containment pass settled readback. Product filter
composition export `a301101d-ddc2-807b-8008-bba0f07b1569` was inspected internally.
Exact geometry and IDs are in
`testing/searchable-choice-clear-consumers-2026-10-04.json`.

Native successor `easystud-authenticated-20261004T192321615Z-388` passes the
same three-width clear-all scenario on runtime
`ba5390258ac4ea8a9e468836687e384350d7c128` (Kit 0.4.90): hidden selections
cleared, one change event, list stays open, focus returns to search, centred and
contained controls and trailing chevron. Credentials, child and lease cleaned;
no fixture or business request. This closes publication/geometry and focused
native regression, not the combined human checklist or whole-view parity.
