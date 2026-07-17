# Panels

Panels are the large boxes that organise an EasyEdu management screen.

## Mixins

```scss
.my-panel {
  @include easyedu.panel-shell;
}

.my-panel__header {
  @include easyedu.panel-header(var(--easyedu-primary));
}

.my-layout {
  @include easyedu.split-layout;
}

.my-clear-selection-panel {
  @include easyedu.sticky-selection-panel(var(--easyedu-primary));
}

.my-clear-selection-panel__button {
  @include easyedu.sticky-selection-button;
}

.my-clear-selection-panel__count {
  @include easyedu.sticky-selection-count;
}

.my-import-panel {
  @include easyedu.semantic-accent-panel(primary);
}

.my-results-panel {
  @include easyedu.semantic-accent-panel(success);
}
```

## Patterns

- Use panels for major work areas.
- Use filter shells inside panels for search and filtering controls.
- Keep panel action rows single-line on desktop; move overflowing actions into
  an overflow menu or mobile tray.
- Use sticky selection panels for compact persistent feedback such as "3 items
  selected" plus one recovery action. On mobile, prefer `mobile-action-tray`
  instead so the panel does not compete with touch actions.
- Use semantic accent panels when a management surface needs a persistent
  meaning. `primary`, `success`, `warning` and `danger` share identical
  geometry and differ only through public semantic tokens.
- The semantic rail is painted by the panel background so it is clipped by the
  real rounded border while menus and popovers can still escape through
  `overflow: visible`. Do not recreate it with an unclipped `::before` element.
- Keep plugin-specific layout, minimum heights and action menus outside the
  mixin. If menus must escape the panel, retain `overflow: visible` locally.
