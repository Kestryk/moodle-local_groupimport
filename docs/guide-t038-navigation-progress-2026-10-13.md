# T038 - Guide navigation reading lanes

Programme `EED-UI-2026-0073`, scope GS3/GS4. Kevin approved the separate
short FR/EN labels on 12 October: each current Guide slide keeps its stable
identifier and order, receives its reading number, and uses one short chapter
label per consecutive group. Full slide headings remain unchanged.

## Implemented candidate

Kit `facc899` / 0.4.202 defines an explicit
`.easyedu-guide-nav-item__path` route glyph for a guided path. EasyStud renders
that glyph inside the existing navigation button while retaining the existing
`has-guided-path` class and `data-easyedu-guided-label` accessibility contract.
The previous visible text badge is not painted by the shared component.

Navigation labels now wrap at the actual card width instead of being clipped
with an ellipsis. The Discovery variant retains its existing width and scroll
behaviour; chapter labels are still emitted by `guide_discovery::modern_curriculum`
only when the category changes from the immediately preceding item. No guide
engine, path identifier, reading migration, action, dialog, storage or Motion
behaviour changed.

## Evidence and remaining gates

`tools/release/test-guide-t038-navigation.cjs` passes 36 source/Kit/lang
contract checks. The compact route glyph is expressly excluded from the generic
direct Font Awesome chapter-icon selector, and its own host-safe inline rule is
retained when Moodle theme utilities force a flex display.

After controlled localhost publication and cache purge, the read-only French
native N2 proof passes at 1600, 1280 and 390: all twelve short labels have no
overflow or ellipsis, each guided path emits the named route pictogram, and
each route pictogram remains contained in a 22px compact box. The run has no
console errors, no blocked requests and no business writes:
`C:\Users\kj220291\AppData\Local\EasyEdu\artifacts\easystud\authenticated\easystud-authenticated-20261013T101715322Z-40432`.

This is not a human visual acceptance claim. Foundation and product Penpot
composition remain pending; the separate T040 FR/EN capture requirement and
human acceptance remain open.
