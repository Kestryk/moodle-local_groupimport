# Floating Guide caption: intrinsic width and balanced text lane

The caption had a fixed 6rem maximum and inherited the host system font rather
than the UI family. On the current native pool the ordinary French and English
strings did not exceed that cap: the reported end clipping was not reproduced
on this baseline. A reproducible horizontal imbalance did exist: the text lane
had 0.45rem before the caption but 0.85rem after it, shifting its centre 3.203px.
Do not relabel the native zero-clipping baseline as a reproduced clipping failure.

The canonical Guide recipe now specifies the UI family, centres its label and
uses the same 0.85rem gap as the existing outer inset. Its maximum width comes
from `--easyedu-guide-floating-label-width`, plus 0.125rem paint clearance.
The shared Student Management / Mass Import launcher supplies the rounded-up
text advance from its resolved font, recalculated on creation, font readiness
and resize. Canvas font metrics avoid the collapsed flex box and entrance scale;
neither `scrollWidth` nor transformed Range width is a safe measurement there.
The resize listener is removed with the existing page lifecycle cleanup.

No participant state, source launcher command, modal, Guide content or Motion
timing changes. The resting 48px circle and icon are unchanged. The exact Kit
variant is pinned in the consumer manifest; unrelated pre-existing Guide
module differences are preserved.

Native FR/EN checks at 1600/768/390 use real scroll, hover and Guide open/close.
After settling, the caption equals its text width (FR 93.28125px, EN 72.90625px),
with no clipping. Horizontal text-lane and vertical line-box offsets are 0px.
The font-character Range is 0.796875px above the line centre, an ordinary font
metric; it is reported separately from CSS alignment, not hidden by an offset.
All unrelated ordered CSS rules across the four page styles remain identical.
The official Moodle Grunt pipeline, not historical handwritten wrappers,
produces the delivered AMD module and map.
