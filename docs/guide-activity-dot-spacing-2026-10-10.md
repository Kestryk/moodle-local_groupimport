# R10-28 activity-dot spacing: candidate

Source baseline504269b, Kitd266408; existing worktrees only. No preview change.

The shared activity uses4px dots and3px gaps,1.35s vertical bounce with
0/180/360ms delays. Prepare three explicit grid lanes instead of flex children,
with zero internal padding/margins and border-box dot sizing. No timing,
keyframes, templates, Guide lifecycle or playback commands change. This is a
spacing-hardening candidate, not a claim that flex itself reproduced the report.

test-guide-activity-dot-source.cjs passes full unrelated CSS and complete
controller/template/content preservation. test-guide-activity-dot-layout.cjs
checks playing/paused/reduced/disabled at three widths and seven animation
phases, equal horizontal gaps, sizes and actual staggered vertical paint.
The flex parent's inline-grid child computes to grid (CSS blockification).
Animated rectangle arithmetic has subpixel floating differences around4px;
use0.0001px precision tolerance, not a loose visual threshold.

Guide board72 retains two dot triads named Activity dot /1..3. Editor audit
finds3px ellipses with3px gaps, diverging from native4px dot recipe. Exact
IDs desktop e764db89-4cb1-80d0-8008-c26ab25fcb74/75 and
e764db89-4cb1-80d0-8008-c26ab2601aa4; compact
e764db89-4cb1-80d0-8008-c26ab63f9089/8a and
e764db89-4cb1-80d0-8008-c26ab63fdc0b. Do not repaint independently before
checking the active/paused Foundation Reading banner source and paired copies.

Waiting for requested Foundations connection. Next is exact source/Standard
dot inventory and reconciliation, product propagation, then native pause/
completion/spacing proof. Human checklist and all other Guide lots remain open.

## Foundation source resolution

Foundations is reconnected. The four Active/Paused Desktop/Phone providers
already have4px dots and3px gaps. No source redesign or timing change is needed.
The3px discrepancy is on the retained product copies only. Source roots:
4ee6f77a-1dfb-809b-8008-c1ed889a5627 /c1ed88b6c44a and
e764db89-4cb1-80d0-8008-c25a8178bef6 /c25a819ee4bb.
The candidate's12 playing/paused/reduced/disabled cases pass at three widths,
sampling seven animation phases with unchanged timings. Source preservation
gate passes. Paired saved publication and product/native proof remain separate.

The eight source/Standard triads pass read-saved-guide-activity-dots.cjs:
three4px circles with3px gaps, no Foundation source edit. Guide board72's two
owned stale triads are corrected to the same recipe, preserving each triad's
centre and vertical centre. No unrelated children or banner size is changed.
Native candidate guide-activity-dots-native.spec.js selects one test, samples
the real Add illustration while playing, pauses through its native control,
and checks departure cleanup. Product saved readback passes for both owned
triads. The desktop editor raster was inspected: three evenly spaced circles
remain on the reading line, with the existing controls and banner preserved.
Evidence is external and manifested under guide-activity-dots-20261010.
This scoped raster is not a whole-page or mobile visual certification.
Served-native playback/pause proof remains pending.
