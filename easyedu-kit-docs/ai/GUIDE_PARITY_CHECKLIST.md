# EasyEdu Guide Parity Checklist

Use this checklist whenever a plugin claims to use the EasyEdu guide kit or when
guide behaviour is ported from one plugin to another.

The goal is exact contract parity, not visual inspiration.

## Reference comparison rule

When a plugin says "make it like EasyEdu/EasyStud", compare all of these:

- DOM structure;
- CSS classes;
- SCSS mixins used;
- typography;
- spacing;
- button states;
- navigation card states;
- checklist states;
- highlight behaviour;
- keyboard navigation;
- reload persistence;
- sticky return panel behaviour.

Do not stop after matching colours or rough layout.

## Modal shell

- [ ] Launcher uses the EasyEdu guide launcher structure.
- [ ] Launcher icon and hit area match the kit.
- [ ] Modal width, height and min/max height use kit tokens.
- [ ] Header title uses kit typography.
- [ ] Header subtitle uses kit typography.
- [ ] Close button uses the kit close/action button primitive.
- [ ] Header map chips keep the same height, radius, icon size and arrow
      spacing.
- [ ] Modal body has the same top spacing above navigation cards as the
      reference.
- [ ] Modal footer has the same border, background, height and button alignment
      as the reference.

## Rich navigation rail

- [ ] Navigation cards use `.easyedu-guide-nav-item`.
- [ ] Active card styling matches the kit.
- [ ] Hover and focus-visible styling matches the kit.
- [ ] Guided-path cards use `has-guided-path`.
- [ ] Guided badge text is short, normally `Guide`.
- [ ] Guided badge never overflows card content.
- [ ] At desktop and compact widths, guided-path copy wraps inside the green
      card; the start action is never a competing third column or an overlap.
- [ ] Locked cards use `is-locked` but remain clickable.
- [ ] Locked cards use `cursor: pointer`, not `not-allowed`.
- [ ] Requirement badge text is one short word, not a sentence.
- [ ] Left/right nav arrows are positioned like the kit reference.
- [ ] Nav arrows disable at the beginning/end of the scroll range.
- [ ] Vertical wheel over the rail scrolls the horizontal rail.
- [ ] The native scrollbar is not visible.
- [ ] Active nav card stays in view after slide changes.

## Slide content

- [ ] Slide panel left accent matches the kit.
- [ ] Slide icon tile size, radius and colour match the kit.
- [ ] Slide title font family, weight, size and line height match the kit.
- [ ] Slide body text size and line height match the kit.
- [ ] "Show in the interface" button uses the kit action button style.
- [ ] "Show in the interface" icon, spacing and border radius match the kit.
- [ ] Show, start-path and footer navigation actions use the compact rounded
      guide variables rather than inheriting square Moodle button padding.
- [ ] Visual demo cards use the kit mini-card structure.
- [ ] Empty space below content is intentional and not caused by broken sizing.

## Footer and progress

- [ ] Footer progress text uses `Step X of Y`.
- [ ] Footer progress text sits next to Previous/Next, not isolated far away.
- [ ] Previous button disabled state matches the kit.
- [ ] Next button primary style matches the kit.
- [ ] Footer stays aligned when translated labels are longer.

## Show in interface and highlight

- [ ] Target is resolved by configured target key or selector.
- [ ] Guide modal closes while preserving the highlight.
- [ ] Highlight is `position: fixed` and viewport-anchored.
- [ ] Highlight remains aligned while scrolling.
- [ ] Highlight refreshes on scroll and resize.
- [ ] Highlight refreshes after Bootstrap modal open/close.
- [ ] Highlight refreshes after CSS transitions and animations.
- [ ] Highlight refreshes after relevant DOM mutations.
- [ ] Highlight responds to `easyedu:guide-refresh-highlight`.
- [ ] Highlighted target receives `is-easyedu-guide-highlight-target`.
- [ ] Checklist docks away from the highlighted target.
- [ ] Sticky return-to-guide card appears.
- [ ] Sticky return-to-guide card auto-hides according to kit behaviour.
- [ ] Auto-hiding the return-to-guide card also clears the highlight.
- [ ] Manually dismissing the return-to-guide card also clears the highlight.
- [ ] Opening the guide normally while a temporary return panel is active clears
      the old highlight.
- [ ] Return button reopens the guide without losing active slide context.
- [ ] Show-in-interface highlights are temporary and do not persist forever.

## Guided checklist

- [ ] Checklist uses `.easyedu-guide-checklist`.
- [ ] Checklist remains above Moodle modals when a step opens a modal.
- [ ] Minimized checklist title displays the active pending step.
- [ ] Minimized checklist subtitle displays visited count, for example
      `0/3 visited`.
- [ ] Completed steps show the kit completed state.
- [ ] Locked steps show the kit locked state.
- [ ] `requiresStep` disables dependent steps until prerequisite completion.
- [ ] Locked steps display an overlay named after the required previous step.
- [ ] `completeOnClick` waits for the real target click, not the checklist click.
- [ ] Every action-oriented step declares `completionMode`.
- [ ] `action`, `event` and `reload` steps stay pending when their checklist
      row is clicked.
- [ ] Business success dispatches `easyedu:guide-step-complete` with stable
      path and step identifiers.
- [ ] The final checklist confirmation appears immediately after the last real
      action completes.
