# SM-44 — History and native Message diagnosis

Source-only diagnosis while SM-43B paired publication is unfinished. No modal
source, Penpot consumer or runtime change in this lot yet. Checklist OPEN.

## Confirmed divergences

- `scss/easyedu/adapters/_moodle-message-dialog.scss` explicitly calls
  `foundation-dialog-actions($density: compact)` for the native footer.
  The latest user request explicitly supersedes that older density with the
  regular matched pair, aligned inline-end; widths remain translation-adaptive.
- The same adapter uses `modals.modal-header` (1rem/1.15rem padding), while
  `_dialog-classes.scss` entity header uses the public 64px header with
  .75rem/1.25rem padding. Native Message already has canonical Close,
  non-resizable textarea and unboxed loading; preserve those and sending.
- `scss/views/_mass-import.scss` History header retains a private flex/border
  recipe with 1rem padding and no canonical header background. `index.php`
  emits `local-groupimport-import-modal__header` without a public header role;
  History and rollback share it. Do not accidentally recolour danger rollback
  when giving History the canonical neutral/primary chrome.

## Next gate

Read real native History/Message at 1600/768/390, compare Foundation providers
and EasyStud dialogue boards, then migrate canonical shared roles and preserve
all body/recipients/history data. Read paired Regular footer heights, Close
glyph, loading/error/body containment and focus restoration. Open/cancel only;
no Send, rollback, export, fixture or DB mutation. Existing modal Motion remains.
