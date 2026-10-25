# EasyStud accessibility protocol

## Scope

EasyStud targets WCAG 2.2 Level AA for UI owned by `local_groupimport`.
Automated checks deliberately target plugin regions rather than the whole
Moodle page so core navigation, the active theme, browser extensions and
third-party blocks do not create unrelated findings.

Primary regions:

- Simplified student management: `#local-groupimport-easystud`
- Mass import: `#local-groupimport-import`
- Plugin dialogs: the visible EasyStud modal contained by either region

Automated axe checks complement, but do not replace, keyboard, focus, contrast
and assistive-technology review.

## Automated layers

### Playwright and axe

The first JavaScript smoke is:

```powershell
cd tools/playwright
npm ci
$env:EASYEDU_MOODLE_URL = 'http://localhost/local/groupimport/manage.php?id=5'
$env:EASYEDU_MOODLE_USERNAME = 'Admin'
$env:EASYEDU_MOODLE_PASSWORD = '<local test password>'
npx playwright test accessibility-smoke.spec.js
```

The spec:

- authenticates only against the configured local test site;
- waits for EasyStud boot to finish;
- analyses only `#local-groupimport-easystud`;
- reports all axe findings;
- fails on critical or serious violations;
- checks desktop and mobile workspaces without changing Moodle data.

The test is an explicit smoke command. It must remain optional until a
deterministic authenticated course fixture is created in the platform matrix.
Credentials must never be committed or passed through public workflow inputs.

### Moodle Behat

The preferred long-term accessibility gate is:

```bash
moodle-plugin-ci behat --profile chrome \
  --suite=local_groupimport \
  --tags=@local_groupimport&&@accessibility
```

`tests/behat/accessibility.feature` creates its course, teacher, participant,
group and grouping through Moodle data generators. It opens EasyStud through
the Moodle Participants navigation and runs axe against the plugin region with
Moodle's `best-practice` extra tests.

Promote this scenario to a required gate only after it passes repeatedly on the
supported Moodle matrix.

## Axe exclusions

No axe rule is excluded in the initial protocol.

If a Moodle core or theme issue is found:

1. confirm that the failing node is outside the plugin region;
2. narrow the included selector before disabling a rule;
3. if a rule must be disabled, document the rule ID, affected Moodle versions,
   upstream issue and removal condition here;
4. never exclude a rule only to make CI green.

## Keyboard protocol

Complete these checks on desktop at 100% and 200% browser zoom:

1. Reach the plugin navigation, view switcher, filters and list controls with
   `Tab` and `Shift+Tab`.
2. Open and close each modal with the keyboard. Focus enters the dialog,
   remains trapped, and returns to the trigger on close.
3. Select participant, group, grouping and group-member checkboxes with
   `Space`.
4. Use `Ctrl` or `Shift` selection where supported and verify selection type
   exclusivity.
5. Open context menus through the documented keyboard alternative.
6. Complete participant-to-group and group-to-grouping moves through action
   buttons and destination modals without drag and drop.
7. Operate pagination, Select all/Select results, sort controls and advanced
   filters.
8. Open the guide, navigate slides, start a guided path, minimise and close the
   checklist, and return to the guide.
9. Verify every focused control has a visible focus indicator that is not
   clipped by overflow.
10. In a Grouping containing a Group with at least three members, collapse the
    member list and verify that `Tab` bypasses every clipped member action. On
    opening, verify those actions are keyboard-reachable again. If an action
    had focus when the list closes, focus must return to that list's disclosure
    button.

### Focused member-list containment scenario

`member-list-focus-containment.spec.js` is the narrow Moodle 5.1 regression
for this disclosure. It is read-only: it opens and closes a Grouping and a
member list, but does not select, remove or change any membership data. The
supervised runner first proves exactly one selected test, then takes the shared
runtime lease and writes its isolated profile, capture and manifest outside
Git. The scenario also proves the existing normal-motion disclosure state while
opening and closing the list.

```powershell
.\tools\playwright\Invoke-EasyStudPlaywrightWithSavedCredentials.ps1 `
    -CredentialLoaderPath $loader `
    -OrchestrationModulePath $orchestration `
    -Spec 'member-list-focus-containment.spec.js' `
    -Grep 'collapsed nested group members stay out of keyboard focus and restore on open' `
    -WaitForLease
```

## Touch and responsive protocol

At widths 390, 768 and 1024 pixels:

- controls have an effective touch target of at least 44 by 44 CSS pixels;
- mobile entity workspaces replace side-by-side columns where required;
- long press opens a persistent context menu after the finger is released;
- the action tray remains reachable and does not cover the selected card;
- no operation depends only on drag and drop;
- zoom and text resizing do not introduce horizontal page scrolling.

## Visual and semantic checks

- Selection state is conveyed by checkbox state and accessible attributes, not
  colour alone.
- Empty, filtered-empty, loading, success and destructive states include text.
- Participant images have useful alternatives or are correctly decorative.
- Count badges do not replace an accessible object label.
- Generated controls have names from Moodle language strings.
- Tooltips are supplemental; required instructions remain available without
  hover.
- Contrast is reviewed in default, hover, focus, selected, disabled and
  drop-target states.

## Evidence

For a release candidate, retain:

- command and Moodle version;
- axe JSON or console output;
- viewport and theme used;
- manual keyboard checklist result;
- any exclusion with owner and expiry condition.
