# K23-10 / K23-19 native validation

This is a Boost configuration change, not an EasyStud/CCB code release. Do not
build or publish plugin assets to apply it. Read the adjacent universal-width
README, back up the complete live SCSS, compare its hash, and preserve unrelated
configuration before replacing the four owned historical patch families.

`tools/playwright/candidates/universal-width-native.cjs` is a measurement candidate.
Arguments are absolute Playwright module, HTTPS base URL, external output directory,
phase name, course id and course-settings id (defaults: 5 and 2). Supply
`EASYEDU_TEST_USER` and `EASYEDU_TEST_PASSWORD` through the environment. No password,
browser storage or screenshot belongs in Git. Acquire the target's operational
lock before running; the candidate does not acquire a deployment lock for you.

The candidate measures Dashboard, course, course settings, native Participants,
My courses and administration at 1920/390. It opens a native menu but submits no
course form. It records actual URLs, heading visibility, banner edges, drawer
positions, viewport overflow, controls and page/console/HTTP errors. Output is
evidence, not a blanket automatic acceptance claim. In particular, Participants
must remain at `/user/index.php` with `local_groupimport_native=1`; a redirected
EasyStud view does not verify Moodle's native table.

For the delivered configuration, external assertions cover the exact 1320/1304
desktop and 390/374 compact widths, aligned banner edges, unchanged heading policy,
and no drawer/form overlap. Four initially redirected checks are preserved as
EasyStud checks; four additional native-table checks complete the native matrix.
A preliminary sequential native-table run logged unload/fetch errors. Its isolated
successor uses a fresh browser for each case, waits table readiness, records the
empty Moodle pending queue, and distinguishes normal page life from teardown.
Both reports remain available; no product behavior was changed to repair a harness.

The production comparison is in `RAPPORT-K23-10-19-20261023.md` in the review folder.
Raw JSON, before/intermediate/after captures, configuration readbacks, compilation
proof and artifact manifest are under `C:/dev/artifacts/k23-10-19-20261023/`.
This targeted native matrix is not a complete site/theme accessibility audit.

No PHP or AMD product source changes, new UI component, language key, schema or
plugin version are part of this lot. MoodleCS/PHP lint and AMD builds therefore
do not apply to the plugin diff. The standalone SCSS is compiled with Node22.11.0
and Sass1.79.1, and the Node measurement source has a syntax check. The fragile
configuration/native-URL boundaries are recorded in the documentation contract.
