# First-row touch selection anchor

Kit0.4.118 adds card-selection-first-row-anchor(content-padding,first-row-height).
It centres the existing touch target on the measured header row rather than
total card height. Pass original composition parameters; no private offset,
breakpoint, title lane, paint, card size or Motion is owned by this recipe.

Default card-selection-header-anchor remains0.3rem. The consumer full responsive
Participant uses0.45rem/0.72rem content padding and1.85rem persistent action row.
Public source/paired layout/isolated/native/human gates remain distinct.
