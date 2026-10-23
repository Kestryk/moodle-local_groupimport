# Responsive preferences, column boundaries and full-width course drawers

Base: `f0bb9363`. The responsive Student Management and Mass Import drawer now
places Display and animations before its spaces heading. It uses the existing
Kit navigation item, icon and label classes, including the shared 48 px row and
full list width. The desktop rail, localized strings, display preferences
handlers and native drawer lifecycle are unchanged.

The paired canonical Kit commit is `5ea05ae`, on
`work/codex2/k23-nav-lanes-20261023`; integrate the consumer alongside it.

Student Management opts into a thin Kit lane boundary on every supported host.
The existing `workspace-lane` mixin gains an optional `$outlined: false`
parameter. Complete lanes use a 1 px `--easyedu-border`; split start/end lanes
omit their shared horizontal seam. Other Kit consumers retain byte-identical
default CSS. The duplicate Moodle 5.3-only boundary is removed. Its white
surface and the 4.5/5.1 `surface-strong` surface remain unchanged.

## Native checks

Authenticated headless Chromium, FR/EN, 1600/768/390, Student Management and
Mass Import on Moodle 4.5, 5.1 and 5.3: 36 page cells. The 24 responsive cells
verify first position, equal width to the next list action, 48 px height and
successful opening of the existing preferences dialog. The 18 Student
Management cells verify the four-sided 1 px boundary and host surface. Complete
and separated workspace views receive additional desktop/phone checks.

No pageerror is recorded. The 4.5 fixture has existing missing theme-logo/image
404s and existing page overflow; before/after values are unchanged. On 5.3,
known core ESM unload/fetch console messages remain in the raw run rather than
being reclassified as plugin errors. No complete zero-console claim is made
for those environments. The desktop navigation measurements on 4.5/5.1 remain
identical before/after.

Reusable probe: `tools/playwright/k23-nav-lanes-native.cjs BASE COURSE OUT LABEL`.
Pass an absolute external evidence directory and the `QA_USERNAME` /
`QA_PASSWORD` environment variables. `PLAYWRIGHT_MODULE` and
`QA_CHROME_EXECUTABLE` select installed tooling. No authentication state or
generated media belongs in Git. This is a native regression candidate;
registration in the shared platform scenario catalogue remains an integration
step because that checkout has concurrent work.

## Full-width trial, separate operational change

Moodle 5.3 Boost still anchors limited-width drawers with formulas containing
`$course-content-maxwidth`. Overriding only `.main-inner`'s maximum width does
not update those formulas. The companion additional-SCSS block in
`docs/operations/fullwidth-course-drawers-2026-10-23.scss` anchors course drawers
and their openers to viewport edges at the native desktop breakpoint. Native
vertical offsets, sizes, visibility, width/clip animations and responsive
drawers are preserved. It does not target dashboard or activity-page layouts.

This is an explicit companion to the existing full-width trial on the three
Moodle 5.3 sites. It is not loaded by the plugin or the Kit. Apply only while
that trial is enabled; ending the trial requires removing both SCSS blocks.
No Moodle core file is modified. Back up the complete `theme_boost/scss`
setting, check its current hash before writing, append the companion block,
then reset theme caches. Preserve all unrelated SCSS.

The local before/after and served-theme checks cover FR/EN, 1600/1280/768/390,
native left/right actions and their combinations. On 1600 px, the closed left
opener moves from x=285 to x=0 and the open left drawer from x=214.5 to x=0.
The responsive drawer rectangles remain identical. Remote settings and served
compiled CSS are verified separately; authenticated remote course access was
not available, so the remote interaction gate remains explicit.

## Source checks

- Pinned Node 22.11.0 / Sass 1.79.1 page build; only column boundary rules and
  the responsive preferences wrapper margin change. `guide.css` is identical.
- `test-k23-nav-lanes.cjs`: responsive DOM order, desktop preservation,
  seven shared outline usages, host surfaces and byte-identical default Kit
  lane CSS.
- Focused JavaScript tooling lint and syntax checks; no production JS/PHP
  change and no AMD build is needed.
- Moodle CodeSniffer: zero errors on the changed Mustache/SCSS; four
  `Internal.NoCodeFound` warnings because these are non-PHP files. Sass and
  native checks, rather than PHP tokenization, validate their presentation.
- Existing navigation integration contract still fails on the same missing
  mobile Groups text expectation in `manage.php`, reproduced on the base.
  That file and the oracle are unchanged.

Runtime file backups are hash-checked before restoration. Test-user preferences
are restored. No fixture course, group, membership or account is created.
