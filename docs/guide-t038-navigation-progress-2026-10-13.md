# T038 - Guide navigation reading lanes

Programme `EED-UI-2026-0073`, scope GS3/GS4. Kevin approved the separate
short FR/EN labels on 12 October: each current Guide slide keeps its stable
identifier and order, receives its reading number, and uses one short chapter
label per consecutive group. Full slide headings remain unchanged.

## Implemented candidate

Kit `c771328` / 0.4.200 defines an explicit
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

`tools/release/test-guide-t038-navigation.cjs` passes 35 source/Kit/lang
contract checks. This is not a browser or visual acceptance claim. Foundation
and product Penpot composition remain pending because the shared editor is not
available; the native N2 proof must cover French 1600/1280/390 after the
controlled localhost publication. Human acceptance remains open.
