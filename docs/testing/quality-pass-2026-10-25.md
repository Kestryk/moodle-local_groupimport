# PHP quality gate and legacy contract inventory

Use MoodleCS 3.7.0 with PHPCS 3.13.6, matching the plugin CI. Run the complete
plugin in a valid Moodle component context. A standalone worktree scan cannot
resolve every package, language-order or PHPUnit coverage check. The Windows
runtime distribution may omit `config-dist.php`; a temporary upstream copy of
that unexecuted sample file allows component discovery and must be removed
when restoring the exclusively leased runtime.

## Inclusion decisions

Remove `MOODLE_INTERNAL` only from declaration-only files and empty standalone
fixture includes. `importlib.php`, the performance helper libraries, the
welcome test and seven worker doubles perform no top-level Moodle operation.
Keep the guards in files which load dependencies or construct global Moodle
state, including the standalone bootstrap, service definitions and test files
with top-level `require_once`. Web entry points retain their real `config.php`
bootstrap and capability checks. The small CLI reporting fixtures explicitly
declare `CLI_SCRIPT` before loading Moodle; they do not bypass web login.

The worker double intentionally has the same fully qualified name as the
native transfer service. Its narrowly named duplicate-class annotation is
local to that isolated fixture. The distributed Guide language files keep
their real `local_easyedu_guide` package identity; only the parent plugin's
incorrect-package diagnostic is annotated for those two embedded files.
Neither exception disables the remaining coding standard.

## Behaviour-preserving metadata

Fixture declarations identify their package. PHPUnit classes identify their
actual covered classes/functions; no assertion is removed and `coversNothing`
is not used. Language arrays are ordered by key. Existing section notes are
retained before the assignments, as required by the language-order sniff.
Compare the complete evaluated key/value arrays before and after, including
both languages of the embedded Guide distribution. Header class-name wrapping
in Mass Import concatenates the identical string.

There is no change to JavaScript, SCSS, Motion, permissions, data schema,
translated values or generated assets. A product changelog entry and asset
rebuild are therefore not applicable to this housekeeping batch.

## Test reporting

ESLint reads the unmodified AMD sources through `lintText` with the established
Moodle build configuration and stdin-equivalent paths. Preserve the raw
line-ending diagnostics as part of the baseline; do not normalize source files
to manufacture a lower count. Report before/after totals and source hashes.

The release directory also contains historical source-preservation oracles,
isolated browser specimens and native scenarios requiring their own fixture
and lease. These are distinct from a single runnable CI unit-test suite.
Inventory every `test-*.cjs` and retain its arguments, outcome and failure log.
Supply actual compiler/renderer dependencies; do not substitute a current CSS
file or current HEAD for a historical baseline merely to turn an oracle green.
Native tests may run only against their leased copy with explicit fixture
inputs. Missing fixtures are blocked scenarios, not passing tests.

Store machine-specific logs, dependency paths and the detailed CI outcome in
the external review artifact directory. A green PHP gate is not a claim that
the entire lint, browser or GitHub Actions workflow is green.
