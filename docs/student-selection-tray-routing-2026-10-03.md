# Responsive selection trays — source-backed continuation

Owner continuation of Platform batch EED-UI-2026-0073. The shared Platform
worktree has unrelated dirty owner files; this portable record is its exact
crosswalk/state/scenario-registry proposal, not a replacement global plan.

## Native routing and evidence boundaries

Existing course-5 entities only, checkbox selection, entity-view switching and
clear. All GroupImport POST is blocked. No send, deletion, transfer, fixture
or production mutation. Command eligibility is checked independently against
native source control presence and existing group/grouping membership.

| Selected entity | Native actions |
| --- | --- |
| Participant(s) | Message, Move, Clear |
| Member(s) in a group | Move, Remove membership, Message, Clear |
| Group without grouping | Move, Delete, Clear |
| Group with grouping | Move, Remove from groupings (neutral), Delete, Clear |
| Grouping | Delete, Clear |

The current template has no selected-participant Details toolbar control:
the card Eye is a separate action. No synthetic Details command is added.
Two actions use one row; three use two rows with a full-width last action;
four use two complete rows. The tray minimum is 37.6px, not a fixed maximum.

Historical routing/frame run
`easystud-authenticated-20261003T161746342Z-38916` passes twelve cases at
390/768 and completes credential/child/lease cleanup. Pinned JSON:
`testing/student-selection-tray-routing-preview-2026-10-03.json`.
Its loaded spec blob is `505d31c57469609a0e211ec92218f3c3488e3b2d`.
The capture reveals a remaining clipped icon on the phone's long
Remove-from-groupings label. This PASS certifies routing/frame bounds only,
not painted-content padding. Preserve that evidence unchanged.

## Canonical correction and reproduction

Kit 0.4.65 `69a93cf228e966a939c980ae0f0342ed820cfb2b` owns
`selection-action-tray-density`. Public modifier and independent recipe
share 2.35rem minimum and normal white space. Long labels wrap, retaining
0.35rem icon gap, horizontal padding and neighbouring row height.
The consumer changes no controller, Mustache, command/API or original Motion.

Compile `sass --no-source-map scss/easystud.scss styles.css`, then run
`tools/release/test-selection-action-contract.ps1` with the canonical Kit
root and immutable efbad CSS baseline. The gate compares complete business/
Motion files and all emitted CSS sequences, allowing only selection paint.
Kit `scripts/test-selection-action-tray-contract.ps1` compiles actual Sass
and checks minimum/wrapping, role selector order and independent recipe.

The successor `student-selection-tray-routing-preview.spec.js` adds range
paint bounds inside horizontal padding, explicit icon/text gap and centres,
and row height calculated from actual wrapped lines. Invoke through the
saved-credential runner, exactly-one-test discovery, bounded watchdog and
`-WaitForLease`; never edit the loaded candidate until the child exits.
Native successor is pending until its served assets, run and cleanup exist.

## Foundations and product propagation

Shared whole-tray provider `37222e98-689a-801a-8008-bbd427f72e42` stays
authoritative. Main `37222e98-689a-801a-8008-bbd426069902` and Standard
`37222e98-689a-801a-8008-bbd4f10b151f` use source-backed 128.72px short-label
frame. Ordinary linked 3/2-action usage is paired in Library and Standard;
the two-action frame is 84.4px. Source geometry is flexible, not hard-coded.
Paired recursive fingerprints match:
`testing/student-selection-tray-foundations-2026-10-03.json`.

Product file `220f6449-533e-815b-8008-ad9958d032a1`, page 03
`92c1c225-95fb-802e-8008-ae9f13d0b0b9`, board
`37222e98-689a-801a-8008-bbed2afcc015` contains the five native selections
at phone/tablet width. Fourteen linked trays / forty-six actions include
existing participant, member and action-routing consumers. Three superseded
stubs are hidden recoverably, not deleted. Providers/IDs and paint readback:
`testing/student-selection-tray-product-2026-10-03.json`.
This initial containment/centre readback needs the same long-label padding
successor; it is not complete long-label or whole-viewport acceptance.

Private media is manifested below EasyEdu/artifacts, never in Git. Inspect
captures privately; the user does not need intermediate capture approval.
Global human checklist stays unchecked. Remaining gates: flexible long-label
paired/product publication, native painted fit, whole-view sticky positioning,
translated/all-state coverage, isolated real transfer proof and human review.
