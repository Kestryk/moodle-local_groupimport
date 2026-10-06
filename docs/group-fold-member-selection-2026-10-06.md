# Group fold member-selection successor (SM-62)

Batch EED-UI-2026-0073. Candidate only until managed promotion and native proof.
The earlier human checklist and all other SM-01..73 lots remain OPEN.

## Verified cause and bounded correction

`bindGroupMemberToggles` previously changed disclosure/ARIA only; selected member
classes and checkboxes remained active after their Group folded. Add
`clearFoldedGroupMemberSelection` inside the original resize mutation on folding
only. It clears selected member items whose nearest Group has the same exact
Group id, including hidden catalogue copies. Another Group membership of the
same user is preserved. Existing `setItemSelected` and `updateSelectionActions`
own checkbox, selection availability, top/compact actions and counts.

Opening/reopening does not clear or restore selections. Empty/absent Group id
never broadens the clear. No change to card timing, resize, focus clipping,
Motion completion/reversal, Grouping/Participant selection, commands or data.
This is a product selection rule, not a new shared visual component; canonical
Kit SCSS/controllers/version remain unchanged. No private Mustache style exists.

## Source/build and design evidence

- Base `d8ab821`; isolated actual-function test executes eighteen selected-count,
  duplicate-copy and other-membership combinations plus three actual event
  directions. PASS; reconciliation occurs once only when something was selected.
- Complete prior controller is reconstructed by removing only the helper and
  folding call. Styles, template, Motion, choices, PHP/endpoints and transfer
  service are identical. Official local toolchain rebuilds AMD/source map.
- Product page `92c1c225-95fb-802e-8008-ae9f13d0b0b9` has nineteen existing
  effectively visible Group-card compositions. Their `sm62FoldSelection`
  metadata records the product-only rule without changing providers/paint/layout.
  Saved-version/readback/persistence and native proof are separate gates.
- `student-fold-member-selection.spec.js` is local-supervised and discovers one
  test. It uses existing populated Groups at1600/768/390/320 in normal/reduced
  Motion; three native checkbox selections, fold, reopen, preserved other Group,
  duplicate-copy clear and action-state reconciliation. No fixtures or real
  Move/Remove/Send/Save/import; all writes are guarded. Natural transitional
  disclosure is observed, never manufactured, paused or replaced.
- Declared floor: Moodle5.1 (`2025100600`); no new Moodle API/version-dependent
  syntax or compatibility claim. Reviewed official Moodle coding style and5.1
  JavaScript guide: https://moodledev.io/general/development/policies/codingstyle
  and https://moodledev.io/docs/5.1/guides/javascript . Other versions unexecuted.

## Open gates / rollback

Managed preview, native behavioural matrix, broad context-action/keyboard
journeys and human acceptance remain OPEN. Source snapshot/commit supplies an
explicit reversible boundary; do not revert another window or shared runtime.
Penpot publication is behaviour metadata only, not a visual or native PASS.

Next: saved design readback, ordered Source prerequisites, managed promotion
and the immutable single supervised scenario. Continue palette root/cascade
audit and SM-51 optional/full modal-body/native compact entry work afterward.
