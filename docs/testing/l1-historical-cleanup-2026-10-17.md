# L1 historical cleanup — 17 October 2026

Base: 8129aef7. No runtime, services or preview touched.

## Bounded source delta

- Remove only the Guide discovery move/actions `stage::after` and mobile-actions menu selectors containing a second descendant Guide root. After L2 root consolidation there are three selector branches (six in the earlier audit). A supported Guide scene has exactly one Guide ancestor, so these branches have no target. The formerly unreachable declarations are not activated or repaired.
- Remove only `!important` from the action-grip `margin: 0` declaration in `_layout.scss`. The icon remains a span with zero computed margins, including inside the existing action-menu trigger. No margin value or icon recipe changes.
- Historical tutorial SCSS and its hint rules were already removed by P2; no second removal required.
- Canonical Kit counterpart is on dedicated branch `work/codex1/easyedu-kit-l1-cleanup-20261017` (base 57b5d7f); the shared SCSS file is identical. No existing Kit branch or consumer runtime was changed.

## Proof

Node 22.11.0; Sass 1.79.1; conservative page CSS build PASS (log: <workspace>/artifacts/l1-cleanup-build-20261017.log).

`test-l1-dead-selector-cascade.cjs`: PASS, exactly three selector branches removed and one priority changed, 3797 retained rules compared in order including declarations and parent at-rules. styles.css, mass-import.css and administration.css are byte-identical after newline normalization. No unrelated priority changes accepted.

`test-l1-dead-selector-browser.cjs`: PASS, actual PHP programme/Mustache rendered in isolated Chromium, FR/EN × 1280/1024/768/390 × page/body portal = 16 cases, 1297 descendant elements per case, unchanged computed layout/paint properties, zero page errors. All removed selector targets are absent. Includes a real action-grip span and its existing parent recipe. External requests aborted; no Moodle HTTP access. Evidence: <workspace>/artifacts/l1-cleanup-browser-20261017.json.

T037 PASS 14 checks; T038 PASS 47 checks; mirror roundtrip PASS (6 AMD exports, 3 SCSS, 2 templates), with the dedicated canonical Kit worktree in argument.

This proves a bounded static cascade and offline rendering equivalence, not native playback, native Moodle theme acceptance or human visual approval. B2 repair remains outside scope.
