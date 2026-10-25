# Pagination And List Tools

Pagination bars should stay aligned between neighbouring columns, even when only
one column has multiple pages.

## Mixins

```scss
.my-pagination {
  @include easyedu.pagination-bar;
}

.my-pagination__controls {
  @include easyedu.pagination-controls;
}

.my-pagination__arrow {
  @include easyedu.pagination-arrow-button;
}

.my-pagination__label {
  @include easyedu.pagination-content-centre;
}

.my-pagination__selection {
  @include easyedu.pagination-selection;
}

.my-pagination__select {
  @include easyedu.pagination-select-button;
}

.my-pagination__tools {
  @include easyedu.pagination-tools;
}

.my-pagination__count {
  @include easyedu.pagination-count;
}

.my-pagination__sort {
  @include easyedu.pagination-sort;
}

.my-pagination__spacer {
  @include easyedu.pagination-spacer;
}

.my-pagination.is-placeholder {
  @include easyedu.pagination-placeholder;
}

.my-list-tools {
  @include easyedu.list-tools;
}

.my-pagination {
  @include easyedu.pagination-mobile;
}
```

`pagination-select-button` owns its inline-flex alignment, line height and text
centering. Consumers may change its height or horizontal padding without
reintroducing local vertical-alignment rules.

Render the changing Select/Deselect wording inside one direct child `<span>`.
Update that label node rather than replacing the button contents so the
component keeps a stable, explicitly centred flex item.

Use `pagination-arrow-button` for First, Previous, Next and Last controls when
their markup needs a direct mixin. `pagination-controls` applies the same
compact square geometry automatically to the standard EasyEdu/EasyStud page
data attributes. Use `pagination-content-centre` for a changed page label or a
custom page button whose icon and text must remain centred; it does not alter
pagination ownership, page state or keyboard semantics.

The controls are static at desktop and mobile sizes: compact mobile layout
keeps the centred page group. `prefers-reduced-motion` has no pagination-style
override because these primitives do not animate; consumers that replace list
content must continue to use the documented fade-only motion recipe.

Pagination actions use the semantic primary colour rather than Bootstrap's
neutral `outline-secondary` text colour. Keep page labels, Select/Deselect
labels and the Sort caption scoped to their pagination primitives; never apply
a blanket colour rule to every descendant `<span>`, because that also recolours
dropdown values and button labels.

The selection control, page controls and sort control share one vertical
centre. Consumers may reduce their individual heights, but must not offset the
sort tools with margins or baseline alignment.

Use the regular typography weight for the Sort caption and selected value. Use
the semibold weight for the result count. Keep this mapping identical in every
view and at desktop and mobile breakpoints.

Place select-all/select-results controls in the list tools area, not inside the
pagination controls, so the page navigation remains centred.

On mobile, retain three columns: selection at the start, page controls in the
centre and compact sort tools at the end. Hide the result count before moving
or wrapping the sort control. Bottom pagination should contain centred page
controls only.

Recommended structure:

```html
<nav class="my-pagination">
  <div class="my-pagination__selection">Select all/results</div>
  <div class="my-pagination__controls">Page controls</div>
  <div class="my-pagination__tools">
    <span class="my-pagination__count">12 items</span>
    <label class="my-pagination__sort">Sort...</label>
  </div>
</nav>
```

If a neighbouring column has no pagination, render the same pagination bar with
`is-placeholder`. This reserves height and keeps card rows aligned while hiding
inactive page controls.

## Runtime replacement

Scrollable columns must replace pages with a fade-only motion recipe:

```js
Motion.swap(list, applyPageState, {
    exitDuration: Motion.timing.fast,
    enterDuration: Motion.timing.normal,
    exitDistance: '0px',
    distance: '0px',
    resize: false,
    swapOpacity: 0.55,
});
```

Do not translate the list or interpolate its height. Either can make
`overflow-y: auto` reserve a temporary scrollbar and shift cards horizontally.
Sorting should use the same recipe because it replaces the same list surface.
