# Guide welcome — server generation candidate

Current successor: source wiring is served at runtime dc76075. Native welcome
failed in runs202747658Z-53756 and203022143Z-55920 before acknowledgement:
eligibility true, invitation hidden, no errors/writes. Diagnostic confirms the
launcher is visible after readiness but the one-shot init had occurred while
the loading shell hid it. Canonical0.4.157 now observes only launcher ancestry
attributes/size for at most30s, disconnecting on visibility/open/close/destroy.
EN/FR normal/reduced built consumer delayed-visibility tests pass. Corrected
native successor203632655Z-34796 passes at75311dd. Actual first acknowledgement
and reload belong to previous203306236Z-52108 (which failed later on admin).
Successor verifies already-seen reload, request rejection, paired admin actions,
Cancel preserving state and phone suppression. No global reset confirmed.
Historical paragraphs retain earlier states.
`guide_welcome.php` requires POST, login, course management permission and sesskey;
it accepts no user id. `amd/src/guide_welcome.js` qualifies the owned root's real
opening, coalesces pending requests and aborts on teardown. It does not control
Guide paint or Motion. Failures leave the guide usable and retry on a later
opening. Server eligibility/translated fields are supplied by `manage.php`.

`reset_guide_welcome.php` renders confirmation on GET. Only confirmed POST with
valid sesskey and site configuration capability rotates the generation. Cancel
returns to settings without changes. Its Mustache calls only public Kit classes;
opt-in body padding is canonical0.4.155, with unchanged header/caption/paired
actions. Admin settings link to confirmation, never reset while rendering.
Privacy provider declares and exports the preference through Moodle's API;
Moodle core remains the owner of preference deletion.

The built-adapter lifecycle harness and server in-memory/state/static wiring
checks pass. Native candidate `tools/playwright/guide-welcome-native.spec.js`
is local-supervised: may acknowledge only the current QA user's guide-seen
preference, checks reload, rejects GET/invalid sesskey and opens/cancels admin
confirmation. It never confirms global reset or edits a course. Source retained
for future supervised CI adaptation; Platform registry-owner update pending.

The standalone reset page explicitly calls `easyedu-ui--standalone` (Kit0.4.156)
to seed canonical defaults without an unrelated workspace parent. Normal
`easyedu-ui` still inherits custom product colours. Only the exact new token-
scope hunk is transferred; an unrelated pre-existing filter-track-focus class
in the Kit is not silently copied by this batch. Actual Mustache reset layout
passes EN/FR1280/768/390: equal action heights,20px body padding, expected primary
paint, contained long copy. Guide linked first-visit saved gate passes1 root/7
visible descendants; settled raster inspected. Admin Penpot reset composition,
native welcome and human gates remain distinct/open.

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
