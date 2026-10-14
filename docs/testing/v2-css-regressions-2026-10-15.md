# V2 regressions reported by Kevin, 15 October

The earlier end-of-head reference injection hid a real cascade change: Moodle
aggregated plugin CSS before Bootstrap. PAGE requires CSS follows the theme.
Run233132153Z-33920 with the reference before the theme reveals panel height
1879.97px vs720px at1280. The late viewport height constrains nested lists and
flex-shrinks cards. Diagnostic233533798Z-824 failed on transient sampling after
selection and is preserved; it does not certify expanded cards.

Corrections: explicit intrinsic panel height; paginated children never shrink;
retain the historical p-0 overflow-disclosure footprint; anchor the mobile eye
to the first identity row; 16px between empty-file warning and preview action.
Build conservative PASS. No reserved JS/template/controller change. CSS order
and responsive partials remain intact. Test v2-css-regressions-native.spec.js
checks actual column scroll extents, compact/selected card bounds at1600/1280/390,
and empty-file warning/colour against3cbb03cf in its original theme position.
Native result pending; previous V2 parity claims are superseded by this gate.

Claude Penpot relay: SM panel/list intrinsic flow, participant compact/expanded
cards, disclosure footprint, mobile detail eye; MI empty-file warning spacing,
1600/1280/390 SM and1280/390 MI. Palette colour must be measured, not guessed.
