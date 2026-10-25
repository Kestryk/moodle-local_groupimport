# EED-UI-2026-0030 - EasyStud global controls and pagination parity

## Consumer scope

This batch covers every rendered EasyStud surface that owns these controls:

- Simplified Student Management: Participants, Complete view, Groups and
  groupings, and the three compact entity workspaces;
- Mass Import, whose upper navigation already consumes
  `easyedu.admin-primary-nav-action`;
- Administration settings, whose Moodle form actions already consume
  `easyedu.admin-form-actions`.

The source inventory found four dynamic Student Management list owners:
Participants, Groups in Complete view, Groups in Structure view, and
Groupings in Structure view. They all render page controls through
`amd/src/course_manager.js` and the shared `data-easystud-page-*` attributes.

## Delivered consumer changes

- Top panel action buttons now reuse `easyedu.action-button(small)` rather
  than maintaining a separate content-alignment rule. The shared primitive
  retains icon/text centring for disabled states.
- `Groups without grouping` retains its disclosure button, ARIA state and
  child list, but adopts the surrounding Group-section identity rail, surface,
  border radius and shadow.
- Paginated lists receive a local structural marker and use a column flow only
  inside their existing content block. Bottom pagination uses the remaining
  block space; it is never fixed to the viewport.

## EED-KIT-2026-0001 integration

The published, pushed Kit contract is
`6dec8785262d9b006feeb21ea313949ef8fac01c` (base
`f5aa5f72df80d8ae2a2b00c9628fcffadc5e7f56`). This consumer imports only its
two pagination primitives: `pagination-arrow-button` and
`pagination-content-centre`, plus their application inside
`pagination-controls`.

The Kit contract applies the compact arrows to the existing
`data-easystud-page-first`, `data-easystud-page-prev`,
`data-easystud-page-next` and `data-easystud-page-last` hooks. EasyStud keeps
its markup, JavaScript page state, labels and keyboard semantics; no fallback
primitive or copied Kit bundle is introduced.

## Documentation and validation boundary

The focused source-owned scenario is
`global-controls-pagination.spec.js` / `EED-UI-2026-0030 global controls,
ungrouped disclosure and pagination parity`. It records explicit desktop and
390 px mobile review captures, checks enabled/disabled top-action centring,
the Complete-view ungrouped surface/disclosure, all four pagination owners,
bottom-of-block placement and compact arrow keyboard focus. It is retained as
a candidate for a separately authorised authenticated run; this QA commit
does not execute a browser, acquire a lease, mutate fixtures or refresh cache.

No repository-wide agent-rule change is required: the existing component and
documentation contracts already require shared button and pagination
primitives. This document records the specific dependency rather than creating
a competing local rule. No runtime, cache, lease, fixture or browser activity
belongs to this source-only batch.
