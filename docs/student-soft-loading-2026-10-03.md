# Soft loading - SM-16 / EED-UI-2026-0073

Kit `0b491e404e84ad611d83404fde6f1f33fff265c3` (0.4.62 source checkpoint)
owns the quiet palette, separate readable-title/decorative-rail roles, 2px rails,
3.2s off-cue seamless sweep and interruptible 320ms appearance. Three canonical
SCSS files are byte-identical in the consumer. Student loading aliases now
reference Kit variables; Mass Import/Administration use the same primitives.
There is no ordinary inline Mustache paint, private shimmer or new business code.

The old gradient occupied part of the cue at its +/-110% loop boundary.
The new 190%-wide non-repeating light strip is entirely off-cue at +/-180%.
Actual-Sass Chromium tests compare exact screenshots at beginning/end, require
a different visible midpoint, verify interrupted/completed appearance and
RTL/reduced-motion/forced-colours/server-disabled paths at 1600/768/390.
Final isolated run `loading-soft-20261003-c` passes. Earlier a/b runs remain
recoverable intermediate evidence. Frames are static, not whole-area shimmer.

Normal card/filter Motion, loading readiness, native bootstraps, fail-open,
320ms Student and 180ms Mass Import/Administration outgoing/content handoffs,
50/21 cues, breakpoints, original templates and course data are unchanged.
Existing Sass mixed-declaration warning remains; this lot introduces no new one.
The narrow changed-file Kit audit has no new finding. The prior broad audit's
13 unrelated unbaselined findings remain open; its baseline is not rewritten.

## Design and verification

Foundations 08.5.2/08.5 reconciles twelve existing providers, not new duplicate
components. Section/stack frames remain opaque/static; internal cues are lighter,
rails are two pixels and row-height aligned. Hidden legacy geometry is preserved.
Twelve recursive Standard/Library paint/geometry comparisons pass with no
overflow beyond a 0.01px floating-point tolerance. Paired source and backup:
`testing/student-soft-loading-foundations{,-before}-2026-10-03.json`.
External captures: `EasyEdu/artifacts/penpot/soft-loading-20261003`.
Penpot midpoint specimens are static explanations, not running Motion proof.

EasyStud inherits thirty-nine existing linked loading specimens, with no old
cue palette left after the shared-library update. Twelve overflowing descendants
in five mobile instances were resized within their existing roots: gradient cues,
static row widths and name cues. Providers remain linked, heights/row gaps and
hidden legacy stay unchanged; final descendant overflow is zero. Readback:
`testing/student-soft-loading-product-2026-10-03.json`. Whole Student loading
compositions and all Administration loading compositions still need source-backed
publication; existing linked examples do not certify every route/state.

The native candidate `student-soft-loading-preview.spec.js` is local-supervised
in the Navigation Skeleton family: original server-rendered loading is inspected
while only RequireJS GETs are held for at most six seconds. The gate is released
in `finally` before the eight-second fail-open. No loading-root reset, artificial
business entry, non-GET GroupImport command or fixture is allowed. Existing
readiness/exit/entry/inert states and responsive containment must pass after
release. The source scenario must stay immutable while its child executes.
Native successor run `easystud-authenticated-20261003T133140640Z-34072`
passes at 1600/768/390 against served runtime `fffad46` with refreshed caches:
actual primary cue, distinct soft token, 320ms entrance, 3.2s sweep, static
frames/two-pixel rails, root containment/nonfocusable cues and both original
native exit/entry phases. Ready/ARIA/inert final states pass, with no page
error, non-GET GroupImport command or fixture. Cleanup is complete. Native
proof: `testing/student-soft-loading-preview-2026-10-03.json`; all three external
captures are inspected and pinned. These element captures are not full-page
parity: the native long reserved loading area/floating navigation remain, and
desktop edges need separate descendant/full-composition geometry verification.
Mass Import/Administration native lifecycle and complete route compositions are
still separate pending gates.
The first native run `easystud-authenticated-20261003T132641614Z-4696`
failed on a candidate error, not a colour regression: it expected the secondary
soft role on the primary cue. Source explicitly passes the primary #E8EFF5.
The successor asserts both distinct tokens and actual primary paint; all other
assertions remain. Original immutable failure and successful cleanup are pinned
in `testing/student-soft-loading-preview-failure-2026-10-03.json`. No native
PASS is inferred from this diagnosis; no UI source or course data is changed.
Human acceptance remains deferred; this is not a release.

## Portable Platform-owner proposal

Classify Kit pixel-loop/fade contract as ci-reusable and native loading candidate
as local-supervised. Add the twelve paired provider IDs and actual source/product
proofs to the source/Penpot crosswalk. This window does not edit shared dirty
plan/state/registry/batch files. SM-15 role fixture, SM-11 whole-board actions
and actual transfer DB integration remain separate work, not silently certified.

## Recovery

Source uses an owned feature worktree with exact-file verified snapshots. Recover
by a reviewed successor/revert of the owned loading commit, not a reset, copy
over the active preview or automatic manipulation of unrelated work. The
versioned pre-change Penpot paint/geometry record preserves all visible mains;
hidden legacy children were not deleted. No memberships or roles are changed.
