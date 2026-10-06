# Semantic view-switch icon paint (SM-60)

EED-UI-2026-0073. Source candidate; native gate below is pending until its exact
pushed candidate is served and the immutable scenario finishes. Human OPEN.

## Actual change and preservation

Canonical Kit 0.4.120, commit `49d047ac1cac875fc3adabd12d1994156ff72749`:
`scss/easyedu/_workspace-control-classes.scss` is byte-identical here. Four
shared rules replace literal tile/glyph blue with primary-soft/readable primary,
chosen-primary hover tint and neutral disabled roles. Pressed hover stays solid.
One `easyedu-workspace-view-switcher--tiled` class is added to the existing
desktop template wrapper; no Mustache paint or private SCSS skin is added.

The preserved source baseline is `6a6c65b76a96b5cd99da538b8beb0a54012a6c6f`.
`node tools/release/test-view-icon-palette-preservation.cjs <owned-kit-root>`
passes canonical module identity, one exact template class change, four paint
rules and byte-identical complete other CSS. Controller/AMD, all Motion/choices,
PHP, settings, layout and responsive sources are unchanged. The baseline fold
and availability tests remain historical; don't weaken their full-source pins
to pretend the new CSS existed then. The fixed scoped member-fold code is intact.

The canonical shared isolated fixture passes43 state/palette checks, including
two/three choices and pressed-hover/disabled precedence; no native availability
or settings persistence is inferred. Public SCSS-only archive test passes and
VERSION/manifest both equal0.4.120. No agent/docs files enter the public archive.
Existing Sass mixed-declaration warning is retained, not repaired in this lot.

## Penpot defaults and boundaries

Foundation Library `f8d43eec-8cff-8027-8008-9ce268fbf0db`, host
`f8d43eec-8cff-8027-8008-9ce28a412006`: eight existing M/S state providers,
64 tile/glyph fill updates. Standard `d0d0680d-7d36-80da-8008-97a492c30a31`,
host `51671704-28fe-802f-8008-9a3b8bfe5dfc`:64 corresponding fill updates.
All descendant geometry/font fingerprints unchanged, saved versions completed,
validation=[]; no new component, variant or icon-root normalization.

Product03 `92c1c225-95fb-802e-8008-ae9f13d0b0b9` hosts:
`92c1c225-95fb-802e-8008-ae9f2c1055da`,
`cef95197-06bc-809e-8008-aede91ff23ff`,
`cef95197-06bc-809e-8008-aede62dfb925`.
They inherited the source paint, so zero extra Product fill writes were needed.
Geometry/font identity, saved metadata and validation=[] pass. Fresh28x28
surface readback is #eaf3fb/#eaf3fb/#0f6cbf. Metadata does not mean human review.

Compact native entity tabs have no square surface; preserve that recipe rather
than adding one simply to match a historical static specimen. The six compact
Product drawings/custom theme specimens need their own anatomy/visual pass;
they are not included in this three-desktop-default publication claim.
No new full-view screenshot/raster parity or human acceptance is claimed.

Own MCP recovery: toolbar showed Connected but the owned plugin-modal was hidden
and its iframe had0x0 bounds; focusing the editor alone was insufficient. Reveal
only the owned MCP panel and click its status inside the iframe before SDK work.
This is editor-connection recovery, never hiding a runtime overlay for evidence.
Failed/terminated read-only requests were not duplicated as design writes;
settled saved state was checked before continuation. Guide connection untouched.

## Native scenario and next gate

`student-view-icon-palette.spec.js` is local-supervised. Discovery run
`easystud-authenticated-20261006T093933084Z-45468` selects exactly one test.
It uses actual native local view clicks and transient saved/default/dark/light
palette roots, checking rest/hover/focus/pressed and a clearly labelled disabled
paint probe. It never claims transient disabled paint proves native permissions.
Compact768/390/320 stays background-free. No fixtures/settings Save/Send/import/
drop/transfer; plugin writes blocked, only side-effect-free core reads allowed,
unsent-message bootstrap mocked empty to avoid consuming a draft.

Promote the preceding proof/audit commit `6a6c65b` together with this candidate,
in order, then refresh caches and run the focused scenario through the approved
runtime wrapper/leases. Do not save palette settings for a visual check.
SM-59 popup roles, SM-64 full Mass lifecycle, SM-72 Restore persistence, custom
Penpot specimens, optional SM-51 full bodies and the combined checklist remain
OPEN. SM-61 Guide handoff remains solely with the separate Guide owner.

Cost review for this slice: no quota telemetry, so no numeric savings claimed.
Avoidable overhead included guessed file names, overlarge assertion diffs,
premature MCP calls before a helper completed, and repeating focus without
checking the iframe's visibility. Use rg discovery, compact diff failures,
finished helper sessions and the observed iframe focus path. Reuse focused
guards; no new worktree, subagent or redundant whole-page screenshot run.
