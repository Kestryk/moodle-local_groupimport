# Selection actions and Bootstrap compatibility classes

The public `.easyedu-ui .foundation-selection-action.btn-outline-secondary` adapter
uses the primary selection-action recipe. The Bootstrap class is a compatibility
hook, not permission to replace the component palette with neutral ink.

The previous adapter called `selection-action(neutral)`: its `$ink` supplied both
`color` and `border: 1px solid $ink`. The grey came from this Kit rule, not a native
Bootstrap rule winning the cascade. `$ring` only controls the focus ring; it does
not paint the resting outline. Keep the independent neutral mixin API intact for
other consumers that explicitly request quiet chrome.

No new palette, specificity, geometry, Motion or command handler is introduced.
The explicit danger, solid, disabled and borderless recovery variants retain their
existing recipes. Outline command text and border use the same primary ink in
rest/focus. Hover and pressed already used the primary tint and remain unchanged.

Plugin copies: `scss/easyedu/_foundation-classes.scss`, compiled page styles.
Regression: `tools/playwright/selection-action-primary-palette.spec.js` checks real
computed styles from the compiled sheet, including unchanged semantic variants.
The native before/after census and cascade evidence live in the external K23-75
report. No production deployment is part of this source correction.
