# EasyStud filter-panel geometry plan

Status: complete. Automated Moodle 5.1 validation and human visual approval
were obtained on 2026-07-31. The previous implementation covered only the two
panels when both were open. The desktop composition now covers collapsed
and one-sided disclosure states across Participants, Groups and Groupings, and
the named AMD output has been regenerated officially.
Canonical batch: `EED-UI-2026-0001`.

## Product goal

Above `1024px`, paired filter/create surfaces in the three desktop views must
keep equal visible shell heights, aligned disclosure actions and aligned first
list/card baselines whether filters are absent, collapsed, or open on one or
both sides. At `1024px` and below, the existing three responsive workspaces
must keep natural, independent filter heights.

## Safe first slice

- Source boundaries: `scss/components/_layout.scss`,
  `scss/components/_structure.scss` and the existing disclosure-state code in
  `amd/src/course_manager.js`.
- Use grid/flex stretch, a vertical panel shell, a desktop-only inert
  collapsed slot and `margin-block-start: auto` for the More-filters row.
- Do not add fixed heights, JavaScript height synchronisation, absolute action
  positioning, overflow hiding or a new UI Kit primitive.
- Do not touch the concurrent skeleton, navigation, Mustache, AMD or generated
  `styles.css` work until ownership is explicitly reconciled.

## Implemented evidence protocol

`tools/playwright/filter-panel-geometry.spec.js` contains one exactly
discoverable test. It covers `1440x900`, `1280x600`, `1025x768`, `1024x768`,
`768x1024` and `390x844`, polling until three geometry samples are stable.
Above `1024px`, it compares the two visible shells and their actual disclosure
buttons with a maximum `2px` delta. At and below `1024px`, it follows the real
exclusive Participants and Groups workspaces and validates each active filter
shell independently, without imposing desktop height equality.

The scenario now additionally checks collapsed, participant-only-open,
group-only-open and both-open desktop states, the paired Structure cards and
their list baselines, plus the independent responsive Groupings workspace. It
also checks unclipped advanced content, natural trailing space,
viewport containment, horizontal document overflow, keyboard Space/Enter,
`aria-expanded`, visible keyboard focus, applicable 44px targets and scoped
WCAG 2.0/2.1/2.2 axe coverage. Static discovery selects exactly one test. Sass
source/generated parity, Moodle theme-cache purge and HTTP 200 served-asset
hash parity pass. The approved runner discovered exactly one test and created
manifested preflight run `easystud-authenticated-20260729T144713668Z-28360`.
After the protected bundle was restored, authenticated runs isolated the
`390x844` focus modality defect and two heading contrast failures. The test now
establishes keyboard modality with real Tab navigation, and the source-first
heading override reaches WCAG AA contrast. Final isolated-profile run
`easystud-authenticated-20260730T072344530Z-12792` passed the complete scenario
after the selective theme-cache purge. The cleaned final spec was then
revalidated in `easystud-authenticated-20260730T073616851Z-18448`; it passed
the same matrix including axe with no page or console error. Credentials were
cleared, the external profile was emptied and the final fixture lease was
released.

## 2026-07-30 regression correction

- Cause: the AMD disclosure controller applied the HTML `hidden` state to the
  advanced region. That removed the region from desktop grid sizing, so a
  one-sided open changed the shared row and pushed both lists downward.
- Correction: the controller now uses explicit per-disclosure root state with
  `inert` and `aria-hidden`. When paired desktop disclosures share a state,
  Grid stretch keeps the shells equal. When only one side opens, both shells
  keep their natural height while the shared row keeps the two lists aligned.
  The existing hidden Groupings control reserves the missing desktop action row
  without a hard-coded block size. At `1024px` and below, panels remain
  independent. No JavaScript dimension measurement, fixed height, absolute
  positioning or overflow clipping is used.
- The former fixed Structure-card minimum height is removed. The grid row now
  supplies equal paired heights and the group disclosure action uses the same
  bottom-aligned flex rule as the participant pair.
- Sass and Playwright-spec syntax checks pass. The active packaged Moodle 5.1
  checkout has no Grunt toolchain, so a minimal physical component was staged
  temporarily in the complete Moodle 5.1.3 builder. With Node `22.23.0`, the
  official targeted Rollup task generated the named
  `local_groupimport/course_manager` module and source map; only those two
  generated files were promoted and the temporary component was removed.
