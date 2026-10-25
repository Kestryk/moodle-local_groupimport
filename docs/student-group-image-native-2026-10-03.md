# Group image composition — native audit candidate

Continuation of `EED-UI-2026-0073`. The existing implementation already owns
the correct functional boundary: a real image input, native `FormData`, the
existing AJAX/process-new-icon path, a pending native delete-picture checkbox,
and Save as the only server mutation. The consumer composes canonical Kit
`image-preview`, `image-preview-placeholder`, `settings-modal-filepicker`,
`modal-file-drop-state`, `toggle-check` and `slideshow-toggle-row` recipes.

The focused supervised scenario
`Group image picker preserves shared preview drop and toggle geometry` opens an
existing Group settings dialog, then audits 1600/768/390 after the native
desktop entry. It selects and drops in-memory image files, reads filename,
preview/file-row containment, 32px centred upload icon, drag-over paint and the
pending delete-picture label transition. It closes with Cancel. Every plugin
business POST is blocked; there is no Save, upload endpoint call, persisted
image, fixture or production mutation.

This is a candidate until exact-one-test discovery, managed local promotion and
the named browser run pass. It must not be described as operating-system file
chooser proof or persisted Moodle file-area proof. After native geometry is
known, publish only missing image/file compositions in paired Foundations and
linked EasyStud page 04; do not duplicate the already canonical filepicker.
The human checklist stays open.

The first supervised execution stopped on a test-only outer-box assumption:
the icon tile is 32px including its 1px border, while CSS `left/top: 50%`
correctly resolves to 15px in the 30px content box. No product assertion before
that point failed and no POST occurred. The successor measures the actual
content-box centre; preserve the failed run as diagnostic evidence rather than
misclassifying it as a visual regression.

## Verified result and publication

Successor run `easystud-authenticated-20261003T182824502Z-44648` passes all
three widths. Filename replacement, drag-over paint, the 32px centred upload
tile, ellipsis at 390px, preview/filepicker containment and Enabled/Disabled
pending-delete labels pass. Three captures were inspected and pinned through
2026-11-02; cleanup is complete and no business POST occurred. Proof:
`testing/student-group-image-preview-2026-10-03.json`.

Foundations already contained the full Settings modal file picker state family,
modal drop surface and Classic toggle. No duplicate was created. Only the
missing shared image-preview family was added: Empty/Present in Tall/Compact.
The paired Library/Standard hosts use ordinary linked instances. EasyStud page
04 archives its old local placeholder recoverably, replaces it with the linked
Tall/Empty component and adds a composition combining the existing picker and
toggle states. The product still has zero local component masters and all four
composition cards contain their descendants. IDs:
`testing/student-group-image-penpot-2026-10-03.json`.

The final Penpot PNG export timed out after the settled readback; it was not
retried unchanged. Geometry is verified, but human visual acceptance remains
open in the later global checklist.

## Page 04 alignment continuation, 4 October 2026

The full Group image composition board
`fcb98309-36c1-8004-8008-bc07bb1ecdce` was exported successfully and
visually inspected. Both desktop cards have identical 760x300 bounds; their
linked image previews and file pickers share the same top coordinate, and
their pending-delete actions share the same 75px offset from the picker. The
compact card's preview, picker and pending-delete action share one left edge.
All 27 text paints are contained by their parent and no descendant extends
outside the board. The inspected preview tiles, linked upload icons and
text/button alignments show no remaining measured offset requiring a source
change in this board. This closes the agent geometry/export audit only;
human visual acceptance remains in the combined checklist.
