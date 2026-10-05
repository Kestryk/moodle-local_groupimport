# Quiet desktop selection recovery (SM-52)

Source candidate after served SM-50. User rejects two strong nested borders;
retain the centred outer capsule and propose a quiet inner Clear selection.
Public `easyedu-selection-recovery-action` opts into shared
`selection-recovery-action`, inheriting Small selection-action type/density,
icon spacing, standard Motion, keyboard ring and disabled behavior. Resting
surface/border are transparent; hover/pressed use the existing pale surface
and paragraph ink. No new font, private offset or forced style. Only the existing
desktop recovery button opts in; responsive action proxies keep their old skin.

The complete generated CSS differs only by this new public family. Existing
capsule/layout/pagination, template outside the one class, controller, AMD,
mobile cards and accepted Motion are unchanged. Sass build and bounded
`test-quiet-selection-recovery.cjs` prove preservation, not native acceptance.

Foundations has five new Library states in 08.2.1 and linked Standard copies in
08.2. Default/Hover/Pressed/Focus-visible/Disabled preserve canonical Small
geometry and linked circle-xmark. Main/descendant normalization now passes:
the 12.48px source slot contains 10.4px glyph paint, rather than the inherited
20px geometry left after a component swap. All five source/Standard recursive
paint/type/geometry fingerprints match and have no overflow. Shared capsule
source and Standard consume the new provider at unchanged 218.88x43.6 frame
and 127.08x30.4 button geometry. Product propagation now passes readback: the
one active shared capsule consumes Quiet Default with no inner fill/stroke;
its previous neutral version is hidden recoverably. A file-wide component scan
finds this active usage and its archive only. The owned editor checkpoint was
inspected: label/glyph sit inside the capsule; selection handles and editor
chrome mean this is not a clean component export or full visual parity proof.
Native sticky checks remain OPEN. Retain the old neutral
states; do not repaint the global neutral selection-action family.

The candidate is now served via managed request 20261005T211901Z-3c478ecca3,
including prior documentation/test commit 97f449d before ea5d351. Runtime HEAD
61eb5590 is clean and managed cache purge completed. First native run
easystud-authenticated-20261005T211925074Z-8284 failed before authentication:
the login DOM rendered, but the test waited for full page load at its 15s action
timeout. No product assertion ran. Cleanup completed, no fixture requested.
The successor uses DOMContentLoaded (like the existing SM50 scenario) and a
separate bounded navigation timeout, retaining readiness/fonts and all strict
paint/geometry/behavior oracles. Human checklist stays OPEN.

Second run easystud-authenticated-20261005T212015202Z-24840 reaches native
1600px rest: centred capsule, button 126.36x30.39, Inter 12.48/600 and zero
icon centre delta. It stops on a test serialization assumption: zero-alpha
transparent paint serializes as rgba(255,255,255,0), not rgba(0,0,0,0), after
transition. The successor asserts exact zero alpha rather than invisible RGB
channels; hover/focus/geometry/behavior oracles are retained. No product fix or
business request; all cleanup true. Preserve both failed predecessor runs.

Strict native successor PASS easystud-authenticated-20261005T212116128Z-47096:
six desktop records at 1600/1100 (rest/hover/keyboard-modality focus), plus the
unchanged 390px responsive proxy. Capsule centre delta and icon centre delta
are zero; dimensions are stable through hover/focus, canonical Inter12.48/600,
no permanent inner border, pale hover and visible keyboard ring. Clear works
at all three widths; bottom pagination has no capsule overlap. No business
writes, blocked requests, page errors or fixture mutation; all cleanup true.
Disabled/pressed and long labels retain shared static/Penpot coverage, not a
new native all-locale claim; keyboard focus paint is not full tab-order proof.
Native blob 9d0db8b1442e7351256c4ad7928c94bfc21fbbb2 and SHA256
795E6DDF34AD7AF894C0E8484A176161041362B097E2BAB7501720945D5ED0E4.
Served CSS blob ed2ed8746f8de3322849784bff727e1bcc09dd95. Source/Kit/Motion
preservation guards remain PASS. Human validation and clean export remain OPEN.
