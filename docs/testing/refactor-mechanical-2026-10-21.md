# I1 / I2 / I5 / I7 — mechanical cleanup before V2

Base: `565533b8`, including K21-33..36. Dedicated branch:
`work/codex1/easystud-refactor-mechanical-20261021`. No runtime deployment,
database change, browser or native SQL test. All changes remain on this branch.

## I1 — retired production code

Remove 15 named functions from `manage.php` (the complete legacy render family,
navigation-key helper and three participant enrichment helpers), the unused email
extractor from `ajax.php`, and the unused delimiter helper from `importlib.php`.
Token-based removal verified every retained function unchanged at this step.
Remove the orphan card-title-accent source, minified build, map and builder, plus
the overlay mixin with no SCSS include. Compilation before/after produces exactly
the same CSS (Node 22.11.0, Sass 1.79.1; 1,490,171 bytes).

The legacy profile-chunk tool really still reads two removed functions. Their
exact bodies are pinned under `tools/perf/fixtures/legacy-profile-fields.php`,
never loaded by production; the original 21 historical checks still pass. The
tool's README distinguishes this historical proof from today's producer.
`specimen.js`, Moodle callbacks, `find_import_user`, `course_structure` and the
`userdetails` action remain untouched. `course_structure::get_state()` has no
production caller found, but `tools/perf/measure.php` still calls it three times
(the userdetails action uses `get_user_details` instead). It is not deleted.

## I2 — one implementation per policy

`classes/local/create_names.php` contains the unchanged bounded parser and letter
conversion; both script entrypoints delegate, preserving their callable names.
The existing S4 and Guide parser fixtures load that shared implementation without
relaxing assertions. `participant_fields.php` owns configured identifier labels,
the service's stricter display-field visibility policy, and colour validation.
The public/protected service entrypoints delegate to it. Unused page display
configuration computations and their two obsolete helper definitions are removed.

The visibility implementation is the service's original policy: clone each custom
field, force signup=0, then call Moodle's `is_visible($context)`. Never replace it
with the old unrestricted page listing. Fixtures cover a hidden configured primary
field, a visible detail field, duplicate detail choices and a viewer without field
access; no private value appears. `settings.php` delegates WCAG contrast calculation
to the unchanged implementation in `lib.php` (five actual private-method cases).

## I5 — standard partial-tree behavior

Register the setting page whenever site configuration is allowed. Construct
settings, load custom-field choices and initialize this page's presentation only
for `$ADMIN->fulltree`. Full-tree FR/EN metadata is identical (23 child items).
The partial tree registers one empty page and performs zero plugin SQL instead
of one custom-field query. The optional global colour-setting class relocation
is not included: retaining its existing class identity keeps this lot mechanical.

## I7 — lean move-status reads

The general list filters queued/running/retry in SQL. An explicit job id must
retain final outcomes: completed/cancelled/failed are still returned to the
polling dialog. Both paths select only `id,status,nextitem,total`, exactly the
inputs of `move_job::progress()`, excluding payload and other history data.
The existing final PHP filter, course/owner scope, descending order, response
shape and localized messages remain. `move_modal.js` is unchanged.

## Executed gates

- `test-refactor-mechanical.cjs <absolute PHP> <external output> [base]` executes
  actual before/after page and service builders, the actual move-status branches,
  full settings construction and the real contrast method with deterministic
  Moodle boundaries. 27 JSON cases, exact serialized order and SHA-256 parity;
  full settings parity in FR/EN, partial-tree query assertions, protected files
  unchanged. This is isolated execution, not a native Moodle certification.
- S4 parser fixtures: 44 checks for each script; Guide parser five examples;
  initial-state transport 15 checks; K21 write-path and uninstall metadata tests;
  security escaping and filter engine. PHP syntax checked on all touched PHP.
- Full MoodleCS: 0 errors; warnings listed in external JSON. Official
  local_codechecker other-file checks: 0 errors / 0 warnings. No lint rule changed.
- Current AMD sources are byte-identical except the removed orphan. Full Moodle
  ESLint remains 105 pre-existing errors, warnings 572 to 570 (orphan removal).
- Extended isolated release gate: 12/13 pass. The R6 bulk fixture fails because its
  doubles omit `core_group\visibility`, needed by the already existing optimized
  membership-assignment service. Reproduced against an isolated copy of base
  `565533b8`; no product or fixture assertions were changed to hide it. The old
  failing run, exact baseline reproduction and all other results are preserved.

Evidence lives in `C:/dev/artifacts/refactor-mechanical-20261021/`. Intermediate
fixture failures (missing Moodle boundaries / accidental test-store aliasing)
remain archived; the strict successor keeps the same product and assertions.
The intake JSON's pre-existing merge markers are left untouched; this document
and the four changelog lines provide the delivery record.

Integration: apply before/rebase the parallel I3 builder extraction, so it uses
the shared field policy and does not reintroduce unused page helpers. I12 owns
canonical Kit reconciliation; its synchronizer must not restore the retired
overlay into this consumer. No remaining visual token value was changed.
