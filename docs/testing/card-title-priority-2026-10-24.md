# Card title priority and existing overflow

The same `ensureNestedGroupActionMenus` controller already owns Group and Grouping
headers. It moves secondary commands into the existing More menu before applying
`card-header-readable-fallback`. This change adds no new menu, command or component.

A responsive constrained Grouping still reserved the absolute touch-action lane
while its identity occupied the fallback row. Its title was reduced to 91.97px in
the native 390px case. The consumer now composes the existing Kit
`identity-card-action-clearance($flow: true)` and
`card-header-terminal-slot(overflow)` recipes in that state. The More control
therefore yields the identity row, as it already does on Group cards. Targets,
count paint, menu dispatch, selection, disclosure and Motion remain unchanged.

The preferred caption budget stays 7.5rem. Measure the name itself, excluding the
Grouping disclosure chevron. Its minimum is the smaller of the intrinsic caption,
that preference and the maximum identity space after the mandatory selector,
chevron and existing spacing. At the narrowest desktop sample this cap is 112.76px;
forcing 120px there would overflow the card or require another structural design.
Secondary actions cannot consume that retained identity budget.

## Native validation

The versioned candidates use the supervised saved-credentials runner, a reserved
local Moodle copy and an external artifact directory. Run each candidate with a
single matching grep. Supply the normal credential loader, manager URL, Chrome
path and `K2348_DIR`; the paired baseline candidate additionally requires
`K2348_BASELINE_CSS`, containing the unchanged baseline page stylesheet.

- `k23-48-card-title-matrix.spec.js`: FR/EN, 1600/1280/1150/1050/390, course drawer
  closed/open, Group/Grouping, short/long captions and one to six original actions.
  Labels and hidden actions are controlled browser-only stress; the actual native
  overflow controller is called without changing course records or commands.
- 432 presentation cases plus two explicitly separate mobile drawer-overlay
  observations. Mobile drawer open is not treated as permission to click through it.
- Retain the failed initial course prerequisite and the initial 120px-only oracle.
  The latter incorrectly demanded 120px even when essential identity geometry
  permits only 112.76px; it also correctly exposed the separate 390px lane problem.
  The successor records root font, physical capacity and preferred width separately.
- Verify Group terminal count after More, menu opening, Escape/outside closure and
  viewport containment. Compare Group and desktop geometry with the baseline;
  parent-relative positions exclude ordinary document scrolling.
- `k23-48-page-two.spec.js`: real Grouping pagination to 2/2 without manually
  invoking the controller, plus paired native baseline/current CSS captures.

The CSS change uses existing canonical mixins and adds no Kit source definition.
Only Student Management CSS changes. PHP and AMD are unchanged. Runtime files are
backed up, checked for concurrent modification and restored after validation.
Human acceptance and production publication remain separate from this local proof.

## Recorded result

Local Moodle 5.1, existing course 5 (54 groups, 14 groupings), source `348be719`.
The native candidates require a comparable two-page fixture; no persistent course
names, membership or configuration were changed.

| Width | FR/EN | Drawer | Result |
| --- | --- | --- | --- |
| 1600 | Both | Closed/open | PASS |
| 1280 | Both | Closed/open | PASS |
| 1150 | Both | Closed/open | PASS |
| 1050 | Both | Closed/open | PASS |
| 390 | Both | Closed; modal overlay observed separately | PASS |

432 presentation cases, 12 native menu cases and 32 paired page-2 card measurements
passed; no pageerror occurred. The preferred name budget is 120px on this host.
The unchanged narrowest desktop identity permits 112.78px once selector/chevron
space is reserved, and all six secondary commands are in More. At 390px, the
Grouping name grows from 91.97px to 143.16px. All 408 Group/desktop comparisons
remain identical within the 0.5px tolerance (observed maximum delta 0px).
The Group count remains after More, minimum gap 5.59375px.

MoodleCS: zero errors, 32 baseline warnings. No PHP/AMD/Kit definition changed.
Mass Import, Guide, Administration and global CSS are byte-identical to the base.
Moodle 4.5/5.3 were not rerun for this CSS-only layout repair. Production was not
modified; release validation remains with the integrator.

## Grouping coverage rechecked on 2026-10-25

The requested Grouping extension already exists in `960ba61a83f59fc6c9f4d86884e586ceec023cd0`
(compiled by `4ebb0331f924b6e4fa8d478927e77b3379887a0e`). Its subject and
patch explicitly target Grouping headers. The shared controller, action selector,
7.5rem preferred title budget and canonical fallback recipes cover both families.
No additional product or Kit definition is necessary.

Rechecked at integrated source `5bf932baae6aa953755433aa1f0aa7ec77c2c5db`:
432 short/long-title presentations with one to six actions, FR/EN, all five
specified widths and desktop drawer states pass. The two mobile drawer-overlay
observations remain separate from interactive card tests. Twelve native menu
open/Escape/outside checks pass; Group terminal count order remains correct
(minimum More-to-count gap 5.59375px).

Minimum long Grouping title widths (drawer closed/open), in pixels:
1600: 214.69/120.19; 1280: 126.69/120.19; 1150: 153.69/162.78;
1050: 143.69/112.78; 390 closed: 143.16. The 1050 open case reaches the
physical identity capacity documented above; all six secondary actions yield.
No title/control collision or card overflow is observed.

Natural pagination to page 2/4, without a manual controller call, also passes:
40 Grouping cards across FR/EN and 1050/390, retaining More and the same
112.78/143.16px minimum title widths. Both runs have zero pageerrors.
The serving runtime stylesheet and compiled controller match the tested source
byte-for-byte. This follow-up changes documentation only; there is no new
before/after product delta, build, deployment or persistent course-data change.