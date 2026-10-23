# K23-29 — Group member count after More actions

The Group badge preceded the appended overflow trigger in the DOM without a
terminal flex order. Responsive headers also positioned the trigger absolutely,
so an order-only change could not put the count after it.

The shared Kit `card-header-terminal-slot` supplies count order 99 and in-flow
overflow order 98. Group headers consume those roles and release redundant
absolute-action clearance. The Grouping count delegates to the same count role
with identical declarations. No PHP, template, JS, menu delegation, business
state or Motion changes are involved.

Group counts remain rendered at phone widths using the existing badge recipe.
Grouping counts keep their independent phone disclosure policy.

Native evidence uses owned pool course 71, FR/EN and widths
1600/1280/1024/768/390. Record card width, count/menu boxes, signed gap and actual
menu/selection interactions. Negative gaps reproduce the original ordering
defect. Keep preliminary harness failures separate from product failures and
compare no-overflow geometry independently.

Evidence: `C:/dev/artifacts/k23-29-20261023`; delivery report in
`C:/dev/artifacts/easystud-claude-interface-review-20261011/revue-2026-10-11/`.
