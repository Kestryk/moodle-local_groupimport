# K20-18 — one measured Full details disclosure

The participant density controller is the owner of this correction. The shared
Motion engine, card renderer, templates, CSS, filter state and long-list policy
are unchanged.

## Cause

On desktop, compact cards hide metadata. Full details removed the compact class
inside `Motion.swap`, then scheduled the responsive refresh. Its deferred tag
overflow pass ran after Motion had already measured the list with every tag
visible. The resulting target was too tall. Repagination also replaced existing
cards after measurement. Density deliberately changes desktop page size from
20 compact cards to 15 full cards; this existing policy must remain intact.

## Correction

Inside the existing Motion mutation, synchronise pagination and then tag
overflow after applying density, before Motion reads the natural target
height. Request the existing responsive refresh with `pagination: false` to
avoid a second pagination pass. Retain all other
refresh work, the existing full/reduced/minimal policy and the same animation.
There is no timer, replacement rendering path or Motion API addition.

## Reproduction and evidence

Allocated copy: `http://localhost:8052`, course 71, English and French. Never the
main localhost runtime. Raw measurements, immutable failed harness runs and
screenshots are outside Git in `C:/dev/artifacts/k20-18-20261021/`.

The desktop baseline records a 7,525.58 px animation target against a settled
2,679.25 px list: 4,846.33 px excess. Ordinary participant cards briefly reach
369.75 px before settling at 159.75 px (210 px overshoot). The first harness
incorrectly retained detached card references; its live-node successor preserves
the same reproduction while measuring replacement nodes correctly. The first
mobile harness opened an unrelated navigation drawer over the real density
proxy; its timeout is retained and is not product acceptance evidence.

The focused controller test executes the actual density handler in 18 cases:
desktop/mobile, three Motion levels, open/close/reopen. It asserts that the
target and density-specific page size are final before Motion measurement;
deferred work neither repaginates nor changes height. Native frame sampling,
console checks and the bilingual
shared audit are recorded separately in the external delivery report.

## Commands

Use the pinned Node 22.11.0 binary to execute:

```text
node tools/release/test-participant-density-final-height.cjs
node tools/release/test-mobile-participant-memberships.cjs
node tools/release/test-security-escaping.cjs
node tools/release/test-filter-engine.cjs
node tools/release/build-sm-amd.js C:/dev/moodle51-build-501
node tools/release/build-course-manager-amd.js C:/dev/moodle51-build-501/node_modules
node tools/release/test-participant-density-native.cjs <allocated pool URL> <Playwright module> <admin secret file> <new absolute output directory>
```

The native candidate covers course 71 in FR/EN at 1600/390, asserts one height
animation and monotonic progress, samples actual live card nodes, and preserves
the desktop 20/15-card policy. It requires normal Motion, read-only data and an
already owned pool lease. Reduced/minimal handler behaviour has isolated tests;
the native matrix does not claim separate reduced/minimal visual acceptance.

No canonical Kit synchronisation is required: neither Motion nor a Kit
component, style, template or shared API changes. M3-1 remains untouched.

## Completed acceptance

- Native FR/EN ×1600/390: eight open/close transitions, one height animation per
  transition; target-to-settled difference below0.005px, no visible reversal.
- Ordinary participant overshoot:210px before,0px after (rounding noise below
  0.001px). Desktop page size still20compact /15full; mobile15.
- Local tag expansion/closure, selected-participant disclosure and Group member
  disclosure pass on the same copy;0console errors.
- Shared conformity audit:FR/EN at1600/768/390,0failures. See the external
  audit JSON paths in the delivery report.
- MoodleCS:0PHP errors /27pre-existing warnings. Changed controller ESLint:
  0errors /1warning both before and after. No PHP changes.
- The historical long-list browser oracle fails on both base and candidate at
  `assert(row.closed.titles)`: it expects native title attributes replaced by
  the accepted Kit bubble. Its assertions remain unchanged.
- The existing intake JSON is invalid on the base at line1759. It is unchanged;
  this bounded lot is recorded in CHANGELOG, this report and the review status.
