# Filtered select-results scope — 2026-10-04

## Scope

SM-32 keeps pagination and filtering as independent states. “Select results”
may include matching entities on other pages, but never an entity explicitly
excluded by participant, catalogue, structure or grouping filters.

The implementation centralises the existing filter markers and adds the same
durable marker to grouping search/occupancy. Clearing a former global
selection, applying a filter and selecting again therefore targets the current
filtered result set only. When a filter is active, “Deselect results” also
clears selected entities of the same type that the filter has hidden; this
prevents a later “Select results” from reviving the former global scope. No
server command or membership mutation is part of this UI state transition.

## Evidence status

Consumer source and generated AMD remain to be built and checked. The managed
native sequence and human acceptance remain open in the combined checklist.
