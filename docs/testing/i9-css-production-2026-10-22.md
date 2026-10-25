# Production stylesheet verification

The source checkpoint for this review is `8f7a5f1f`. Production minification
already exists in `60ca1c66`; it is the default in
`tools/release/build-page-styles.cjs`. `--no-minify` retains the readable output
for diagnosis. No production stylesheet or component definition changes in
this verification batch.

## Sizes from the same source and pinned toolchain

Node 22.11.0, Sass 1.79.1 and the existing PostCSS installation were used.
Gzip values use Node's default gzip settings and are compressed byte counts,
not observed HTTP transfer sizes.

| Page stylesheet | Readable bytes | Production bytes | Readable gzip | Production gzip |
| --- | ---: | ---: | ---: | ---: |
| Student Management | 1,241,325 | 1,218,534 | 112,670 | 111,045 |
| Mass Import | 365,244 | 358,395 | 35,458 | 34,761 |
| Administration | 310,005 | 304,305 | 32,882 | 32,304 |
| Guide | 536,941 | 527,611 | 44,317 | 43,714 |

The four rebuilt production files match the versioned assets exactly. The
raw savings are modest because the readable builder already compacts each
rule. These measurements supersede estimates from an older audit checkpoint.

## Preservation checks

- `audit-page-css-production.cjs SASS_MODULE POSTCSS_MODULE EVIDENCE_DIR`
  builds both forms, saves them outside Git, then compares independently
  parsed selector trees, declaration/value tokens, priority and rule order.
  All four pages have zero semantic differences.
- `test-page-css-production-cssom.cjs PLAYWRIGHT_MODULE VALUE_PARSER_MODULE EVIDENCE_DIR`
  compares Chromium CSSOM rule/selector/order/priority and value tokens.
  CSSOM preserves insignificant whitespace inside custom properties and
  unresolved functions. The historical raw-string gate reports 260 such
  differences on Student Management; its original failed diagnostic is kept.
  The format-specific successor proves zero value-token differences on all
  four pages without changing the historical gate.
- The existing Guide-aware subsequence contract retains 6,372 Student
  Management, 1,785 Mass Import, 1,424 Administration and 2,433 Guide selector
  occurrences. The global stylesheet has zero presentation rules.
- Student Management has exactly one large token-default block:
  `.local-groupimport-easystud`, 377 custom-property declarations. There is
  no `:root` emission and no second default block inherited from the Guide.
  The smaller Guide modifier blocks are component-specific roles, not
  duplicate copies of the default token catalogue.
- The native candidate compares readable and production CSS in the same
  authenticated Moodle DOM at FR/EN 1600/768/390, on all four surfaces.
  Consolidated geometry/computed paint is neutral in 24/24 cases, with zero
  page/console errors or business writes. Strict screenshots pass 20/24;
  the four compact Guide cases remain raw failures. A four-case identical-CSS
  control also fails those screenshot comparisons. The original full run,
  control and resting-pointer compact successor are retained separately;
  no pixel threshold or failed assertion is relaxed. The strict zero-failure
  native criterion remains open. Configuration is restored exactly by hash.
  Evidence, pixel counts and the raw failure measures are in the external
  review report. Set `I9_IDENTICAL_CSS_CONTROL=1` for the four compact controls,
  or `I9_COMPACT_GUIDE_ONLY=1` for the actual compact Guide comparison.

## Guide delivery options requiring approval

The present architecture keeps Guide rules inside Student Management's
sheet. Mass Import requests both its page sheet and `guide.css`. The lazy
Guide facade delays JavaScript, not these CSS requests.

| Option | Benefit | Constraint |
| --- | --- | --- |
| Keep the existing integrated Student Management sheet | No change to order or first-open paint | Guide styling is downloaded with the workspace and repeated across page bundles |
| Shared cached Guide sheet requested by both consumers | Cache reuse and smaller workspace-specific CSS | Preserve exact cascade order, media/supports context, host tokens and all non-Guide shared rules |
| Load that shared sheet only on first Guide activation | Smallest initial payload | Additional failure/preload/opening states and risk of unstyled welcome/resume/checklist UI |

Recommendation for approval: the second option first, retaining eager CSS
loading to avoid changing first-open behaviour. A lower-bound comparison finds
1,617 identical rule bodies (488,965 bytes, excluding conditional wrappers)
shared between the current Guide and Student Management sheets. This is an
inventory estimate, not a proposed downloadable size or measured latency gain;
the actual extraction must preserve each rule's ancestry and position.
No loading architecture change is applied by this batch.

The shared component/API documentation contract remains unchanged because
this batch adds validation and a compatibility inventory only. No UI, token,
template, PHP behaviour or Bootstrap migration is introduced.
