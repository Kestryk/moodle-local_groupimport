# Fixed-control modal yield (SM-49)

`modal-yield-control` / `easyedu-modal-yield-control` opts into hiding a fixed
control while an active shared blocking dialog owns the viewport. The public
selector uses existing `easyedu-modal-layer` or `easyedu-message-dialog` roots
with aria-modal=true and excludes hidden/aria-hidden=true. Closed dialogs must
never suppress navigation. Keep actual dialog ARIA/hidden lifecycle accurate.

No control size, paint skin, font, focus command, controller or Motion is changed.
The Navigation template adds only this shared role to its compact trigger.
Other fixed controls opt in explicitly; this is not a blanket overlay repaint.

EasyStud's native 390/768/320 baseline certifies all13 drawer labels Inter15/500
but still paints its trigger through the Participant modal backdrop. Existing
embedded Navigation differs from the older canonical tree: preserve it, sync
only identical modal/dialog modules and the one template class. Guide project,
connection and handlers remain independently owned. Native Message/Guide and
other optional dialog journeys are separate from Participant-only proof.
