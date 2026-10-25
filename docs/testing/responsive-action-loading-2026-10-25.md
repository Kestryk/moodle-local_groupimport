# One action indicator per viewport

Student Management's request tracker activates a desktop pseudo-element pair
(spinner and label) and a real responsive live-status node together. Before this
change, the desktop Kit include had no viewport boundary, while the responsive
status became visible at widths up to 1024px. Both presentations therefore painted
during the same pending action.

The consumer now includes the unchanged desktop Kit recipe only at widths above
1024px. The responsive status, its hidden state, request counter, error handling,
ARIA and Motion remain unchanged. No hiding override or duplicated visual recipe
is introduced. The range query also handles fractional widths without a gap.

## Inventory

- `local/cm/actions.postAction` and `postActionInBatches` share the same tracker:
  group/grouping creation, membership operations and other AJAX card commands
  all use this one presentation pair.
- `templates/manage.mustache` contains the only responsive action-status node.
- Mass Import and Administration include the common bottom-end Kit indicator,
  without a responsive duplicate; their CSS remains byte-identical.
- Modal body skeletons, disabled modal actions, loading skeletons and progress
  notifications are distinct states, not duplicate viewport presentations.

## Native evidence

Run `tools/playwright/responsive-action-loading.spec.js` with the authenticated
lease wrapper against the owned Moodle pool copy. This is a supervised local QA
candidate; its external evidence does not constitute a production deployment.
The test routes page CSS to the baseline/candidate compiled files and clicks the
real group-create button. It holds the native AJAX request before the server,
then answers with an explicit refusal: no group is created. The actual request
tracker and its finally cleanup execute normally.

FR/EN, each before and after, resize continuously through
1600 → 1025 → 1024 → 768 → 390 → 1600 while that same request remains pending.
Before: two presentations at widths <=1024. After: desktop only above 1024,
responsive only at/below 1024, and no responsive status after settlement.
24 observations pass; zero console/JS errors and HTTP failures.

CSS comparison preserves every selector and declaration, adding only the desktop
viewport condition to the two pseudo-elements and their restricted-Motion rules.
The other three generated page styles remain byte-identical. SCSS CRLF retained.
Evidence: `C:/dev/artifacts/responsive-action-loading-20261025/` (`native.json`,
`css-parity.json`, authenticated runner logs). No runtime source files or course
data changed; no deployment to community/staging.
