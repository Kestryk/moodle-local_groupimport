# T060 — Discovery typography inventory, not activation

Read-only inventory at Source153f27a / canonical Kit8d84fe0 (0.4.170).
The embedded and canonical `_guide-discovery.scss` are identical. Existing
Discovery locals are control0.78rem and body0.88rem; global Kit roles resolve
control0.88rem, body0.9rem and caption0.76rem by default. These are distinct
roles, so replacing every number with `type-caption` is not preservation.

| Authored size | Exact current text consumers | Preparation |
| --- | --- | --- |
| 0.88rem | Guided invitation heading; scene card-copy heading; source-title; checklist heading (lines354/657/658/931) | Already call `type-control-label`; investigate removing their duplicate override using its existing control role. Preserve configured-token behavior explicitly. |
| 0.78rem | Checklist step heading; invitation Start; inspection field; live scene status (159/391/666/710) | Resolve semantic control/Small action/field/status roles separately; do not blindly bind all to global0.88rem. |
| 0.68rem | Slide kicker and prerequisite caption (574/973) | Reconcile their different eyebrow/helper semantics with Foundations before changing rendered size. |

There are ten hardcoded declarations across these three requested sizes.
Glyph sizes, numbered-counter glyphs and scene arrows are a separate icon
anatomy, not paragraph text. Literal weights600 on current-step/positive-result
text are candidates for the existing semibold token, not permission to alter
the approved card identity title or global heading role.

Next T060 gate: inspect paired Foundation examples and the actual localized
roles; implement a bounded canonical recipe, compare full unrelated CSS and
native computed text at1280/768/390. Retain default/custom palette and reduced
Motion. This audit changes no SCSS, template, AMD, runtime, progression or user
acceptance. It does not complete the separate global Claude code audit.
