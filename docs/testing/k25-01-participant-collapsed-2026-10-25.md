# K25-01: coherent collapsed participant cards

## Reproduced cause

With the admin default ON, the predecessor also reproduces the reported leak
without selecting a card: start Compact at 1600px, switch to mobile, choose Full,
then return to desktop. The desktop flag remains Compact while the model-wide
metadata override remains Full: 13/15 cards show groups. Separate desktop/mobile
UI flags and a global metadata override had become inconsistent. Explicit manual
choices now synchronize both viewport flags, preserving the last choice.

The earlier admin-default fix changed metadata disclosure but left initial visual
density on the historical `count($users) > 5` rule. With admin default off, a long
course therefore entered Compact mode while its metadata/groups were expanded.
On Moodle 5.1 native baseline: 18/20 initial desktop Compact cards showed groups.

The suspected CSS escape was not reproduced on this host: `hidden` remained
present and the computed display was none, protected by Moodle's hidden rule.
Responsive Compact had a second inconsistency: it retained a detailed, wrapped
identity (about 153px on the measured card), and a manual mobile Compact choice
could reset the global override to null rather than explicitly collapse it.

## State and layout contract

The PHP initial visual mode uses the same existing admin predicate as the JS
metadata default, independent of participant count. Initial mobile mode follows
that mode. A manual Compact choice stores false and Full stores true on both
viewports. Reload returns to the configured default; current-model pagination
preserves an explicit choice, including desktop/mobile viewport transitions. Single-card selection remains a per-card temporary
disclosure and never changes the global override.

Collapsed cards consume the existing Kit compact headline and responsive tracks.
The compact Kit role explicitly resets its inherited grid to one row (0.4.227).
The existing rail/inset predicates also follow actual hidden metadata. Expanded
cards retain the G7 wrapped-name and narrow readable-summary recipes; these
expanded recipes must not be applied to a genuinely collapsed card. Colours,
type tokens, control targets, selection handlers and Motion timing are unchanged.

The bounded Kit relay is recorded in `easyedu-kit-docs/easyedu-kit.json`; unrelated
existing differences in the vendor cards module are preserved.

## Reproduction and acceptance

Lease one test runtime, back up its plugin files and participantcardcollapsed
value, set 1 then 0 and purge caches between admin cases. Use a course with more
than five participants, including group memberships. At 1600 and 390px, measure
initial, explicit Full and explicit Compact; record real model/ARIA state,
`hidden`, computed display, painted groups, grid row count and card height.
A collapsed card must have hidden metadata, no painted membership rows and one
identity grid row. Measure text content boxes separately from optical title
padding: padding is not a second text line. Full mode retains its existing layout.
Then select one member, select a second, deselect both and paginate: neighbours
must stay collapsed, two selected cards must not reveal metadata globally, and
pagination must preserve Compact. Restore setting, deployed files and caches.

| Gate | Scope |
| --- | --- |
| `test-participant-collapse-default.cjs` | Existing 24 admin/override policy cases, unchanged. |
| `test-participant-density-policy.cjs` | Actual production manual override and mobile initialization, 10 cases. |
| `test-participant-density-final-height.cjs` | Existing 18 Motion/page-size transitions. |
| `test-security-escaping.cjs` | Required security convention/escaping guard. |
| `tools/playwright/k2501-participant-collapsed.spec.js` | Supervised native candidate: four admin/density combinations at desktop/mobile, plus selection and pagination. Requires the approved credential wrapper, exclusive runtime/config fixture and external artifact paths. |

Build styles with the standard page-style Sass pipeline. AMD changes use only
`build-amd-official.cjs MOODLE_BUILD_ROOT`, followed by its `--check` byte gate.
Do not add a CSS mask for visible groups while leaving the state inconsistent.
