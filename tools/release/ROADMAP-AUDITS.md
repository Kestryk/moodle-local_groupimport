# Codex2 roadmap audits (13 October 2026)

Owner: performance branch; product implementation/integration remains Codex1.
No edits to reserved controllers, templates, services, SCSS or AGENTS.md.
These tools introduce no Moodle API or PHP requirement beyond Moodle4.5/PHP8.1.
Intake statuses distinguish audit/tool delivery from product/human acceptance.
Raw evidence and captures are external, not committed into the repository.
AI contract addition is not applicable: these lots do not introduce a reusable
UI component or alter interaction contracts; this file documents validation.

## T057 — bilingual source lint

`node tools/release/audit-texts.cjs --self-test`

`node tools/release/audit-texts.cjs --strict --output <external-json>`

Audits literal EN/FR plugin assignments, duplicate/missing/extra keys and
matching interpolation placeholders; known French accent omissions, encoding,
parenthesised plurals, sentence-case candidates. Scans tracked AMD source
strings/templates for UI and literal aria-label candidates, with file/line and
context. No source writes. --root selects another committed checkout.

Language errors fail --strict. Capitalisation and JavaScript are warnings for
manual triage: technical literals, regular expressions and dynamic templates
can yield false positives. This dependency-free lexer is not a full AST parser
or a complete French dictionary. Upstream embedded Guide is separately owned.
No accent omission detected in current non-example French prose by the known
word list; this is not a claim of exhaustive orthographic certification.
N0 self-tests and PHP lint only; native display/human language review remains.

Translations retain all 973 keys and every original interpolation token. Count
summaries use labels where practical, avoiding grammatical singular guessing
without introducing JS or plural-selection APIs.

## T056 — contract-oriented visual tooling

`node tools/release/visual-contracts.cjs --self-test`

`node tools/release/visual-contracts.cjs --output <external-json>`

72 existing release contracts catalogued/hashed, with historical-pin and browser
references; they are not all re-executed or silently updated to current pins.
Current native scenario: `roadmap-visual-contracts-current.spec.js`, one test.
Run through the existing saved-credentials wrapper, AllowedSpecRoot pointing
to this source checkout, URL on :8051 only, lease `groupimport-perf-runtime-write`.
Set process-local EASYEDU_AUDIT_RUNTIME_ROOT to the copy's plugin directory.
No deployment or purge is needed: the report hashes actual served files.

FR1280 Student initial / More Filters / Mass Import controls captured externally;
font, paint, geometry and relational overflow measured after native readiness
and finite animations. Preserve prior non-ready and short-picker diagnostics.
Repeated measurements certify repeatability, not correctness. For future
regression comparison set EASYEDU_VISUAL_BASELINE_JSON to a reviewed external
report with approval=human-approved and matching viewport/locale/states. This
tool never automatically approves or overwrites its reference. Raster review
and human acceptance remain separate. Geometry tolerance is0.5px; overflow1px.

| Scenario | Class | Status | CI blockers |
| --- | --- | --- | --- |
| roadmap-visual-contracts.spec.js | exploratory | retained failed non-ready predecessor | historical harness only |
| roadmap-visual-contracts-ready.spec.js | exploratory | retained short-picker predecessor | historical harness only |
| roadmap-visual-contracts-current.spec.js | local-supervised | current candidate, native findings open | DPAPI, existing course, reviewed baseline |

Registry handoff is documented here for the Platform planning owner; no competing
write to the shared cross-project registry in this bounded lot.

## T053 — CSS analysis only

`node tools/release/audit-css.cjs --self-test`

`node tools/release/audit-css.cjs --output <external-json>`

Balanced generated-CSS block accounting respects quoted braces/comments and
at-rule contexts. Preserves quoted whitespace when comparing duplicates. Five
auto-tests; structural metrics and literal-reference candidates are not a full
CSS AST/liveness or specificity proof. Plan in CSS-REDUCTION-PLAN.md.
CSS-only Sass compression is written externally for byte/gzip measurement;
there is no product build, source change or preview deployment.

| Scenario | Class | Status | CI blockers |
| --- | --- | --- | --- |
| roadmap-css-coverage.spec.js | exploratory | retained failed second-navigation readiness | immutable predecessor |
| roadmap-css-coverage-entry.spec.js | local-supervised | incomplete native initial readiness | DPAPI, existing course, current readiness failure |

Both require the saved-credentials wrapper/:8051/-perf- lease. Whole containing
Moodle theme bundles must not be labelled isolated plugin transfer. Unvisited
modals, phone/palette/pseudo states are not dead rules even after coverage works.

## T058 — accessibility diagnosis, no product fixes

`node tools/release/accessibility-inventory.cjs --self-test`

`node tools/release/accessibility-inventory.cjs --output <external-json>`

Run each native test through the saved-credentials wrapper, one exact grep,
AllowedSpecRoot, :8051 URL, EASYEDU_AUDIT_RUNTIME_ROOT, -perf- lease, external
manifested outputs. No fixture, cache, product deployment or business submit.
Read ACCESSIBILITY-FINDINGS.md before interpreting booleans/case coverage.

| Scenario | Class | Purpose / CI blocker |
| --- | --- | --- |
| roadmap-accessibility.spec.js | local-supervised | primary FR1280 modal/Tab/Escape/axe diagnosis; live data/DPAPI |
| roadmap-accessibility-panels.spec.js | local-supervised | expanded filters/panels/rollback/admin and direct Escape; live history |
| roadmap-accessibility-menu-entry.spec.js | exploratory | settled context menus, retained open-qualified navigation timeout |
| roadmap-accessibility-navigation.spec.js | local-supervised | stable compact panel identity/focus; desktop load then resize |
| roadmap-accessibility-small-menus.spec.js | local-supervised | paint-qualified sort/overflow menus; conditional live selection |

Raw completion is separate from passed=false findings/gaps. Ordinary nonmodal
disclosures do not inherit modal-trap/Escape semantics. Do not silently weaken
focus oracles or treat role attribute presence as correct accessible naming.
Source4.5/PHP8.1 compatibility unchanged; no native4.5 execution claimed.

`node tools/release/summarize-roadmap-audits.cjs <external-artifact-root>`

Creates an evidence/cleanup index without changing raw predecessors. Redacts
auth query values only in completed owned Playwright-generated error contexts.
Leaves active/unmanifested foreign files alone; no deletion or profile scanning.
