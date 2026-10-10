# Guide tooltip audit and non-visual extraction - R10-32

The served palette successor remainsc129230. This successor starts the tooltip
lot; it does not change navigation, shared Guide engine or rendered paint.

## Verified ownership and divergences

- Canonical tooltip-surface and popover-surface own existing dark gradient,
  border, glow, arrow and typography. Long-copy overrides were still written in
  the plugin scss/components/_tooltips.scss, with11.36px/470 type and28rem limit.
- Move those exact declarations into opt-in popover-long-copy in the canonical
  Kit, then include it from the consumer. Complete emitted CSS is byte-identical
  after normalized line endings, using the existing Sass toolchain.
- Whole-module equality initially fails because the embedded file has earlier
  contextual-help-control/focus additions absent from this canonical branch.
  Preserve those additions. The bounded successor compares the new recipe
  exactly and verifies all other canonical recipes against Kit88d6473;
  it does not claim whole-module synchronization or authorize a downgrade.
- Guide navigation titles use ellipsis. Actual navigation template currently
  has no tooltip attribute. The existing workspace hover-popover listener is
  rooted on the workspace; it cannot provide a reliable Guide body-portal or
  browser-fullscreen tooltip. No native title is added as a substitute.
- Foundations Dark Long provider3ade82ad-bce8-8059-8008-9bf93fcbb129 has main
  3ade82ad-bce8-8059-8008-9bf93f808cb4,304x68. Dark Single-line provider
  8a2f9f7d-feb6-80ca-8008-9b9a13e3af70 has main
  8a2f9f7d-feb6-80ca-8008-9b9a138ab5db,224x48. Both painted text settings
  report Inter12.16px/700/1.35; this differs from the actual popover body recipe
  12.16px/540/1.38. API inventory is not saved/raster parity.

## Next bounded steps

Reconcile source/Standard tooltip states in Foundations before introducing a
Guide-specific public usage. Preserve the existing gradient identity and all
legacy default recipes; use an explicit opt-in if a new density is needed.
Then add canonical Guide hover/keyboard tooltip lifecycle, not a workspace
listener fork: viewport containment, correct arrow position, modal/fullscreen
ownership, close/navigation/scroll/Escape cleanup and destroy/reinit are required.
Never put an inaccessible primary label solely in a tooltip or duplicate native
title. Touch behavior and fully readable mobile labels need independent proof.

Current extraction source guard is test-tooltip-extraction-source.cjs, pinned
to Source952b466. Foundation publication, built behavior, Guide integration,
native tooltip matrix and human acceptance remain open. Previous palette and
explanation proof pins remain unchanged.
