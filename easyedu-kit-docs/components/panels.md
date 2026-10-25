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

.my-section-icon {
  @include easyedu.section-icon-tile;
}

.my-compact-section-icon {
  @include easyedu.section-icon-tile($size: compact);
}
```

Foundation consumers that use the public class API can opt into the same
compact geometry without recreating the tile:

```html
<header class="easyedu-panel__header easyedu-panel__header--compact-icon">
  <span class="easyedu-icon-tile easyedu-icon-tile--compact" aria-hidden="true"></span>
</header>
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
- Use `section-icon-tile` for heading icons that must share one square and
  centre line across views. Do not resize an icon glyph to fill the tile.
- Use the compact modifier for dense panel headings only. Keep larger file
  deposit and onboarding illustrations on their own documented size so icon
  hierarchy remains visible.
- Pair it with `easyedu-panel__header--compact-icon`; the header modifier makes
  the identity track follow the compact square instead of retaining an empty
  regular-width column.
