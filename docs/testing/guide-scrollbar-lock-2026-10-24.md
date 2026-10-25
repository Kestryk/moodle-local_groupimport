# Guide document scrollbar compensation

The shared scroll lock measures `innerWidth - documentElement.clientWidth`
before hiding document overflow. When that scrollbar would disappear, its width
is added to the computed HTML right padding. The original inline value and its
priority are saved and restored when the last Guide root releases the lock.
Repeated opens do not accumulate padding. Zero-width/overlay scrollbars do not
add padding. A stable scrollbar gutter already retains the reservation and must
not receive a second compensation.

The canonical Guide, embedded source and Moodle AMD adapter share the same lock
block. Fullscreen parking, release promises, animations and CSS are untouched.
The AMD build and source map are generated with `build-guide-amd.cjs`.

## Verification protocol

Run `tools/release/test-guide-scrollbar-lock.cjs` for lock ownership, repeated
opens, exact padding/priority restoration, stable gutters and zero-scrollbar
cleanup; the optional argument selects the canonical Guide source. Keep the
existing `test-guide-fullscreen-release.cjs` as the independent release gate.

The supervised `tools/playwright/guide-scrollbar-lock-native.spec.js` discovers
one authenticated local test. Set `K2362_AMD` to the exact candidate/baseline AMD
file and `K2362_ACORN` to the supplied parser, plus `K2362_LABEL` and the normal
runner credentials/browser settings. Browser artifacts stay in the external
manifested run. There is no course fixture or runtime deployment.
For the additional pre-existing Guide lesson measurements, save the baseline
report first and supply it through `K2362_REGRESSION_BASELINE`. These lesson
measurements must remain identical; the scroll-lock width assertions remain
absolute (at most 0.5 px) regardless of any baseline lesson defect.

Chromium headless normally hides scrollbars. The candidate explicitly removes
that launch flag and disables overlay scrollbars. Moodle also clips document
overflow around its own inner scroller: a disposable, absolutely positioned
spacer and test-only body-overflow rule create real document overflow without
reflowing the course content. The fixture selects automatic gutters to reproduce
the reported disappearing-scrollbar case, then checks stable gutters separately.
Every positive case requires both document overflow and a nonzero measured
scrollbar before opening; a zero-width local result is not accepted as proof.

FR/EN at 1600/768/390, ten open/close cycles with and without a document scrollbar.
Record `#region-main` before/during/after, card width/x, padding restoration and
page errors. The same run samples five Guide lessons, checks stable gutters,
and measures external native-fullscreen exit followed by Close. Preserve
preliminary harness failures rather than relabelling them as successful runs.

## Results

The native candidate passes all 120 cycles: FR/EN at each width, ten cycles with
a 15 px document scrollbar and ten without. Baseline opening increased the host
width by 15 px in all six positive combinations. Candidate open/close width
deltas are exactly 0 px; card x/width and original inline padding are preserved.
All six stable-gutter cases also preserve host width without added padding.
The two native-fullscreen external-exit/Close runs contain 214 sampled frames
and no hidden-modal/parked-host frame. Zero JavaScript exceptions.

The 30 sampled lesson measurements remain identical to the baseline. This is
a bounded non-regression result: the local runtime's older CSS/templates contain
13 pre-existing flagged lesson cases, including captions, identifier specimens,
Start order and filter search presentation. They are not certified fixed by this
scroll-lock change. Recheck the final integrated assets separately.

ESLint remains at its inherited 26 errors / 513 warnings, with zero additional
diagnostics. Full-checkout MoodleCS reports 0 errors / 32 inherited warnings;
no PHP is changed. Canonical/embedded full-engine roundtrip already has unrelated
drift; the three owned lock blocks are identical and all other engine bytes
are preserved. The independent current consumer fullscreen-release test passes;
the older library test fixture needs its own geometry API update.
