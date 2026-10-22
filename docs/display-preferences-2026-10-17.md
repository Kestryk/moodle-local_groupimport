# Personal display and animation preferences (ANIM / G1)

Decision: Kevin K17-05, 17 October 2026, validation 1. Reference: EasyStud
Penpot Product views03z and the five `PENPOT-S8-G1-*` captures dated 16 October.
No Penpot document is changed by this implementation.

The desktop tab rail exposes a Direct icon control with a hover/focus tooltip.
The responsive navigation drawer, Guide footer and guided-path footer expose
the same Display and animations command. The window uses native modal focus
isolation, the T045 Kit header/Close/action families and a scrollable body.
The Guide remains open behind the window. Escape or Cancel discards the pending
selection and restores the opener; Escape does not also close the Guide.

The three radio cards are Complete, Reduced and Minimal. Save uses Moodle's
`core_user/repository.setUserPreference('easyedu_motion_level', value)` for the
current user. Saving changes the shared Motion level immediately, then closes
the window. A failed save keeps the window open with a localized alert and the
previous effective policy. Repeated initial clicks share one rendering promise.
Returning to the institution default selects `default`; Save is still required.
The radio checked while following the default represents the effective level;
the reset button's pressed state communicates that the default is selected.

`classes/local/motion.php::apply_to_page()` initializes the controller with the
admin default and raw personal preference. The existing M1 resolver remains the
only server authority: personal full/reduced/minimal precedes admin `motionlevel`,
with the legacy fallback; the system preference is ignored by default. Existing
preference declarations, upgrade migration and privacy provider are reused.
No preference, role or capability is added.

## Kit and design follow-up

`scss/easyedu/_preferences-classes.scss` is the single embedded Kit definition
for the new radio-card and preference-window composition. It composes existing
Direct icon, Guide utility, typography, focus, tooltip, dialog and button recipes.
The Foundation class entry point emits it for all three page CSS bundles.
There is no product-local visual override. The Guide utility selector also
covers the existing Guide portal outside `.easyedu-ui`.

The canonical external Kit owner must incorporate this additive module and its
class entry point. Penpot should retain G1 composition and catalogue the reusable
radio-choice, recommendation and native preference-window variants. This source
delivery does not claim saved external Kit/Penpot parity or human acceptance.

## Build and verification

Use Node 22 and the existing pinned toolchain:

```text
node tools/release/build-display-preferences-amd.cjs TOOLCHAIN/node_modules
node tools/release/build-styles.cjs SASS styles.css conservative TOOLCHAIN/node_modules/postcss
node tools/release/build-page-styles.cjs SASS TOOLCHAIN/node_modules/postcss
node tools/release/test-display-preferences-browser.cjs PLAYWRIGHT EXTERNAL_ARTIFACT_ROOT PHP CHROME
```

The isolated browser proof executes the generated Motion and preference AMD,
the real localized template and built CSS, with a bounded mocked repository.
FR/EN at 1600, 768 and 390 px cover Save at all levels, reset, Cancel, failure,
Escape, focus return and containment while the OS requests reduced motion.
It certifies controller and layout behavior, not native Moodle persistence.

`tools/playwright/display-preferences-native.cjs` is a proposed local-supervised
scenario. Arguments are Playwright, external artifact root, owned pool URL,
test-user secret path and Chrome. Acquire the first free 8052/8054/8055 atomic
directory lease before syncing or invoking it. It uses only course 71 and the
synthetic user, checks FR/EN at the same widths, the three persisted levels,
reset/cancel, reload and Guide nesting, then restores the user's starting choice.
The script does not own or acquire the runtime lease; its caller must release it.
Registration in the shared scenario registry belongs to the Platform owner.

Proof artifacts are external under the ANIM run directory. A retained failed
login selector predecessor distinguishes harness corrections from product fixes.
MoodleCS covers the touched PHP/lang files, PHP lint and ESLint cover source,
and the existing generated Motion, escaping and filter tests remain required.

## Final proof — 17 October 2026

Native Moodle 5.1 pool8054: FR/EN ×1600/768/390, six cases PASS, zero console errors. The synthetic user’s initial preference was restored. All three values persist and apply immediately; default reset, unsaved Escape, real reload and nested Guide Escape pass. Six isolated cases also pass, including failed Save and explicit selection of the already checked default-level radio.

Measured footer glyph centres: max horizontal 0 px, vertical 0.046875 px; heights [37.59375] px with zero peer difference; horizontal overflow0 px. Radio controls20×20 px and inner dots10×10 px in all six isolated cases. The public Kit label role supplies the optical1 px correction; no product-local offset is added.

PHP lint, escaping, filter engine and generated Motion contracts PASS. MoodleCS:0 errors, one pre-existing MOODLE_INTERNAL warning in motion.php; normalized-stdin Moodle ESLint:0 errors/0 warnings. CRLF source files are preserved. Earlier login auto-wait, glyph-offset and checked-radio failures remain separate external predecessor evidence. No assertion threshold was relaxed.

Source proof: `docs/testing/display-preferences-2026-10-17.json`; external screenshots/logs under `<workspace>/artifacts/easystud-anim-20261017`. Native footer measurements do not certify every existing Kit glyph in unrelated controls. Human acceptance and external canonical Kit/Penpot updates remain open.
