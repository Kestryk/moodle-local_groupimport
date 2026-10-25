# Guide path context: canonical Kit integration candidate

## Scope

EED-UI-2026-0073 / P1, existing Source/Kit worktrees and implementation window.
Includes the canonical ID-only persistence API, its exact Moodle AMD adapter,
generated module/map, isolated successor tests and local documentation.
Excludes new activity invitation/milestones, old-progress migration, business
commands/data, styles/templates/Motion, Penpot writes and human acceptance.
Shared Platform plans and scenario registry retain their named owner.

Source baseline `afa41fcc92dafd5e823706b860b1c2efbe49f804`;
Kit baseline `723181d94c8a7f5bf6be5c239c471a1d01441f84`.
Technical Moodle component remains `local_groupimport`, floor5.1. No new Moodle
API, compatibility claim, upgrade or public archive version is introduced.

## Actual implementation

The canonical Guide now optionally stores validated positive ID strings/arrays
under `pathContexts[pathName]`, in the existing consumer checklist key.
Schema is explicit `pathContextFields[pathName]`; existing EasyStud paths do
not opt in yet. Public named get/token/set exports are adapted by the scoped
Guide synchronizer, not handwritten duplicate plugin logic.

Reads clone context without writes/restoration. Writes require the same active,
visible path/root/config/epoch as the token captured **before** a native command.
Hidden/inactive/obsolete sessions, malformed IDs, extra fields and unavailable
or exhausted storage reject writes. Writes never certify memberships or complete
a milestone. Explicit local Reset removes only that path's evidence; existing
global checklist Reset still clears all checklist progress, not course data.
Reading saves and fresh-root initialization preserve evidence and old history.
Starting opted paths advances the existing epoch; Stop already does, teardown
nulls config. The consumer must not manufacture a fresh token in a late callback.

Detailed canonical contract: Kit `docs/components/guide-path-context.md`.
Expected business-proof boundary: `guide-activity-grouping-authority-2026-10-11.md`.

## Proof

Kit `node scripts/test-guide-path-context.cjs`:57 actual isolated storage/API
cases pass, with complete unrelated engine reconstruction and five unchanged
presentation assets. Source `node tools/release/test-guide-path-context-build.cjs`:
canonical bounded source parity,15 unchanged product assets, complete unrelated
adapted engine and five callable exports in the generated named AMD pass.
The source map has no sourcesContent. Scoped synchronization aligns14 sources.

The first build failed before generation because the old bridge only converted
init/destroy exports. That failure is retained as a procedure diagnostic; the
bridge now explicitly adapts all three new exports and rejects unknown exports.
The accepted styles, templates, localized fallbacks and full Motion remain intact.
Historical whole-engine tests remain pinned; do not rewrite them or use them as
the new engine oracle. This separately bounded successor preserves their scope.

Served/native context lifecycle and activity-path activation are still separate
gates. No fabricated native completion, fixture mutation, settings Save or
business command is needed by the storage proof. No new Penpot component/layout
exists in this tranche; visual propagation is therefore not applicable.

## Served native evidence

Feature Source939f243 / Kit4fed6ce is locally served at runtime14c3977 after
managed preview and cache purge. Six native cases pass: EN normal run
`easystud-authenticated-20261011T075659624Z-3576` and FR reduced run
`easystud-authenticated-20261011T075818835Z-22864`, each at1280/768/390.
The QA-only schema/key demonstrates stored context surviving Guide destruction/
reinitialization, no automatic checklist restoration, explicit Resume, real
Reset clearing only its context/completion, other context/legacy progress
preservation and obsolete-token rejection. Errors/blocked commands are empty;
credentials/lease/child cleanup is complete. Retention dry-run protects both
runs without deletion. Sanitized proof:
`testing/guide-path-context-native-2026-10-11.json`.

This uses the existing filter path with temporary QA schema, not an installed
activity path or fabricated business success. Full browser page reload,
FR-normal/EN-reduced combinations and human acceptance are still separate.
Current bilingual PHP payload remains12 readings/7 invitations/8 definitions.
Per-lot consumerSync adds the exact canonical/consumer pins without changing
nominal public metadata or earlier pins. No design-family change is claimed.

## Next integration stage

Add activity-specific targets, typed success predicates and bilingual invitation
using these now-served APIs, then validate real path cues/resume/reset separately.
Keep the old create-grouping definition/progress; decide visible invitation
replacement explicitly, never silently translate its old completion.

All other Guide/SM requests and the deferred combined human checklist remain.
