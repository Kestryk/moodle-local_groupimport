# Post-I3 fixture producers

The standalone Guide presentation fixtures now read `classes/output/manage_page.php`
for the literal tutorial definitions and call `output\guide_config::build_template_data`
for the actual adapter. Path literals and illustration branches come from
`classes/output/guide_config.php`. The pages are never bootstrapped.

## Parity gate

`tools/release/verify-fixture-producer-parity.cjs <php> <new-external-directory> <old-fixture-ref>`
compares the eight current fixtures in EN and FR against the unmodified fixtures
from the supplied Git ref. In an external scratch tree, it reconstitutes the
current producer bodies at their former global locations. The scratch `manage.php`
is scanned, never included. The 16 JSON values must be deeply equal; PHP warnings
and absent extraction boundaries fail the verifier. This checks relocation parity,
not a claim that today's curriculum equals a historical curriculum.

The original I3-2 commit `c37fa3d0` also preserves both Guide constructor bodies
under whitespace/namespace normalization. No production PHP, template, JS, CSS,
translation, permission or Motion change belongs to this fixture lot.

## Current browser inputs

Offline render fixtures must load the page sheets declared by `manage.php`, in
order. Since I9, `styles.css` intentionally has no site-wide presentation rules.
`fixtures/page_css.cjs` reads the actual page declarations; it does not synthesize
replacement CSS. Historical CSS identity tests retain their historical inputs.

The isolated Guide loader executes the actual built Motion, Bubble and Guide AMD
modules in dependency order. Missing dependencies throw. `mustache_partials.cjs`
resolves the real local Mustache partials and throws for unknown/missing files.
Neither helper supplies fallback markup, a fake Motion implementation or relaxed
geometry. Existing assertions and historical baseline refs remain in place.

## Security fixture routing

The K21 write-path fixture takes token-bounded `handle` bodies from the current
I6 action classes. Its 19 behavior assertions stay unchanged. S4 exercises the
shared `create_names` parser and scans the actual action classes for both protected
removal paths. The bulk fixture invokes actual action classes; newly missing core
interfaces or changed query-count contracts remain failures to qualify.

## Results and limits

The full 225-script inventory and per-script raw logs are recorded in the external
review report for this lot. Historical one-change preservation proofs are retained,
not deleted or rebased to HEAD. A mismatching source snapshot is not by itself a
confirmed product bug. Native tests still require their own matching lease,
credential channel, scenario data and supported Moodle version.

No CHANGELOG entry: this lot changes release-test fixtures only, with no public
runtime behavior or schema change.

## Supervised native adapter

The tagged-administration CLI fixture accepts process-local credentials from the
existing saved-credential supervisor, with the previous secret-file fallback.
The versioned post-I3 native spec invokes the original assertions under the same
explicit pool lease. Login awaits committed DOM content rather than all unrelated
page requests. It saves no settings or authentication state to disk.

The native replay passes FR/1600, then retains a FR/390 failure: the old removal
target oracle expects 24px while the shared Close touch floor produces 44px.
Review that policy separately; this fixture lot does not shrink the target or
replace the assertion. The supervisor itself is unchanged.
