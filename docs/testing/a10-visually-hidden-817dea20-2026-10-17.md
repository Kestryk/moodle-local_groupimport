# A10 visually-hidden after accepted817dea20 parity

This successor replaces the WIP conclusions on5fbdb52e. The consumer branch
starts at the parity evidence successor40df01bf; the canonical branch starts
at3e1d3a8, which already contains the original public recipe from4c27185.
The actual hidden-text recipe and its page scopes are unchanged froma4552fff.
No force-push/rewrite of those older branches is required.

The private Guide implementation is not redesigned. The canonical reports now
include the five accepted Guide/bubble commits exactly from the consumer; the
source Guide engine, embedded mirror, templates and existing shared Guide
partials remain unchanged. The existing private Guide helper is outside this
new public utility's call path and is retained, not a second implementation of
the newly exposed .visually-hidden class.

One new public Kit mixin defines the9declarations. The consumer owns only the
page scopes under Student Management, Mass Import, administration and the Guide
root. Each page sheet gains exactly one announced rule; ordered pre-existing
selectors/declarations/priorities/at-rule ancestry remain identical after
excluding that exact rule. The global sheet is byte-identical,0rules. All51
shared SCSS files, including the public forwarder/recipe, match the canonical
candidate after Git line-ending normalization. Full parity is required by the
successor test; the former diagnostic allowance is not used to claim a PASS.

Node22.11.0/Sass1.79.1 conservative build PASS. T03717,T03849, exact roundtrip
6Guide/3bubbleexports/3modules/7SCSS/7templates and current Light recipe12values/
3pagecascades PASS. The original stale Light oracle is preserved by the parity
predecessor and no accepted Light value changes. Eight fresh offline headless
cases test all4hosts with/without equivalent theme CSS:1x1px,cliprect,visible
DOM,retained description linkage. No native assistive-technology assertion.

No PHP touched. Official local_codechecker supported non-PHP13files0errors/
0warnings. The two changed/new active JS proof scripts have MoodleESLint0/0;
the archived predecessor is historical evidence, not an active new JS module.
No dependency upgrade, protected frontend/controller/PHP/template edit or
runtime publication. Visual scope is limited to correctly hiding the existing
accessible description nodes on themes lacking the utility. The accepted
card/Guide values, states, widths, Motion and focus remain unchanged.

For Penpot: one accessibility utility in the Kit; no visible control/component
design, recipe geometry, screen composition or responsive breakpoint changes.
Human acceptance and native4.5installation/reader testing remain separate.
Evidence: <workspace>/artifacts/a10-hidden-817dea20-20261017/.
