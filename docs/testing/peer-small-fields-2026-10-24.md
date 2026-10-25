# Small field/action alignment

The shared Kit adds the opt-in `foundation-text-field-peer-small` variant;
the published S/32px field is retained. Create and rename fields consume the
new variant. Their Small icon peers use the same size recipe: 1.9rem desktop,
44px through the existing 1024px workspace boundary. Existing captions remain
outside the measured field frame. Narrow in-card search composes the same
field variant when its Cancel command folds into a Small icon; wide searches
retain their current recipe. No native commands or JavaScript are changed.

The shared source change is applied independently to the canonical Kit and
the embedded mirror. Preserve the consumer's newer caption support; do not
replace its entire workspace-control file with an older canonical snapshot.

## Native protocol

`tools/playwright/k23-71-peer-small-field.spec.js` authenticates using only the
supervised runner's process-local credentials. It uses the actual native
Moodle page and swaps baseline/candidate CSS only in the owned browser.
Check FR/EN at 1600/1025/1024/768/390, open Group and Grouping renames through
their visible native controls (including the mobile menu), measure input and
Save/Cancel border boxes, then Cancel. Inspect creation fields in both mobile
entity views and narrow search icon/caption containment. Never submit a create
or rename. Preference writes are intercepted so presentation changes are not
persisted. Headless browser and runtime lease are released by the runner.

The external report records exact measurements, any unavailable case and
source hashes. Shared component browser contracts retain the historical
XS/S/M/L/XL heights. Ordered CSS comparison permits only paired field/action
selectors; Guide CSS and unrelated component rules must remain unchanged.

The first native pass confirmed Create at every width and desktop rename;
it left responsive rename untested because the direct trigger is hidden.
Preserve that pass and use the actual menu in the successor. Do not label a
hidden control or a synthetic DOM fixture as native responsive acceptance.

## Result

Native supervised Moodle 5.1 run: 112 measurement records across before/after,
FR/EN and five widths; all 60 candidate Create/rename field-action pairs have
zero height delta. Twenty native search cases cover both entity families;
Small icon modes at 1025/390 are aligned, including their captioned variant.
Wide text-Cancel searches keep their prior recipe. No pageerror or attempted
business mutation. Native menus, then Cancel, are used throughout. No fixture
data, source/runtime file or site configuration is changed; the lease is released.

Canonical Chrome fixture: 20 paired text/search/composite cases PASS and
25 historical field-height checks unchanged. Source compilation and the
workspace contract PASS; the older foundation-text-field source contract still
expects literal dimensions and fails on the existing token-based S field in
both baseline and candidate. It is not presented as a new regression or as
a passing full suite. Node syntax checks and git whitespace checks PASS.

The mobile rename Cancel can extend beyond its card in this runtime: the
same clipping is visible before and after this change. This pre-existing
layout issue is outside the paired-height repair and is retained in the
external captures; no claim of complete unrelated layout acceptance is made.

## Creation occurrences after native-placeholder restoration

The follow-up is based on `6a26f34c`, including `3e9f7634` and the root-type
restoration `77f95f0b`. It preserves their template changes: the two groupname
inputs and the groupingname input have native placeholders and accessible
names, without a visible caption. No template edit is required for the height
fix. The existing grouped Create/rename selector intentionally uses the same
Small peer variant: rename is already part of the approved paired-height work.

`k23-71-create-fields.spec.js` separately identifies all three occurrences,
checks Participants and structure on desktop, then Participants/Groups/Groupings
in the responsive workspace at 1024/768/390. It measures only actually visible
controls: the mobile Participants-only tab has no Create group field and is
recorded as inapplicable. Do not expose a hidden desktop duplicate solely to
claim responsive coverage. The runtime template hash must match `6a26f34c`
before presenting this as native-placeholder acceptance. The external follow-up
report records the occurrence indices, before/after CSS and exact source pins.

The first occurrence-specific probe sampled both outgoing and entering panels
mid-transition (0.98 scale, equal input/button heights). Its strict expected
absolute-height assertion correctly failed. Preserve that run and wait finite
native animations plus the expected visible occurrence indices in the successor;
do not weaken the height tolerance or change product Motion.

The new consumer delivery replaces the previous consumer commit for integration;
it carries the same Kit change on the newer base. The canonical Kit commit is
unchanged. Do not cherry-pick both consumer deliveries.

The occurrence-specific successor passed 44 before/after contexts and 18
visible candidate field/+ pairs in FR/EN. Occurrence 0 is observed twice on
desktop Participants; occurrences 1 and 2 each have eight candidate cases
across desktop structure and the responsive entity tabs. Every measured
candidate pair has zero height delta, all native placeholders/accessibility
names remain present, and no JS exception occurs. The runtime template
matches the pinned source; no runtime files, settings or data are changed.
