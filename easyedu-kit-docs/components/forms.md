# Forms And Filters

EasyEdu form primitives style plugin-specific controls while keeping Moodle
forms and accessibility behaviour intact.

## Search fields

```scss
.my-search {
  @include easyedu.search-field;
}
```

Expected structure:

```html
<label class="my-search">
  <span class="fa fa-search" aria-hidden="true"></span>
  <input type="search" placeholder="Search">
</label>
```

## Selection checkboxes

Use `selection-checkbox` for card/list multi-selection controls. Keep a real
checkbox input and render the visual square as the sibling UI element.

```scss
.my-selector {
  @include easyedu.selection-checkbox(var(--easyedu-participant));
}

.my-selector--large {
  @include easyedu.selection-checkbox(var(--easyedu-participant), large);
}

.my-card-selector {
  @include easyedu.selection-checkbox(
    var(--easyedu-participant),
    regular,
    card
  );
}

@media (max-width: 64rem) {
  .my-card-selector {
    @include easyedu.selection-checkbox(
      var(--easyedu-participant),
      large,
      card
    );
  }
}
```

Expected structure:

```html
<label class="my-selector" aria-label="Select item">
  <input type="checkbox">
  <span class="easyedu-selection-checkbox__ui" aria-hidden="true"></span>
</label>
```

Use `large` on touch/mobile contexts, `regular` for desktop cards and `small`
only in very dense table/list rows. Do not make the checkbox look disabled when
the current selectable type is still valid.

Use the `card` variant for selectable object cards. It keeps the visible square
quiet and compact while the label provides a larger hit area. The variant
includes hover, active, focus-visible, checked, indeterminate and disabled
states. Use the semantic object colour for `$checked-color`; do not add
participant/group/grouping checked-state overrides in the consumer plugin.

For an indeterminate checkbox, set the native DOM property
`input.indeterminate = true`. Do not emulate the state with a class or replace
the native input. The `large, card` combination provides the minimum EasyEdu
touch target without enlarging the visual square beyond the card hierarchy.

## Segmented toggles

```scss
.my-view-toggle {
  @include easyedu.segmented-toggle;
}
```

## Segmented single choice

Use `segmented-choice` when a user must choose exactly one strategy and each
choice benefits from a short title and explanation. This is preferable to raw
inline radios in import/reimport workflows.

```scss
.my-strategy {
  @include easyedu.segmented-choice;
}

.my-strategy--compact {
  @include easyedu.segmented-choice(compact);
}
```

Expected accessible structure:

```html
<fieldset class="my-strategy easyedu-segmented-choice--contained">
  <legend class="easyedu-segmented-choice__legend">Reimport strategy</legend>
  <div class="easyedu-segmented-choice__body">
    <div class="easyedu-segmented-choice__label" aria-hidden="true">Reimport strategy</div>
    <div class="easyedu-segmented-choice__options">
      <label class="easyedu-segmented-choice__option">
        <input class="easyedu-segmented-choice__input" type="radio" name="strategy" checked>
        <span class="easyedu-segmented-choice__surface">
          <span class="fa fa-plus" aria-hidden="true"></span>
          <span>
            <strong>Add missing items</strong>
            <small>Preserve current placements and add only missing items.</small>
          </span>
        </span>
      </label>
    </div>
  </div>
</fieldset>
```

The canonical contained structure requires
`.easyedu-segmented-choice--contained`, `__legend`, `__body`, `__label`,
`__options`, `__option`, `__input` and `__surface`. The native legend is
visually hidden but remains the accessible name of the radio group. The visible
label belongs inside `__body`; never place it over the fieldset border. Keep the
radio input immediately before its surface so checked and focus-visible states
work without JavaScript. The component collapses to one column on narrow
screens.

The former direct-legend structure remains styled for compatibility, but new
implementations should always use the contained structure. This prevents grey
legend patches, clipped borders and browser-dependent fieldset rendering.

Use the regular size for review/import strategies and other explanatory
choices. Use `compact` only inside dense settings/filter panels. Prefer this
component whenever a choice is mutually exclusive and the consequences need a
short explanation. A simple native select remains preferable for long option
lists or choices whose options do not need descriptions.

## On/off toggles

```scss
.my-toggle-check {
  @include easyedu.toggle-check;
}
```

Use this for compact binary filters such as "Groups without groupings" instead
of a raw checkbox when the control sits inside an EasyEdu filter box.

## Inline reveal panels

Use `inline-reveal-panel` for transient panels that open inside a card or
filter box, such as search-in-container, paste identifiers, or add-by-text
controls.

```scss
.my-inline-panel {
  @include easyedu.inline-reveal-panel(18rem);
}
```

Expected behaviour:

- collapsed state has `max-height: 0`, no margin and no visible content;
- open state uses `.is-open` or `aria-expanded="true"`;
- plugins own the input parsing/business logic;
- the kit owns the reveal motion, border and spacing.

## Native selects

Use `native-select-control` when the plugin keeps a Moodle/native `select` but
needs EasyEdu borders, focus rings and density.

```scss
.my-select {
  @include easyedu.native-select-control;
}

.my-select--small {
  @include easyedu.native-select-control(small);
}
```

Expected structure:

```html
<label class="my-field">
  <span class="my-field__label">Sort</span>
  <select class="my-select">
    <option>A-Z</option>
    <option>Empty first</option>
  </select>
</label>
```

## Multi-select lists

Use `multi-select-list` for Moodle/admin settings where users choose several
fields. The same mixin has a compact variant for filter panels.

```scss
.my-admin-list {
  @include easyedu.multi-select-list;
}

.my-filter-list {
  @include easyedu.multi-select-list(small);
}

.my-expanded-settings-list {
  @include easyedu.multi-select-list(large);
}
```

