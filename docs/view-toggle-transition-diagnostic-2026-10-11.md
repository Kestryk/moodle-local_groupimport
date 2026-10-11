# R10-25 — View icon flash diagnosis and source candidate

Read-only native run42032 on source66b3067/runtime b5fc3d8 records48 frames on
three real desktop view changes. Correct terminal colours do not prevent the
icon/tile temporarily converging while both colours interpolate. Conversion
through native canvas gives minimum contrasts1.4298/1.4298/2.1555:1.

Retain the raw colours: Chromium uses rgb, color(srgb) and oklab. The original
diagnostic's regex-based RGB calculation is explicitly rejected; the separate
offline measure-view-toggle-paint gate preserves the original report and writes
an immutable corrected sidecar. It does not reopen Moodle, import auth state or
mutate course/settings data. This is diagnosis, not acceptance of the flash.

Kit0.4.167 supplies a shared stable-icon modifier for atomic glyph/tile
paint. View/card Motion, transforms, commands, endpoints, geometry and native
class ownership remain unchanged. Foundation Library/Standard annotate eight
existing M/S states and24 tiles; two source captions are saved. Three existing
product switchers carry the same contract without static paint/geometry changes.
The consumer opts in by one public class. Canonical module identity and complete
unrelated CSS/controller/Motion preservation pass. Strict served native contrast
frames are required before claiming this issue fixed in preview.

The43 historical semantic-palette checks remain passing. Current source and
native minimum-contrast proof will be independently pinned; no legacy test is
rewritten or broad consumer style substituted. R10-11 filters stay separate.

The isolated successor reproduces legacy contrast below3:1 and passes three
atomic-paint palettes (minimum5.3604/6.9846/6.9823:1), unchanged28px icon geometry.
Glyph transition:none introduces no new movement timing; existing hover
movement and view/card animations remain unchanged. Native successor pending.

Source/Kit preservation snapshot ws3-20261011T130405Z-port4719pg3-1f6595b35507
is verified. Kit604a9d7 is pushed on the existing work branch, version0.4.167.
Consumer metadata records this one-module sync, not a full-kit version upgrade.
Saved GET checks confirm8 Library/24 Standard/3 product annotations; both
source captions were read back and the native SVG paints their complete copy.
Classification: the frame diagnosis and strict successor are local-supervised;
the three-palette browser fixture and source reconstruction are ci-reusable.
Platform shared plan/registry updates remain its owner's responsibility; this
local record is the EED-UI-2026-0073 backlink. No human action is required yet.

Workflow cost notes for R10-33: narrow known-family reads and structured summaries
are preferable to full descendant inventories, which produced oversized output.
Penpot offscreen text is culled: frame before reading SVG, and use auto-width
measurement with fixed-lane restoration only when real cached paint is stale.
Use runtime-installed Playwright via the runtime wrapper, explicit preview SHAs,
and rg directory/glob filters on Windows. No token/cost total is available.
