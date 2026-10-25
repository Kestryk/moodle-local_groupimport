# K21-35 — Full quality inventory

`.gitattributes` now enforces LF for JS, SCSS and CSS. All 719 tracked matching
files in this owned worktree were converted from CRLF and passed
`git add --renormalize -- '*.js' '*.scss' '*.css'`. Their normalized bytes are
identical to the committed Git blobs: no runtime source or generated asset
content changed, so no AMD/style rebuild is needed. Other agents' worktrees
were not rewritten. They must apply the attributes on a clean coordinated
checkout; normalization must not discard local work.

`test-source-line-endings.cjs` checks the policy and actual checkout. Detailed
before/after JSON and byte proofs live in
`C:/dev/artifacts/k21-33-36-20261021/`. ESLint comparisons ignore absolute
autofix byte offsets (changed by CRLF), retaining rule, severity, message,
line, column and end positions. All non-linebreak diagnostics are identical.
No remaining ESLint issue is presented as fixed by this mechanical lot.
The pre-existing intake JSON conflict markers are not resolved by this change.

No lint rule was disabled or weakened. Moodle .eslintrc rules are loaded with the plugin as cwd so AMD overrides apply.

ESLint: 26662 errors / 572 warnings before LF; 105 errors / 572 warnings after LF. Fatal parsing errors: 0.

All remaining diagnostics are identical before/after. The first CLI attempt outside the config root missed AMD overrides; it is retained but excluded.

| ESLint rule | Errors | Warnings |
|---|---:|---:|
| promise/catch-or-return | 0 | 22 |
| camelcase | 0 | 1 |
| promise/always-return | 0 | 45 |
| max-len | 68 | 0 |
| no-empty-function | 0 | 12 |
| curly | 25 | 0 |
| brace-style | 0 | 406 |
| max-statements-per-line | 0 | 24 |
| no-multiple-empty-lines | 0 | 1 |
| complexity | 0 | 23 |
| jsdoc/require-param | 8 | 0 |
| no-nested-ternary | 0 | 18 |
| one-var-declaration-per-line | 0 | 14 |
| max-depth | 0 | 1 |
| consistent-return | 0 | 2 |
| no-unused-vars | 4 | 0 |
| promise/no-nesting | 0 | 2 |
| promise/no-callback-in-promise | 0 | 1 |

| File | Errors | Warnings |
|---|---:|---:|
| amd/src/card_title_accent.js | 0 | 2 |
| amd/src/csv_import.js | 1 | 7 |
| amd/src/easyedu_guide.js | 41 | 475 |
| amd/src/guide_welcome.js | 5 | 0 |
| amd/src/local/cm/actions.js | 4 | 2 |
| amd/src/local/cm/advanced_settings.js | 5 | 3 |
| amd/src/local/cm/cards.js | 3 | 4 |
| amd/src/local/cm/context_menu.js | 0 | 19 |
| amd/src/local/cm/drag_drop.js | 1 | 2 |
| amd/src/local/cm/filters.js | 0 | 1 |
| amd/src/local/cm/group_cards.js | 30 | 4 |
| amd/src/local/cm/group_card_controls.js | 0 | 6 |
| amd/src/local/cm/guide.js | 0 | 2 |
| amd/src/local/cm/identifiers.js | 1 | 0 |
| amd/src/local/cm/layout.js | 2 | 1 |
| amd/src/local/cm/list_controls.js | 1 | 6 |
| amd/src/local/cm/messaging.js | 0 | 2 |
| amd/src/local/cm/modal.js | 0 | 1 |
| amd/src/local/cm/move_modal.js | 1 | 7 |
| amd/src/local/cm/navigation.js | 1 | 2 |
| amd/src/local/cm/optional_tools.js | 0 | 1 |
| amd/src/local/cm/pagination.js | 6 | 2 |
| amd/src/local/cm/participant_modal.js | 0 | 2 |
| amd/src/local/cm/quick_actions.js | 1 | 16 |
| amd/src/local/cm/shared.js | 1 | 0 |
| amd/src/local/cm/workspace.js | 1 | 1 |
| amd/src/local/sm/groups.js | 0 | 1 |
| amd/src/local/sm/participants.js | 0 | 1 |
| amd/src/searchable_choices.js | 0 | 2 |

