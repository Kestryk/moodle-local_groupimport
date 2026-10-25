# Searchable multiple filters - SM-14 / EED-UI-2026-0073

Dedicated EasyStud/Kit branches own this increment. Canonical Kit
`df067f8f571c965a38bcbf941e7194c8a6035b72` (0.4.60 source checkpoint) supplies
the byte-identical JS controller and searchable-choice/native-field recipes.
Consumer-specific hooks/translations/reset bindings own no new SCSS paint.
The original filter predicates, Move command, AJAX/service and Motion remain
unchanged against consumer `f27f88dbf30843b4d10d85e12b35e47228c5d2a3`.

## Behavior

Groups, Groupings and the two group-catalogue grouping filters accept multiple
independent choices and searchable options. Native selected options survive
searches with no results. None/one/count summaries and labels are translated.
The mobile role fallback is searchable below the original 768px threshold;
desktop/tablet role shortcuts stay native. Participant-only grouping filter
visibility on mobile is unchanged, not invented by the new composition.
Both modes share Escape, local focus, disabled/no-JS and label restoration.
Native Reset and role shortcuts refresh the corresponding choice controller.

## Canonical presentation and proof

Foundations 08.4/08.4.1 has six linked pairs: Closed/Open/No-results,
Responsive-open, Focus-visible, Disabled. Recursive provider/geometry/paint
checks and descendant containment pass. See the versioned readback JSON.
EasyStud page 03 keeps one filter block and its original contents/role shortcuts;
only the superseded checkbox presentations and full composition are hidden
recoverable archives. New ordinary composition hosts retain linked inner
controls; product owns no competing component Library. Desktop/Mobile open
examples are on board `a301101d-ddc2-807b-8008-bba0f07b1569`, at (80,6760),
below the prior board with a 122px gap. Groupings remain hidden in mobile.
The touch More-filters override uses the existing shared 44px source density;
its dedicated canonical touch/hover catalogue remains SM-17, not completed.

All captured texts are Inter; native Kit font continues inheriting Moodle.
The first isolated run exposed an invalid inherited-family `font` shorthand
and 16px fallback. Canonical longhands restore regular 14px fields, rather
than a forced plugin style. Isolated run `searchable-multiple-20261003-c`
passes single/multiple interaction and S/M/L field density at 1600/768/390.
It does not load the Moodle icon font and cannot certify native paint.

`tools/release/test-student-searchable-filters-contract.ps1 -KitRoot <kit>`
guards exact canonical assets and unchanged native predicates/Move/API/Motion.
PHP lint, builders and Sass pass with one pre-existing mixed-declaration
warning. Wider canonical audit still reports 13 previously unbaselined px/hex
findings in unchanged extraction files; the baseline is not changed to hide
them. Historical single-choice/member proof ledgers remain immutable.

## Preview gate and evidence

`student-searchable-filters-preview.spec.js` is `local-supervised`, exact test
`Searchable multiple filters preserve native selections and reset across
workspaces`. It is a proposed focused extension of the registered
`easystud-filter-panel-geometry` family. Native execution requires clean pushed
source, managed promotion/cache and the saved-credentials wrapper with explicit
source-spec root and runtime lease. Discovery selected exactly one test.
No fixture, business POST, enrolment change or actual Move/Remove/Send is used.
Managed source `6e8a2a7` is served at clean runtime `cae152ae`, with cache refresh
completed. Run `easystud-authenticated-20261003T123356784Z-14216` passes six
selection/search/reset cases at 1600/768/390, both desktop group catalogues,
original OR predicate parity and the native mobile role-search fallback.
Triggers measure 14px with 38px Desktop/44px touch height. Six native control
captures were inspected and pinned; page errors and business POSTs are zero.
Owned child stopped, lease released and credentials cleared; no fixture.
Evidence: `testing/student-searchable-multiple-preview-2026-10-03.json`.
Full-block/card/Motion runtime parity, many-role fixture and human acceptance
remain separate; static unchanged Motion is not fresh animation proof.

External evidence: `EasyEdu/artifacts/kit/searchable-multiple-20261003-c` and
`EasyEdu/artifacts/penpot/multiple-filters-20261003` (Standard `standard-b.png`,
Library `library-a.png`, product `product-a.png`). Captures agent-inspected,
manifested and retained. First cropped Standard capture is preserved as
intermediate, not representative proof. Retention dry-run deletes nothing.
Human acceptance is false; the combined checklist remains deferred.

For snapshots use `save-selected-members-snapshot.ps1 -Name <new-name>
-File <exact-allowlist>`; optional `-SourceRoot <explicit-git-worktree>` supports
the paired canonical Kit. It refuses existing snapshots and validates exact
paths/hashes under the external handoff root; no source files are overwritten.

## Portable Platform-owner proposal

Record canonical Kit/source pins, six paired Foundation IDs and inherited
product controls from `docs/testing/student-searchable-multiple-*.json` in
the source/Penpot/refactor crosswalk. Classify the native spec as
local-supervised and the Kit isolated contract as ci-reusable. Keep source,
linked visual readback, agent capture inspection, native runtime and human
acceptance separate. This window leaves dirty shared planning/state/registry
and batch files untouched; this is a proposal, not an applied shared-plan edit.
