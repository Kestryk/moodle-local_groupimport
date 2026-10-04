# Mass Import secondary icon hierarchy - SM-42B

Native SM-42 baseline showed 40.8px identification/deposit tiles against
35.2px main-column tiles. Kit 0.4.98 (`7e00460`, predecessor `f843c9b`)
uses existing Compact 35.2px/17px roles throughout this embedded hierarchy.
PHP only opts into public classes; no private style, upload/removal/draft
change, new limit, business command or Motion edit. Heading, description and
native chooser tracks shrink together; subordinate copy/control use full
width on mobile. Standalone regular deposits remain 40.8px/20px.

## Foundation and product propagation

Paired Standard 08.4 / Library 08.4.1 compound providers are recorded in the
canonical Kit document `docs/components/compact-deposit-hierarchy-2026-10-05.md`:
Default `cf371b29-2e8e-8011-8008-bd89354c3a82`, Uploading
`cf371b29-2e8e-8011-8008-bd8936da8cc4`. Existing Section icon tile / Compact /
Primary `cf371b29-2e8e-8011-8008-bd543613abac` supplies both nested density
and the separate identification tiles. Original regular providers unchanged.

EasyStud page 01 now has 18 linked compact-header deposits (including the
three validation Danger presentations) and 18 linked identification tiles.
Settled readback verifies unchanged root sizes, all business text and all
non-icon surface/stroke paint, centred 17px linked glyphs and containment.
Identification text tracks follow the native 35.2 + 6px column/gap; deposit
tracks follow 35.2 + 15.2px. Initial desktop and mobile exports inspected.
Other notice/segmented-choice artwork was deliberately not reclassified.

Exact recovery is stored on every edited picker via plugin data `sm42Before`,
`sm42Backup`, `sm42Density=compact`; its previous linked composition remains
hidden under the same parent. Each new identification tile stores `sm42Old`
and `sm42TextsBefore`; the old wrapper remains hidden, not deleted.
The first desktop picker `5daf2376-ada4-8014-8008-ad9c9b69b188` has backup
`cf371b29-2e8e-8011-8008-bd8a784ba56b`. Mobile initial picker
`01e728c3-f1ef-80b3-8008-b30dbbe61d51` has backup
`cf371b29-2e8e-8011-8008-bd8b2fdb0a8d`. No full-page archive cleanup inferred.

A bulk editor task timed out after applying its first nine items. Readback
confirmed the exact applied subset before continuing; it was not replayed.
A later nullable-radius setter was rejected; it was narrowed to finite values
before continuing. Final content/palette/glyph guards pass for all 18 pickers.
These are editor-operation corrections, not suppressed native product errors.

## Checks and remaining gates

- `tools/release/test-mass-secondary-icons-source.js` compares the canonical
  SCSS bytes, reconstructs both class-only PHP changes against `dd7fb86`,
  compares the entire unrelated CSS and preserves controllers/generated AMD,
  settings, templates, commands and accepted Motion. PASS with Sass 1.79.1.
- PHP syntax: `index.php` and `classes/form/import_form.php` PASS.
- Isolated Kit three-width compact/regular geometry, glyph centring and native
  control indent: PASS. This is placeholder geometry, not font-icon proof.
- `mass-secondary-icons-successor.spec.js` is local-supervised native initial
  GET-only proof at 1600/768/390. Served successor remains pending.

Human checklist stays OPEN. All-state uploading/removal/report lifecycle,
other correlated-board typography and Skeleton geometry remain separate
existing queue items. No import, Move, Send, Drop or settings save performed.
