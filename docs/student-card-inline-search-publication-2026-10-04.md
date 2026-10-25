# Card inline-search continuation

SM-35 / EED-UI-2026-0073 successor. Native generated Group member search contains
one field and one Cancel button, no title. The corresponding Foundation Members
and Groups specimens now match that structure on Standard and Library pages.
The former titled layout is retained as hidden text, not a live native heading.

Two effective visible EasyStud page-03 member-search consumers are reconciled:
the desktop inline specimen and the responsive panel specimen. Hidden old view
copies are excluded, not silently exposed or used to claim active coverage.
Controls share a top coordinate and 8px gap; their terminal action stays inside
the actual consumer width. Desktop uses 38px, responsive 42.4px, following the
existing native adapter rather than shrinking the mobile field to desktop.
The responsive card menu now uses the native `Search participants` label and
linked magnifying-glass instead of its unrelated old glyph.

Kit 0.4.91 owns the three search-layout recipes. `_structure.scss` calls them
without private paint declarations. Sass 1.79.1 rebuild yields the exact whole
CSS baseline hash `36CD9BACBB3CF8A762B859C70FA8EF0FC4B61A8D9AA128887934B753E81263C1`.
Controller, generated AMD and Mustache are unchanged. Existing disclosure Motion,
card-local filtering, selections and Cancel logic remain untouched.

The fresh native test will check real desktop/mobile menu entry, matching and
empty searches, focus, restoration, gap and equal field/Cancel heights. No
business action or fixture write is permitted. Fresh run
`easystud-authenticated-20261004T194652570Z-8360` passes at 1600/768/390:
field/Cancel are 38px desktop and 42.390625px responsive; gap is 8px,
shell inset 8.8px, radius 8px and border dashed. Cancel is 12px with the
default secondary colour rgb(11,94,168). Search/filter/empty/focus/restoration
pass through the native magnifier or responsive menu. No business request or
fixture change occurred; child/credentials/lease cleanup completed. Human
acceptance stays pending; earlier passing runs remain historical proof.

This bounded pass does not certify every whole-view card state or responsive
action route. See `student-group-member-search-2026-10-04.md` and the combined
completion queue. Readback: `docs/testing/student-card-inline-search-2026-10-04.json`.
