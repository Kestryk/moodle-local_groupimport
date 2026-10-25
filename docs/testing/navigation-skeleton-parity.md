# Navigation Skeleton parity (`EED-UI-2026-0025`)

## Scope and immutable input

Student Management (`templates/manage.mustache` and
`scss/components/_layout.scss`) and Mass Import (`index.php` and
`scss/views/_mass-import.scss`) consume the immutable UI Kit snapshot
`45c5cb1a0c8364bd77c343b14af2ee71416a4bcb` for the selectively synchronized
Navigation Skeleton primitive.

The selective vendoring synchronises K3.1 Loading and Navigation Skeleton
primitives through
`scss/easyedu/_tokens.scss`, `scss/easyedu/components/_loading.scss` and
`scss/easyedu/components/_navigation-skeleton.scss`, plus their consumer
contract and durable coverage matrix. `tools/sync-easyedu-kit.ps1` is not
used. Administration/settings, functional Navigation, filters, pagination,
Send message, Guide, CCB, runtime and cache remain outside this consumer lot.

## Composition and lifecycle boundary

The existing server-rendered skeleton roots remain `aria-hidden` and now mark
the Navigation Skeleton composition with `data-easyedu-navigation-skeleton`.
No real control, navigation destination or meaningful copy is added. The
existing no-script reveal, AMD readiness, 320 ms Student Management handoff,
180 ms Mass Import handoff and their JavaScript fail-open paths are unchanged.
Mass Import additionally reveals its server-rendered content through a scoped
no-script stylesheet and does not emit server-side `aria-busy`; the classic
bootstrap still owns that state when JavaScript runs.

Student Management's large left/right loading panels and Mass Import's two
large loading regions compose `skeleton-structural-container-frame`, which
uses the K3.1 block-start accent. Student Management's search/filter shell and
participant/structure cards compose `skeleton-section-frame`, retaining the
logical `border-inline-start` card accent. The view selector has no Skeleton
frame or border. Each real Navigation view uses the K3.1 compact static
one-line frame, decorative Guide-start circle and one internal cue. Student
Management uses the overlay cue; Mass Import uses the direct cue. RTL sweep
reversal, reduced-motion and forced-colors behavior come from the embedded Kit
component rather than local overrides.

## Animated-surface measurement

The measurement counts server-rendered decorative cue elements that receive a
shimmer animation. It separately records large-frame animations, which must
remain zero.

| Surface | Before | After | Large-frame animations |
| --- | ---: | ---: | ---: |
| Student Management | 48 | 50 | 0 -> 0 |
| Mass Import | 19 | 21 | 0 -> 0 |

K3.1 adds two decorative navigation cues to each real Navigation view: one
circular Guide-start cue and one compact navigation cue. Student Management
therefore has 50 animated cues. Mass Import changes from five header cues plus
two cards with seven cues each (`5 + 2 x 7 = 19`) to 21 cues. The migration
does not animate a large frame or change loading geometry, readiness or
real-navigation behavior.

## K3 consumer coverage - 2026-08-27

The durable applicability inventory is recorded in
`docs/testing/skeleton-k3-coverage.md`. Student Management and Mass Import are
the only EasyStud product views that render the real shared
`easyedu_navigation` template, so both adopt the compact K3.1 composition.
Administration/settings and the Guide's internal dialog navigation do not
qualify as product real-navigation views and keep their existing contracts.

## Static validation and deferred review

Run `tools/release/test-navigation-skeleton-contract.ps1` to verify the
immutable snapshot reference, selective component import, decorative markup,
one-line frame/cue composition, two-level border distinction, borderless view
selector and the two surface-count formulae. Run the
official Sass build with `sass scss/easystud.scss styles.css --no-source-map`,
PHP lint for `index.php`, JavaScript syntax for the affected Playwright source
and `git diff --check`.

No runtime promotion, cache refresh, lease acquisition or browser execution
is implied by this source change. When separately authorised, the focused
`tools/playwright/navigation-skeleton-zoom.spec.js` scenario inspects both
views at 320 and 390 CSS px in LTR and RTL, with genuine Chromium 100% and
200% browser zoom. It asserts one cue row, compact-navigation height close to
real navigation, top accents only on structural containers, inline-start
accents only on internal cards, no toggle border and no focusable Skeleton
node. It also asserts the numeric document `scrollWidth` stays within
one CSS pixel of `clientWidth`, as well as Skeleton and frame containment. It
creates a new profile only below the supervised run's
external artifact directory and sets the per-host zoom preference before
launch; it does not send keyboard shortcuts or automate any existing desktop
browser window. Reduced-motion and forced-colors remain covered by the Kit
source contract and its canonical CSS media rules.

