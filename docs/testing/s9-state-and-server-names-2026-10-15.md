# S9 names, browser state and PHP page, 15 October

Claude d8594b8e was integrated as5678fd58 and servedf45e2885 with purge.
It makes build() send plain formatted group/grouping names to the browser,
which already escapes them once. Its new PHPUnit case is preserved. PHP lint
and the35module escaping check pass. PHPUnit executable/configuration are absent
in both the main Moodle checkout and the named build checkout; PHPUnit was not run.

The requested page_data() audit finds the same double-escaping path: name uses
format_string() with default escaping, group/filter builders pass it unchanged,
and manage.mustache uses escaped fields for grouping headers and option labels.
The pre-ready server markup and filter choices can therefore display entities.

The consumer now adapts the lean state in manage.php using a lib.php helper.
It reformats the existing rawname with the course context and escape=false,
then leaves the existing escaped Mustache fields intact. No entity decoding,
unescaped template field, new template variable or manual reserved-source edit.
All other state fields and the raw name are retained. Existing format filters
remain active and actual tags are stripped by Moodle.

Read-only renderer recipe covers QA ampersand/angle brackets/quotes, a literal
entity string, and actual bold markup. It uses the real manage and group-card
templates, checks DOM text and absence of injected elements, and creates no
course/group/grouping. The first source-path attempt stopped before rendering
because Moodle had already loaded the runtime lib; preserve that failed script
and log. The served successor loads only the runtime lib. Native result pending.

N2 relay after service: replay only S9 including tooltip and unchanged CSV,
strict T0201600/1920, MI root16px, eye390/768 and responsive animations with reduced
motion fades. Neighbouring badge heights on all three cards are measured within1px
as requested; do not silently restyle cards awaiting Kevin's Penpot choice.
This PHP recipe does not certify the browser/CSV business fixture.

## Served verification

Consumer320d05fa served14b895d0, purgePASS. Native082404228Z-49956 PASS:
three cases through actual Moodle manage/group-card templates, plain context,
DOM group/grouping names and all relevant options match; literal entity text
is preserved, actual bold markup stripped, no injected element. No business
record or configuration was written. This is server renderer proof under the
managed principal-runtime lease, not a browser fixture/tooltip/CSV proof.
Source-path preflight failure is retained in test-server-name-escaping.php and
external temp/s9-server-renderer-source-20261015.log. The successor uses the
served lib only. PHP lint passes; PHPUnit remains not run for the stated reason.

All Complement3 items and the limited N2 replay list are in
codex1-before-v2-complement3-2026-10-15.md and the durable corpus relay. No N2
acknowledgement or run result is asserted. K15-16/17/20/21/24 remain blocked on
Kevin's Penpot choice, irrespective of the earlier approved layout-only fixes.
