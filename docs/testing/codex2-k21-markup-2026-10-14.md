# K21 markup consumer on the modular runtime

This branch starts from served3cbb03cf. The already integrated model-only
group_cards.updateStructureSummary needs the markup consumer still missing
from the served structure header. Two existing accent badge elements replace
the old single Groupings/Groups summary. Each has the matching
data-easystud-structure-count and data-count-template attributes.

manage.php supplies the four label/template context values via the existing
local_groupimport_count_string/local_groupimport_count_template helpers.
Missing Groupings plural/singular FR/EN strings are carried from the approved
original K21 change. No helper, reserved AMD source/build, CSS or Guide code
is changed. Existing title-wrap flex wrapping and badge styles are reused.

Native QA is targeted on an owned8051 disposable course: FR/EN1280/390,
two painted count labels, complete singular/plural templates, correct2/3
model counts and no viewport/label overflow. Existing focused30-case model
proof remains separate; this markup lot does not repeat it or certify
Moodle4.5/human/Penpot acceptance.

Penpot relay for Claude: Groups & groupings panel header, Groupings/Groups
count badges, ordinary and wrapped mobile composition, FR/EN1280/390.

The initial run205311374Z-43732 is interrupted by the session cut after only
FR1280; its partial JSON/PNG are retained and do not constitute a full PASS.
The recorded wrapper owner is dead, its exact owned runtime lease is released,
then fixture94 is cleaned by the ownership-guarded fixture helper under a new
owned lease. Recovery is recorded separately rather than inventing the
missing original wrapper result. The complete targeted run resumes with a
fresh fixture/profile and unchanged oracles.

The resumed desktop-first recipe205910420Z-50104 fails at390 before count
measurement: it requests the desktop layout switch, hidden at that width.
The immutable original report/context are retained; the native mobile
successor opens the actual mobile Groups command, then scrolls the count
labels into view. Label/text/template/overflow requirements are unchanged.

Final native PASS4: run210159178Z-41176, course96, sole on-demand mode;
FR/EN1280/390 show2groupements/2groupings and3groupes/3groups, both explicit
singular|plural templates, height23.34px and zero label overflow. The model
updates both complete count labels. Captures FR390 and EN1280 are inspected;
desktop labels follow the title, mobile labels stack beneath Groups.
No page error or blocked write. Wrapper finally cleanup removes the course
and two synthetic users, clears credentials and releases the runtime lease.

Raw JSON/captures:
`C:/dev/artifacts/es-k21-markup-mobile-native/easystud/authenticated/easystud-authenticated-20261014T210159178Z-41176/playwright-output/k21-markup-mobile-successo-5c02f-EN1280-390-served-user-keys/`.
The same pass validates served progress key local_groupimport.easyedu_guide.u2.c96
and discovery key local_groupimport_easystud_guide_seen_96_2; no second user
or shared-browser isolation acceptance is inferred from this single-account
native proof. Shared30case model/singular tests remain previously recorded.
