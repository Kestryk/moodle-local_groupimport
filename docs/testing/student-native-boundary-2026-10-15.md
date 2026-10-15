# K15-28 / R7 student boundary

The course-home tour had no role filter. Its shipped JSON now permits teacher,
editingteacher, manager and site administrator only. Upgrade2026101500 updates
only that filter on tours with the plugin's exact name/path; it retains all steps,
text, other filters and configuration. Existing role shortnames follow Moodle's
native user-tour role filter, available on4.5; no Moodle5-only dependency added.
Custom staff roles can be added by an administrator to that native tour filter.
The existing managegroups navigation gate and page-only CSS stay unchanged.

Read-only preflight found one existing enrolled synthetic student@example.com
account in course5. The native recipe uses admin Login as for that account in an
ephemeral managed browser, creates no accounts/enrolments and submits no EasyStud
business action. Check course home and native Participants: no EasyStud entry,
tour, Guide, dedicated stylesheet or EasyStud CSS rules. Upgrade and native proof
are pending publication. Human acceptance remains separate.

This Moodle audience filter adds no UI Kit recipe. Existing source/AI capability
boundary remains applicable; no controller or Penpot composition changes.

## Served proof

Source9de886e1=>runtime6ef853ed, purge PASS. The packaged principal runtime has
no admin/cli/upgrade.php: the first CLI invocation failed before any mutation.
Under dedicated active-runtime/cache leases, Moodle's own upgrade_noncore API
then upgraded the only pending component, local_groupimport, to2026101500.
Before/after deep comparison proves unchanged tour steps and all configuration
outside the role filter. External temp/student-native-upgrade-proof.json retains
the result. Native role matching now returns student=false, administrator=true.
No default site settings, accounts or enrolments were changed for the recipe.

Native easystud-authenticated-20261015T103503008Z-19532 PASS FR1280/390 on both
course home and native Participants: four cells, zero EasyStud navigation links,
dedicated stylesheets, CSSOM selectors, Guide/workspace roots, matching tour init
IDs or requests to the plugin. Native participantsform is visible, actual Moodle
user menu identifies the synthetic student, zero overflow/page errors. Four PNGs
remain outside Git; mobile Participants capture visually inspected.

Preserve failed harness predecessors without relabelling them as product failures:
100415985Z-17508 read M before committed login finished;100516587Z-19396 assumed
Continue was a link (core uses single_button);100636239Z-2020 assumed page-user-index
instead of core's explicit course-view-participants pagetype. The final successor
retains every audience/CSS/tour assertion and uses the source-derived native controls.
No product edit was made for those harness corrections. This is Moodle5.1 native
evidence; a separate clean4.5 installation still belongs to the compatibility lot.
