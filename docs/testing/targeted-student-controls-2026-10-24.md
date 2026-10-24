# Targeted Student Management controls

Source checkpoint: `e3cdf3e0`. Changes are isolated from the integration checkout.
The shared Guide and V3 SCSS are reconciled into the Kit and mirrored back;
the consumer owns grouping/search commands and their ARIA state.

## Results and scope

| Control | Before | Candidate |
| --- | --- | --- |
| Resting floating Guide, 48px frame | Compass centre offset −3.59375px horizontally | 0px horizontally and vertically |
| Expanded floating Guide | Existing icon/label layout | Unchanged width and visible label |
| Notification stack | Right side on desktop/tablet | x=16px, y=76px, below the native navbar |
| Grouping with seven groups | Search opens automatically | Search remains hidden until explicitly requested |
| Narrow search field and Cancel, desktop | 38px / 30.390625px | 30.390625px / 30.390625px |
| Narrow search field and Cancel, touch | 46px / 44px | 44px / 44px |

The ungrouped search already uses a native placeholder. Its actual wide
Complete-view frame and text Cancel are both 38px. Responsive Groups/Groupings
tabs intentionally hide the ungrouped section; those hidden occurrences are
not claimed as visible-page proof. A labelled browser-only clone of its real
search panel additionally measures the existing narrow Kit recipe at all three
viewport widths. No new field variant or per-section CSS is introduced.

The pinned source already contains the Small field recipe from the preceding
field-alignment delivery, but its checked-in Student Management stylesheet
does not. Regeneration therefore also restores those existing source rules.
Those prerequisite compiled changes are included explicitly, not attributed
to a new placeholder/template change. Other page sheets only change the
shared notification placement; Guide CSS changes its launcher gap.

## Search inventory

All six search labels in `templates/manage.mustache` use `easyedu-search-field`
and native placeholders: Participants, participant-focus group catalogue,
Structure Groups, Structure Groupings, ungrouped groups and groups inside a
grouping. The two dynamic constructors in `amd/src/local/cm/group_cards.js`
use the same recipe for members and grouping groups. None uses the captioned
modifier. The Guide filter/intro specimens are separate read-only examples.
Searchable-choice widget inputs are separate filter widgets, not these card
searches. The exhaustive grep also includes Mass Import's preview search and
its read-only Guide scene, which use the existing `easyedu-search` table recipe
rather than the paired card-search recipe. The captioned Kit primitive remains
available for other consumers.

## Native scenarios

`tools/playwright/k23-targeted-78-83-successor.spec.js` compares pinned assets
before/after on an authenticated Moodle page at 1600/768/390px, FR/EN. It
replaces the two named AMD definitions inside Moodle's real aggregate using
an AST, and checks that both replacements actually occurred. Merely routing
an individual module URL is insufficient when Moodle serves an aggregate.

`tools/playwright/k23-search-motion-final.spec.js` inventories live search
inputs, measures the wide ungrouped panel and its narrow component fixture,
compares baseline/candidate CSS, checks top-left notification containment,
and exercises manual grouping-search open/Cancel with its real normal-motion
`is-easyedu-disclosing` state. Preference persistence is stubbed; no course,
membership, grouping or server setting is written. The seven-group stress
case modifies only the browser model and restores it immediately.

Tests require externally configured artifact/source roots and a local saved
credential loader; credentials are never written into the repository. Failed
preliminary runs are retained externally with their original strict oracles.

The source CSS audit compares complete Sass output and preserves the order
and declarations of every rule outside floating Guide/notification selectors.
The Kit audit has the same 67 findings before/after (29 in its old baseline,
38 pre-existing uncovered findings); its global baseline gate is not green.
ESLint has zero errors and seven existing warnings in the two touched modules.
Forcing PHPCS to tokenize those JavaScript files additionally reports the same
92 legacy findings on baseline and candidate, with no new finding; this is
not presented as a successful whole-plugin PHP codechecker gate.

No remote deployment, PHP change or Penpot publication is part of this lot.
Native proof covers this targeted Moodle 5.1 recipe, not an exhaustive 4.5/5.3
or whole-plugin audit.
