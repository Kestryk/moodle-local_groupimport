# EasyEdu UI Implementation Checklist

Use this checklist for every UI task in EasyEdu plugins.

## 1. Discovery

- [ ] Confirm the target repository and Moodle version.
- [ ] Run `git status --short --branch`.
- [ ] Read `ai/MOODLE_PLUGIN_RULES.md` when the target is a Moodle plugin.
- [ ] Inspect existing kit docs and component matrix.
- [ ] Read any matching plugin mapping in `docs/examples/` before copying UI
      between EasyEdu plugins.
- [ ] Identify matching components/tokens/mixins.
- [ ] Read the component's "Import Audit Checklist" when it exists.
- [ ] Identify missing kit behaviour before touching the plugin.
- [ ] On mobile, verify one entity workspace is visible, touch targets meet the
  shared minimum, and long press and explicit menu buttons resolve identical actions.
- [ ] When another plugin is the visual reference, capture computed styles and
      perform an inverse audit before recreating its appearance.

## 2. Kit-first decision

- [ ] Reuse existing kit component exactly when available.
- [ ] If the target behaviour is missing, add it to the kit first.
- [ ] Document the component contract in `docs/components/`.
- [ ] Add or update the component import checklist when the behaviour is easy
      to misimplement across plugins.
- [ ] Update `ai/COMPONENT_CONTRACT.md` for fragile or high-value behaviours.
- [ ] Update `CHANGELOG.md`.

## 3. Plugin integration

- [ ] Copy/sync only the required kit parts into the plugin.
- [ ] Keep plugin-specific selectors and data in the plugin.
- [ ] Keep shared style/interaction rules in the kit.
- [ ] Avoid local overrides unless they are explicitly documented as plugin
      context adaptations.
- [ ] Preserve ids, `data-*`, DOM order, draggable rows and modal interaction
      classes while adopting visual surfaces.
- [ ] Keep overflow and sticky offsets plugin-owned unless the component
      contract explicitly owns them.
- [ ] For each rendered EasyStud view with real navigation, use the compact K3
      Navigation Skeleton as decorative markup only; retain the real navigation,
      lifecycle, `aria-busy`, no-script and fail-open contracts unchanged.
- [ ] Use the K3 logical `border-inline-start` Skeleton accent rather than a
  physical or top-border accent; preserve native RTL behaviour.
- [ ] Use K3.1 `skeleton-structural-container-frame` only for a large
      left/right region; internal cards retain `border-inline-start` and a
      view toggle/selector receives no Skeleton border.
- [ ] Every real Navigation Skeleton has one compact cue line, one decorative
      Guide circle and no focusable descendant.
- [ ] For top admin navigation, use `admin-primary-nav`; keep labels on one
      line and do not restyle the guide launcher as a nav action.
- [ ] Keep the direct guide wrapper first in the admin navigation DOM so the
      kit can anchor it at the far start edge with the CCB reference behaviour.
- [ ] When top navigation actions must remain centred independently of the
      left guide launcher, use `easyedu-admin-primary-nav--balanced` and wrap
      actions in `easyedu-admin-primary-nav__actions`.
- [ ] For in-view status/toggle actions, use `admin-secondary-actions`, not the
      primary navigation component.
- [ ] Give every icon-plus-label action an explicit `gap`; never depend on icon
      font whitespace or concatenate an icon directly with text.
- [ ] Use `admin-form-actions` for final settings buttons, with separation from
      the preceding setting and Moodle-style right alignment on desktop.
- [ ] Use `segmented-choice` instead of raw radios for mutually exclusive
      strategies that need explanatory text.
- [ ] Keep segmented choices as a native `fieldset`/`legend` radio group and
      use the compact variant only in genuinely dense settings or filters.
- [ ] Map administration headings and labels to EasyEdu typography roles instead
      of copying local font sizes or weights.
- [ ] Keep user-configurable preview/final content outside shared administration
      typography.
