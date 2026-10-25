# Administration settings loading-state contract

The EasyStud administration page keeps Moodle's native `admin_setting_*`
controls and settings APIs. `settings.php` adds one server-rendered structural
skeleton heading before the real settings so the page does not expose controls
while Moodle dependency/show-hide logic and fonts settle.

The classic `js/admin_settings_loading.js` bootstrap marks the page root as
loading, keeps the native form hidden, observes settings-form mutations and
reveals it after a 240 ms quiet period, but never before a 1200 ms minimum
visible interval. This minimum keeps the structural skeleton perceptible on a
page whose native controls are already settled at first paint. A 1.5-second
deadline fails open to a degraded state. No loading text or second modal is
introduced. The loading selector deliberately outranks Moodle's broad
`.settingsform > *` reset and its ID-qualified `display: none` rule, and reveals
its first `fieldset` parent so the server-rendered skeleton is not hidden by
the native settings layout. The skeleton follows the four live settings sections
in their real order: features, interface/accessibility, learner identification
and participant-card display. Its three overview placeholders and eight native
setting-row placeholders use the same full-width vertical rhythm as the content
they replace; the identifier control retains a tall multiselect-shaped cue.
This represents the complete page rather than an unrelated three-column card
dashboard. Because Moodle's
dependency controller can rewrite inline display values during bootstrap, the
loader preserves those values, temporarily forces every non-skeleton fieldset
child hidden, and restores the latest Moodle state before revealing the form.

Without JavaScript, `settings.php` emits a scoped no-script fallback that
reveals the native settings-form children and hides only the decorative
Skeleton. The bootstrap remains the sole writer of `aria-busy`, so the
server-rendered no-script page is not left marked busy. This fallback does not
change the normal 1200 ms minimum-visible interval, 1.5-second degraded
fail-open deadline, native settings destinations, or JavaScript geometry.
The loading CSS itself is also gated by Moodle's core `body.jsenabled` class:
the server-rendered loading body class alone cannot prove that scripts ran.
Core adds `jsenabled` from its early body bootstrap, while a no-script request
keeps the native form visible and the Skeleton at its normal hidden default.
Its Skeleton selector also matches the more specific loading rule used by the
normal SCSS state, so Moodle's settings-form cascade cannot re-display the
placeholder after the no-script override. The fallback's `<noscript>` tag and
its inner `<style>` are emitted on separate lines. This is required because
`admin_setting_heading` sends its description through Moodle's Markdown Extra
renderer: an inline `noscript` is treated as paragraph content, while a
line-delimited context block is preserved as the browser-recognised no-script
style source.

With motion enabled, the skeleton fades out over 180 ms and the restored native
form fades in over 180 ms. Native controls remain masked until the skeleton has
left; reduced-motion users receive the same ordered reveal without a delay.

The page uses the shared EasyEdu bottom-end action indicator. It stays fixed at
the lower-right corner, uses the localized `Loading in progress` label and
keeps the historical rotating circle. Reduced-motion and forced-colors users
receive a static skeleton surface.

The focused contract is the exact test named
`keeps the EasyStud administration skeleton and shared bottom-end indicator
contract` in `tools/playwright/mass-import-audit.spec.js`. The validated Moodle
5.1 run is recorded in the external artifact manifest
`easystud-authenticated-20260730T130714944Z-11468`.

The plugin declares Moodle 5.1 as its compatibility floor. Moodle 4.5, 5.2
and 5.3 remain deferred to the final compatibility matrix.

## Static contract

Run `tools/release/test-admin-settings-loading-contract.ps1` with PHP lint,
the classic-bootstrap syntax check and the plugin Sass build. Runtime/browser
validation remains a separately authorized bundle.

`EED-UI-2026-0033-RF5` changes only this decorative geometry. The accepted
minimum interval, fade, no-script fallback, degraded fail-open path and
`aria-busy` ownership remain unchanged.

### Markup correction - 2026-07-30

The skeleton builder now concatenates its cards and sections before passing the
CSS class and attribute array to the outer `html_writer::div()` call. This is
required by the Moodle 5.1 renderer signature and prevents a fatal
`TypeError`; the `moodle_page::add_body_class()` message was a cascading
output-order error from the same malformed call. Static PHP validation passed
after the correction. An authenticated browser rerun remains a separate
runtime validation step.
