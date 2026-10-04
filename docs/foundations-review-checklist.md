# Deferred Foundations / EasyStud visual checklist

Requested 2026-10-01: continue implementation; review the combined changes later.
This is a living checklist, not a claim that every component is implemented.
Technical checks and human visual acceptance remain separate.

## Student Management

- [ ] Compact selection toolbar and mobile tray: Inter/600/12.48px, shared gap,
  semantic danger hover/focus and neutral disabled; 30.4px compact / 37.6px tray.
  Six non-mutating native cases pass, including the actual tray-height successor.
  Global human acceptance and complete type/view propagation stay open.

- [ ] Participant/Group/Grouping detail/settings chrome: shared Inter title,
  icon/eyebrow, right-aligned matched native actions and normal open/close; source-complete
  conditional content. Shared headers and three desktop product specimens
  updated; 9 scoped 1600/768/390 cases pass in the current local preview. Native
  Participant entry/focus is verified; Group/Grouping use desktop open then
  resize, not an invented mobile menu command. Native body scrolling exposes
  all action centres. Body
  styling, complete responsive product compositions and human acceptance open.

- [ ] Compact simplified Participant/Group drag previews: identity and title,
  no card contents or action/selection controls, bounded footprint, no opaque
  moving-icon square; Multiple only has rear layers and extra-item count.
  Managed native-event proof `easystud-authenticated-20261004T001137528Z-50096`
  passes Participant/Group Single/Multiple plus allowed and danger targets at
  1600px without Drop or business write. Human acceptance and mobile
  non-drag alternatives remain open.
- [ ] Native message modal: inherited Kit font/tokens outside the workspace,
  canonical textarea, header/body/footer, right-aligned matched Send/Cancel and close action.
- [ ] Move participants/groups dialogs: canonical destination/menu and actions,
  source-complete Penpot specimens including origin option and empty state.
- [ ] Modal footer pairs: same font/height/padding/radius, adaptive translated
  width and right-aligned wrapping. Four paired Foundation / eleven product
  readbacks recorded 2026-10-03; current local preview has 9 entity + 9 Move +
  3 Message cases PASS and 21 inspected final captures. Evidence:
  `testing/student-modal-preview-2026-10-03.json`. Human tick remains deferred;
  foreign CCB body-edge overlaps and all-state/body parity are separate gaps.
- [ ] Creation + centred in solid/outline buttons; adjacent search/add fields
  have coherent height/radius; Ungrouped identity icon remains visible.
- [ ] Reduced workspace/column/view-title sizes and softer card-title contrast,
  paired canonical Kit/Foundation and product/native coverage.

- [ ] Clipboard canonical multiline field and recognized/unknown result pills,
  six native rows, lookup, resize, close/focus at desktop/tablet/mobile;
  scoped 5.1 technical proof passed; human acceptance remains deferred.

- [ ] Foundation Textareas for Group/Grouping identifier additions; multiline
  values, recognition, focus, vertical resize and native responsive routing;
  reflowed panels/cards, equal columns and bottom-anchored pagination.

- [ ] Real Foundation Text fields for creation/Rename; native focus, placeholder,
  filled value and responsive hit geometry; no disguised Search instances.

- [ ] Measured identity typography/colours, subordinate group-member names.
- [ ] Compact Add/Save/Cancel labels, vertical icon/text centres and common gap.
- [ ] Inline identifier results use shared Success/Error pills; recognised
  names, unknown identifiers and card metadata remain distinct.
- [ ] Container-search Cancel matches the compact Foundation secondary action.
- [ ] Product Grouping-add examples: full-width field, linked Add/Cancel below,
  separated recognition pills; originals retained and native actions unchanged.
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
- [ ] Drag Single: compact identity/name summary, moving outline/badge and rail;
  no controls, details, stack or count. Source card stays unchanged.
- [ ] Drag Multiple: same flair, two rear layers, inset `+N` extra-item counter.
- [ ] Quieter 28/22px workspace and 20px panel titles, 12px view labels;
  softer card/member identity text, harmonised search/create fields and plus.
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

Later Move checkpoint: six linked product states use regular shared actions
and neutral native destination shells. Ten regular Standard/Library states and
two shell fingerprints match; native six-case run
`easystud-authenticated-20261002T183714504Z-31732` passes at 1600/390.
No-destination branches are static/Penpot only. See the Move JSON readback
and modal contract for close/shell/checkbox paint gaps.

Later paired checkpoint (2026-10-02): Clipboard neutral shell and public
modal/navigation layer have linked Foundation Standard/Library Desktop/Narrow
and product specimens. The 1rem help/field gap and wrapping results fit;
the previous host is preserved hidden. See the neutral-lookup JSON readback.
Baseline run `20261002T201951972Z-46704` confirms three covered helper
characters at 390; post-promotion proof remains pending. No human item is ticked.

Final scoped proof: `easystud-authenticated-20261002T205725336Z-32120` passes
at 1600/768/390 on runtime `b8a3c0f`; 111 helper characters unobscured at each
width, neutral chrome/title/help roles, field states, results and focus return.
Three captures inspected/pinned and cleanup complete; no fixture/business
command. This supersedes the overlap for Clipboard only. Human items stay open.

Clipboard field/results run `easystud-authenticated-20261002T185415434Z-42396`
passes 1600/768/390 controls, with cleanup. Whole-dialog visual acceptance is
still open: a floating navigation trigger covers help at 390. The failed
mid-transition field-sampling run is retained and the harness now waits for
terminal paint. Human items remain unchecked; this does not validate all cards,
menus, actions or mobile overlays.

Workspace/native portal technical checkpoint:
`easystud-authenticated-20261002T171159560Z-11724` passes on runtime `a364b014`
through source `0deb382`, Kit 0.4.53, at 1600/768/390. Message phone body fits
its field without the former fixed-shell gap. Paired Foundation Standard/Library
and product Desktop/Narrow message specimens use linked compact actions;
11 active Student boards have updated role readbacks. Final message/Move/drag
captures inspected and pinned, cleanup complete, no business mutation.
See `docs/student-workspace-controls-2026-10-02.md` and the paired JSON readback.
Move Penpot anatomy, native-close/header paint, untested states and human
acceptance stay open. No checklist item is ticked from automation.

Inline lookup final run `easystud-authenticated-20261002T050512385Z-40496`
passes six Group/Grouping previews at 1600/768/390, recognised/unknown labels,
shared typography/colours/padding, containment and unobscured paint hits.
Desktop search Cancel blue-border/halo keyboard focus passes; native responsive
direct search remains hidden. Seven final PNGs inspected/pinned, no command or
fixture mutation; original Motion unchanged. Initial focus-border failure and
covered/hidden-trigger diagnostics remain preserved. No human item is ticked.

Preview recovery 2026-10-02: runtime `020cf4c` is clean and caches refreshed.
Member-row run `easystud-authenticated-20261002T041025264Z-44664` passes
1600/768/390 role/centre/containment and keyboard checks. Normal-motion nested
disclosure/focus run `20261002T041123913Z-45996` also passes at 1440px.
Four PNGs inspected and pinned; no business-data mutation. Native densities
remain 42px desktop / 37.6px responsive, not Foundation 52px adoption.
No human checklist item is ticked from these automated results.

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
