# More Filters hover and Motion successor — SM-54

EED-UI-2026-0073. Intake audit after SM-58 served PASS; implementation and
human acceptance OPEN. SM-43A underline-only proposal was explicitly rejected.
Do not close this successor from the old native test PASS.

## Verified current state

Canonical Kit `_forms.scss` `filter-disclosure-trigger` uses transparent paint,
primary-strong text and label underline on hover. Wide/Touch fill the available
lane; Compact is natural width. `filter-disclosure-row` reserves 16px padding.
Source SM-43A native record proves both transitional phases and nested closure,
but predates the user's later report of perceived roughness and rejected hover.

Product file `220f6449-533e-815b-8008-ad9958d032a1`, Student page
`92c1c225-95fb-802e-8008-ae9f13d0b0b9` live audit counts 20 effective-visible
More Filters copies, Wide/Touch, four current providers:

- Wide Collapsed: `2a31d374-d2a1-80fd-8008-ac60c5933349`.
- Wide Expanded: `2a31d374-d2a1-80fd-8008-ac60c650268e`.
- Touch Collapsed: `a301101d-ddc2-807b-8008-bbb661c14700`.
- Touch Expanded: `a301101d-ddc2-807b-8008-bbb661e42659`.

Foundations Standard/Library pages and ten main/Standard state IDs are retained
in `docs/testing/filter-footer-foundations-2026-10-05.json`. Use those existing
providers, not a second family. Product narrow lanes differ by composition;
preserve their width overrides and actual painted label/chevron centres.

Mustache currently renders a direct label span and decorative Chevron span.
The consumer `_layout.scss` delegates Wide paint to the canonical recipe, but
`_structure.scss` also consumes Compact for Group member Show-all controls.
Therefore a blind global repaint of that shared mixin can alter unrelated
accepted card controls. Preserve those by a documented opt-in composition or
explicit compatibility path, not private consumer declarations.

## Next bounded implementation

Propose a quiet localized shared hover capsule around label/chevron, rather
than a full-width filled footer or underline-only response. Keep full available
hit lane, existing canonical type, icon ratio/gap and keyboard-focus ring.
Publish desktop/mobile source and all twenty consuming copies, read back and
inspect meaningful exports before promotion. Proposal is not human-approved.

Audit actual opening/closing padding/height and reversals before attributing
roughness to CSS. Preserve original card Show-all/expand Motion, one-click
nested closure, inert/ARIA, focus and reduced/disabled policies. Native proof
must sample both transitional phases, not merely the endpoint. No filtering,
roles, memberships or Guide writes belong to this lot. Existing footer gap
and per-view availability rules remain in force.
