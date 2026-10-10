# Source-member path: localized/reduced-motion review successor

Six French native cases pass. Existing English normal-motion proof remains separately
pinned in `testing/guide-source-member-targets-native-2026-10-10.json`.

French normal-motion successor run43852 passes all three viewports with actual
`html lang=fr`: source selection, member dialog/search/destination, aligned
destination/Confirm highlights, previous-step review, reopening and Cancel.
Confirmation remains uncompleted; zero page errors/blocked writes. Credentials,
owned child and lease cleanup are complete. Retention dry-run protects the run
with zero candidates/deletions. Reduced-motion successor run22648 also passes
all three widths with actual `prefers-reduced-motion: reduce` asserted. Both runs
retain the same2px highlight tolerance and leave confirmation uncompleted.
Exact scope: `testing/guide-source-member-localized-native-2026-10-10.json`.

The same read-only scenario now verifies the actual requested document language
and accepts an explicitly validated optional test-only Motion preference via
`EASYEDU_GUIDE_REVIEW_MOTION` (`no-preference` default or `reduce`). It records
both per viewport. No production JavaScript, Kit, Penpot, paths, targets or
course transaction changes are needed to broaden this verification.

Run French normal and French reduced at1280/768/390; retain failures separately.
Check source selection, member-specific modal, searchable destination, confirmed
highlight bounds, prior-step review, reopening and Cancel. Never click the
business confirmation or manufacture completed paths. Use the existing temporary
QA reading store, not the user's normal progression store.

The scenario source must remain immutable until the owned runner exits and
credential/child/lease cleanup is recorded. No native PASS is inferred from
adding the test options; combined human acceptance remains open.

Kit/Foundation component-contract updates are not applicable to this lot:
only a test protocol is extended; existing component source and designs are
unchanged. The plugin AI contract and changelog document the validation rule.
