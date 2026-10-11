# R10-17 — Preview requires a completed file

User request: prevent navigation when Preview is pressed without a loaded file,
with an explanatory warning before any request. Existing Moodle filepicker
allocates a positive draft ID when empty; that ID is not file readiness.

The consumer adapter now binds one capture-phase submit guard to the real import
form only. It requires Moodle's completed filename anchor and no native
dndupload-inprogress marker. Empty/progress-only/local raw-file states cannot
submit. Invalid submission stays on the page, exposes the canonical
easyedu-notice--warning, focuses the real picker action and marks it invalid.
The existing selected-file observer clears the warning/invalid state after a
completed callback. Actual selected-file submission delegates unchanged to Moodle.

No generic validation controller is forked. Native filepicker draft/upload/delete,
server validation/parser, history/rollback/confirmation, accepted Motion, SCSS,
Guide and course commands remain unchanged. Both EN/FR warning copy are provided.
No new Foundation visual family is needed: existing Warning components are
read-only confirmed in the connected Foundations library from Guide Easystud.
This is component availability, not fresh saved/raster whole-view validation.

## Proof and boundaries

test-import-file-required.cjs executes the actual bounded helpers: eight empty,
whitespace, selected and uploading combinations, completed-callback recovery,
idempotent capture, generated AMD export execution and exact reconstruction of
all unrelated controller source. All pass. PHP form lint and maintained Moodle
Babel/Terser build pass. Complete CSS/Guide/business-source equality is checked.

Local-supervised native scenario: actual empty picker with positive native draft
ID; real Preview click and Enter at390/768/1280, contained Kit warning, returned
picker focus, no document reload or business writes. Source scenario is immutable
while the child runs. Actual file upload/import and human acceptance remain
separate; no fixture/upload is performed to manufacture proof. Native proof is
recorded after ordered managed preview, not inferred from these isolated cases.

Runtime promotion must apply the pushed source commit and purge changed AMD;
do not copy the worktree directly into the serving checkout. Changelog and local
contract are updated; shared Platform plans/registry belong to their owner.
All older Guide/SM/admin/Mass Import requests and the human checklist stay retained.

Initial native43272 stops before the real Preview interaction: AMD readiness
arrives after fail-open and Mass remains degraded. Zero errors/business writes
and complete cleanup; original strict scenario remains unchanged. A one-root
existing late-ready opt-in successor is scoped in mass-import-late-ready-2026-10-11.
This diagnostic does not disprove or certify the empty-file guard.
