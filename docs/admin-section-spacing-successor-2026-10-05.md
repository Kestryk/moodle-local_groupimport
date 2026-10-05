# SM-45 - Native administration section rhythm

User requested more separation between Admin sections, without enlarging the
already-normalized typography or controls. Human checklist OPEN.

## Native baseline

`admin-section-spacing-baseline.spec.js`, local-supervised, passed 1600/768/390
in `easystud-authenticated-20261005T025728421Z-19876`. Five native `h3.main`
section headings render inside the settings fieldset at Inter16/600, with zero
start margin and 8px end margin at all three widths. Measured gap before each
heading is zero. No horizontal overflow, page error, Save or fixture mutation.
All credential/child/runtime/fixture cleanup flags true. Preserve this baseline.

## Existing Penpot reference, not a new style

EasyStud Admin page `5daf2376-ada4-8014-8008-ad9db3131f63` already uses a coherent
40px section separation in Desktop and 32px at 768/390. Native currently loses
that spacing. Preserve the source composition, five-section order and all
setting content/controls; the correction belongs in a shared Moodle layout
recipe, not scattered per-setting offsets or bigger fonts.

| View | Inner composition | Section separation |
| --- | --- | --- |
| Desktop | `5daf2376-ada4-8014-8008-ad9db35ea4de` | 40px |
| 768 | `01e728c3-f1ef-80b3-8008-b313d80cb218` | 32px |
| 390 | `01e728c3-f1ef-80b3-8008-b3141e5ea46c` | 32px |

Native successor, shared source publication and human acceptance remain distinct.
The saved native screenshot is a viewport-only baseline, not full-page parity.

## Next gate

Canonical shared `moodle-admin-section-spacing` opt-in, exact consumer include,
whole unrelated CSS/controls/controller preservation and three-width native
heading spacing/containment checks. Do not save settings or change colour values.
Publish the reusable layout note to Foundations without creating another button,
dropdown, colour picker or typography family.

## Shared candidate and paired layout guide

Kit 0.4.102 exposes `moodle-admin-section-spacing` and public
`easyedu-admin-section-flow`, with themeable wide/narrow tokens. The consumer
has one Kit include targeting its native settings form. Only the native section
start margin changes; end margin remains 8px. Strict full-unrelated CSS,
settings/control/controller/Motion reconstruction and canonical identity pass;
Kit compile successor and SCSS-only package gate pass.

Foundations reusable layout guides (not new interactive-control providers):
Library page `b278fa65-0838-80ba-8008-9de247d32d5b`, board
`386b6f86-a1e7-806b-8008-bdc56a41b2a4`; Standard page
`b278fa65-0838-80ba-8008-9de2ad4cfd3f`, board
`386b6f86-a1e7-806b-8008-bdc579c6e1b0`. Both use existing typography/surface
roles and explicitly separate product-owned content from the shared 40/32px
flow. Recursive geometry/type/text/fill fingerprints match. No new button,
dropdown or colour picker family, and no copied internal agent files in public
distribution. Existing Admin compositions already depict the same spacing,
so their controls/content were not resized to disguise the native gap defect.

Baseline/successor specs are local-supervised Docker/CI candidates with one-test
discovery, saved-credential wrapper, external manifested media and no Save or
fixtures. Shared Platform registry remains its owner's file; this portable
intake records the scenario lifecycle. Native successor remains pending.

Standard export inspected, eight text paints contained. Library/Standard hosts
are below prior content without overlap. This is a shared layout guide, not a
new interactive component, a new modal shell or whole-form acceptance.
