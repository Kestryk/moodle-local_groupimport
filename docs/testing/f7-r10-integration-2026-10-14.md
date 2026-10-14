# F7 / R10-09 / R10-12 / R10-22 / T058 — integration

Kevin's 14 October instruction: publish the five commits together, verify
FR1280 and390 in both rendering modes. No Penpot operation by Codex.

| Original | Source integration | Scope |
| --- | --- | --- |
| 1777dddc (Claude F7) | 0ff1e05c | Batched member heights and deferred action-menu measurements during view swaps |
| 744e0f07 (Codex2 R10-09) | f2ea4776 | Equal result-count and Select all height |
| 5ec681c3 (Codex2 R10-12) | cbce74e9 | Quiet Clear selection within the existing recovery capsule |
| f347269e (Codex2 R10-22) | 616a3c87 | Narrow pagination arrows, painted circle on hover |
| 9b017481 (Codex2 T058 contrast) | d526ed7a | Existing readable heading token replaces stale literal |

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

Next: A-CHECKLIST→A-FLUIDITE→R10-26→A-ADMIN-CONTROLES→A-PARCOURS-10;
then R10-02/06/14, R10-15, R10-21+K17. Option b for path10 is already coded;
remaining work is presentation. Penpot-dependent lots wait for Claude,
including R10-20/24; T048/K18 remains first in series B.
