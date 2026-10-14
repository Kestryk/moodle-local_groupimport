# F7 / R10-09 / R10-12 / R10-22 / T058 — integration

Kevin's 14 October instruction: publish the five commits together, verify
FR1280 and390 in both rendering modes. No Penpot operation by Codex.

| Original | Source integration | Served runtime | Scope |
| --- | --- | --- | --- |
| 1777dddc (Claude F7) | 0ff1e05c | 684cd6de | Batched member heights and deferred action-menu measurements during view swaps |
| 744e0f07 (Codex2 R10-09) | f2ea4776 | 3401d915 | Equal result-count and Select all height |
| 5ec681c3 (Codex2 R10-12) | cbce74e9 | fb0363b1 | Quiet Clear selection within the existing recovery capsule |
| f347269e (Codex2 R10-22) | 616a3c87 | 7fdc370d | Narrow pagination arrows, painted circle on hover |
| 9b017481 (Codex2 T058 contrast) | d526ed7a | 037faef9 | Existing readable heading token replaces stale literal |

Only CHANGELOG conflicts occurred and every entry was retained. Product
JavaScript is Claude's exact imported source; no local business edit. No new
Moodle5-only dependency or POST/sesskey change. Rebuild Course Manager with
the current toolchain and conservative styles with Sass1.79.1. Earlier
016266a9 proof is a prerequisite of this grouped preview, not another UI lot.
This record/spec/build commit completes the publication; one product commit
per imported lot is preserved.

Native recipe: f7-r10-integration-native.spec.js, one supervised test and four
FR cells (legacy/reactive×1280/390), existing localhost course5. It changes
views with their actual controls, waits for Motion to settle, reads member
height variables, opens available desktop overflow and the three mobile card
menus, exercises previous/next pagination, compares count/select heights, checks
arrow rest/hover size, selection recovery rest/focus and native heading
contrast. It clears its UI selection; business writes are blocked. It is
functional/paint regression evidence, not a new F7 timing benchmark.

Source CSS adapters remain candidates for later canonical Kit/Claude design
propagation. This lot does not claim shared-component or human acceptance.
EN, touch/coarse-pointer, forced-colours, full contrast/axe and Moodle4.5
native are outside the requested four-cell check. Results, served hashes and
runner cleanup are recorded after publication, with generated artifacts only
under the external manifested authenticated root.

Grouped preview/purge completed 2026-10-14T07:40:28.210516Z, runtime
HEAD4a32ae5f (build/record08cc14a1→4a32ae5f; earlier proof016266a9→2c68863d).
Committed Course Manager source/build and all three changed style files match
the served runtime. The 11-case R10-23 production-helper gate still passes.

Native evidence remains PARTIAL. Both supervised runs are retained FAILED:
`easystud-authenticated-20261014T074113876Z-52072` completed FR/legacy/1280,
including swaps, two-page pagination, selection rest/focus/clear, equal
25.90625px count/select heights and heading contrast5.11027. Desktop overflow
controls were absent on this course/view, so no desktop-menu opening is claimed.
The same run opened all three FR/legacy/390 mobile menus, then its desktop
count-height assertion failed: the existing responsive rule hides that count.
`easystud-authenticated-20261014T074708525Z-45108` (count-visibility successor)
again passed those three mobile menus and next/previous pagination, then
incorrectly required the desktop Clear selection button to be visible.
Existing responsive CSS hides that button/frame and the code supplies mobile
action proxies. This run does not prove the mobile selection bar. Neither run
reached reactive mode. Both recorded zero page errors/attempted business writes,
no new fixture and complete credential/child/lease cleanup.

Prepared, syntax-checked but NOT RUN:
`f7-r10-responsive-actions-native.spec.js` covers only the three unfinished
cells. It uses the actual checkbox label and mobile Clear/Move proxies, checks
the mobile bar, and measures R10-12's desktop capsule only when painted.
The two failing recipes/artifacts are preserved; no product fix or extra
Playwright run is made in this conversation (brief quota). Native acceptance
stays false. Complete that targeted check in a fresh conversation before A.

Final restoration under the owned runtime lease returned mode/databaseMode
legacy; a fresh CLI process confirmed legacy and no leftover course73/groups/
groupings. Both run manifests stay failed. JSON, cleanup, runner logs and the
FR1280 selection PNG are pinned30days; retention dry-runs show zero candidates,
deletions and unmanaged artifacts. The desktop PNG was inspected locally;
this is agent inspection, not Kevin's visual acceptance.

The later grouped preview3f22f1b0 retains these F7 changes and publishes four
Codex2 lots. Its single native run20261014T095601999Z-42312 again passes the
legacy390 menus/pagination, then toggles off the participant already selected
by its menu. bindContextMenu.prepareContextSelection explicitly selects it;
the recipe must clear that retained selection first. This is an established
recipe-state error, not a product selection fix. Three unfinished cells remain
open. Active prepared recipe is n2-four-selection-reset-native.spec.js (not
run); details and served mapping in n2-four-integration-2026-10-14.md.

Then: A3 V3 T033/T034/T035 (including violet ungrouped section underline),
A-CHECKLIST→A-FLUIDITE→R10-26→A-ADMIN-CONTROLES→A-PARCOURS-10;
then R10-02/06/14, R10-15, R10-21+K17. Option b for path10 is already coded;
remaining work is presentation. Penpot-dependent lots wait for Claude,
including R10-20/24; T048/K18 remains first in series B.
