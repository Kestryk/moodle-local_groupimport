# Deferred Foundations / EasyStud visual checklist

Requested 2026-10-01: continue implementation; review the combined changes later.
This is a living checklist, not a claim that every component is implemented.
Technical checks and human visual acceptance remain separate.

## Student Management

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
- [ ] Context menus, sticky mobile actions and non-drag alternatives remain usable.

## Mass Import and administration

- [ ] Typography, spacing, centred actions, shared navigation and mobile layout.
- [ ] File present/remove, type icon, upload progress and drag-over frames.
- [ ] Preview table headers, status badges, row selection and report actions.
- [ ] Re-upload disclosure and loading/skeleton states.
- [ ] Administration responsive fields, descriptions and modal content fit.

## Evidence and remaining coverage

Narrow diagnostic: `easystud-authenticated-20261001T180425356Z-36668`.
Native desktop member disclosure: `easystud-authenticated-20261001T180240745Z-42952`.
Generated media lives under the approved external artifact root, never Git.
Add the final drag-preview run once executed. Danger-state implementation and
whole-view/mobile coverage still need their own slices; do not tick them now.