- [ ] Steps can use `highlightTarget` when the visual target should differ from
      the action/completion target.
- [ ] Clicking a checklist step highlights `highlightTarget` when provided.
- [ ] Closing the checklist clears the active highlight.
- [ ] Returning from the checklist to the guide clears the active highlight.
- [ ] Checklist highlights auto-hide after a short delay.
- [ ] Auto-hiding a checklist highlight leaves the checklist panel visible.
- [ ] Checklist state persists across page reloads.
- [ ] Restored checklist opens on the same path and next expected step.

## Learning scenes

- [ ] Rich slides use kit-owned data-driven scenes rather than plugin-prefixed
      tutorial markup.
- [ ] Card detail, assignment, filters, paste, context menu, action flow,
      drag-and-drop and formula scenes retain their meaningful animation.
- [ ] Every animated scene has responsive and reduced-motion behaviour.
- [ ] Scene labels come from Moodle language strings.

## Locked slides and unlock paths

- [ ] Slides can declare `requires`.
- [ ] Missing requirement locks the nav card.
- [ ] Clicking a locked nav card opens the locked slide content.
- [ ] Next/Previous and keyboard navigation skip locked slides.
- [ ] Locked slide panel uses `.easyedu-guide-slide__locked`.
- [ ] Locked panel has no heavy shadow.
- [ ] Locked panel spacing below the slide title is comfortable.
- [ ] Locked panel shows `requirestitle`.
- [ ] Locked panel shows `requirescontent`.
- [ ] Locked panel offers a button for `unlockpath`.
- [ ] Unlock path has its own path name, separate from normal practice paths.
- [ ] Unlock checklist uses the alternate unlock styling.
- [ ] Unlock checklist title follows `Unlock: [slide name]` when relevant.

## Accessibility

- [ ] Keyboard navigation works with ArrowLeft, ArrowRight, Home, End and Escape.
- [ ] Arrow and horizontal rail movement follow RTL document direction.
- [ ] Opening the modal locks page scrolling and traps Tab/Shift+Tab focus.
- [ ] Normal close restores focus to the guide opener.
- [ ] Show-in-interface focuses the visible target rather than restoring the
      launcher.
- [ ] Guide controls are real buttons or links.
- [ ] Focus-visible state is visible.
- [ ] Disabled controls expose disabled state.
- [ ] Icon-only controls have accessible labels.
- [ ] Custom tooltips do not duplicate native `title` tooltips.
- [ ] No focus is trapped behind hidden modal content.
- [ ] Reusable guide roots do not share a fixed title ID.
- [ ] Checklist feedback uses a polite live region.
- [ ] Forced-colours mode preserves modal, panel and highlight boundaries.

## Responsive and lifecycle

- [ ] A compact navigation consumer portals the initialized Guide root outside
      any transformed drawer; its overlay is never a descendant of that
      drawer.
- [ ] A compact forwarding launcher may be cloned, but its style selector does
      not require the absent desktop Guide wrapper and no second Guide root is
      created.
- [ ] The fixed Guide modal has an explicit elevation above the compact drawer
      and the focused 390 px check proves the dialog owns its centre point.
- [ ] The consumer's launcher wrapper does not use `transform` or another
      containing-block rule around the fixed modal; if launcher and modal share
      a root, centre the launcher without transforming that root.
- [ ] The consumer's desktop launcher wrapper does not create a stacking
      context above Moodle-native dropdowns; the fixed modal retains its own
      explicit elevation.
- [ ] Narrow or short viewports use the bounded guide bottom sheet.
- [ ] Modal and floating panels respect viewport safe areas.
- [ ] Guided steps scroll independently while header, feedback and actions
      remain reachable.
- [ ] Hidden, zero-sized and detached targets are ignored.
- [ ] Removing the active target clears its highlight.
- [ ] Target mutation observation stays local to the active target subtree.
- [ ] `destroy()` removes listeners, observer, frames, timers and owned
      highlight, and releases the page scroll lock.
- [ ] Teardown preserves stored visitor progress.
- [ ] Reduced motion disables guide shell and highlight motion while preserving
      understandable state changes.

## Moodle integration

- [ ] The canonical controller, template and guide SCSS were reviewed as one
      atomic source set.
- [ ] Canonical, embedded and runtime copies were compared before writing.
- [ ] User-facing guide strings are in language files.
- [ ] Plugin target selectors are configured in plugin code, not hardcoded in
      the kit.
- [ ] Source/setup steps point to stable controls or wrappers, not empty tables
      that may not exist before configuration.
- [ ] Plugin-specific slide content remains in plugin data.
- [ ] Shared behaviour remains in the kit.
- [ ] AMD source/build artifacts are synchronized when the plugin ships builds.
- [ ] A direct AMD wrapper exports both `init` and `destroy`.
- [ ] Direct-wrapper conversion removes both named `export` keywords and
      `export default init`.
- [ ] The consumer module namespace is preserved in generated AMD output.
- [ ] SCSS is compiled after syncing the kit.
- [ ] The canonical source state and consumer runtime/version evidence are
      recorded.

## Final answer requirement

When this checklist is used, the final implementation report must say:

- which reference plugin/page was compared;
- which items were verified by code inspection;
- which items were verified visually;
- which items were not verified and why;
- whether any local plugin override remains and why it is not in the kit.
