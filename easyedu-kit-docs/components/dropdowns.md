# Dropdowns And Menus

EasyEdu menus cover dropdown lists, context menus and compact overflow action
menus.

## Mixins

```scss
.my-dropdown-menu {
  @include easyedu.menu-surface;
}

.my-dropdown-menu button {
  @include easyedu.menu-item;
}

.my-context-menu {
  @include easyedu.context-menu;
}

.my-context-menu--small {
  @include easyedu.context-menu(small);
}

.my-overflow-menu {
  @include easyedu.overflow-action-menu(small);
}
```

## Sizes

| Size | Intended usage |
| --- | --- |
| `small` | Compact card action menus, toolbar overflow menus, responsive action trays. |
| `regular` | Default context menus and dropdown command lists. |
| `large` | Educational/help menus or larger modal navigation surfaces. |

`small` should be the default when a plugin moves hidden card actions into a
three-line action trigger. It keeps menu rows readable without making dense
cards feel overloaded.

## Expected Structure

```html
<div class="my-menu" role="menu">
  <button type="button" role="menuitem">
    <span class="fa fa-copy" aria-hidden="true"></span>
    <span>Duplicate</span>
  </button>
  <button type="button" role="menuitem">
    <span class="fa fa-pen" aria-hidden="true"></span>
    <span>Rename</span>
  </button>
</div>
```

Use plain, visible labels inside menus. Once an action is inside a menu, remove
hover-help attributes from that menu item because the label itself explains the
action.

## Behaviour

- Menus should stay above cards and scrollable panels.
- Menu items should expose focus states equivalent to hover states.
- Menu triggers and visible action items must never acquire text underlining on
  hover, active or keyboard-focus states; preserve the focus ring instead.
- Do not keep hover-help tooltips on actions once they are moved inside a menu:
  the menu label is visible and duplicate bubbles add noise.
- Disabled actions should remain visible only when they help explain why an
  action is unavailable; otherwise hide unavailable actions.

## States

- `:hover` and `:focus-visible` must use the same background and text colour.
- `:hover`, `:active` and `:focus-visible` keep `text-decoration: none`.
- `[aria-disabled="true"]` and `:disabled` are supported and should not be
  clickable.
- The menu container should be hidden when closed, not visually collapsed with
  zero height, so focus cannot move into invisible actions.
- Plugins can position menus left/right/top depending on viewport collision,
  but should keep the kit surface and item mixins.

## Errors To Avoid

- Do not use both an ellipsis and the EasyEdu three-line action trigger for the
  same meaning.
- Do not allow menu surfaces to sit under neighbouring cards; keep a local
  stacking context and use the kit z-index as the baseline.
- Do not add native browser `title` attributes to menu items.
- Do not wrap menu labels onto several lines in dense card menus; move long
  actions to a larger modal or use shorter wording.

## Import Audit Checklist

Use this checklist when moving a menu/dropdown from EasyStud or Course Banner
Builder into another plugin:

- The trigger uses the EasyEdu three-line action affordance for hidden actions,
  not a raw `...` text button.
- The trigger size matches its context: `small` for dense cards/toolbars,
  `regular` for normal dropdown controls, `large` only for guide/help surfaces.
- The menu surface uses `menu-surface`, `context-menu` or
  `overflow-action-menu`; plugin CSS should only position the menu.
- Menu items have visible labels and accessible focus states.
- Menu items do not keep hover-help bubbles or native `title` attributes.
- The menu has enough z-index/local stacking context to appear above
  neighbouring cards, accordions and scrollable panels.
- Disabled or unavailable actions are hidden unless their disabled state teaches
  something useful.

When a plugin needs a Moodle/native select, use `native-select-control` from
`forms.md`; do not force native selects through the command-menu surface.
