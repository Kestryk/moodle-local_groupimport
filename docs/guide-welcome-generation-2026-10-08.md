# Guide welcome — server generation candidate

G10-G WIP, not connected to the page or served runtime yet. No preference is
written by the current preview. The invitation must remain desktop-only and
reuse shared Guide primitives, with a highlighted actual Guide launcher.

`classes/local/guide_welcome.php` owns one plugin configuration token and one
current-user preference. Showing or dismissing the invitation does not mean
the guide has been opened. Only an actual opening may acknowledge the token
rendered into that page. A stale browser must not acknowledge a newer reset.
Reset generates a new opaque token, requiring site configuration capability;
there is no mass SQL update or deletion of user preferences. A reset racing
with an old opening leaves the user eligible for the new generation.

Storage uses Moodle's native Preference API, rather than browser-local memory:
[Moodle user preference API](https://phpdoc.moodledev.io/main/d6/d91/group__core__user.html).
Production integration must add preference metadata/export in the Privacy
provider before activating writes. Current class is deliberately not invoked
by `manage.php`, an AJAX endpoint or the admin settings page yet.

Next integration gates:

- Foundations source-preserving desktop welcome composition, linked Guide and
  Admin examples, settled paint and saved readback.
- Shared engine actual-open lifecycle hook and opt-in desktop invitation.
  Do not use legacy `firstVisit` auto-opening; user chooses Open or dismiss.
- Moodle adapter: authenticated explicit POST, valid sesskey, current user only,
  no caller-supplied userid. Stale generation acknowledgement returns false.
- Admin reset: explicit confirmation, POST, sesskey, site configuration
  capability, bounded feedback. Do not reset on rendering a settings page.
- Privacy declaration/export and isolated Moodle PHPUnit tests.
- Approved native tests of reload, other-browser state, genuine opening,
  dismissed invitation, keyboard/reduced-motion and admin reset, with the user
  preference/configuration mutations separately recorded from course writes.

Verification performed: PHP syntax and isolated in-memory contract harness
`tools/release/test-guide-welcome-state.php` pass. The real Moodle candidate
`tests/guide_welcome_test.php` has not run: no PHPUnit installation in local
Moodle. These checks are not a rendered welcome, native preference or security
endpoint proof. Human checklist remains OPEN.

Foundations draft: ordinary480x140 composition on Library page, cloned and
detached only at the Resume root, retaining linked Small primary/neutral actions
at identical30.4px height. Copy uses existing Inter12.16 and actions12.48, no
new font. Settled painted copy fits448x46; both labels are centred in their
canonical button tracks. Exact IDs and open gates are recorded in
`docs/testing/guide-g10-g-welcome-draft-2026-10-08.json`. Editor raster inspected
at external `penpot/g10-g-welcome-20261008/foundations-welcome-desktop-draft.png`.
No Library publication, Standard/Product link, saved readback or native welcome
claim yet. The one partial empty host left by a read-only-width API error was
completed in place with documented `resize()`, not duplicated or discarded.

Successor canonical0.4.154 adds opt-in `welcomeOffer` and actual-open
`easyedu:guide-opened` notification, no server writes. Translated template fields
remain absent from product config, so this surface is not active. Isolated
actual built consumer passes EN/FR normal/reduced-motion480x140 geometry, paired
action heights, no automatic guide opening, no event on dismiss, event on actual
opening and responsive suppression1023/390. Header/completion/mobile label
regressions also pass. Foundations provider and Standard linked successor now
exist with identical settled paint; saved-server gate still separately pending.
