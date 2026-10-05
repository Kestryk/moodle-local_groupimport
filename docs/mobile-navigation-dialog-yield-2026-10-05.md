# Mobile navigation continuation (SM-49)

Earlier SM27/SM47 evidence already established canonical Inter roles and a
native-course-links composition. SM51 observed the fixed launcher protruding
through the Participant modal's left edge; stacking below the dialog doesn't
necessarily suppress its paint through a semitransparent backdrop.

The read-only successor audits all rendered native drawer label/row fonts at
390/768/320 after fonts/Motion settle. It uses actual mobile Participant-eye
entry, records active aria-modal markers and launcher visibility, then closes
normally with focus return. It never follows destinations/opens Guide or writes
business data/fixtures. Correct type must not get a speculative override.

Source/Kit/Foundation policy for yielding to an actual modal, native baseline
and any successor remain OPEN. Shared Guide project/connection stays untouched.

Native audit PASS213952482Z-22356: all13 visible destination rows and their
actual label children use canonical EasyEdu Inter15/500, title16/600, white
opaque drawer at390/768/320. Actual mobile Participant-eye entry and Close
focus return work; zero errors/blocked requests/fixtures, all cleanup true.
Font complaint is not reproduced in this revision; don't add another override.
The native launcher remains visibly painted (44x44, layer1064) while the public
easyedu-modal-layer Participant dialog is open. Preserve that diagnostic.

The embedded Navigation composition differs substantially from the older
canonical Navigation module, including accepted trigger geometry and Guide
integration. Do not blanket-sync it to repair this issue. Modal primitives and
public dialog classes are identical canonical/embedded: an additive public
modal-yield-control can use the already present easyedu-modal-layer lifecycle
without editing Navigation/Guide controllers or redoing accepted Motion.
