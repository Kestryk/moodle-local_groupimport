# K23-38 — Native course drawers on detail pages

This is a temporary Boost configuration correction. Move the width and drawer
anchoring policy into the future EasyEdu theme, then remove the additional SCSS.
It is not an EasyStud or Course Banner Builder component change.

Boost 5.3 applies content-anchored drawer formulas to both `.pagelayout-standard`
and `body.limitedwidth` (theme/boost/scss/moodle/drawer.scss:306-307). The original
K22-35 override covered course layouts only. K23-10 widened it to `limitedwidth`
but still omitted standard layouts such as `group/overview.php` and native
Participants. The fixed-width anchor formula then places the drawer over content
whose width was changed independently by the platform configuration.

The companion `k23-38-universal-width.scss` extends K23-10's existing horizontal
edge overrides to both native scopes. It retains the 992px breakpoint and
1320px width policy. It changes no vertical offset, drawer width, visibility,
open/closed state, animation, DOM structure, banner, or plugin component.

## Deployment

No staging or Community deployment is included or authorized by this lot.
After orchestrator approval, back up the current `theme_boost/scss`, identify
the single `K23-10-UNIVERSAL-WIDTH` block, and replace that block with the
companion file. Preserve unrelated configuration. Verify the expected previous
hash before writing and reset theme caches on that site only. Do not append a
second width block or restore an old whole configuration over newer additions.

Local 5.3 still had the historical full-width trial. Its test correction instead
replaced only the nested `body.pagelayout-course.limitedwidth` scope with
`body.pagelayout-standard, body.limitedwidth`, preserving its independent width
configuration. Backups and guarded apply script are in
`C:\dev\artifacts\k23-38-20261024`.

Native results, readiness limitations, before/after screenshots and exact hashes
are recorded in `RAPPORT-K23-38-20261024.md` in the review folder. A CSSOM comparison
of the proposed published configuration is distinct from local persisted-config
validation. No production runtime is certified by local evidence alone.
