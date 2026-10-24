# Compact captioned searches

Student Management captioned searches now compose the Kit
`search-field-intrinsic` mixin. It keeps the native search input's intrinsic
width instead of stretching the frame across a wide grid cell, with a maximum
of the available container width. No fixed pixel width, font reduction or
placeholder truncation is added. The caption remains above the same-row icon
and input. Full participant details uses this same search, not another form.

The code review and native measurements did not attribute a width change to
`77974e54`: that commit changed only a display:none selector's specificity.
The captioned fields themselves have grid/flex stretch inherited from their
column composition. The older G8 change introduced their persistent captions.
The measured current participant field is 612.70px wide at a 1600px viewport;
its intrinsic counterpart is 250.19px in English, without changing the 36px
input row or the 63.02px total frame including the persistent caption. The
44px touch row remains at compact widths. Localized captions can require
more intrinsic width or wrap when constrained; translations are unchanged.

The desktop Structure hide guard remains stronger than the captioned grid.
It now excludes responsive workspaces, whose existing active entity regions
already own visibility. Previously the desktop-only Structure focus class was
cleared on compact layouts while this guard hid their Groups/Groupings fields
as well. Those active fields must be visible; unrelated inactive regions must
remain hidden. No new mode, input, data handler or responsive breakpoint exists.

The consumer adoption lives in `scss/components/_forms.scss`; the shared mixin
lives in `scss/easyedu/components/_forms.scss` and the canonical Kit. The
parallel field-peer button work in `_workspace-control-classes.scss` is not
modified. Inline card search/Cancel components and their native handlers are
unchanged. No PHP, JavaScript, Motion or Mustache product code changes.

## Reproducible checks

`tools/playwright/search-field-density-native.cjs` is a local-supervised
native candidate. Supply an owned localhost runtime via `EASYEDU_MOODLE_BASE`,
course via `EASYEDU_COURSE_ID`, credentials via `EASYEDU_MOODLE_USERNAME` and
`EASYEDU_MOODLE_PASSWORD`, external artifacts via `EASYEDU_ARTIFACTS`, and
optionally external Playwright/Chrome paths via `EASYEDU_PLAYWRIGHT_MODULE`
and `EASYEDU_CHROME`. Use `EASYEDU_PHASE=before` with `EASYEDU_BASELINE_CSS`
to serve the exact predecessor stylesheet inside the test browser only.

FR/EN at 1600/768/390 covers the existing Participants/Groups/Groupings views
and toggles Full details on desktop. Compare widths and control typography;
require caption above, icon/input on one row, containment and active compact
search visibility. Preserve baseline measurements of invisible compact fields
as failures rather than inventing an earlier visible geometry. No enrollment
or membership write is submitted by the test.

`tools/release/test-search-field-density.cjs <Kit-root> <PostCSS-module>` checks
canonical mixin parity, unchanged JS/markup and every unrelated ordered CSS
rule in all four shipped page sheets. Native results and screenshots live in
the external review report `RAPPORT-K23-64-20261024.md`.
