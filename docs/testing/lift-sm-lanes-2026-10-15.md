# Lift Student Management

Approved 14 October specification, excluding section2.7 controller alignment.
Kit0.4.211/49ef47e adds opt-in continuous lane segments and resting card tokens.
Consumer CSS retains DOM, template, attributes, commands, Motion and reserved
modules. Focus views use joined header/list segments, complete view uses panels.
Ratios use a named inline-size container at1400px; creation/list share columns.
Mobile keeps existing view visibility and changes only surface/inset/card paint.
Active dropzone outlines are retained: the dotted members region is functional.
No pagination behavior or complete-list alignment change.

Conservative Sass build passed. Only Student Management page CSS changes;
Mass Import/admin/global CSS remain byte-identical. Native recipe covers
three views at1600/1280/390, bounds, radius, gaps and screenshots. Publication
and native result pending. Drag/drop business behavior and human acceptance
are not certified by this presentation recipe.

Claude visual handoff: workspace lane recipe (whole/start/end), participant,
group, grouping/ungrouped cards, filters/creation shells and member rows;
SM ready/rest/hover,1600/1280/390. Penpot remains Claude-owned.

Broad native234938193Z-27992 PASS available views1600/1280/390: gap24px,
ratios0.9/1.1 and1.1/0.9 above actual panel1400px, equal below; cards12.8px,
no painted-column scroller/horizontal overflow. Complete view disabled by the
current admin configuration, recorded unavailable, no native complete claim.
Raster mobile group review identifies extra legacy create-card inline padding
inside the already padded lane; remove it generically while desktop segmented
lanes retain16px. Edge successor measures actual field/card boundaries and
captures the panel contents, rather than only the top navigation viewport.

Edge run235351112Z-55364: desktop1600/1280 PASS leading/trailing delta0 for
participants/groups/groupings; mobile participants fails2.875px leading offset
from legacy responsive list padding0.18rem. Preserve run/spec. Reset lane-list
inline padding at the adapter; desktop segmented-lane16px wins by specificity.
Final successor retains exact1px criterion and only reruns the three mobile views.
