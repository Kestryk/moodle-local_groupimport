# Drag And Drop

Drag/drop styles should make compatible targets obvious while preserving
selection-based alternatives for keyboard and touch users.

## Mixins

### Flat allowed-drop affordance

`drop-affordance($size: 2.5rem)` renders the linked Foundations 40px circle
with a centred proportional 20px SVG slot, 1.5px blue border and no glyph shadow.
Its plus path is normalized from the linked product specimen
`92c1c225-95fb-802e-8008-aeafea3eb9fc`, not a font character or new icon.
`insert-drop-target` consumes it on `::after`, preserving the semantic
container surface/rail/shadow and its identity-icon pseudo-element.
Override `--easyedu-drop-affordance-plus` with a themed SVG image if needed;
surface and border use existing shared deposit/focus tokens. Other consumers
adopt this recipe only on their own explicit synchronization.
The same family supports `drop-affordance($size, danger)`: linked xmark,
danger surface/border tokens, no relief. Sizes 2/2.5/3rem match the linked
S/M/L 32/40/48px specimens, with 16/20/24px icon slots.
`denied-drop-target` applies the M danger indicator and a non-layout outline
only to the hovered incompatible container. The consumer owns the eligibility
predicate and clears the transient class on leave, cancellation and end.
Never reject an eligible nested Group merely because its parent is a Grouping.

### Foundations moving state

Apply `drag-preview-moving-outline` to the cloned front card. Add a decorative
moving badge with `drag-preview-moving-badge` and its proportion-preserving
16px `drag-preview-moving-icon($mask)`. The linked Foundations specimen uses
a 2px primary outline at 72% opacity, a 26px badge, 12px/700 text and a 6px
icon/text gap. The label is translated by the consumer and may grow naturally.
The portal relays the workspace's resolved Kit/theme variables and font family;
`--easyedu-drag-font-family` is its font bridge. Do not invent portal skin values.

Use `drag-preview-count-placement` for the upper-right, inset multiple badge.
Single has no rear layers and no count; Multiple has two rear layers and `+N`
for the extra objects. A compact entity preview uses `drag-preview-compact`:
an 18rem (288px at the normative root) viewport-bounded summary with semantic
identity and a truncated title. Do not clone expanded details or controls.
Use `.easyedu-drag-preview--group` for the Group identity; Participant is the
default. Consumers retain the source card unchanged and relay its theme.
Decorative previews must be inert/aria-hidden; actual drag commands and keyboard/
touch alternatives stay with the plugin. Do not drop or mutate memberships just
to capture the moving state.

```scss
.my-target.is-drop-target {
  @include easyedu.drop-target-overlay(var(--easyedu-group));
}

.my-container.is-insert-target {
  @include easyedu.insert-drop-target(
    var(--easyedu-group),
    #f7fcf9,
    #edf8f2
  );
}

.my-card.is-drag-stack {
  @include easyedu.drag-stack-preview;
}

.my-drag-preview {
  @include easyedu.drag-preview-container;
}

.my-drag-preview > .my-card {
  @include easyedu.drag-preview-card;
  @include easyedu.drag-preview-surface(var(--easyedu-group));
}

.my-drag-preview.is-captured {
  @include easyedu.drag-preview-captured;
}

.my-drag-preview.has-stack {
  @include easyedu.drag-preview-stack-layers;
}

.my-drag-preview__badge {
  @include easyedu.drag-preview-count-badge;
}

.my-column.is-not-compatible {
  @include easyedu.drag-disabled-zone;
}

.my-card.is-dragging {
  @include easyedu.drag-source-placeholder;
}

.my-table-row.is-dragging {
  @include easyedu.object-row-cells-drag-source(var(--easyedu-primary));
}

.my-column.is-visually-disabled-but-still-observed {
  @include easyedu.drag-disabled-zone(0.42, 0.18, 0.72, false);
}

.my-settings-dialog {
  @include easyedu.modal-file-drop-state(".is-file-drag-over", var(--easyedu-primary));
}
```

Use drag/drop as enhancement only. Always provide buttons or context menu
actions for the same operation.

Reset opacity only on the cloned front card, not every descendant. Native
checkbox inputs and unchecked custom marks intentionally have zero opacity;
forcing them visible corrupts the preview even when the source card is correct.

Use `drop-target-overlay` when an item is dropped onto the target itself. Use
`insert-drop-target` when the target represents a container that will receive the
dragged item, such as a group receiving participants or a grouping receiving
groups.

For multi-drag, show one leading card and a count badge for the hidden extra
items. The badge should represent additional items, not the total number of
selected cards.

When using a custom fixed preview, apply `drag-source-placeholder` to every
source item being dragged so the original list keeps its spacing while the
preview follows the pointer.

For native `<tr>` reordering, use the `object-row-cells` family documented in
`tables.md`. Its drag-source state intentionally keeps the live row visible and
therefore must not be replaced with `drag-source-placeholder`.

Use `modal-file-drop-state` on dialogs that accept file drops anywhere inside
the modal. The plugin JavaScript should only toggle the state class while a
valid file is being dragged over the dialog.
