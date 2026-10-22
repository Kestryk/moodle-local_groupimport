# Empty card alignment — 17 October 2026

Base 108f0b2c. Shared Kit entity-card-empty-line gains a selection-aligned opt-in; consumer removes its duplicate indentation/rule definition. Default grouping-empty recipe unchanged. The same light rule is retained, defined only in Kit. No pagination, copy or JS logic changes.

Cause: local K16-82 composition in _k16-finish.scss combined 22.8 px margin with the Kit 12 px padding / 18 px icon track. Neither K16-01 pagination nor the touch wording swap creates the measured offset.

Pool protocol: 8052 occupied; atomic 8054.lock acquired with owner. Sync via PowerShell robocopy, guarded purge; headless Chrome. No :80 request or publication. Copy restored to 108f0b2c and purged before releasing lock.

Before (FR/EN): 1600 icon 28.46875 px / text 23 px; 768/390 icon 26 px / text 11.796875 px.
After (FR/EN 1600/768/390, 24 samples): icon <= 0.328125 px; text <= 0.015625 px. Zero page errors. DOM fixture clones an existing rendered empty group into a tree-children/grouping ancestor, then removes it; no DB writes. Real ungrouped groups 394/382/342 sampled. Kevin's group 2208 is absent from the snapshot: recheck that exact group and a persisted nested empty group after integration. This is native-page geometry plus reversible DOM-composition proof, not a claim of persisted fixture or human acceptance.

Build conservative PASS. Evidence: <workspace>/artifacts/empty-card-align-20261017/{before,after}.json and scripts/logs. Canonical counterpart on work/codex1/easyedu-kit-empty-card-align-20261017. Visual elements: entity empty-line recipe; group cards in catalog/tree; empty state; desktop/tactile widths 1600/768/390. Claude updates Penpot.
