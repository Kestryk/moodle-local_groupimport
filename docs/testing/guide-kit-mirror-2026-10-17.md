# Guide Kit mirror — 2026-10-17

Base EasyStud: 6c3ac95f (origin/work/claude/easystud-regressions-20261016).
Canonical base: 0a460ecd (the preceding Codex1 K16 canonical sync).
Branches: work/codex1/easystud-guide-kit-mirror-20261017 and
work/codex1/easyedu-kit-guide-mirror-20261017.

## Contract and scope

Reverse-report the accepted C-G1/C-G2/C-G3/C-G4/C-G5/C-G7/P-G6/J-G2/J-G3/J-G4
sources to the canonical ES module and embedded mirror. Retain generic default
labels, exported public functions, separate Fullscreen and Motion imports.
The Moodle adapter retains its inline Fullscreen, AMD dependency, translated
fallbacks and partial namespace. The new shared partial is guide_simplecreate;
the adapter maps it to local_groupimport/guide_simplecreate. Only its documentation
annotation differs. Consumer runtime sources and generated assets are unchanged.

SCSS has no second copy inside easyedu-guide-kit: its shared source lives in
scss/easyedu/components. Copy _guide-discovery.scss, _guide.scss and _animations.scss
to the canonical checkout, without introducing a third styling authority.
No public API or architecture policy changes; no new AI-contract rule is needed.
Other consumers must adopt the Guide sources atomically using their existing
adapter. They have not been built, published or visually certified in this lot.

## Validation

Run from this EasyStud worktree, replacing KIT with the canonical branch checkout:

    node tools/release/test-guide-t037-reading-composition.cjs KIT
    node tools/release/test-guide-t038-navigation.cjs KIT
    node tools/release/test-guide-mirror-roundtrip.cjs KIT

PASS: T037 (14 checks), T038 (47 checks), adapter roundtrip (exact normalized
runtime JS and templates; five callable AMD exports; ES-module syntax; three
SCSS files). No browser, runtime, service, build or generated asset mutation.

Test changes deliberately replace obsolete approved-design expectations:
T037: 42rem reading measure -> 38rem, 42rem container -> 36rem (C-G1/C-G2);
read compiled Student Management CSS after the CSS-per-page split rather than
global styles.css. T038: 12 labels -> 13, Create/Batch replacing Structure
(C-G7). Both tests now accept a canonical checkout path as the first argument,
retaining the historical default. All other original assertions remain.

The read-only sync-easyedu-guide.ps1 -GuideOnly check aligns every Guide-owned
item, including new partials and animations. Its wider historical scope still
reports pre-existing _buttons.scss drift against canonical base 0a460ecd (K16-80
Close changes are outside this delivery). No Apply run and no unrelated button
changes. Full log: <workspace>/artifacts/guide-mirror-roundtrip-20261017.log.

The new source-only roundtrip test separately verifies the exact owned contract;
it does not relax or hide the wider synchronizer diagnostic. Native visual and
human acceptance remain those of the source delivery; no new claims are made.
Canonical delivery: 6804e7f9c02fddfdaa841be5fe972c31fff11d81 (pushed on the dedicated branch).
