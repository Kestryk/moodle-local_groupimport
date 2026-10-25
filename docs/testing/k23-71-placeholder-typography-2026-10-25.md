# K23-71: shared search placeholder typography

Creation and rename fields use the canonical Small text-field scale. Searches
must use the same text recipe rather than a separate font shorthand or a font
inherited from a surrounding panel. The wrapper continues to own field height.

`components/text-fields.field-text` supplies size `--easyedu-size-s-font`,
weight 400, UI font family and line-height 1.2. `field-paint.placeholder`
supplies inherited typography, muted text colour and opacity 1. Existing
invalid/disabled state overrides remain authoritative.

Consumers checked:

- Six static search slots in `templates/manage.mustache`: participants, group
  catalogue, structure groups, structure groupings, ungrouped and grouping containers.
- Dynamic group-member and grouping-container searches in
  `amd/src/local/cm/group_cards.js` use the same `easyedu-search-field` class.
- Mass Import preview and its Guide specimen use `easyedu-search`.
- The six Administration searchable-choice controls use
  `easyedu-searchable-choice__search`; they must not restore `font: inherit`
  from their panel after applying the shared search recipe.

The canonical Kit commit is pinned in `easyedu-kit-docs/easyedu-kit.json`.
Only the shared recipes and their consumers were reconciled; existing
consumer-specific host-theme priority adapters were preserved.

Native computed styles before: creation 12px/400; Student Management searches
14px/400; Mass Import preview 13px/400; Administration choices 14px/400.
After: all applicable placeholders 12px/400, EasyEdu Inter, muted colour
rgb(92,108,125), opacity 1. Measured at 1600, 768 and 390px.
Hidden retained search slots were measured separately from visibly opened controls.

The four rebuilt page stylesheets change only font/placeholder declarations.
No frame, padding, icon, display, transition or business-state declaration changes.
The canonical `test-placeholder-text.cjs` and existing
`test-peer-small-fields.cjs` cover typography and unchanged geometry separately.
