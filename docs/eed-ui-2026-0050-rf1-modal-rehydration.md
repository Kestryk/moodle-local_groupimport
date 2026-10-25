# EED-UI-2026-0050-RF1 - Dynamic entity modal rehydration

## Scope

EasyStud initially serialises Participant detail data into each participant
card. Group and Grouping settings modals, by contrast, are rebuilt from the
live card/tree DOM whenever they open. After an AJAX membership or entity-name
mutation, the visible tree was current but the Participant JSON could still
describe the server state from initial page load.

RF1 rebuilds participant group and grouping membership metadata from the live
EasyStud DOM. It refreshes the card filter attributes and the serialised detail
payload after successful mutations and again immediately before Participant
details opens. Group and Grouping modals continue to be reconstructed from the
same live DOM, so all three entity families now share one current-page state.

## Preserved behaviour

- No endpoint, payload, permission, transaction or saved value changes.
- Existing AJAX success/error notifications and modal Motion remain unchanged.
- Entity detail fields unrelated to group membership remain server-rendered.
- Malformed server detail JSON is left untouched instead of blocking the UI.
- No page reload, cache, fixture or browser activity belongs to this source lot.

## Validation

`tools/release/test-entity-modal-rehydration-contract.ps1` checks the live-DOM
rehydration boundary and the generated AMD bundle. The complete AMD runtime
format contract remains mandatory because Moodle must receive a canonical
RequireJS `define(...)` module with no top-level ESM declaration.

Human preview validation should add/remove a participant from a group, change a
group's grouping membership, rename Group/Grouping entities, close each modal
and reopen it without refreshing the Moodle page. Names, counts and membership
lists must match the visible cards.
