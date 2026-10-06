# Group fold member-selection successor (SM-62)

Batch EED-UI-2026-0073. Served/native scoped successor now PASS; not human acceptance.
The earlier human checklist and all other SM-01..73 lots remain OPEN.

## Served scoped proof

Source `dcf68620b95205c6941ad7ce17368dd29478d4bd` is served at clean runtime
`1c6caa159ac4be2e39d550f6edc41dfd5b288f78`. Ordered request
`20261006T085656Z-7b0366efe3` includes prior compact-Move proof and feedback
intake before the fold candidate; `20261006T090428Z-8b7d8aeea3` promotes the
accessibility successor. Caches refreshed; CSS remains byte-identical.

The exact same immutable native scenario now passes eight cases at1600/768/390/
320 in normal/reduced policies, after changing the actual product source.
Three real checkbox selections, another Group retained, all folded-Group copies
cleared, reopen without reselection and zero-selection action reconciliation
PASS. Four normal-policy cases observe the original disclosure marker. No
forced click, altered Motion, settings Save, transfer, import, Send or fixtures.
Cleanup complete; no errors/blocked requests. See
`testing/group-fold-member-selection-native-2026-10-06.json` for exact pins.

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

### Actual native predecessor and accessibility successor

Run `easystud-authenticated-20261006T090024033Z-24168` fails before the fold:
the Group toggle is semantically disabled by its ancestor's `aria-disabled=true`
when members are selected. No record is a native PASS. Cleanup is complete;
no fixture/business write, errors or blocked requests. Preserve the immutable
scenario and failed evidence; never force-click this disabled action.

`updateSelectionAvailability` keeps exclusive-type logic, disabled-selection
paint, event guards and actual native checkbox `disabled`, but removes the
ancestor ARIA flag. Whole-card ARIA disabled would incorrectly include nested
fold/search/actions and selected members that remain valid controls. Forty
executed actual-function states pass, with complete remaining code/styles,
previous fold correction, original Motion and the native scenario unchanged.
The generated AMD is rebuilt; a genuinely changed Source successor, not an
unchanged retry or a weakened test, must be served before rerunning.

Product metadata readback/validate=[] and actual saved-file GET200 are verified
after owned plugin-heartbeat recovery. No shared provider paint was changed.

Broad context-action/keyboard journeys and human acceptance remain OPEN.
Source snapshot/commit supplies an
explicit reversible boundary; do not revert another window or shared runtime.
Penpot publication is behaviour metadata only, not a visual or native PASS.

Next: shared palette root/cascade successor, then SM-51 optional/full modal-body
and native compact-entry work. Preserve this passing scoped native proof.
