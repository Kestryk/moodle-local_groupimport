# Participant card default disclosure

The PHP renderer already passes `participantcardcollapsed` as the boolean
`metacollapsedbydefault`. The participant model must use it until an explicit
user display choice sets `metaExpandedOverride`. Automatic compact layout above
five participants is a layout policy, not a replacement for the admin default.

An explicit desktop compact choice stores `false` (collapsed); full information
stores `true`. Subsequent card renders and pagination reuse that choice. A new
page model returns to the configured default. Mobile retains its separate
membership-only compact policy. No participant cache, permissions, saved user
preferences or animation timing changes.

Run `node tools/release/test-participant-collapse-default.cjs` after changing
participant disclosure or density policy: 24 cases execute the actual production
policy/setter across both automatic densities, admin values and manual choices.
Also run `test-participant-density-final-height.cjs` (18 Motion/layout cases) and
`test-security-escaping.cjs`. Build and byte-check all AMD modules using
`build-amd-official.cjs` and the installed Moodle toolchain.

Native acceptance: on an exclusively leased test runtime, back up the admin
setting, set 1 then 0, purge caches each time and load a course with more than
five participants. Check the real hidden/painted metadata state. Toggle full and
compact information, paginate and confirm the manual choice persists. Restore
the original setting and deployed files before releasing the lease. Test fixtures
must not change course memberships.
