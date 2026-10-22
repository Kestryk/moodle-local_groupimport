# K16 Reset / Cancel parity — 2026-10-14

Kevin requests the participant search Reset to use exactly the Grouping group-search
Cancel sizing recipe. Use foundation-button(secondary: true), the regular secondary recipe actually
applied to Cancel by the later public class cascade, with matching row stretch.
Reset keeps the canonical regular search field block-size of2.375rem (38px)
when its mobile grid stacks it below the field; Cancel remains in its38px field row.
Use a precise selector to override the old Reset field-peer sizing. No markup/controller or other Reset changes.

The canonical recipe supplies height, padding, radius, font and interaction states;
there is no new duplicated product size. Different translated labels retain intrinsic
widths. Equality refers to the requested recipe/height/padding/radius, not label width.

SCSS compilation passes. Native candidate injected temporarily from
<workspace>/artifacts/es-k16-v3-20261014.css, FR1600/1280/390 in both modes; compare exact
computed height/padding/radius/font/min-height/border with the real visible Cancel,
and use keyboard Reset to clear the native search. Initial compact-recipe candidate failed (Reset26px vs native Cancel38px); preserved
in es-next14. Regular-recipe desktop1600/1280 equality passed in es-final14; mobile probe
required the native grouping overflow menu and preserved the lower32.39px Reset
measurement before the explicit field-height correction. Final results pending es-k16v3.
Integration/served stylesheet and human acceptance remain Codex1/ Kevin gates.

## Final bounded evidence
Final candidate es-close14: desktop1600/1280 Reset and Cancel are exactly38px,
padding8px16px, radius9.28px, font60012px/14.4px, min-height32px, border1px.
Reset390 also measures38px with the identical computed recipe. Native390 Cancel
comparison cannot complete: the compact Grouping context menu has no Search groups
entry; original direct search button is hidden. Screenshot inspected:
<workspace>/artifacts/es-close14/after/legacy-0/easystud/authenticated/easystud-authenticated-20261014T073334302Z-9132/playwright-output/k16-reset-final-successor--462ec-and-overflow-menu-Cancel-FR/final.png
Spec k16-reset-final-successor.spec.js:35 times out accessing the unavailable command.
Do not force-open a hidden control or claim full mobile parity. Menu controller
work remains outside this CSS lot; Codex1/Claude owns follow-up. Existing native
Reset keyboard clearing passes before the menu probe.

Both legacy and reactive confirm the same desktop equality and mobile Reset38px;
both stop at the missing compact Search groups command, spec line35. No page error
or business write occurred. Exact mobile Cancel comparison remains open.
