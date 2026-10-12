# T037 — reading composition, bounded completion-paint successor

Programme `EED-UI-2026-0073`. T037 remains PARTIAL: GS1/GS2/GS5/GS8/GS9 reading
changes are not implemented yet. Human checklist and original61 received scopes
remain open. This first successor fixes the independently observed completion
paint, not the complete slide layout.

## T037-A: actual change and preservation

On baseline Source22b0d16/Kitbfaf059/runtime6e6cdc9, the unified scene-header
body mixin paints its child regular/ink. Finished accent/strong on the parent's
display:contents node cannot override that child. The diagnostic records16
localized/width/palette cases with this strict failure; keep it immutable.

Kit0.4.185/7728357 adds exactly two emitted declarations on the finished child:
semantic `--easyedu-accent` and `--easyedu-font-weight-strong`. All other CSS,
font metrics, controller/template, translated copy, curriculum, course commands
and Motion bytes remain identical. No private plugin stylesheet or new engine.
The16 records =2 languages ×4 widths ×2 palettes, each covering the four
current timed entries; results count records, not synthetic browser sessions.
Both default and custom accent paint pass the corrected isolated successor.

## Source / Standards / product design

Existing saved Foundation Reading banner Finished Desktop and Phone already
use Inter/700/accent. Four source/Standard roots were read from the server,
framed in the owned editor and raster-inspected, unchanged; no new shared family.
Product's existing linked Desktop is retained. A missing Phone usage is added
as linked source instance under `92 / Guide / Finished reading banner / Phone`,
in the verified free lane below existing hosts. Both saved source links and
painted text are read back. Caption12.48 design and current narration14.4 native
metrics are explicitly different densities; this lot preserves metrics and
establishes semantic paint parity only, not full typography/design acceptance.

External manifested evidence run: `guide-t037-20261012-a`. Its source/Standard
and product JSON/rasters remain outside Git. Owned CDP9225/MCP4411 only; no other
window's connection is altered. No Moodle fixture or persisted setting changed.

## Native gate (pending at this checkpoint)

`tools/playwright/guide-t037-finished-paint-native.spec.js` is local-supervised,
not CI. It covers actual Start/Next/finish/reset on all four current entries,
Add/Move, EN/FR,1600/768/390 and normal/reduced policies (60 cases). It compares
idle/active/reset metrics, finished accent/700 and visible completion icon,
then a reversible Guide-root-only custom accent; no settings Save. The same
registered wrapper/QA storage, denied course writes and complete cleanup apply.
Isolated CSS states do not certify actual engine completion or native preview.

## Next bounded work

### Retained native predecessor and strict successor

Run `easystud-authenticated-20261012T115532027Z-42356` stops on its first
reversible custom-palette icon comparison. The actual default finished copy
and icon already pass accent/700. After changing the test root to #8b3470,
copy changes immediately while the icon inherits the existing live colour
transition: its sampled rgb(120,64,108) is between endpoints, not the expected
settled rgb(139,52,112). Credential/lease/child cleanup is complete; no writes.
Retain the immutable predecessor and unchanged assets. The separately named
`guide-t037-finished-paint-settled-native.spec.js` waits actual finite modal
effects before both custom paint sampling and restoration; same strict colours,
60 routes and metrics. It does not change product transitions or assertion values.

GS1 paragraph-only42rem reading width; GS2 source-confirmed title ink without
reverting approved16px; GS5 discrete safe-demo caption; GS8 semantic Source/
Destination scene labels; GS9 existing dl/dt/dd lesson reading points in3 desktop
columns/1 phone, excluding six introduction specimens and T012 ol recap.
Keep original clocks/cards and dedicated interface cue. GS3 short labels belong
to separate T038 human decision. Approved Student corridors remain queued.

## Recovery and handoff

Before this successor, verified clean three-repository candidate snapshot:
`ws3-20261012T113654Z-port4719pg3-8544b02337e2` (candidate-not-published).
T012's disclosure/continuous/keyboard proof stays pinned, not relabelled as proof
of this new CSS. Revert only the two completion paint declarations if needed;
do not reset a worktree, move paths or purge unrelated history.
