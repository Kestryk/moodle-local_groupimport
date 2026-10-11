# Guide Light tooltips: French and native fullscreen review

Current test-only successor reuses the accepted Light family and real truncated
French navigation labels, not invented business copy or another tooltip skin.
Profiles:1280 regular,1280 native Fullscreen,768 and390 compact. Hover and actual
Tab focus assert text, inherited family metrics, pale surface/foreground,
viewport containment and ownership inside the fullscreen modal. Escape exits
the actual browser fullscreen element before compact resizing. No force-click,
settings, course command or real-user progress write; an ephemeral QA key is used.

Initial local-supervised run1248 verifies French regular hover/type/containment
and keyboard entry, then fails an inherited assertion that every Tab must remove
all tooltips. In French, the next real control can also have a truncated label:
it legitimately needs its own tooltip. Keep the failed spec/run immutable and
complete cleanup. Its record is partial, not fullscreen/compact PASS.

The focus successor checks that focus leaves the original control, then requires
the exact tooltip text of the next actually truncated label or zero tooltips for
a nontruncated/non-navigation control. This retains the original hover, keyboard,
paint and viewport oracles, without changing the Kit controller or Motion.

The longest real title in the initial desktop profile uses Light Short. This
does not prove native Light Long paint; the existing isolated Long proof remains
separate. Do not rewrite actual product titles to manufacture a Long specimen or
claim every guide-help usage from four navigation profiles.

Source product f6e9143 / runtime product ec4987e unchanged. Scenario successors:
tools/playwright/guide-light-tooltips-localized-fullscreen-native.spec.js and
tools/playwright/guide-light-tooltips-localized-focus-native.spec.js. Both are
local-supervised, valuable CI candidates with the existing authenticated wrapper.
No new Penpot family, SCSS, build or cache purge is applicable. Shared Platform
registry/state updates remain with their named owner; native/human gates differ.

Focus successor17900 passes all four real FR normal-motion profiles, including
native Fullscreen ownership, Escape, hover, actual keyboard progression and
viewport containment. All observed titles use Light Short; native Long is NOT
certified. No errors/writes; credentials cleared, child stopped and lease
released. Both runs protected by dry-run retention, no deletion. Exact record:
testing/guide-tooltip-localized-native-2026-10-11.json. The no-touch-device,
native Long, other general help and human acceptance boundaries remain open.
