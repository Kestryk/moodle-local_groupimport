# Mass Import Cancel palette and Groups view-switch scrolling

## Cancel uses the existing selection action

The preview footer Cancel link already has `foundation-selection-action`,
`btn-outline-secondary` and the tray-density modifier, just like the native
page-selection command. Keep that one Kit definition. The primary palette was
connected by the earlier selection-action work and the host-priority adapter;
do not add a footer-specific colour recipe or replace the existing geometry.

Use a real uploaded preview on the owned Moodle copy, never a confirmed import.
Measure the footer Cancel and the page-selection button with rows selected and
deselected at 1600/390 in English and French. Their computed text and border
must match `--easyedu-tone-primary-ink`; their heights must agree within 0.5px.
Cancel the preview and clean only the test's own draft upload files.

## One animation owns a desktop view reveal

Desktop workspace changes call `Motion.swap` on the layout. Their synchronous
pagination and pre-reveal hydration can also call `animateListArrival` for the
new Groups cards. That second animation starts at `translateY(6px)`. On a short
list whose scroller exactly fits its final content, the translated last card
temporarily increases scrollable height by six pixels and creates a scrollbar.

The desktop state mutation and its pre-reveal callback now share the existing
`withoutListArrival` scope, as the mobile view mutation already does. The view
fade remains enabled, including its existing timing and reduced/minimal policy.
Standalone pagination still owns its card arrival. No overflow style, maximum
height, business state or CSS recipe is changed.

## Regression evidence

Use the native frame diagnostic on courses with one group, a medium catalogue
and a long catalogue, at 1600/390, English/French, full/minimal motion. Arm the
bounded sampler on the actual toggle click and include the scrolling ancestors,
the two Groups lists, their direct card geometry and active animation frames.
Distinguish ordinary page scrolling from transient overflow of a Groups list.

The reproduced short-list baseline had `clientHeight=172`, `scrollHeight=178`
while its only card carried `translateY(6px)`, then settled to 172/172. After the
fix, Groups scrolling must remain 172/172 throughout the view transition. The
view animation must still run in full motion; mobile/minimal paths must remain
valid. Keep baseline JSON, source SHA and failed harness runs separately.

`tools/release/test-layout-swap-list-arrival.cjs` executes the production binding
and transition helpers to verify suppression during both hydration callbacks,
retained view animation, later pagination arrival and exception-safe restoration
of the scope. The source and compiled AMD must both be included in delivery.

## Recorded result

On the owned Moodle 5.1 copy, all 24 before/after cases completed: three course
sizes, two languages, two widths and full/minimal motion. The short course
reproduced a 6px transient list overflow in both desktop languages before the
change; every measured Groups list remained within its scroll box afterward.
The full desktop view fade remained observable, while minimal mode had none.
The native preview palette check passed eight cases (language, width, selection
state), measuring both controls at the primary Kit colour `rgb(15,108,191)` and
37.59375px height. No import was confirmed and no new palette rule was needed.

Security escaping, filter-engine and layout-arrival regression checks passed.
ESLint on the changed AMD source had zero errors and the same three pre-existing
promise warnings as its parent. Normalize only stdin line endings for that
check; preserve the working tree's required CRLF. No product PHP or SCSS changed.
Detailed frame JSON, immutable preliminary probes and runtime cleanup evidence
remain outside Git in the review artifacts.
