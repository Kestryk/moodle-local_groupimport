# Guide navigation pointer focus

Clicking a navigation pill can focus it before the pointer is released. The
focus reveal added by G10 centered every focused pill, moving it away from the
press coordinates. The release then hit another pill and Chromium delivered
the click to their common navigation ancestor. The slide did not change even
though the navigation scrolled.

Keep that reveal for focus without a matching pointer press. A navigation-local
pointer origin is consumed by the corresponding focus event and released on
document pointerup or pointercancel, including release outside the navigation.
The click still uses the original delegated activation; arrows, wheel scrolling,
Motion policy and non-pointer focus reveal retain their existing behavior.

The same navigation binding is maintained in canonical Kit, embedded Kit and
the Moodle adapter. Run the focused source contract with:

```text
node tools/release/test-guide-nav-pointer-focus.cjs <canonical-kit-root>
```

Native evidence uses actual pointer press/release coordinates, not programmatic
button clicks. The initial paint hit must be the intended pill. Record capture
events, scroll position and active slide after each click. Cover active and
inactive pills at 1600/768/390, then verify both arrow directions and a focused
offscreen pill without activating it. No course mutation or Guide completion
is required.

Baseline 98a270a4 reproduced 12 failures in 36 clicks: 3/12 at 1600, 3/12 at
768, 6/12 at 390. The separate existing full Guide sync has fourteen drifted
files before this change; do not overwrite unrelated Guide features to repair
that historical drift. The focused contract verifies exact shared navigation
binding parity independently.

The corrected native run passes 72 pointer clicks across English and French,
12 arrow checks and 6 focus-reveal checks, with no console or HTTP errors.
The final executable AMD is identical to the tested build. The focused contract,
security escaping and filter engine checks pass. Existing full Guide gates keep
their baseline failures; the full PHP MoodleCS scan has the same 135 errors and
32 warnings on the base and candidate, with no PHP changes in this lot. Engine
ESLint diagnostics are unchanged (36 errors for the Moodle adapter, 34 for the
canonical engine); the new regression contract has zero errors and warnings.
