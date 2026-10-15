# K15-25 / K17 participant column, 15 October

Only the existing participantstitle view-model field now uses Moodle's localized
Participants string. The h3 and compact column heading already share that field.
The workspace selector still uses layoutmodeparticipants (Participants & groups /
Participants & groupes). No new template variable, CSS, type role or JS change.

FR/EN Guide/checklist language audit found old combined wording only for the
workspace switch or filter path view selection, where it remains accurate.
No column-specific combined wording needs replacing. The11October document is
historical proof of the superseded R10-21 choice and is retained unchanged.
Native heading/selector verification is pending the quick-fix publication.
Visual relay: SM participant panel h3/compact column heading, ready, FR/EN1280/390.

Published as c1f0cf02, followed by the quick-fix series through6ef853ed.
Native easystud-authenticated-20261015T100223443Z-17800 PASS: both heading slots
read Participants in FR/EN1280/390, while the selector retains Participants &
groupes / Participants & groups. No page errors, business writes or overflow.
