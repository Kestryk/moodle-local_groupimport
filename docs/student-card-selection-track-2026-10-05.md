# SM-48 - card selection header track audit

Scope: stable Participant header checkbox in collapsed/expanded states and
phone title clearance for Participants/Groups/Groupings. Preserve contents,
semantic checkbox paint/hit targets, existing Show-all/card Motion and commands.

Source review finds competing overlay rules: compact cards centre the checkbox
against total card height; sole selection switches to a corner offset; the
Participants view supplies a separate 0.9rem top offset. Phone <=560px removes
the avatar and reduces expanded card left padding to 1.85rem, even though the
touch target extends beyond that title lane. This is not a validated fix.

`student-card-selection-track-audit.spec.js` is a local-supervised diagnostic
candidate. Read actual selection hit target, visual square, title and card
geometry at 1600/768/390/320, before/after sole selection, with Group/Grouping
headers where their current view permits. Only client selection/view switching
is activated; block entity POST, no fixtures, settings Save or commands. Export
geometry and sanitized request pathnames, not names or account data. It awaits
the existing finite card effects instead of changing accepted Motion.

An audit run can succeed while reporting overlap: it is not a regression PASS
or human acceptance. Native baseline, canonical recipe successor, isolated and
served strict regression, paired Foundations/EasyStud publication and human
review are OPEN. No Penpot write while the parallel Guide writer owns the MCP.

## Native baseline - 5 October

Diagnostic easystud-authenticated-20261005T114832432Z-38908 completes sixteen
measurements at clean runtime 30947d3. No browser errors or blocked entity
requests; credential/child/lease cleanup completes. Representative current
mobile headers do not overlap at 768/390/320, with 44px hit targets and 6.08px
Participant title clearance. This does NOT disprove the user's other-state
report: manual full-details/long names/nested cards are not fully sampled.

Desktop Participants view reproduces the reported shift: checkbox top relative
to the card moves from 5.875px to 15.390625px at sole selection (9.515625px).
Its painted square/title centre delta grows from 0px to 8.40625px. The 320px
representative Group header also has a 4.828125px centre delta, without overlap.
Canonical fixed-header anchor is the next scoped successor; do not rewrite
disclosure Motion or infer all mobile states are already fixed.

## Source candidate - canonical header anchor

Kit 0.4.110 adds an opt-in header anchor after the unchanged overlay slot.
EasyStud applies it to desktop compact and sole-selected Participant states,
including the competing Participants-view selectors. The <=1024px legacy
breakpoints, title/action lanes, checkbox paint, JS and original card Motion
remain unchanged. Six isolated complete/Participants-view configurations at
1600/1100/1025 pass fixed top, >=32px hit targets and >=4px title clearance;
exact predecessor aeb0c288 fails the same top-stability oracle.

Native strict successor `Student selection header anchor stays stable after
sole selection` is versioned beside the diagnostic; it asserts no overlap,
title clearance and desktop fixed top/painted-centre alignment. It is not run
against the unchanged served predecessor. Source is a candidate only: paired
Foundations/EasyStud writer handoff/publication precedes managed promotion.
No whole-card mobile completion or human approval is claimed.
