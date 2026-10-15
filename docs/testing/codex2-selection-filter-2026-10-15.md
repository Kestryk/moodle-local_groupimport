# Served modifier selection, role filtering and tooltip

8051 synchronized253 product files/hash+purge to463b657f, which includes the published Claude7759a02b→a2202a7b integration. External stage/backup es-selection-20261015-stage and es-selection-20261015-deploy.

`selection-filter-catalog-successor.spec.js` PASS, run easystud-authenticated-20261015T071257962Z-57104/course108: click/Ctrl/Shift selects three participants, three groups and three members; mixed participant/group selection refused; search finds precisely QA Guided One; numeric teacher-role filter finds precisely QA Guided Four; trusted dragstart/dragend remain functional with neutral drop. pageErrors0/blockedWrites0. No real users or business memberships mutated by the browser.

Earlier run070759701Z-39128/course106 passed participants and mixed rejection then failed a harness direct-child group selector. Its evidence is immutable; successor uses actual catalog descendant cards and waits for readiness. This is not a product regression.

Default tooltip screenshot inspected: classic blue-to-green surface, no custom palette marker, success variable#1a7d59. Source served Kit recipe confirms gradient135deg #183a59→#1f6b57. Browser report records marker/border/success, not a computed background-image comparison. Custom palette variants and all filter combinations are not claimed.

Fixture adds a teacher role only to an owned synthetic course user and temporarily normalizes two palette keys to defaults. A fresh DB audit exposed that the original helper's cleanup exited before palette restoration, leaving identical colours in lowercase instead of their original uppercase spelling. Helper corrected with a shutdown restoration registered before the exiting base helper; exact restoration must be verified separately and is not inferred from the wrapper cleanup flag. Synthetic courses/users were removed by the base cleanup.

Exact original palette restoration was subsequently executed under an owned runtime lease against the first manifested baseline and verified in DB (es-selection-palette-exact-restoration.json; es-seven-security-cleanup-db.json PASS). Wrapper cleanup alone was insufficient and is not used as the restoration proof.
