# Management workspace chrome

Measured workspace text colours are separate tokens: title #0f2f44,
description #49657a and panel title #12364d. The 2026-10-02 user-requested
quieter hierarchy supersedes the historic 30/23px title and 22px panel role:
workspace title is now 1.75rem (28px), narrow title 1.375rem (22px), and
panel title 1.25rem (20px). Description remains 16/13px. These are public
theme tokens, not a blanket reduction of every copy or control.

Emit `workspace.workspace-classes` from `easyedu/workspace-classes` after the
Foundation class API. The application root uses `easyedu-ui` for Inter.

The accepted Student Management desktop board
`92c1c225-95fb-802e-8008-ae9f13f14484` supplies the large workspace identity:
historically supplied a 30px/700 title, 14px eyebrow, 16px description; the
390px board `cef95197-06bc-809e-8008-aeeaa9e3ad0d` supplied 23px/12px/13px.
The current title roles are 28px/22px; other shell geometry is unchanged.
All dimensions are encoded in rem at 16px. This opt-in large workspace recipe
does not change the existing compact Mass Import/Administration title roles.

Use `easyedu-page-header` around identity and navigation. The identity contains
`easyedu-workspace-eyebrow`, `easyedu-workspace-title-control` (native Moodle
select-menu retained) and `easyedu-workspace-description`. The native title
dropdown keeps its accessible label, destinations and keyboard behavior.

`easyedu-workspace-panel` has a 4px semantic top rail, 14px radius, no shadow,
24px/20px desktop inner padding and 16px mobile padding. Its `--success`
modifier supplies the green rail. `easyedu-workspace-panel-title` is 20px/700.
Panel height, scroll area and focus-mode visibility remain consumer behavior.

## Validation contract

Check loaded Inter, 28px/22px native title, wrapping/containment at 390px,
18px identity-to-navigation gap, equal desktop panel heights, no panel shadow
and pagination placement. Preserve every existing card/action/data attribute.
This first slice does not certify card/filter/modal migration or full parity.

## Workspace controls

Emit `workspace-control-classes` after consumer layout/breakpoint adapters.
Native templates opt into `easyedu-search-field` on the real search label,
`easyedu-create-icon-button` on a labelled native submit button, and
`easyedu-workspace-view-switcher` on the existing view-toggle group. Secondary
create uses `easyedu-create-icon-button--secondary`; it never means Danger.

Search and creation fields share a 38px regular height, 14px Inter and 0.72rem
radius. Search keeps one wrapper border, a 14.4px icon and an unframed native
input; focus belongs to the wrapper. Responsive minimum is 2.65rem, preserving
the established touch field. The Create control is a square of matching height.
Its 8px corner radius and solid/outlined states reuse the existing Foundations
Card quick actions / Create family (`10fc9fee-0b8e-807e-8008-98e57f2f3d3c`),
not a newly invented action. Its centred 16px mask is the existing Control/plus painted path
(`32eadb6d-165e-803e-8008-988f531d61a4`), not a new glyph or font-baseline fix.
View labels are 12px; existing hit areas, selected skin, wrapping, destinations
and transition/disclosure Motion are not changed by this text role.

Card identities and related-person names use the softer existing palette role
#264861, retaining 14px/700 and 13px/600. Semantic rails/badges remain unchanged.
This colour passes 4.5:1 against white and the used pale selected surfaces;
theme overrides still require their own contrast check. No full-tree byte parity,
whole-view migration or human visual acceptance is implied by these opt-ins.
