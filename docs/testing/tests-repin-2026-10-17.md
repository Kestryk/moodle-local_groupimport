# Tests repin — 2026-10-17
Base 05a84c57. No product files changed.

P2 test: optional argv[4] is the archived legacy module reference (default
4110785e). Compile the current entry with that module substituted at the current
workspace-shared slot, then compare active rules to the current entry. Compare
current generated SM rules to current SCSS, rather than to a historical page CSS
changed intentionally by K16-01. No current unrelated rule is excluded from parity.
Keep legacy selector exclusion and removal-size threshold. The shared target binder
must remain, but its whole file is no longer required to match the old revision:
P2 JS cleanup is now authorized. PASS 10 assertions, 4135 current active rules.

Pills: syncTagWindow is a policy descriptor, not a renderer. Exercise it through
actual syncParticipantTagOverflow from cards.js. Preserve first-value, exact +N,
22px, titles, no clipping, one-line collapsed, expansion/reduction and View-all
assertions. Correct fixture root/meta classes and native hidden utility (Moodle's
Bootstrap CSS is absent in a standalone document). PASS 16 cases at 1600/1280/
768/390, counts 1/6/15/31; zero page errors. Isolated browser only: no Moodle URL,
login, service, database, screenshots or runtime. This does not certify deferred
server details opening. Old failure logs retained outside Git in C:/dev/artifacts.
No historical test was removed; no production expectation was weakened.
