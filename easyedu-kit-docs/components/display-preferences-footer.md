# Display preferences and Guide footer — K17-62/69

`card-direct-action($size: 1.85rem)` keeps the complete existing card action
recipe and all defaults. Display preferences opts into `$size: 2rem`, shared by
navigation, the Guide footer and its checklist. Desktop frame: 32 × 32 px. The
existing pointer-coarse / narrow 44 × 44 px frame, icon metrics, hover disc,
focus and accessible label stay unchanged. Other card actions keep their
29.59375 px frame at the 16 px baseline.

The Discovery footer follows the legacy Guide shell in the cascade. Its own
compact rules must retain Touch44 after both previous/primary action recipes.
The two navigation buttons remain one grid group; this group may shrink and
its buttons keep a 44 px minimum. No independent row for the settings icon.
The reading counter has the accepted 20 px line track, yielding the exact same
vertical centre as the three buttons. The 92bd04f8 nowrap/padding correction
is retained. The current native 390 footer is 64 px high; desktop height remains
63 px, unchanged in this bounded correction. The optional Show cue stays in
its existing slot. Guide content, order, keyboard and Motion are untouched.

Canonical template and shared Guide SCSS are aligned with the integrated
K17-62/69 predecessor e8a1b83a, including 92bd04f8. The consumer template is not
changed; the mirror now carries its namespace/localization adapter exactly.
The branch starts above df4c0db / 0428c2a, preserving GMI-C2/C3/C4 and K18-C-MI.

Native proof: FR/EN × 1600/1280/768/390, zero console errors, footer centre
spread 0 px and no bottom/document overflow. The compact next/previous targets
are 44 px. At768 the existing checklist avoidance mode hides its footer;
those hidden zero-size boxes are not reported as visible44px controls.
Human acceptance and any Penpot update remain separate.
