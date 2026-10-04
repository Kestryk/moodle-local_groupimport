# Forms And Filters

EasyEdu form primitives style plugin-specific controls while keeping Moodle
forms and accessibility behaviour intact.

## Native text fields

`foundation-text-field(small|regular|large)` is the named single-line field
recipe measured live on 2026-10-02 from Foundations `08.4.1`, eighteen masters.
Do not disguise a Search field by hiding its icon. Apply to the native input:

```scss
.my-create input { @include easyedu.foundation-text-field; }
.my-compact-edit input { @include easyedu.foundation-text-field(small); }
```

```html
<label for="group-name">Group name</label>
<input id="group-name" name="groupname" type="text" class="my-field">
```

| Size | Minimum height | Font / weight | Painted inline inset |
| --- | --- | --- | --- |
| S / small | 2rem / 32px | 0.75rem / 400 | 0.875rem / 14px |
| M / regular | 2.375rem / 38px | 0.875rem / 400 | 0.875rem / 14px |
| L / large | 3rem / 48px | 0.875rem / 400 | 0.875rem / 14px |

One shared Inter family, 1.2 line height and control radius (0.72rem). The inset
includes the 0.0625rem border and 0.8125rem padding; the specimen widths are
illustrative, not fixed input widths. Filled values consume `field-text`,
placeholders `text-muted`; Hover, Focus-visible, Disabled and Error have named
public tokens. Error is the explicit `aria-invalid="true"` state, not `:invalid`;
it preserves the visible focus halo. Disabled wins paint without washing out
the whole input. These measured field error/disabled roles are not the separate
feedback-pill palette. Themes may override all field-role tokens.
Focus explicitly owns value colour and surface as well as border/halo; the
native Moodle focus skin must not override the correct resting value role.
Resting hover explicitly excludes focused, focus-visible and aria-invalid
fields: its higher-specificity selector must not override keyboard-focus or
explicit-error borders while the pointer remains over the field.

Native semantics, labels, validity messages, read-only behavior, commands and
responsive hit geometry remain consumer-owned. `aria-disabled` only paints;
use native `disabled` when the control must be disabled. Do not invent a new
field width or shrink established touch geometry. Reduced Motion removes paint
transitions; the shared transparent outline supports forced-colors focus.
The single-line mixin must never be applied to Textarea or a multi-control
wrapper. Its state paint is shared internally, not its geometry.

Run `scripts/test-foundation-text-field-contract.ps1` for all three public paths.
Publication/adoption does not imply deferred human acceptance or browser proof.

## Native textareas

`foundation-textarea(small|regular|large)` maps the eighteen measured Foundations
Textarea masters, without inheriting a single-line input's vertical geometry:

```scss
.my-identifier-list textarea { @include easyedu.foundation-textarea; }
```

```html
<label for="identifiers">User identifiers</label>
<textarea id="identifiers" rows="3" placeholder="One identifier per line"></textarea>
```

| Size | Minimum height | Font / weight | Painted top / inline inset |
| --- | --- | --- | --- |
| S / small | 5.5rem / 88px | 0.75rem / 400 | 0.75rem / 0.875rem |
| M / regular | 7rem / 112px | 0.875rem / 400 | 0.75rem / 0.875rem |
| L / large | 8.75rem / 140px | 0.875rem / 400 | 0.75rem / 0.875rem |

All sizes use Inter, line-height 1.2, top/start text flow and the same six
explicit field states and theme roles as Text field. `_field-paint.scss` is an
internal helper: it is not a public component or an input-to-textarea alias.
Native `rows` and vertical user resizing remain available; no fixed height,
width, maximum height, row count, parser or submission behavior is imposed.
Consumers own labels, validation/announcements and panel layout. A taller field
requires actual panel/card/column reflow, not clipped contents or a scaled
linked root. Never reveal a source-hidden mobile action to demonstrate a style.
Clipboard/message controls need their own consumer reconciliation.

Run `scripts/test-foundation-textarea-contract.ps1` and the single-line contract
together when shared field paint changes. Publication is not browser proof or
human acceptance.

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
The disclosure label uses `filter-disclosure-type`: inherited family,
`0.76rem` (12.16px with a 16px root), regular weight and `1.1` line height at
every size. The legacy `mobile-filter-disclosure-trigger` consumes this same
recipe. Do not override the mobile label with a larger/bold role. Validate the
public wide/touch/legacy paths with
`scripts/test-filter-disclosure-typography-contract.ps1`.

The shared hover uses 72% primary-soft plus 28% surface and the regular control
border, independent of the surface behind it. Expanded retains primary-soft;
keyboard-only Focus-visible retains the resting muted text plus the standard
ring. Disabled stays transparent with subtle text and 0.62 opacity. Legacy
`mobile-filter-disclosure-trigger` delegates to the exact touch recipe rather
than maintaining a different border/radius/gap palette.

