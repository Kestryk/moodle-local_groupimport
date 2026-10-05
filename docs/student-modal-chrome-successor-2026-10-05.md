# SM-44 — History and native Message diagnosis

SM-43B is served and its native/cleanup gates pass. SM-44 diagnosis and shared
source candidate are implemented; preview promotion is still pending below.
Human checklist OPEN.

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

## Immutable native baseline

`student-modal-chrome-baseline.spec.js` passed in external run
`easystud-authenticated-20261005T022956653Z-24592`: 1600/768/390, Message and
History opened/cancelled, no page errors or blocked business requests. All
credential/child/lease/fixture cleanup flags are true. No fixture was requested.
Message header 63.39px, actions 26px/12px; History header 65px with no background
image, Close 32px and old title colour. Retain that evidence as the old baseline.

## Shared source candidate

Kit 0.4.101 adds `dialog-header` and public `easyedu-dialog-header` /
`easyedu-dialog-close`. Existing entity/confirmation header declarations are
unchanged. Native Message opts into their 64px/12x20px header geometry and
canonical header colour, and Regular matched footer density (37.6px/14.08px).
History changes only three PHP classes (header/title/Close); its data/body,
dialog dimensions, native hooks and rollback header remain untouched.

`test-modal-chrome-successor-source.js` passes canonical byte identity, exact
PHP class reconstruction, whole unrelated compiled CSS and all native
controllers/templates/Motion preservation. Kit successor compile and SCSS-only
distribution gates pass. The original compact-footer spec/guard stays historical,
not weakened to certify the new Regular density.

## Paired Foundations publication

Library page `81455adb-6787-8068-8008-9ce6186bf6ef` and Standard page
`2b150968-5877-802e-8008-97c286173199` retain the same existing providers:

| Density | Source main | Provider | Standard copy |
| --- | --- | --- | --- |
| Desktop | `db59201c-3dd6-8004-8008-bab0e3ca94ea` | `db59201c-3dd6-8004-8008-bab0f942bdc9` | `db59201c-3dd6-8004-8008-bab11fd7aa9a` |
| Narrow | `db59201c-3dd6-8004-8008-bab0e6bcd242` | `db59201c-3dd6-8004-8008-bab0fa00d117` | `db59201c-3dd6-8004-8008-bab1205e8920` |

Two icon-free Regular actions consume existing Primary/Secondary M providers
`db59201c-3dd6-8004-8008-baad4854bd4f` / `db59201c-3dd6-8004-8008-baad48fd2237`.
Both are 37.6px with 10.4px gap and 17px right inset in the bordered specimen;
example widths are 80/222, not fixed translated runtime widths. Inter labels
are centred and painted inside padding. Narrow export inspected. Compact
superseded actions stay hidden/recoverable; geometry backup is plugin data
`SM44-before`. Native textarea dimensions are retained, moved 12px below the
taller header; footer grows 11.2px. Async Standard copies inherit new chrome;
their decorative veils/status rows move 12px to retain body alignment. This
does not certify a real sending/error workflow, and no real message was sent.

## Product publication

EasyStud page 04 links the same updated source providers in five Message roots:
`cef95197-06bc-809e-8008-aeffad54179b`,
`01e728c3-f1ef-80b3-8008-b400db6681f1`,
`11206fb4-1be0-8047-8008-bc2655ff7f99`,
`11206fb4-1be0-8047-8008-bc2658023a6a`,
`11206fb4-1be0-8047-8008-bc2659b95deb`.
Settled header/root sizes, linked Regular action providers, heights and Inter
painted labels were read back; narrow export inspected. State-overlay veils
and busy specimens move 12px with the taller header. This preserves their
pre-existing state illustrations, not a runtime claim for sending/error.

History shell `cef95197-06bc-809e-8008-af0007f4cb03` now depicts the actual native
title-only header: old decorative icon/eyebrow stay hidden, title Inter16/700
#264861 at 21px/22px, canonical gradient and centred 30.4px linked Close.
The history items/restored status/actions remain intact; full History export
inspected. Backup `SM44-history-before` preserves old header geometry/paint.
Native successor and human acceptance remain separate gates.

## Scenario lifecycle

Baseline and successor specs are local-supervised Docker/CI candidates: one-test
saved-credential discovery, external manifested artifacts, no real Send,
rollback/export, fixture or DB changes. POST guards block native business
writes but permit Moodle read-only template/recipient loading. Successor asserts
three-width canonical header paint/containment, Close centred hit target,
Regular paired action density/right inset and native Cancel/focus restoration.
No changes to the owner's Platform scenario registry; this portable intake is
ready for the planning owner to consolidate. Retain failed runs without hiding
native overlays or weakening assertions.
