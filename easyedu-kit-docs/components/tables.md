# Tables And Reports

Tables are used for import previews, reports and dense administrative data.

## Mixins

```scss
.my-preview {
  @include easyedu.preview-table;
}

.my-row--warning {
  @include easyedu.table-status-row(warning);
}

.my-report-summary {
  @include easyedu.report-summary-grid;
}

.my-report-summary__item {
  @include easyedu.report-summary-item(var(--easyedu-success-soft), #cfe7d9, var(--easyedu-success));
}

.my-report-title {
  @include easyedu.report-title(var(--easyedu-success));
}

.my-report-list {
  @include easyedu.report-list;
}

.my-preview-notice {
  @include easyedu.preview-notice;
}

.my-preview-toolbar {
  @include easyedu.preview-toolbar;
}

.my-preview-table-wrap {
  @include easyedu.preview-table-wrap;
}

.my-status {
  @include easyedu.preview-status(#e8f6ee, #1f6748);
}

.my-source-table {
  @include easyedu.semantic-table-surface(primary);
  @include easyedu.stable-table-header;
}

.my-sticky-table {
  @include easyedu.sticky-data-table(0);
}
```

## Variants

- `success`: interpreted or imported successfully.
- `warning`: imported with warnings or already existing data.
- `error`: cannot be imported without correction.

Status labels use `status-label-layout`: short values remain compact, while
multiline validation copy is centred horizontally and vertically with a 12px
inline inset. The fit-content label centres itself in the owning cell, wraps
long identifiers safely and never exceeds the cell's available inline size.
Consumers must not remove this inset or restore start-aligned text for status
messages.

## Accessibility

Use real table markup for tabular data. Keep status colours paired with text or
icons so the result does not rely on colour alone.

## Import contract

- Apply `semantic-table-surface` directly to a real table when its existing
  columns and DOM must remain untouched.
- Add `stable-table-header` to dense administration tables whose translated
  headings must remain readable. It uses the compact Mass Import typography
  and prevents labels from being split in the middle of words.
- Apply `sticky-data-table` only inside a container that owns vertical scroll.
- The plugin owns horizontal overflow, action-menu escape and sticky offsets.
- A table using `stable-table-header` must provide enough intrinsic width or a
  horizontal scroll shell. Do not reintroduce `overflow-wrap: anywhere` to make
  a narrow fixed column appear to fit.
- Do not change `table-layout`, draggable row hooks, ids or `data-*` attributes
  while adopting these surfaces.
- Pair warning/error row colours with visible text or icons.
