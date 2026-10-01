# Deferred Foundations / EasyStud visual checklist

Requested 2026-10-01: continue implementation; review the combined changes later.
This is a living checklist, not a claim that every component is implemented.
Technical checks and human visual acceptance remain separate.

## Student Management

- [ ] Measured identity typography/colours, subordinate group-member names.
- [ ] Compact Add/Save/Cancel labels, vertical icon/text centres and common gap.
- [ ] Mobile drawer has an opaque surface after its opening transition.
- [ ] Context menu labels match Foundations; foreign CCB drawer occlusion resolved.
- [ ] All product layout-toggle glyphs stay inside their matching centred slots.

- [ ] Workspace title/description/navigation spacing and centred view toggles.
- [ ] More filters stays one unified block in desktop and mobile.
- [ ] Participant, group and grouping headers: checkbox/title/badge/actions align.
- [ ] Detailed participant metadata: all information retained, 84px + 8.8px grid.
- [ ] Sorting and top/bottom pagination containment at desktop/tablet/mobile.
- [ ] Narrow 320px density: readable selected/unselected cards; taller endpoint.
- [ ] Native disclosure/focus and original animations retained.
- [ ] Drag Single: moving outline/badge, source contents and rail, no stack/count.
- [ ] Drag Multiple: same flair, two rear layers, inset `+N` extra-item counter.
- [ ] Drag target allowed, incompatible/danger, error and cancelled states.

  Technical desktop checkpoint: allowed Participant→Group / Group→Grouping
  and participant refusal on empty Groupings pass in Single/Multiple.
  Final danger capture inspected. Error messages and mobile alternatives remain
  separate; this is not a human tick of the combined checklist item.
- [ ] Context menus, sticky mobile actions and non-drag alternatives remain usable.
- [ ] Direct card actions: eight families aligned; Rename/Unlink product instances.

  Technical checkpoint: `easystud-authenticated-20261001T193408313Z-42096`
  passes 1600/768/390 geometry, hover/focus and search open/close. Desktop and
  mobile captures inspected. No command mutation. Product Rename/Unlink
  instances remain to propagate; this does not tick human acceptance.

## Mass Import and administration

- [ ] Typography, spacing, centred actions, shared navigation and mobile layout.
- [ ] File present/remove, type icon, upload progress and drag-over frames.
- [ ] Preview table headers, status badges, row selection and report actions.
- [ ] Re-upload disclosure and loading/skeleton states.
- [ ] Administration responsive fields, descriptions and modal content fit.

## Evidence and remaining coverage

Final roles/states: `easystud-authenticated-20261001T212924094Z-41672`
passes on preview `2dc94de5`; whole-view capture inspected. Native context
run `20261001T213015887Z-41920` passes typography/centres/focus in all nine
cases, but its OVERALL result stays failed for three 390px foreign-overlay
hit targets. No business data changed. Penpot has 12 linked member specimens;
narrow/whole-card exports and 42px native versus 52px default density remain
to reconcile after reconnect. None of these facts tick human acceptance.

Narrow diagnostic: `easystud-authenticated-20261001T180425356Z-36668`.
Native desktop member disclosure: `easystud-authenticated-20261001T180240745Z-42952`.
Generated media lives under the approved external artifact root, never Git.
Drag flair and control-opacity proof:
`easystud-authenticated-20261001T185153936Z-4892`, on Moodle preview `f45e2f5`.
Participant/Group Single/Multiple, 1600px, native dragstart/dragend only; no drop.
Native inputs remain hidden, custom checkbox size/rounding matches the source.
The first run passed its narrower assertions but screenshot inspection found
the opacity defect; preserve that distinction, not just the final passing run.
Allowed/empty-Grouping refusal run:
`easystud-authenticated-20261001T192313452Z-43724`, preview `023fbee`.
Native start/over/leave/end only, no drop or mutation. Remaining danger cases,
error feedback and whole-view/mobile coverage still need their own slices.