MoodleCS: 0 errors, 28 warnings, 219 PHP files.

| PHP file | Line | Warning rule | Message |
|---|---:|---|---|
| classes/local/batch_reader.php | 19 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| classes/local/guide_discovery.php | 19 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| classes/local/guide_specimen.php | 19 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| classes/local/guide_welcome.php | 19 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| classes/local/import_execution.php | 19 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| classes/local/import_preview.php | 19 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| classes/local/motion.php | 19 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| importlib.php | 25 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| index.php | 417 | moodle.Files.LineLength.TooLong | Line exceeds 132 characters; contains 175 characters |
| tests/guide_welcome_test.php | 21 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| tools/perf/decompose.php | 24 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| tools/perf/lib.php | 25 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| tools/playwright/k21-course-counts.php | 27 | moodle.Files.RequireLogin.Missing | Expected login check (require_login, require_course_login, require_admin, admin_externalpage_setup) following config inclusion. None found. |
| tools/playwright/palette-native-default-roles.php | 27 | moodle.Files.RequireLogin.Missing | Expected login check (require_login, require_course_login, require_admin, admin_externalpage_setup) following config inclusion. None found. |
| tools/playwright/palette-native-full-defaults.php | 27 | moodle.Files.RequireLogin.Missing | Expected login check (require_login, require_course_login, require_admin, admin_externalpage_setup) following config inclusion. None found. |
| tools/playwright/student-native-context.php | 27 | moodle.Files.RequireLogin.Missing | Expected login check (require_login, require_course_login, require_admin, admin_externalpage_setup) following config inclusion. None found. |
| tools/playwright/t020-complete-view-config.php | 27 | moodle.Files.RequireLogin.Missing | Expected login check (require_login, require_course_login, require_admin, admin_externalpage_setup) following config inclusion. None found. |
| tools/release/fixtures/move-job-mock/context_course.php | 17 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| tools/release/fixtures/move-job-mock/core_user.php | 17 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| tools/release/fixtures/move-job-mock/cron.php | 19 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| tools/release/fixtures/move-job-mock/group/lib.php | 23 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| tools/release/fixtures/move-job-mock/lock_config.php | 19 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| tools/release/fixtures/move-job-mock/membership_transfer.php | 19 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| tools/release/fixtures/move-job-mock/membership_transfer.php | 28 | Generic.Classes.DuplicateClassName.Found | Duplicate class name "local_groupimport\service\membership_transfer" found; first defined in C:\dev\worktrees\easystud-codex1-k21-33-36-20261021\classes\service\membership_transfer.php on line 34 |
| tools/release/fixtures/move-job-mock/move_job_test_db.php | 17 | moodle.Files.MoodleInternal.MoodleInternalNotNeeded | Unexpected MOODLE_INTERNAL check. No side effects or multiple artifacts detected. |
| tools/release/test-import-execution-served.php | 27 | moodle.Files.RequireLogin.Missing | Expected login check (require_login, require_course_login, require_admin, admin_externalpage_setup) following config inclusion. None found. |
| tools/release/test-server-name-escaping-served.php | 27 | moodle.Files.RequireLogin.Missing | Expected login check (require_login, require_course_login, require_admin, admin_externalpage_setup) following config inclusion. None found. |
| tools/release/test-server-name-escaping.php | 27 | moodle.Files.RequireLogin.Missing | Expected login check (require_login, require_course_login, require_admin, admin_externalpage_setup) following config inclusion. None found. |

Official local_codechecker other-file checks: 0 errors / 0 warnings. No Moodle bootstrap/runtime.
