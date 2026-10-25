# R10-31: common slide-title hierarchy

Source baseline2469155, Kit67b4d31. Existing worktrees only; human review open.

The main Discovery slide title currently shares the14.08px body size. It now
opts into the existing `type-section-title` role:16px,600 and semantic
`--easyedu-secondary-text` (#0b5ea8 by default). The Foundation class resolves
the title line-height token to1.2, not the base token's1.25; preserve that shared
rule. Only `.easyedu-guide-slide__header > h3` changes. Long labels wrap and
shrink normally. Modal/page headings, topic labels, cards and body typography
remain unchanged; no border, new icon family or private plugin paint is added.

`test-guide-slide-title-source.cjs` passes complete controller/content/template/
AMD/native command preservation and every unrelated CSS declaration. The
canonical sync changes only shared Discovery SCSS; Sass compiles successfully.
`test-guide-slide-title-layout.cjs` passes144 actual twelve-slide titles across
EN/FR,1280/768/390 and normal/reduced motion, including painted text containment.
Initial fixture expected20px; actual canonical Foundation token resolves19.2px.
The corrected oracle follows that existing recipe, not a product timing change.

Foundations Library/Standard source roots are the same eight roots retained in
`guide-explanation-recomposition-2026-10-10.md` and the versioned before record.
Only `Intro / title` is updated, with preserved copy/position/width and adaptive
height. Linked Standard copies are explicitly reconciled. `findByName('Inter')`
unexpectedly returned Inter Tight and the applied default weight400; exact
gfont-inter/Inter/variant600/weight600 were restored on all eight titles before
raster inspection. Do not repeat approximate font-name lookup for this family.

The first full mobile capture clipped the title under editor chrome. Retain it
as diagnosis; the focused title-standard.png successor is inspected and pinned
under external manifested run guide-slide-titles-20261010. No overlays were
hidden, no editor reload or Moodle action occurred. Retention dry run deletes0.

`read-saved-guide-slide-titles.cjs` is the strict saved-file gate for the eight
titles. Saved verification, product-linked propagation and served-native
title proof remain separate from144 isolated cases and editor raster. Do not
claim current Moodle titles changed: runtimebc9d908 still serves tooltip work.

Next: finish saved readback, propagate source-linked title updates to Guide
without overwriting its specific copy, then controlled local preview and native
long-title/mobile parity. All older Guide/student feedback stays retained.

## Saved Foundation successor

The eight-title saved gate now passes. The reader previously selected a truthy
empty shape-fill array before reaching the text-content fills. Resolve the
first nonempty fill collection and retain exact #0b5ea8/Inter/16/600/1.2
assertions. No design repaint was needed. This corrects evidence parsing,
not source paint or typography. Product propagation and native proof stay open.

## Guide propagation

Native shared-library update was applied. Eight existing product introduction
title overrides retained old14.08px paint; explicitly reconcile those slots
with the16px/600/1.2 secondary-text source while retaining text, widths and
Foundation provider links. Saved product mode of the readback gate passes all
eight Introduction/Participant/Group/Grouping desktop/mobile titles. Four named
standalone Lesson/Discovery title usages are updated too; their saved/raster
proof remains separate. No whole-page Guide certification is inferred.

The native candidate `guide-slide-title-native.spec.js` reads all twelve slides
at three widths, blocking business/settings writes. Not run before promotion.
Its discovery gate selects exactly one test. The saved Foundation/product
readback and focused product Mobile title raster now pass; external manifested
run guide-slide-title-product-20261010 retains mobile-title.png, deletion0.
This certifies the named title, not the entire composed mobile slide.

## Served native successor

Ordered Source2469155/acdbe83/e90a6d8 promotion serves runtimecc30df0;
caches purged. Native run4712 passes36 actual twelve-slide titles at three
widths, exact16/600/19.2px/secondary-blue and painted containment. No page
errors, blocked writes or settings/business writes. Credentials cleared,
lease released and owned child stopped. Retention dry run deletes0.
Evidence is guide-slide-title-native-2026-10-10.json. Native FR/reduced motion
and full Penpot page acceptance remain separate;144 isolated localized cases
do not certify them. Human checklist remains open. Next Guide lot: R10-28 dots.
