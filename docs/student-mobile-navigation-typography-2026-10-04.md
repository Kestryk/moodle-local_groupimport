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
Class: local-supervised. Shared Platform registry remains planning-owner-owned;
this portable backlink records the candidate without modifying that registry.

Initial product Penpot inventory found one effective visible Mobile panel / Open
instance (`cef95197-06bc-809e-8008-aeff2352f110`). Navigation/item labels are
Inter at 18px/700 and 16px/600; its Open guide label is Noto Sans 14px/400.
That guide-label divergence needs source-provider inspection and paired repair;
do not certify the full drawer from its three destination links. Guided visits
remain a separate deferred project; a typography audit does not start that
programme or alter its behavior.

Native measurement and paired catalogue successor are pending. Human acceptance
remains open. Existing navigation routes, responsive trigger, scrolling, layering
and Guide lifecycle are unchanged.
