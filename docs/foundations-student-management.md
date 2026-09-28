# Foundations Student Management migration

## Scope and evidence boundary — 2026-09-28

User authorized starting Student Management after the CSV disclosure correction.
This isolated first slice migrates workspace identity, typography and large
panel chrome to the canonical Kit class API. It preserves native title menu,
navigation, all card contents, data attributes, forms, membership actions,
mobile overflow menus and existing panel-height/scroll behavior.

Source of presentation: EasyStud Penpot page
`92c1c225-95fb-802e-8008-ae9f13d0b0b9`; desktop Complete view
`92c1c225-95fb-802e-8008-ae9f13f14484`, mobile Participants
`cef95197-06bc-809e-8008-aeeaa9e3ad0d`. Live readback measured desktop title
30px, description 16px, column title 22px; mobile title 23px, description 13px.
The shared `workspace-classes` module owns these rem-based responsive recipes.

Old local title-dropdown decoration and panel paint were removed, not patched
with another product stylesheet. Existing panel behavior remains local.
Default desktop columns become equal-width with the measured 32px gutter.
Navigation and layout-toggle spacing no longer accumulates three margins.

## Remaining slices

- Layout-mode and mobile entity selectors; source-backed active/disabled states.
- Filters, quick creation, participant compact/expanded metadata and actions.
- Group/grouping contents, overflow, inline search/add-by-identifier, drag/drop.
- Context menus, populated modals and keyboard/reduced-motion coverage.

No assertion of complete Student Management migration follows from this slice.
Browser checks must inspect desktop, tablet and phone using real populated
cards without submitting imports, memberships, messages or settings.
