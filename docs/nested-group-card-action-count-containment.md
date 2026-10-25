# EED-UI-2026-0027 — Nested Group card action/count containment

## Scope

At responsive widths of 320, 390, 400 and 768 px, an action trigger injected into
the header of a Group nested inside a Grouping has a dedicated touch-target
lane. The member-count badge remains visible before that lane.

The correction is consumer-local to the responsive nested Group header. Its
action lane is reserved only by the affected header, never by a Grouping card
that contains child Groups. This keeps the full nested-card width available
without changing the card box, member-count content, actions menu, Grouping
rail or disclosure Motion.

At 320, 390 and 400 px, the nested card can be narrower than the count badge and the
compact action touch target combined. The action therefore joins the header's
existing wrapping flow at those widths. Grouping and member-count badges are
also hidden there so names and essential actions remain usable; 768 px retains
the established horizontal badge-before-action layout.
At those compact widths, Grouping search, add-group and rename shortcuts also
move behind the existing compact card menu so the Grouping name is not reduced
to an unusable fragment.

The visible checkbox squares are centred on their corresponding Grouping and
Group title lines. The nested Group action trigger uses that same centre line.
At 320 and 390 px, where the nested action participates in the header flow,
the nested Group selector receives its compact-line alignment separately from
wider responsive cards. Its internal right gutter and title typography are
reduced only enough to preserve the full Group name; card dimensions and the
identity rail are not changed. The padded participant rows use border-box sizing
at their existing responsive width, so they stay within the Group card rather
than extending beyond its right edge.

## Validation

`tools/playwright/nested-group-card-action-count.spec.js` records the Group
card, visible checkbox square, title, member-count badge, participant rows and
action-trigger rectangles at 320, 390, 400, 768 and 1280 px.
It requires both compact count badges to be hidden at 320, 390 and 400 px, keeps the
trigger inside the Group card and rejects horizontal document overflow. At 768
px it requires the badge to remain visible and at least 4 px before the action
trigger. It also requires the compact Grouping secondary shortcuts to be hidden,
the checkbox/action centres to match their title line within 2 px, every visible
participant row to stay inside the Group card, and the nested Group name to fit
without any text-overflow tolerance at 320, 390 and 400 px.
The responsive menu assertion targets Moodle's visible shared context menu:
the nested Group sub-menu is deliberately desktop-only, while the compact
trigger opens the existing card context menu. The scenario closes that modal
surface through Escape before continuing to the next viewport, which works for
both responsive and desktop menu presentations.
It also opens the existing menu to preserve its route and capture evidence.

## EED-UI-2026-0028-B expanded-menu stacking

When a nested Group's member disclosure is expanded, the card retains its
existing elevated layer so that the desktop More-actions menu paints above the
revealed participant rows and adjacent cards. The normal expanded-card layer
remains in effect when that menu is closed. This is a consumer SCSS precedence
fix only: the menu stays owned by its existing header, and no action, focus,
keyboard, Escape, outside-click, disclosure, RTL or responsive behavior is
redirected or reimplemented.

`tools/playwright/group-expanded-menu-stack.spec.js` opens the actual member
disclosure and existing desktop More-actions control at 1280 px, records a
review capture, and asserts the open-card stack, menu visibility and retained
expanded state before exercising the existing Escape route. The companion
`tools/release/test-group-expanded-menu-stack-contract.ps1` rejects a source
change that would restore the precedence conflict or alter this scenario's
required open-state checks.

Runtime and visual validation are intentionally not executed until this
candidate is committed and pushed.

## Planned follow-up

After this production fix, redesign the compact Group card inside a Grouping
and the distinct compact Group card in the Groups view. The member list needs a
separate small-viewport presentation focused on readable participant rows,
rather than adding more controls to the current card header.