Foundations 08.5/08.5.1 publishes five Touch states alongside the existing
Wide family. The painted label/chevron gap is 0.42rem (6.72px at 16px/rem), not
the gap between oversized icon/text containers. Read settled `textBounds`
after a linked change; approximate root centring is not painted centring.
Five Wide and five Touch recursive pairs pass in the consumer's
`docs/testing/student-more-filters-foundations-2026-10-03.json`. Source/isolated
checks, native preview and human acceptance remain separate.

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

## Compact list sorting

Use `list-sort-trigger` and `list-sort-option` for the established compact
sorting control, not as replacements for native selects or full-size actions.
They preserve the existing 1.78rem height / 6.8rem minimum width, regular
0.68rem trigger, 0.42rem icon gap, expanded-chevron rotation and focus paint.
The options retain the established 0.74rem/680 role. Menu surface continues
to use `dropdown-menu`; plugins own placement, routing and keyboard behavior.
Run `scripts/test-list-sort-contract.ps1` for the public API boundary.
This source-preserving migration is not a newly accepted Dropdown S skin;
do not silently apply its compact role to every form dropdown.

## File picker surface

```scss
.my-filepicker {
  @include easyedu.filepicker;
}

.my-filepicker__icon {
  @include easyedu.filepicker-icon;
}
```

## Colour picker

Use the public Foundation family around a native `input[type="color"]` and an
editable hexadecimal text field. The text field is the authoritative named
Moodle control; the native colour input is an unnamed progressive enhancement.
This preserves typed invalid values for server validation instead of silently
replacing them with the last valid swatch colour.

```scss
.my-colour--small {
  @include easyedu.color-picker-control(small);
}

.my-colour {
  @include easyedu.color-picker-control(regular);
}

.my-colour--large {
  @include easyedu.color-picker-control(large);
}

.my-colour__input {
  @include easyedu.color-picker-input;
}

.my-colour__hex {
  @include easyedu.color-picker-hex-input;
}
```

Expected structure:

```html
<div class="easyedu-ui">
  <div class="easyedu-color-picker">
    <input class="easyedu-color-picker__swatch" type="color"
           value="#e8f4ff" aria-label="Choose a colour">
    <input class="easyedu-color-picker__hex" type="text"
           name="s_plugin_colour" value="#E8F4FF"
           pattern="#[0-9A-Fa-f]{6}" maxlength="7"
           aria-label="Hexadecimal colour">
  </div>
</div>
```

Use `easyedu-color-picker--small` or `easyedu-color-picker--large` on the root
for the other canonical sizes. Resting, hover and focus are automatic. Apply
`is-invalid` plus `aria-invalid="true"`, `is-readonly` plus
`data-readonly="true"`, or `is-disabled` plus `aria-disabled="true"` to the
root and keep the native input attributes in sync. The legacy
`color-picker-value` mixin remains available only for read-only displays.

The Kit deliberately does not synchronize the two inputs. The consumer owns a
small controller because it also owns validation, persistence and any live
preview. Synchronization must normalize complete valid values only and must
never discard an incomplete or invalid value typed into the named Hex field.

For a native Moodle QuickForm group containing a text value and a colour input,
keep Moodle's generated fieldset and apply both mixins to its `.felement`:

```scss
.my-moodle-colour-group .felement {
  @include easyedu.color-picker-control;
  @include easyedu.moodle-color-picker-group;
}
```

This compatibility contract keeps legacy QuickForm groups on one line. New
custom settings should use the public class structure above so the Hex value is
editable and the component can expose the complete state family.

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

### Solid large file deposit (Foundations)

`file-deposit` is an opt-in presentation shell around a real file control.
Use `.easyedu-file-deposit__heading` with the decorative `__icon` and a
`__title`, then `__control` for the native input/picker. The icon uses the
same 40.8px section tile as adjacent information headings, with a 20px glyph.
The action title uses `type-card-title` (15.68px / 700 / 1.2) and its help copy
uses `type-caption` (12.16px / 400 / 1.2), matching the adjacent information
surface. File names, progress and metadata keep their distinct data roles.
The shell has a solid border, no relief
symbol, and 16px internal padding. It does not emit styles globally or alter
the legacy `filepicker` mixin. See the EasyStud import form for a Moodle adapter.
Keep filename, progress, accepted types, errors and native keyboard handling.
Check both an empty picker and a selected file at 390px and desktop. Do not
hide the native picker or replace it with a non-functional decorative button.

Selected-file presentations exist in M and L. Every file row contains a linked
type icon, the filename/metadata and a linked remove action. In a single-file
zone, removal clears the selected draft and exposes the choose action again;
replacement remains available. In a multi-file zone, every row is removable
independently and the compact M summary may additionally expose Remove all.
The visual family never enables multiple upload by itself: the consumer must
set its native maximum-file contract and preserve server validation.


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
