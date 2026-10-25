# Shared Student Management column surface

Student Management now selects `--easyedu-surface` for its existing
`--easyedu-lane-surface` configuration on every supported Moodle host. The former
`--easyedu-surface-strong` consumer override and the redundant Moodle-5.3-only
lane override are removed. The obsolete experimental grey-surface explanation
is removed with them.

The existing canonical `workspace-lane` mixin still owns the outline, radius,
semantic top rail, inset, shadow and adjoining start/end segments. This change
adds no Kit definition or local paint recipe. The Kit's generic soft fallback
is retained because other consumers, including Mass Import, legitimately use it.
No other page stylesheet changes.

The Moodle 5.3 host selector is retained for its separate navigation surface and
narrow participant metadata container. Neither is a column-background workaround.
The global `--easyedu-surface-strong` token remains in use by fields, navigation and
loading treatments and is not removed.

## Native candidate

`tools/playwright/k23-59-workspace-lanes.spec.js` is a single supervised native
candidate. Supply a local manager URL and process-only saved credentials through
the normal runner, plus `K2359_DIR`, `K2359_VERSION`, `K2359_BASELINE_CSS`,
`K2359_CANDIDATE_CSS` and the browser executable setting. No authentication state
or credentials are stored by the candidate.

It replaces only the requested page stylesheet in the headless browser with the
exact base/candidate build, on an authenticated real Moodle page. Runtime files,
configuration and course data remain untouched. UI preference writes are stubbed
and the Moodle drawers are closed through their native controls before measuring.

FR/EN, 1600/1280/768/390: both desktop layouts and each responsive entity tab.
The comparison requires every painted column segment to be white and retains
before/after card and lane border, radius, shadow, margin, padding, gap and
geometry records. Transparent grouping wrappers are not mistaken for painted
column surfaces. Cards are sampled from the first six visible instances per role.
The normal product Motion is awaited; it is not disabled for the screenshots.

The compiled declaration audit must show exactly two differences: the common
lane value changes to the white Kit surface and the redundant 5.3 override
is removed. All other selectors/declarations and page styles remain unchanged.

## Verified results

Native headless Chromium on Moodle 4.5.9, 5.1.3 and 5.3+ passed all 20 paired
comparisons per version (60 total). Before paint was `rgb(237, 243, 248)` on
4.5/5.1 and white on 5.3; after paint is `rgb(255, 255, 255)` on all three.
Card/lane border, shadow, radius and spacing records are identical; the maximum
width/height difference is 0 px. Outlined lane segments retain their existing
1 px Kit border, including the open adjoining edge between header and list.

All three runs reported zero JavaScript exceptions. Moodle 4.5 also reported
13 resource-404 console messages, already present with the baseline stylesheet;
these are not claimed fixed by this background-only change. MoodleCS found
0 errors and 32 existing warnings in the full checkout (no PHP changes).
All runtime stylesheet hashes and modification times remained unchanged.

The earlier login/drawer-wait diagnostics and an interrupted 5.3 run are retained
separately from the three completed runs. This verifies the candidate stylesheet
against each deployed local host's real DOM; it is not a deployment or a full
cross-version functional certification.
