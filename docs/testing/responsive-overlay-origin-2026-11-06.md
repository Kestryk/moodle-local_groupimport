# Responsive overlay origin

Mobile navigation, context sheets, clipboard dialogs and display preferences now open below the host's fixed navigation. The sheet no longer forces its top to auto and its bottom to zero. Full-height surfaces subtract the host header from their available height.

## Shared authority

| Element | Shared recipe |
|---|---|
| Workspace opt-in | `responsive-overlay-origin($top)` |
| Navigation drawer | `mobile-primary-nav-panel`, `navigation-component` |
| Action menu | `mobile-context-sheet` |
| Clipboard and entity dialogs | `modal-overlay`, `modal-surface-compact`, `dialog-sheet` |
| Display preferences | `preferences-classes` |
| Floating/native controls during a blocking menu | `modal-yield-control`, `moodle-guide-drawer-yield` |

The shared change is maintained in the canonical component repository, commit `123181a`, branch `work/codex1/k23-52-responsive-overlays-20261106`. This is a selective recipe adoption, not a claim that all embedded shared sources have been resynchronised.

The consumer opts in through 64rem with Moodle's `--navbar-height` plus `--mds-spacing-offset` for the 5.3 navbar border. Other consumers keep their existing placement unless they opt in. The existing launcher position, typography, colours, destinations, business state and Motion timings are preserved. Native Moodle core/theme files are unchanged.

## Native evidence

Classification: `local-supervised`, native browser regression. The script is `tools/playwright/responsive-overlay-origin-native.cjs`; it is separate from the pure Node release-script catalogue.

Pass absolute paths to the Playwright package, an external test-account env file, evidence directory, local base URL, course id and optionally browser executable. The external file supplies `EASYSTUD_TEST_PASSWORD`; credentials are never printed or passed as a value on the command line. Only localhost/127.0.0.1 is accepted.

On Moodle 5.3, FR/EN × 375/768px covers all four families. It asserts the host boundary, viewport containment, painted pointer hits on the command and title, Escape and floating-launcher restoration. Desktop 1600px is also captured; the targeted first-panel geometry stays identical before/after. No data is imported or business action submitted.

The first diagnosis exposed the floating Guide and native course drawer opener covering the newly positioned menu header. The shared existing yield policy now covers an actual visible mobile menu; closing it restores controls without another lifecycle or z-index increase.

Sass 1.79.1 / Node 22.11.0 compile the generated page styles. AMD sources and bundles are untouched. Local PHP Code Checker passes; CI and human visual acceptance remain separate gates. This focused recipe does not certify every dialog on every Moodle/theme version.
