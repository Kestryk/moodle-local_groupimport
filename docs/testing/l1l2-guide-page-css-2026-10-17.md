# L1/L2 — finish Guide page-CSS consolidation
Base fcf11a6f. Global styles.css already contains zero rules; manage/index/admin
request their own sheets. The active Guide currently exists only on manage.php;
no Guide stylesheet is requested on unrelated Moodle pages. Current Mass Import
has no Guide root (future Guide delivery must load its styles explicitly).

Remove duplicate page-root expansion in _easyedu-guide.scss. Use ONE persistent
compound root `.local-groupimport-easystud-easyedu-guide.easyedu-guide`. Both
classes already exist on the real Guide template. The two-class specificity keeps
the effective weight of the old `.path-local-groupimport .easyedu-guide` branch,
including mobile body portals. Simply retaining the former one-class root would
lower specificity and would not prove cascade parity. No PHP/template/JS change.

PASS exact cascade proof: 3795 ordered rules, declarations/media unchanged after
only the explicitly mapped root branches and duplicate selector combinations are
normalized. Compound-root Motion conditions and even historically unreachable
nested-root selectors remain in their original declaration/order positions.
Compiled SM reduction 142721 bytes; global/Mass Import/admin unchanged.
PASS offline actual programme/Mustache rendering: 12 FR/EN 1280/768/390 cases,
page host and body portal, 1295 descendant elements each, 17 computed properties,
zero differences/errors. All samples/scenes rendered with hidden flags exposed;
not a native interactive/fullscreen/Motion completion proof. Requests blocked.

Naming clarification: the consolidated backlog calls CSS-by-page “L1/L2”, while
original Kit audit L1 also lists a separate dead-code/!important cleanup. P2 has
already removed tutorial__show-hint and its four !important declarations. This
lot does NOT change the canonical _guide-discovery.scss, its old auto-nested
selectors, or layout action-grip margin:0!important. Removing those needs its
separate Kit/native cascade proof; no blanket claim that every original L1 audit
item is closed. Original B2 repair (visual) stays explicitly outside this lot.

No runtime, publication or service access. CSS conservative build in owned source
worktree only. Native scenes/fullscreen and human validation remain for Claude.
