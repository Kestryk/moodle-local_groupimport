# OLD-B controls — source candidate, 18 October 2026

Source reference: Product views / 03z, `OLD-B-PENPOT-2026-10-18.md`.
This delivery contains source only. No generated stylesheet, AMD build,
browser geometry or accessibility-tree acceptance is claimed.

## Member remove — K16-67

`related-person-remove` and `related-person-remove-target` own the same action
on group cards and entity dialogs. Desktop target: 2rem (32px at a16px root).
Narrow/coarse-pointer target: the existing 2.75rem touch token (44px).
The resting target has no surface, border or shadow. A centred `::before`
draws one12×1.5px stroke in #5C6C7D; the legacy hidden minus character is not
used to position the sign. The shared focus ring remains available.

Mouse users see the action while its member row is hovered or focused; a
Guide-highlighted action stays available. Touch users always see it. The
public related-person-row selector owns this policy, including dialogs; a
consumer must not repeat the hide/show rule. Motion policy remains inherited.

Consumers supply an escaped accessible name containing both member and group,
and the shared help bubble label “Remove from group” (localized). Removal
handlers, confirmation and notifications are unchanged; no Undo toast added.

## Secondary action M / Touch — R13

`buttons.secondary-action` is the single regular secondary action recipe.
`foundation-button($secondary: true)` delegates to it for regular density;
`filter-reset`, `filter-reset-field-peer` and `foundation-field-peer-frame`
are compatibility adapters to the same definition. Compact inline controls
remain an explicit separate density.

At a16px root: minimum height37.6px desktop and44px narrow/coarse pointer;
font14.08px/1.2, weight600; inline padding12px; radius11.52px; white surface,
1px border #C8D6E3 and text #1F2A37 through the existing semantic tokens.
Widths remain intrinsic for translations. Reset and Cancel must use this
recipe together; do not combine Reset with the quiet selection-recovery skin.
The latter remains the independent Deselect action, without changes here.

## Standalone filter toggle — K16-46

`easyedu-filter-toggle easyedu-filter-toggle--standalone` composes
`filter-toggle` with the captionless44×44 target variant. The existing36×20
track,14×14 thumb and3px inset are retained, centered in the target. Default
On #0F6CBF, Off #D7E3ED and white thumb remain semantic token consumers.

`forms/templates/admin_setting_switch.mustache` is the canonical setting
control. Its Moodle adapter changes only the template namespace. The outer
native setting name stays visible; the checkbox keeps its name, id, submitted
yes/no values, disabled/readonly state and explicit accessible name. It uses
`role="switch"` on a native checkbox: checked state is exposed from the live
native property, rather than a duplicated `aria-checked` attribute that could
become stale without JavaScript. No visible On/Off caption is emitted. Native
default-value information below the setting is retained.

## Stage2 gate and scope

Wait for the explicit end of the load-test slot before any build or browser.
Then compile styles and affected AMD using the pinned toolchain, and measure
FR/EN1600/1280/768/390 including touch. Check sizes, glyph/control centres,
focus, row containment, native setting toggle/name/state, reset/cancel parity,
localized help bubbles, and zero console errors. Keep actual before/after
values; source constants are not measured results.

K16-64 is excluded: Circle16 stays10px until Foundations changes its master.
No Guide source/template or CCB files are changed. The Guide mirror is outside
this delta. OLD-B mixins are identical across the canonical Kit and EasyStud's
`scss/easyedu` source mirror. Existing unrelated differences in three files
(responsive card variants, filter helper mixins, legacy field-peer adapter)
are documented separately; the scoped patch does not overwrite either side.
