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

Human checklist stays OPEN. This candidate is not yet served on localhost.
