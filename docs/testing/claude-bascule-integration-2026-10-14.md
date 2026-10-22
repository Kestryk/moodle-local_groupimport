# Claude on-demand-only / loading / Later / K16 integration

Latest Kevin instruction supersedes earlier execution priorities. Integrate
the four Claude commits in order, upgrade local_groupimport to2026101400,
publish, notify Codex2 to replay K16. Source product/registry commits remain
separate; no reserved JavaScript edited independently.

| Original | Integration | Scope |
| --- | --- | --- |
| 1bf77389 | 73fa0128 | On demand only, remove rendering setting, version2026101400 upgrade |
| cf2be86b | 732b957f | No empty-list states before the course model arrives |
| 6a499c5f | dbf4886b | Later postpones the invitation in the current session, not seen preference |
| 1a10749e | 483fa9fd | Grouping mobile Search groups action delegates to its native panel |

No duplicate original/provenance was present. Only CHANGELOG/generated AMD
conflicts occurred. All entries retained and Course Manager rebuilt from the
merged Source, preserving earlier T058 inline focus/F7. PHP syntax, AMD/
ES-module syntax,11-case auto-scroll gate and isolated welcome session contract
pass. Later checks include stale generation, guest, unchanged seen preference,
same-session suppression and fresh-session offer; no persistent writes.

During rebuild, another window wrote an uncommitted K21 lot in the historical
Source worktree (Course Manager, manage/template/SCSS/lang and K21 specs).
Preserve it, do not commit/reset/stash it. Publication worktree is isolated:
<workspace>/worktrees/easystud-codex1-bascule-publication-20261014,
work/codex1/easystud-bascule-publication-20261014, based on483fa9fd. Only this
branch's scoped build/docs/spec are included. Existing proof0983e87e is a
publication prerequisite. Kit unchanged. Original Source is not clean and
belongs to the other writer until an explicit handoff; do not switch it.

Upgrade: runtime's admin/cli/upgrade.php is absent. External CLI bootstrap
calls the installed Moodle upgrade_noncore(true) engine after verifying ONLY
local_groupimport is pending; no borrowed core bootstrap, other plugin or core
upgrade. The final CLI checks plugin version2026101400, removed config record
and local_groupimport_is_on_demand_rendering()===true. Upgrade/cache writes
run under the principal runtime lease. Never restore renderingmode=legacy or
run historical mode-switch recipes after this publication.

One supervised recipe: claude-bascule-principal-native.spec.js, FR/EN1280/390
on-demand only. Hold the real state request until the skeleton/empty-state
observation, then release it and use actual ready cards. Native K16 action
opens the intended grouping panel, real field focus, reset/cancel38px parity,
search/reset/close and focus visibility; no hidden-control forcing. Isolated
adapter probe intercepts its synthetic Later request, verifies POST/action
and sesskey fields and destroys the probe; server session semantics are
tested separately by the no-runtime PHP contract. No new fixture, course
write, seen-preference mutation or global welcome reset. This integration
does not implement the later first-visit timing/wrapping/pulse improvements.

Claude Penpot propagation: existing mobile Grouping card/actions sheet,
Search groups icon/label and native inline-search recipe, Student Management,
rest/sheet/search/focus/Cancel,390 FR/EN; existing loading skeleton/empty-state
visibility,1280/390; welcome Later same paint, same-session hidden state.
No canonical/visual/human acceptance claimed from source/agent proof.

