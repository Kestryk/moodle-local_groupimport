# Tooltips

EasyEdu tooltips are custom hover/focus help bubbles. They should be used when a
plugin needs a consistent visual style and must avoid duplicated native browser
`title` tooltips.

## Mixins

```scss
.my-control {
  @include easyedu.hover-help-host;
}

.my-help-icon {
  @include easyedu.contextual-help-control;
}

.my-custom-popover {
  @include easyedu.popover-surface;
}

@include easyedu.positioned-popover-arrows(".my-custom-popover");
```

## Expected HTML

```html
<button data-easyedu-hover-help="Create a new layer">
  <span class="fa fa-plus" aria-hidden="true"></span>
</button>
```

## Notes

- Keep the help text short for controls.
- Use long tooltip variants only for explanatory text.
- Remove native `title` attributes when they duplicate the custom bubble.
- Use `popover-surface` plus `positioned-popover-arrows()` when a plugin
  creates Moodle-like hover popovers in JavaScript. This keeps custom popovers
  visually aligned with EasyStud while preserving plugin-specific positioning
  logic.

## Contextual-help control contract

`contextual-help-control` is the canonical question-mark trigger extracted
from the accepted first CCB Slideshow control. `help-icon` remains a compatible
public alias; it does not define a second geometry.

- The circle is exactly `1.15rem` and must not grow with surrounding text.
- Hover and keyboard focus never underline the trigger.
- Native button appearance and Bootstrap button/link utilities must not change
  its box, alignment, border or text decoration. The primitive therefore owns
  the complete reset as well as its visual states.
- `:focus-visible` keeps the shared EasyEdu focus ring.
- The consumer owns the native element, accessible name, tooltip/popover
  lifecycle and cursor semantics.
- Do not add plugin-local width, border or hover overrides to reproduce a
  larger question-mark variant.
- Do not require a link-style class on a native button. If legacy markup still
  carries one, the canonical reset must remain authoritative.

## Import Contract

Tooltips are an enhancement layer, not the primary label. A consuming plugin
must keep visible button/menu labels or accessible names, then add
`data-easyedu-hover-help` only when the user benefits from extra context.

Required behaviour:

- Show on hover and keyboard focus.
- Do not show on click.
- Do not duplicate the browser native `title` bubble.
- Keep short control text compact; use the long variant only for explanatory
  help that cannot fit in the surrounding UI.
- Remove tooltip attributes from actions once they move into a visible menu,
  because menu item labels already explain the action.

Common mistakes to avoid:

- Adding both `title` and `data-easyedu-hover-help`.
- Leaving hover bubbles on compact overflow menu items.
- Using a tooltip as the only accessible name for an icon-only control.
- Hard-coding tooltip colours in a plugin instead of using the kit mixins.
