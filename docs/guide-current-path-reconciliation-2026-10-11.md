# Current Guide content and path reconciliation

## Scope

Owner: existing EasyStud implementation window, EED-UI-2026-0073.
Repository: existing Source worktree, branch
`work/port4719pg3/easystud-foundations-student-management-20260928`.
Includes: offline successor test, current coverage/procedure documentation.
Excludes: product code, Kit/design writes, live progress, course data, runtime
publication and the postponed human checklist. No runtime lease is needed.

Source audited: `fa794d596b3b95791cd63ad32a4b23bf11bdbcd1`.
Writer reference: `content-proposal-2026-10-08/HANDOFF.md`, `PLAN.md`,
`CROSSWALK.md`, `QUESTIONS.md` and the two Student Management JSON proposals.
The proposal is a content handoff, not an exact-copy or native completion oracle.

## Actual current programme

The actual PHP fixture yields the writer's twelve stable reading IDs, in the
same order, for EN and FR. There are six reachable invitations and seven path
definitions. The introduction remains a Guide-mechanics lesson without the
group-creation path. This is not evidence that all proposal copy or artwork is
identical, nor that every optional path has native business-completion proof.

| Proposal/path | Current implementation | Remaining boundary |
| --- | --- | --- |
| practice-membership | Six typed native milestones, visible on create-structure | Real group creation/assignment outcomes and human review are distinct from open/search/Cancel proof |
| reorganise-source-members | Four typed milestones, visible on add-or-move-members | Confirmed native transfer is not covered by the non-mutating review tests |
| prepare-activity-grouping | Not installed under this ID; existing create-grouping invitation retained | Define success signals and explicit legacy-progress policy before replacement |
| verify-with-filters | Not installed; search-filter-select remains a reading lesson | Add reliable filtered-result selection-scope signals, not a generic selection event |
| inspect-group-settings / inspect-grouping-settings | Two additional four-step, non-saving paths on their card lessons | Native inspection/Cancel proof exists; no Save/business completion claim |
| first-structure | Historical definition retained, no visible invitation | Never silently delete its saved progress or reintroduce it in the introductory slide |
| try-actions | Original three-step invitation retained on choose-right-action | Old action-method exercise is not the proposed filtered-result verification path |

The activity legacy adapter is not merely a view-open signal: source creation
success emits its first milestone after native `creategrouping` response. Its
later signals are broader, including grouping selection and expansion. Those
events do not prove that the expected groups have been added and verified.
Keep this distinction when designing the successor; do not claim the original
path is wholly unimplemented or silently relabel it as the new proposal.

All twenty-four original public presentation payloads remain archived. The
existing explicit maps cover legacy20, discovery24 and introduction-first24.
The modern presentation key and twelve IDs are unchanged. No migration decision
for the two proposed future paths is made by this audit.

## Executable successor

Run `tools/release/test-guide-current-path-coverage.cjs <php>` with Node.
It uses the existing pure PHP fixture and the actual bounded storage engine,
with an isolated in-memory QA key; it never bootstraps Moodle.

PASS: 12 slides / 6 invitations / 7 definitions per language; 54 localized
milestones, 136 historical reading positions and 14 retained path-state cases.
Typed steps assert exact target identity, previous-step dependencies and event
completion. Original three invitation payloads remain identical to the archive.
Loading never writes; all seven completion maps and historical path identities
survive reading migration; first backups and unknown histories are preserved.

The original activation-only tests are immutable historical evidence: one
expects three invitations and another whole-file identity at its old baseline.
They are not a current seven-path oracle. This successor does not weaken or
rewrite them. Exact predecessor hashes and result are recorded in
`testing/guide-current-path-reconciliation-2026-10-11.json`.

The initial new-harness assertion incorrectly required an optional per-slide
category on both old invitations. Actual template has its canonical category
fallback. The corrected oracle checks that fallback and exact archived payloads,
plus exact invitation/checklist titles for typed paths. Legacy summaries retain
their existing distinct wording. No UI or contract change was needed.

## Next safe sequence

1. Audit native filter/search/selection authorities for a bounded,
   non-mutating verify-with-filters candidate; distinguish visible results from
   all-results selection before defining completion.
2. Specify prepare-activity-grouping separately, including creation/reuse,
   authoritative membership verification and the old-progress boundary.
3. Continue remaining welcome/reset/persistence/full-scene gates with their
   existing ownership and no fabricated business outcome.
4. Final grouped human checklist stays deferred at the user's request; older
   Student Management, admin, Mass Import, Skeleton, packaging and rename lots
   remain retained. No acceptance is inferred from this audit.

No new Foundation family or Kit sync is applicable: this lot changes only test
and documentation. No cache purge or preview is needed; rendered assets remain
unchanged. No screenshot, credential, user-progress or course-data artifact is
created. Historical ledger entries remain recoverable, with a current projection
at its top rather than deleting chronology. Changelog and local AGENTS record
the successor rule; shared Platform planning remains with its named owner.
