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