Next small conversation: A-CHECKLIST, then A3V3 with50% accent opacity (also
violet#72508C ungrouped section), T043/44/46/47/48, GUIDE-PILLS, first-visit
audit tasks, then series A/R10 per FILES-CODEX-AVANT-RELEVE. Reserved Course
Manager/local-sm/course_state/external changes remain Claude's. No Penpot
connection by Codex. Current publication/proof and relay are recorded below.

## Served publication and upgrade

| Original | Integration | Served |
| --- | --- | --- |
| 1bf77389 | 73fa0128 | 5f8b1edd |
| cf2be86b | 732b957f | c981934e |
| 6a499c5f | dbf4886b | a978f930 |
| 1a10749e | 483fa9fd | 0d4992c2 |

Grouped build/record7df19c44 is served as f20b44a5; prerequisite proof0983e87e
is served as7122f0ac. Preview branch is clean. Upgrade engine completed with
version2026101400, config record absent, on-demand helper true, pending plugins
empty. Upgrade also purged caches; it did not restore legacy. Kit6abf7d4b,
version0.4.208 unchanged. Logs remain in the external authenticated artifact
root: claude-bascule-preview-20261014.log,
claude-bascule-moodle-upgrade-20261014.log and runtime-after JSON.

## One native pass retained as FAILED

Run easystud-authenticated-20261014T140634975Z-26864 selected exactly one test.
The first FR1280 cell stopped before loading observation or K16: the default
five-second expectation saw no data-easystud-rendering-mode attribute yet.
This attribute is set by startOnDemandState, not the server template. No
pageerror or blocked mutation was recorded. This does not prove later
initialization succeeds and does not prove a product failure. All four K16
cells and the browser Later adapter remain unverified; no native PASS claimed.

Keep the original spec/run immutable. The separate
claude-bascule-principal-ready-native.spec.js successor waits first for the
actual state request under the existing60-second startup bound, then checks
the rendering attribute. All locale, loading, keyboard, geometry, visible
menu and mutation oracles remain. Successor prepared, NOT RUN; no second
Playwright pass in this conversation. Codex2 can replay K16 on demand only.
Server Later behavior passed in the isolated PHP contract, not a new native
login/session or human first-visit proof. Shared Foundations remains Claude's.

Cleanup: credentials cleared, owned child stopped, runtime lease released,
no fixture requested, zero observed pageerrors/blocked writes. Failure logs,
JSON and context remain external; no generated media was reached, so the
media-only manifest has0files. Retention dry-run:0candidates/0deletions.
All15 product/build blobs compared match7df19c44 and f20b44a5. The historical
Source advanced independently to07104791; only our old untracked PHP test
remains there. Preserve it and that checkout; continue from the isolated branch.
Current proof commit is intentionally not served
alone; include it with the next product publication. A-CHECKLIST is next.

## Fifth Claude commit — progress-aware loading deadline

Kevin requested b5f44a7a before A-CHECKLIST. Only product change is
js/loading_state_bootstrap.js, imported with provenance; no source conflict.
Finished script/xhr/fetch extends the8s inactivity deadline, under a30s ceiling
reset when the visible frame appears. Stalled AMD still emits amd-timeout;
ready disconnects the resource observer and preserves late-ready recovery.
The actual bootstrap executes in test-loading-progress-deadline.cjs with
virtual timers/resource completions, covering stall/progress/irrelevant
resources/ceiling/frame/reduced motion/late ready. No real-runtime writes.

Claude's reported8052 course71 native measurements: frame11.4s, ready20.3s,
no degraded after purge; blocked requirejs gives degraded8.8s. These are
reported upstream evidence, not a new principal-native PASS. The initial
principal failure above remains intact. Publish this integration with prior
proof194ea6dc, relay it to Codex2, then implement A-CHECKLIST. Penpot now
handled by Kevin; no Codex Penpot access or new visual composition here.

Publication completed: b5f44a7a→e552cb05→c155904b, prior proof194ea6dc→3d6653de,
preview clean and purgePASS2026-10-14T15:13:17.2621831Z. The18virtual cases
pass, including unchanged reveal timing after the logical deadline. N2 relay
updated before starting A-CHECKLIST; no new standalone native pass for loading.

In A-CHECKLIST's single failed recipe run20261014T153602743Z-26884, principal
cold startup reaches ready21803ms, with loading then ready and no degraded,
pageerror or mutation. On-demand/FR attribute gates pass. This validates only
the cold-start loading slice of b5f44a7a; stalled principal module and K16 remain
open. A-CHECKLIST stopped later at native-target preparation before any checklist.
