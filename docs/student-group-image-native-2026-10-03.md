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
