# Empty column content alignment

The column's empty panel uses the existing Kit empty-state recipes. Its position
depends on the list toolbar above it. Previously an empty toolbar removed both
side lanes with `hidden`, reducing its height; a populated neighbour could also
wrap its controls and create a larger difference.

The consumer now keeps those intrinsic toolbar slots, makes empty lanes inert
and opts into `pagination-empty-slots`. The Kit hides their paint without
collapsing their dimensions. No fixed offset, header change or second empty
component is introduced. Clear the modifier/inert when results return and keep
an empty Select all disabled.

## Native regression protocol

Use isolated courses with each side empty in Participants & groups and Groups
& groupings, plus all-empty and all-populated courses. Test FR/EN at 1600, 1280,
768 and 390 px. In a two-column workspace compare the top of the empty-state
panel with the first visible card (tolerance 0.5 px). Record painted text bounds
separately: panel-internal typography/padding is intentionally unchanged.

At responsive widths only one entity workspace is shown at a time. Switch
through the actual entity tabs and compare the first entry's offset inside
its own list against the same populated entity in the all-populated fixture;
do not present hidden or sequential tabs as simultaneous neighbouring columns.

Check each empty message remains visible and contained, that no invisible
toolbar control can be focused, that all-populated list geometry is unchanged,
and that empty/all-empty cases do not introduce horizontal overflow or JS errors.
Retain baseline measurements, candidate source hashes and cleanup proof.

## Reproduction and result

Run `tools/playwright/k23-empty-list-alignment-native.cjs` with absolute
`EASYEDU_TEST_OUTPUT` / `EASYEDU_TEST_FIXTURE`, the owned
`EASYEDU_TEST_BASE_URL`, and a Playwright module / Chrome executable
through `EASYEDU_PLAYWRIGHT_MODULE` / `EASYEDU_CHROME_PATH`.
The external private fixture contains username, password and six named course IDs
(`pfull-gempty`, `pempty-gfull`, `gfull-ggempty`, `gempty-ggfull`,
`empty`, `full`). Never commit the private fixture or credentials.

On the pinned base, simultaneous desktop differences ranged from 6.21875 px
to 35.15625 px (French 1280px wrapping). On the candidate, all 64 locale /
width / fixture combinations passed the appropriate entry-slot comparison
with 0 px final difference, and no pageerror or console error. One early
1600px sample caught a 47px layout transition; a separate settled recheck
is retained with the original measurement and returns 0px. This is why the
reusable harness waits for the finite layout transition after changing views.

The all-empty toolbar intentionally retains the same space as a populated
list. Empty-state padding, typography and painted message bounds are not
changed to force the text glyph to coincide with a card title. The criterion
is the start of the existing empty panel / first card, not their different
internal content layouts. Responsive absolute Y values between sequential
tabs are not a meaningful adjacent-column measurement.

The initial all-populated compact group samples differed by 4px in card
height. The compiled CSS delta contains only the opt-in empty-lane visibility
rule (no removed rules). A separate settled before/after native check at
768/390 in both languages returns identical widths, heights and local offsets;
retain those successor measurements beside the initial samples. Twenty empty
side lanes were also checked invisible, inert and without a reachable control.

The owned test runtime was restored by full SHA-256 comparison (1375 plugin
files); the six isolated courses and all active synthetic accounts, groups
and groupings were removed through Moodle APIs. No production deployment or
Penpot edit belongs to this layout-only source change.

`test-empty-pagination-slots.cjs` covers empty/populated/empty state changes,
disabled selection and inert lanes. ESLint reports no error or warning on the
changed production module. Security escaping and filter-engine checks pass.
The pre-existing selection-availability-scope test still fails at its initial
whole-file assertion against the retired monolithic course manager; that file
is unchanged by this patch. PHP source is unchanged (codechecker not applicable).
