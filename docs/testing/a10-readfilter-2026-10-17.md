# A10: spreadsheet read filter signature

Base5fbdb52e. The only production change is classes/local/import_reader.php.
readCell accepts untyped parameters, matching the older4.5interface while
remaining a valid wider implementation of the typed5.1/5.3interfaces. It retains
the bool return. Values are validated before column conversion: a1–3letter
column, integer or decimal-digit row, and string worksheet. Rows are cast only
after validation; row0/negative/overflow and columns past the existing64column
limit fail closed and set the original overflow signal. No import/security
limit is increased, no invalid cell is silently admitted. Native valid reader
inputs preserve their prior result; invalid broad-interface inputs now reject.

The standalone compatibility test extracts the actual anonymous filter, not a
reimplemented method, and declares it against each caller-supplied real library
interface. It requires the real Coordinate class and plugin constants without
Moodle config/bootstrap. Tests pass on local4.5.11,5.1and5.3library interfaces:
19cases each including upper bounds and malformed values. Existing real-XLSX
S6(39checks) and R9(21checks) tests pass with both4.5and5.1libraries.
These isolated library proofs do not certify an installed Moodle4.5site.

PHP lint PASS; official local_codechecker/MoodleCS for the touched PHP0errors,
0warnings; official non-PHP13supported files0/0. New JS harness MoodleESLint0/0.
No frontend path, protected source, template, dependency, version requirement or
generated asset changes. No build, runtime access or localhost publication.

Run the dedicated test with absolute PHP, external output directory, followed
by at least two absolute Moodle lib source directories. No hard-coded frontend
module names are introduced. Evidence: <workspace>/artifacts/a10-readfilter-20261017/.