- [ ] For paired Slideshow administration cards, use the shared card/grid/body
      layout mixins instead of fixed heights or stretched coloured sections.
- [ ] Anchor Slideshow editor/reset actions with `slideshow-action-zone` and
      keep all input names, ids, modal targets and event handlers plugin-owned.
- [ ] Validate checked, unchecked, focus and disabled Slideshow toggle states.

## 4. Guide-specific checklist

- [ ] If visual parity is requested, complete `ai/GUIDE_PARITY_CHECKLIST.md`.
- [ ] Use the kit guide highlight engine, not a local selector implementation.
- [ ] Use viewport-fixed highlights.
- [ ] Use `easyedu:guide-refresh-highlight` after UI transitions.
- [ ] Keep return-to-guide panel behaviour from the kit.
- [ ] Keep locked slides and unlock paths using the kit contract.
- [ ] Avoid long badges in navigation cards.
- [ ] Put explanations in locked slide content, not in compact badges.

## 5. Validation

- [ ] Compile SCSS.
- [ ] Check JS syntax.
- [ ] Run the Navigation Skeleton source contract when its template, cues,
      token snapshot or coverage matrix changes.
- [ ] Run `git diff --check`.
- [ ] Run `.\scripts\audit-kit.ps1 -FailOnNewWarning` in the kit when kit files
      changed.
- [ ] Run plugin PHP lint where plugin files changed.
- [ ] Run `.\scripts\audit-moodle-rules.ps1 -PluginRoot <plugin>` for Moodle
      plugins when practical.
- [ ] If asked or necessary, use browser/headless checks for visual parity.
- [ ] Confirm production packages exclude AI/docs/test-only files where needed.
- [ ] For dedicated mobile entity views, confirm desktop parent containers are
      hidden and each entity is rendered through one flat catalogue only.
- [ ] For off-canvas plugin navigation, test close button, backdrop, Escape,
      focus return, safe areas and preservation of native Moodle navigation.

## 6. Final report

Report:

- files changed in the kit;
- files changed in plugins;
- verification commands;
- what remains intentionally not tested;
- whether the kit was committed/pushed.
# Responsive compact workspace

- [ ] Identity rails keep the canonical width at every responsive breakpoint.
- [ ] Every mobile card has exactly one canonical action-grip trigger.
- [ ] Filter panels are truly hidden when closed and animate independently.
- [ ] Mobile-only filters remain absent at desktop breakpoints, including when
      a desktop focus mode is active.
- [ ] Card-menu observers are idempotent and preserve the approved menu icon.
- [ ] Mobile navigation groups plugin tools and native Moodle links with the
      same accessible navigation-link treatment.
- [ ] Reset is visible only for an active scope and closes that scope.
- [ ] Mobile navigation exposes plugin tools and all native Moodle links.
- [ ] Guide launch remains available beside the navigation trigger.
- [ ] Back to top respects safe areas and other sticky surfaces.
## Responsive parity checks

- [ ] Desktop navigation remains visible and unchanged above the breakpoint.
- [ ] Compact drawer destinations use action-row styling, not raw link styling.
- [ ] Card terminal actions remain aligned without covering identity content.
- [ ] Filters, top pagination and first cards share the same compact rhythm.
- [ ] Non-draggable hover feedback is absent on touch and reduced-motion paths.
- [ ] More-filters text and chevron form one button with synchronized
      `aria-expanded`, `hidden` content and a 44px touch target.
- [ ] Wide desktop filter bars return to a compact visual control below the
      breakpoint without shrinking the touch target.
- [ ] Paired filter surfaces have equal collapsed heights but independent
      disclosure state and measured expansion.
- [ ] Card-menu hover/open feedback affects only its inner visual surface while
      focus-visible encloses the complete touch target.
- [ ] Terminal card actions keep the same position before and after details
      expand.
- [ ] Compact views hide only explicitly owned entity regions and preserve data
      required by shared actions.