- Theme and JavaScript caches were purged under the fixture/cache leases.
  Initial run `easystud-authenticated-20260730T161613997Z-35624` was blocked by
  an unresponsive Apache worker pool, which later recovered without stopping
  MySQL. Diagnostic runs then exposed two viewport-coordinate false positives
  and the real missing no-filter action row; each run cleared credentials,
  stopped its owned child and released its fixture lease.
- Final authenticated run `easystud-authenticated-20260731T062742211Z-18444`
  selected exactly one test and passed in 37.7 seconds across all six widths,
  collapsed/one-sided/both-open desktop states, Structure, all three responsive
  workspaces, keyboard focus and axe. Nine external captures were manifested,
  no page or console error was recorded, the isolated profile was emptied and
  no lease remains active.
- After secondary QA identified that console/page errors were only logged, the
  scenario was hardened to assert an empty runtime-error list. Final strengthened
  run `easystud-authenticated-20260731T063258957Z-3548` passed the same exact
  one-test matrix in 27.9 seconds with nine captures, zero-byte stderr, no
  console/page error, an empty profile and a released lease.
- The user then identified that the instant disclosure state had removed the
  pre-existing open/close transition. `Motion.expand()` and `Motion.collapse()`
  are restored for advanced filters; collapse now retains the non-hidden final
  DOM state required by the alignment contract. The focused spec observes
  `is-easyedu-disclosing` for both directions in normal-motion mode. Final run
  `easystud-authenticated-20260731T073950091Z-13916` passed this strengthened
  single scenario with nine captures, no console/page error, an empty profile
  and no active lease.
- An earlier overly broad Rollup command modified 1,699 generated AMD entries
  in the external CCB validation lab. That lab is preserved as-is because its
  prior dirty baseline is unknown. The later targeted build removed its five
  temporary files, but four empty directories remain because directory
  deletion was refused by execution policy. The lab must be reviewed separately
  before cleanup.

## Compatibility contract

The active checkout is Moodle 5.1.3 and the plugin floor is Moodle 5.1. By
explicit user decision, this tranche is developed and validated only on
Moodle 5.1. The existing `moodle51-active-fixture-write` resource is the
correct lease family once ownership is acquired. Moodle 4.5, 5.2 and 5.3 are
deferred to the final compatibility phase. The broader coding guidance remains
tracked in the platform contract and official documentation:

- <https://moodledev.io/docs/4.5>
- <https://moodledev.io/docs/5.1>
- <https://moodledev.io/docs/5.2>
- <https://moodledev.io/docs/5.3>
- <https://moodledev.io/general/development/policies/codingstyle>

The current implementation report must state the declared floor and exact
Moodle 5.1 runtime executed. It records 4.5, 5.2 and 5.3 as deferred without
running or claiming them now.

The concrete Moodle 4.5-5.3 rules applied to this slice are:

- keep `version.php` as the compatibility source of truth and do not change
  the Moodle floor for a CSS or test shortcut;
- use Moodle APIs, capabilities, contexts, sesskeys and language strings if
  the change expands beyond SCSS;
- keep Mustache/HTML semantic and keyboard-operable, with disclosure ARIA and
  focus state synchronised;
- edit SCSS before generated `styles.css`, keep it theme-overridable and
  preserve focus/reduced-motion behavior;
- do not introduce JavaScript height synchronisation for the independent
  filter panels; keep existing AMD only where the compatibility floor requires
  it and rebuild generated outputs from source;
- report the declared floor separately from the exact Moodle 5.1 runtime
  executed, and defer Moodle 4.5, 5.2 and 5.3 compatibility until the final
  phase.

## Documentation and release rules

The SCSS source, generated CSS/AMD, changelog and scenario registry contain the
implementation, passing automated evidence and the 2026-07-31 human visual
approval. The focused form-token correction is synchronized with the canonical
UI Kit and the embedded Forms/AI contracts; CCB does not contain the affected
mixin.

Do not commit, push, reset, clean, stash, merge or rebase the current dirty
worktree without explicit user approval.
