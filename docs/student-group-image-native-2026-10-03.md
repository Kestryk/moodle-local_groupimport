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
