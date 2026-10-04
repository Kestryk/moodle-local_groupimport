# Mobile navigation typography audit

SM-27 / EED-UI-2026-0073. The shared Navigation recipe explicitly inherits the
Moodle UI family via `--easyedu-font-family-ui`, with medium destination weight
and separate section-title/eyebrow roles. A read-only native gate records the
actual title/item/guide fonts, opaque drawer paint, 44px minimum row target,
label containment, icon centring and Close focus return at 768/390. It never
follows a destination, opens the Guide, or issues a plugin business command.

Scenario candidate:
`tools/playwright/student-mobile-navigation-typography-preview.spec.js`, exact
title `Mobile navigation keeps Kit typography, opaque paint and aligned targets`.
The gate passes its viewport width explicitly into browser evaluation and waits
for the existing opening opacity to settle before recording paint. Neither
correction changes the accepted Navigation Motion.
Class: local-supervised. Shared Platform registry remains planning-owner-owned;
this portable backlink records the candidate without modifying that registry.

Initial product Penpot inventory found one effective visible Mobile panel / Open
instance (`cef95197-06bc-809e-8008-aeff2352f110`). Navigation/item labels are
Inter at 18px/700 and 16px/600; its Open guide label is Noto Sans 14px/400.
That guide-label divergence needs source-provider inspection and paired repair;
do not certify the full drawer from its three destination links. Guided visits
remain a separate deferred project; a typography audit does not start that
programme or alter its behavior.

Native pre-extraction run `easystud-authenticated-20261004T195314211Z-19428`
passes at 768/390: Inter throughout, title 16px/600, destinations 15px/500,
Guide 16px/700, white opaque panel, 46.9375px destination rows, icon centres
at zero delta and Close focus return. No business request or fixture mutation;
owned child stopped, credentials cleared and runtime lease released.

Kit 0.4.92 now owns the two compact destination/Guide-label typography mixins.
The native adapter includes these roles instead of duplicating their values.
Canonical/embedded Typography hashes match; the complete compiled CSS equals
the preserved baseline hash
`36CD9BACBB3CF8A762B859C70FA8EF0FC4B61A8D9AA128887934B753E81263C1`.
Controller, AMD, routes, trigger, scrolling, layering and original Motion remain
unchanged. This bounded extraction does NOT complete the deferred full
Navigation/Guide embedded-tree drift ledger or certify every native sublink.

Paired Foundation Compact-item states, responsive Guide labels and Mobile
panel are reconciled to these type roles. Source/Standard fingerprints match.
The live product panel keeps 316px rows; labels are contained and its three
linked icons are visible, centred and proportional. The old missing glyphs
use native file-import/clipboard-list providers, not custom drawn substitutes.
Catalogue readback is in the Kit's
`docs/testing/compact-navigation-typography-2026-10-04.json`.

The role-specific post-extraction native successor is pending. Human acceptance
remains open; the three destination routes and Guide lifecycle are unchanged.
