# P2 JS retirement
Base 05a84c57. User expressly authorized this previously reserved cleanup.
Remove bindTutorialModal and its private header-offset helper, unused imports,
orchestrator import/call, and legacy-only navigation portal/close selectors.
Current shared targets, tutorial:* target identifiers and payload translations are
retained: those historical names are live shared-Guide contracts, not old markup.

PASS 17 source/AMD assertions: exact shared-target/compact-move function bodies,
exact orchestrator and navigation reconstruction allowing only the stated removals,
unchanged templates/PHP/current Guide source/CSS, callable compiled shared export,
absence of compiled legacy call, and execution of baseline binder proving it
returned after the shared-root check. Removed Guide module source: 40835 bytes.
Build SM and CM PASS in this source worktree; only guide/navigation/orchestrator
AMD and maps change. ESLint no-unused-vars on Guide PASS. T037/T038, security
escaping, filter engine and 12 real Mustache parity assertions PASS.
No runtime/browser/MariaDB/Apache/publication. No new visual choice or style change.
This closes the reserved JS dependency from the preceding P2 delivery. Residual
unused selector fragments/legacy translation names are not mechanically purged;
those are optional stylesheet archaeology, outside this JS-only lot.
