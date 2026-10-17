# K17-21 responsive Groups search — 17 October 2026

Decision: `RETOURS-KEVIN-2026-10-17.md`, K17-05, validation 21.
Base: `bc3f48f8`; branch: `work/codex1/easystud-catalog-search-20261017`.

The compact controller clears desktop Structure focus. The existing
`__search-field--structure` visibility rule consequently hides the Groups
search. Its original input is `data-easystud-structure-group-search`;
`data-easystud-catalog-search="participants"` belongs to the separate Participants
panel and is correctly absent from the compact Groups tab.

The bounded responsive override restores `display:flex` on that existing field
only within the active Groups workspace. The shared `easyedu-search-field`
continues to own geometry, typography, palette, icon alignment and focus paint.
No markup, JS, AMD, translated text, search handler or Motion changes.

Build: portable Node 22.11.0, Sass 1.79.1, conservative page builder. Only
Student Management CSS changes; global/admin/Mass Import outputs stay identical.
Full-build ordered page-subsequence validation passes (5815/1515/1248 rules;
zero global rules). Security escaping and filter-engine checks pass.

MoodleCS: 0 errors across touched SCSS/CSS/CJS. Three tool warnings identify
non-PHP SCSS/CJS and compiled CSS; no PHP source changes in this lot.

Native evidence: dedicated leased copy `http://localhost:8052`, course 71,
`claude-sm-test`. Original 768 FR measurement confirms `display:none`, zero
field bounds and no page/console errors. The initial auth-wait diagnostic is
retained; the harness successor waits committed DOM navigation instead of
unrelated full-load completion. No course data writes.

Native FR/EN 1600/768/390 successor passes visibility, containment and filtering:
one positive result, zero absent-query results and ten cards restored after
clearing. Desktop field height 38px, centre deltas 0px; compact height
42.390625px, icon/input vertical centre deltas -0.0078125px (strict tolerance
0.5px). All six cases assert actual document language; zero console/page errors.
Evidence: `catalog-search-k17-21-results.json`; runner:
`tools/playwright/catalog-search-k17-21.cjs` (local supervised QA candidate).
No screenshots, business POST or fixture changes. Browser closed and own
8052 lease released at 09:57 Europe/Paris, 17 October 2026. No other runtime used.

Preserved harness diagnostics: the original group-card selector was corrected
to `data-easystud-group-id`; the readiness successor uses the actual manager
initialisation marker rather than a Participant card that on-demand rendering
removes. The desktop-to-compact resize attempt was interrupted while accessing
the tab and remains uncertified. The final six-case successor uses a fresh
document at each viewport; it does not certify that separate resize scenario.

Penpot: existing Foundations `EasyEdu / Forms / Search field / M / Default`,
public `easyedu-search-field`. Versioned 2 October readback records component
`81455adb-6787-8068-8008-9cea218710ef` with height 38px in
`docs/testing/student-workspace-penpot-readback-2026-10-02.json`. This historical
reference was read, not live-revalidated in Penpot during this lot.
This is a visibility correction in an existing composition; no component or
provider change, and no Penpot file write. Native geometry does not certify
saved Penpot parity or human acceptance; those gates remain separate.

Integration: apply this branch to the owning integration line; rebuild the
conservative page CSS if combining with other SCSS lots. No AMD regeneration,
database migration, Kit provider update or Penpot publication is required by
this visibility-only change. Human acceptance remains open. The retained
resize diagnostic is a separate unverified scenario, not a six-case PASS.
