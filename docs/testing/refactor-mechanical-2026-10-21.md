# I1 / I2 / I5 / I7 — mechanical cleanup before V2

Replay base: `2311f3cf`, including I3 and the K21-37/K21-39 participant policy.
Dedicated branch: `work/codex1/easystud-refactor-current-2311-20261022`.
Supersedes `87eca0aa` on `2db398f0` and `d2ea49f9` on `565533b8`. No runtime deployment,
database change, browser or native SQL test. All changes remain on this branch.

## I1 — retired production code

Remove 15 named functions from `manage.php` (the complete legacy render family,
navigation-key helper and three participant enrichment helpers), the unused email
extractor from `ajax.php`, and the unused delimiter helper from `importlib.php`.
Token-based removal verified every retained function unchanged at this step.
Remove the orphan card-title-accent source, minified build, map and builder, plus
the overlay mixin with no SCSS include. Compilation before/after produces exactly
the same CSS as the current base (Node 22.11.0, Sass 1.79.1; 1,483,008 bytes).

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
configuration computations are removed in `classes/output/manage_page.php`, their
post-I3 location; the two obsolete helper definitions are removed from `manage.php`.
All four I3 constructors remain in `manage_page`, `guide_config`, `context_actions`.
The three classes only lose a class-opening blank line required by current MoodleCS;
the two Guide/context classes otherwise remain byte-identical after LF normalization.

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
The only canonical settings change between 2db398f0 and 2311f3cf is the K21-37
comment explaining selection-based disclosure after the fold-chevron removal.
Its exact current wording is retained inside the fulltree block. The changelog
conflict is resolved by keeping both the I14 and I1/I2/I5/I7 entries.

## I7 — lean move-status reads

The general list filters queued/running/retry in SQL. An explicit job id must
retain final outcomes: completed/cancelled/failed are still returned to the
polling dialog. Both paths select only `id,status,nextitem,total`, exactly the
inputs of `move_job::progress()`, excluding payload and other history data.
The existing final PHP filter, course/owner scope, descending order, response
shape and localized messages remain. `move_modal.js` is unchanged.

## Executed gates

- `test-refactor-mechanical.cjs <absolute PHP> <external output> [base]` executes
  actual before/after post-I3 output classes and service builders, the actual move-status branches,
  full settings construction and the real contrast method with deterministic
  Moodle boundaries. 27 JSON cases, exact serialized order and SHA-256 parity;
  full settings parity in FR/EN, partial-tree query assertions, protected files
  unchanged. This is isolated execution, not a native Moodle certification.
  Each variant loads its own saved source for all three output classes, including
  the real Guide JS-config constructor. Per-source hashes are in `json-parity.json`.
- S4 parser fixtures: 44 checks for each script; Guide parser five examples;
  initial-state transport 15 checks; K21 write-path and uninstall metadata tests;
  security escaping and filter engine. PHP syntax checked on all touched PHP.
- Full MoodleCS: 0 errors / 32 warnings across the plugin; warnings listed in
  external JSON. Official
  local_codechecker other-file checks: 0 errors / 0 warnings. No lint rule changed.
  The current I4 mass_import_preview class also had one class-opening blank line;
  this mechanical error is fixed and the rest of its source is pinned unchanged.
- Current AMD sources are byte-identical to 2311f3cf except the removed orphan.
  Full Moodle ESLint remains 105 pre-existing errors, with 560 warnings.
- Extended isolated release gate: 12/13 pass. The R6 bulk fixture fails because its
  doubles omit `core_group\visibility`, needed by the already existing optimized
  membership-assignment service. Reproduced against an isolated copy of base
  `2311f3cf`; no product or fixture assertions were changed to hide it. The old
  failing run, exact baseline reproduction and all other results are preserved.

Replay evidence lives in `C:/dev/artifacts/refactor-current-2311-20261022/`.
The 26 targeted commands pass, including PHP syntax on 14 touched PHP files.
Historical delivery evidence stays in `C:/dev/artifacts/refactor-mechanical-20261021/`.
The first replay fixture failure (missing authentication boundary while exercising
the newly covered JS-config constructor) remains archived. Only the deterministic
Moodle boundary doubles were extended; no production behavior was changed for it.
The intake JSON's pre-existing merge markers are left untouched; this document
and the four changelog lines provide the delivery record.

Integration: the complete replay is based directly on `2311f3cf` and preserves
the I3 extraction. A clean cherry-pick is checked in a separate owned worktree
at that exact revision. Do not also apply the superseded `d2ea49f9` or `87eca0aa`. I12 owns
canonical Kit reconciliation; its synchronizer must not restore the retired
overlay into this consumer. No remaining visual token value was changed.
