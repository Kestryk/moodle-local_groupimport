# Shared Small search density

Every actual search frame uses the existing Small field-peer scale: 30.4px on
desktop, 44px through 1024px. Creation/rename text inputs already use that scale.
The standard XS/S/M/L/XL text-field defaults remain unchanged.

The canonical Kit `search-field-peer-small-frame` supplies only block geometry.
It preserves existing inline size, inline padding, type, placeholder, focus,
disabled paint and icon/label structure. The input fills the border-box frame's
content height. Search Cancel commands use `field-peer-small-action`, sharing
`field-peer-small-size` with icon peers and the creation inputs. Consumer SCSS
only maps existing Cancel selectors to this mixin.

Coverage includes the Participants and Groups column searches, both Structure
searches, ungrouped/grouping group searches, dynamic group-member searches,
all searchable-choice popups (More filters, destinations and Administration),
Mass Import's preview filter and real input specimens in both Guides. Decorative
loupes or historical drawings without an input are not interactive search fields.
The old narrow-card and captioned variants remain compatible, with auto-sized
outer grids and the same field height. No placeholder or width rewrite is needed.

Native acceptance: FR/EN at 1600/768/390, each served search context, before/after
outer frame height, width, native placeholder, type, icon containment and vertical
centre; match each adjacent Cancel/Create peer. Preserve the approximately 613px
Participants search width at 1600. Do not certify a hidden ancestor with a zero
rectangle: activate the relevant native view/disclosure first. Explicitly record
presentation probes separately for conditional markup unavailable in fixture data.

Use both rebuilt page CSS and Guide CSS when testing: Guide styles also emit
shared search rules. A candidate appended over old styles cannot prove that a
removed high-specificity declaration is absent in the final deployment. Disable
only the plugin's served stylesheets and substitute the complete baseline or
candidate set in the owned browser; preserve Moodle/theme styles. This browser
substitution does not modify runtime files or publish a deployment.

The canonical `scripts/test-peer-small-fields.cjs` also verifies 20 paired
controls and 25 historical heights at 1600/1025/1024/768/390. Preserve its strict
caption/field/button bottom-edge assertions and the exact 1024px touch boundary.

The Mass Import Guide preview illustration previously grew to 256px on mobile:
its 16rem flex-basis became a block-axis basis inside the toolbar's column flow.
The shared search frame constrains its maximum block size to the same height
token, preserving its inline width. Captioned outer grids explicitly remain
auto-sized and unconstrained. Preserve the failing native evidence and recheck
FR/EN at all three widths after this shared correction.

The opt-in class easyedu-field-peer-small applies the same action density to
existing Kit button families, including the Mass Import preview's Select this
page command and its Guide illustration. Their selection palette, type and
wrapping remain owned by the original button. Import/Cancel footer commands
without an adjacent search are not resized. The native before/after probe
adopts exactly this additional template class in the owned browser, alongside
the compiled candidate styles; it does not deploy files to the runtime.