### Static record - 2026-08-10

The vendored component text was compared after line-ending normalization with
the immutable `c9277a82` source and matched exactly. The focused source
contract, the official `sass scss/easystud.scss styles.css --no-source-map`
build, PHP lint of `index.php`, `node --check` of
`tools/playwright/mass-import-audit.spec.js` and
`tools/playwright/navigation-skeleton-zoom.spec.js`, and `git diff --check`
pass.

The Sass build reports one existing mixed-declaration deprecation at
`scss/components/_layout.scss:129`, outside this lot's Skeleton hunks. No
Playwright process, browser, preview, cache, lease or runtime operation was
started.

### Containment follow-up - 2026-08-10

The Student Management compact Navigation-shaped frame now uses `border-box`
and a logical `max-inline-size: 100%`, so its decorative padding remains inside
the 320 px inline width. The focused scenario records numeric document widths
and fails when `scrollWidth` exceeds `clientWidth + 1`; it still checks both
LTR/RTL directions, native 100%/200% zoom, static large frames and animated
internal cues. Its native-200% capture is written before the containment
assertions, so a failing run retains the requested visual evidence without
weakening those assertions. The UI Kit snapshot and Mass Import consumer are
unchanged.

Hidden compact-only Structure placeholders are excluded from the root-boundary
measurement because their `display: none` rectangle is `0 x 0`; every rendered
frame and cue remains subject to the containment assertion.

At an effective CSS viewport below `20rem` (including native 200% zoom on a
320 px window), Student Management stacks its decorative fixed-width header
and panel cues. The large Navigation-shaped frames stay fully visible; this
consumer-only rule does not alter Mass Import, functional Navigation or the
UI Kit primitive.

Mass Import uses the same extreme-width cue stack for its loading header. At
that width, its decorative card-title cue may also shrink beside its static
icon, so the full card frame remains contained. Its normal desktop/phone
geometry is unchanged.

The Mass Import consumer also gives its Skeleton grid, cards and card headers
an explicit logical inline size. The grid retains its desktop `0.88fr`/`1.12fr`
ratio without fixed minimum tracks, while its responsive one-column rule stays
in place. Its full-width field and row cues use `border-box` and a logical
maximum width. This keeps the 200%-zoom visual coordinates of every rendered
cue within the Skeleton root without changing the shared loading primitive or
the final Mass Import layout.

At the same compact threshold, Mass Import alone reduces the fixed busy
spinner to `1.6rem`, removes its external shadow and aligns its bottom/end
offset with the localized `Loading in progress` label. This is action feedback,
not a Navigation Skeleton cue: the static frames and the 19 animated internal
cues are unchanged. The focused scenario exposes that local busy state and
writes one full-window 320 px LTR/native-200% capture before containment
assertions, while retaining the RTL matrix.

At an effective viewport of 20rem or less, Mass Import resolves the compact
Navigation Skeleton frame to its mobile K3.1 block size with `border-box`
sizing. This consumer-only guard keeps the one-line frame measurable next to
the compact real-navigation trigger at native 200% zoom; it does not alter the
shared Kit primitive, real navigation, lifecycle or cue composition.

Student Management applies the same resolved mobile K3.1 block size and
`border-box` sizing at that threshold. Both real-navigation consumers therefore
retain a measurable one-line decorative frame beside the compact trigger at
native 200% zoom, without changing the shared primitive, lifecycle or
functional navigation.

The containment probe measures the Navigation Skeleton's own client and scroll
width rather than its application root. This keeps the functional Navigation
overlay outside the Skeleton contract while document overflow remains checked
separately.

If a rendered cue exceeds that root, the focused scenario records the measured
root left/right bounds in its assertion message. The raw screenshot and
manifest remain external to Git.

When the supervised process supplies a Chromium executable, the scenario uses
it only with the external run profile. The profile writes Chromium's partitioned
per-host zoom preference before launch; it never changes an existing browser
profile or sends zoom shortcuts.
