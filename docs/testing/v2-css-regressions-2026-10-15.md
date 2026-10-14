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

Native234156525Z-54264 PASS: FR1600/1280/390 compact and selected cards,
no painted-column internal scroller, no compressed card/horizontal overflow,
mobile eye aligned to identity row and p-0 footprint retained. MI warning gap
16px at1280/390. Preview colour rgb(130,117,7), white text, exactly matches
3cbb03cf before the theme in both widths; it is not caused by the split.
Review of mobile collapsed/expanded and desktop expanded PNGs completed.
No pageerrors/business writes; credentials/child/lease cleanup passed.
Rendered cards remain bounded by pagination inventory, not a panel viewport.
Earlier233956457Z-33020 failure counted an inactive opacity0 panel and is kept.
Admin/global CSS did not change in a211780d, prior native admin/outside gates
remain scoped evidence. Structure-view specific successor pending separately.

Structure successor234523350Z-37308 PASS1600/1280/390, no painted-column
internal scroller or horizontal overflow. Admin1280/390 five choices/page CSS
PASS; outside /my no EasyStud selector, no page bundle, global0rules PASS.
Claude69f060f4 is included in this final served-state check. Original sampled
states and failed diagnostics are retained separately. V2 gate closed for these
scoped regressions, Kevin's visual acceptance remains separate.
