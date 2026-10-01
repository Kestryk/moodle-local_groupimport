# Drag And Drop

Drag/drop styles should make compatible targets obvious while preserving
selection-based alternatives for keyboard and touch users.

## Mixins

Foundations moving previews use `drag-preview-moving-outline`,
`drag-preview-moving-badge`, `drag-preview-moving-icon($mask)` and
`drag-preview-count-placement`. Shared roles: 2px primary outline at 72%,
26px moving badge, 12px/700 label, 6px gap and proportional 16px icon.
Portal context supplies resolved workspace variables/font through the
`--easyedu-drag-font-family` bridge. Decorative clones are inert/aria-hidden.
Single has no layers/count; Multiple has two layers and `+N` extra items.

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

.my-column.is-visually-disabled-but-still-observed {
  @include easyedu.drag-disabled-zone(0.42, 0.18, 0.72, false);
}

.my-settings-dialog {
  @include easyedu.modal-file-drop-state(".is-file-drag-over", var(--easyedu-primary));
}
```

Use drag/drop as enhancement only. Always provide buttons or context menu
actions for the same operation.

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

Use `modal-file-drop-state` on dialogs that accept file drops anywhere inside
the modal. The plugin JavaScript should only toggle the state class while a
valid file is being dragged over the dialog.
