# Card headers with the Moodle course drawer

K23-36/G2/G3, 24 October 2026. A terminal count must follow the overflow trigger without leaving the available header. The title can shrink after direct actions have moved into overflow; the existing 7.5rem readability preference remains the overflow algorithm's threshold, not an unbreakable CSS minimum.

The canonical card-header-title-slot is layout only. dropdown-card-open-host releases clipping on the paginated list and intermediate workspace hosts only while an action menu is open. It does not change menu/control paint, target size, page scope or the paging algorithm.

Desktop view changes call the card overflow reconciliation inside Motion.swap's mutation before entry starts. The existing post-swap callback and ResizeObserver remain for external geometry changes. Do not retime Motion or defer the first reconciliation until after the new columns are visible.

Native evidence and replay: C:/dev/artifacts/k23-36-g2-g3-20261024/. The report separates K23-36's late movement, G2's menu clipping, and G3's fixed title minimum. Mobile native course drawers overlay the workspace: record that state separately and close the drawer through its own control before testing the covered plugin commands.

Candidate harness: tools/playwright/candidates/k23-36-drawer-card-headers.cjs. Set EASYSTUD_K23_36_OUTPUT to an absolute artifact directory outside Git before running. Requires the owned :8054 runtime, durable test account, course 71, standalone Playwright and Chrome headless. This is a focused native candidate, not a complete CI or human acceptance gate.
