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

## Verified first-slice evidence

Canonical Kit `ce8a701`, consumer `374f88c`, Moodle 5.1 preview `8a9edf2`.
Sass compilation and the pinned embedded-module contract passed. Authenticated
run `easystud-authenticated-20260928T201728645Z-51068` passed at 1600, 768
and 390px: Inter, 30px/23px title, no horizontal document overflow, equal
desktop columns and no panel shadows. Desktop/mobile viewport captures were
inspected; the earlier root capture clipped content because Moodle scrolls
its page wrapper, so the preserved test now captures the actual viewport.
Cleanup confirms cleared credentials and released runtime lease. No membership,
message, import or settings mutation occurred. Human acceptance is pending.

The cards and filters in these captures still use their existing implementation;
the test proves only this shell slice. In particular compact participant names,
filter density, mobile sorting and card action alignment need their own pass.

## Execution-efficiency note

Most avoidable work in this continuation came from the disclosure harness:
viewport-relative measurements misread scroll anchoring, and repository form
replacement required awaiting Moodle's URL `action=list` response. Preserve
the corrected small test instead of repeating broad page audits. No reliable
per-task token counter was available, so no token savings are claimed.