| Size | Intended usage |
| --- | --- |
| `small` | Compact filters in EasyStud `More filters` areas. |
| `regular` | Standard admin settings lists. |
| `large` | Wider settings screens or review pages where scanning many options matters. |

## Filter disclosure

Use `filter-disclosure-trigger(wide)` when a desktop filter shell needs a calm
**More filters** bar spanning the available column. Use
`filter-disclosure-trigger(touch)` below the consumer's responsive breakpoint
to restore a compact visual control while preserving its minimum touch target.
`compact` remains available for disclosures embedded in cards. The label and
chevron belong to one native `button`; do not place the text beside a separate
icon-only control or reuse a card-members toggle class on this button.
The disclosure label uses the regular typography weight at every size.

```html
<button
  type="button"
  class="my-filter-disclosure"
  aria-expanded="false"
  aria-controls="my-advanced-filters"
>
  <span>More filters</span>
  <span class="fa fa-chevron-down" aria-hidden="true"></span>
</button>
```

The consumer owns `hidden`, `aria-expanded` and the expand/collapse motion.
The kit owns normal, hover, focus-visible, open and disabled presentation. The
touch variant has a minimum height of `44px`. The focus-visible state uses the
public `--easyedu-control-focus-border` and `--easyedu-focus-ring` tokens; a
consumer must not replace them with private or undefined focus variables.

Expected structure:

```html
<label class="my-field">
  <span class="my-field__label">Usable identifiers</span>
  <select class="my-filter-list" multiple size="4">
    <option selected>Email address</option>
    <option>Username</option>
    <option>Student number</option>
  </select>
</label>
```

The plugin may change `size` and container width, but should not override the
focus ring, selected option contrast or disabled state.

## File picker

```scss
.my-filepicker {
  @include easyedu.filepicker;
}

.my-filepicker__icon {
  @include easyedu.filepicker-icon;
}
```

### Solid large file deposit

The large native deposit shell uses `type-card-title` (15.68px / 700 / 1.2)
for its action title and `type-caption` (12.16px / 400 / 1.2) for explanatory
help. Default, hover, focus, drag, danger, disabled and uploading states keep
those roles. File names, progress and metadata remain separate data roles.

## Colour picker

Use this wrapper around a native `input[type="color"]` when a plugin needs a
theme-compatible colour picker without replacing Moodle's form submission
mechanics.

```scss
.my-colour {
  @include easyedu.color-picker-control;
}

.my-colour__input {
  @include easyedu.color-picker-input;
}

.my-colour__value {
  @include easyedu.color-picker-value;
}
```

Expected structure:

```html
<label class="my-colour">
  <input class="my-colour__input" type="color" value="#e8f4ff">
  <span class="my-colour__value">#E8F4FF</span>
</label>
```

For a native Moodle QuickForm group containing a text value and a colour input,
keep Moodle's generated fieldset and apply both mixins to its `.felement`:

```scss
.my-moodle-colour-group .felement {
  @include easyedu.color-picker-control;
  @include easyedu.moodle-color-picker-group;
}
```

This contract keeps the colour swatch and textual value on one line, places the
swatch first, removes the nested QuickForm field margin and preserves the
original input names, ids, validation feedback and submission behaviour.

## Detected token inputs

Use this pattern for text inputs that transform recognised identifiers into
chips, such as users by email/id or groups by name/id.

```scss
.my-token-input {
  @include easyedu.detected-token-input;
}

.my-token-row {
  @include easyedu.detected-token-row;
}

.my-token {
  @include easyedu.detected-token(success);
}
```

## Errors To Avoid

- Do not use the admin-sized multiselect inside dense filter boxes; use
  `multi-select-list(small)` to avoid horizontal overflow.
- Do not hide the native focus outline without replacing it with the EasyEdu
  focus ring.
- Do not convert native `select[multiple]` controls into custom div lists unless
  the plugin also recreates keyboard and screen-reader behaviour.
- Do not place long explanatory text as a field title; prefer short labels and
  EasyEdu help icons/tooltips for Moodle help text.
- Do not replace the native radio with clickable `div` elements. The radio,
  common `name`, fieldset and legend own keyboard and screen-reader behaviour.
- Do not use the visible title as the native fieldset legend. Keep the native
  legend visually hidden and put the visible title inside `__body` so
  translated labels remain inside the segmented-choice surface.

## Import Audit Checklist

- Search fields include a visible/search icon and focus ring around the complete
  wrapper, not only the `<input>`.
- Selection checkboxes use `selection-checkbox`; plugins should not recreate
  the square/checkmark manually.
- Inline paste/search panels use `inline-reveal-panel` rather than one-off
  max-height transitions.
- More-filter toggles use `more-filters-toggle` and stay independent per
  column/panel unless a plugin explicitly owns shared filter state.
- Binary filters inside filter boxes use `toggle-check`, not raw checkboxes.
- Sort controls use `native-select-control(small)` in dense list toolbars and
  never overlap pagination/count text.
- Admin settings use `multi-select-list(regular)` or `large`; dense runtime
  filters use `multi-select-list(small)`.
- Colour pickers use the native input plus EasyEdu wrapper/value display so
  Moodle form submission remains simple.
- Detected token inputs keep parsing/lookup logic in the plugin, but chips,
  rows and spacing come from the kit.
- File pickers and drag/drop overlays use the form/modal/overlay primitives
  together; do not restyle each modal independently.
- Mutually exclusive strategies with explanatory copy use
  `segmented-choice(regular)`; dense equivalents may use `compact`.
