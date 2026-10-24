# Student Management: Guide access after scrolling

The Student Management navigation adapter opts into `bindGuideLauncher(...,
{floating: true})`. Mass Import retains its existing launcher behavior. The
floating control delegates to the original Guide opener and retains its accessible
name. It creates no second Guide, progress record or modal handler.

The trigger is the normal navigation anchor passing above the bottom of the
visible fixed Moodle navbar. Compact navigation has a zero-height anchor; its
position, rather than an invisible drawer button's rectangle, defines this
boundary. Capture-phase passive scroll events cover Moodle's `#page` scroller
and the document. Resize notifications are coalesced into one animation frame.

The existing Guide root scope and resolved theme tokens are relayed to a body
host so transformed content and overflow cannot capture the fixed control. Its
Kit variant `easyedu-guide__launcher--floating` uses the Foundations Library /
Guide launcher / Desktop / Default geometry: 48px circle, 24px compass, existing
primary-to-accent gradient and launcher shadow. It is 12px below the measured
navbar edge, 16px from the viewport's end edge, with safe-area protection.

Entry and exit use the existing 220ms `--easyedu-motion-slow` and
`--easyedu-motion-ease` tokens, opacity and scale .85 to 1. Reduced motion uses
only a short fade; minimal motion has no transition. The inactive control is
disabled, outside sequential focus and aria-hidden. Guide Close returns focus
to the actual floating opener without scrolling the page. The normal launcher
is not resized or moved. Canonical Guide controller, fullscreen and Motion
modules are unchanged.

## Native regression scenario

`tools/playwright/guide-floating-launcher-native.cjs` is a local-supervised
candidate. Set an owned localhost runtime and existing course using
`EASYEDU_MOODLE_BASE`, `EASYEDU_COURSE_ID`, test credentials via
`EASYEDU_MOODLE_USERNAME` / `EASYEDU_MOODLE_PASSWORD`, and an external output
directory via `EASYEDU_ARTIFACTS`. Provide `EASYEDU_PLAYWRIGHT_MODULE` and
optionally `EASYEDU_CHROME` when Playwright/Chrome live outside the checkout.
It does not create course data or apply business actions.

For FR/EN at 1600/768/390, assert inactive at the top, normal Guide open/close,
scroll down, exact circle/glyph geometry and centring, intermediate transition
samples, floating Guide open/close, focus/scroll preservation and reverse
transition. Recheck the Start-before-Compare order on slide 8 and the contained
search icon on slide 9, and the system reduced-motion variant at 390px.

Native evidence: `RAPPORT-K23-43-20261024.md` in the external review folder.
This is a feature-branch delivery, not publication to staging or Community.
