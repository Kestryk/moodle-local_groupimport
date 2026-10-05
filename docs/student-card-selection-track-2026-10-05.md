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
