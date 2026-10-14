# T058 inline / T059 mobile — principal integration

Kevin requests two Codex2 lots published together, with the open FR cells
completed in the same native pass. Source commits remain separate:

| Original | Source | Scope |
| --- | --- | --- |
| 02b33d15 | 5b00aa34 | Six inline panels: owned Escape/Cancel and focus return; keyboard transfer evidence |
| 7f655884 | ee17b0de | Registry of sixteen already measured mobile dialog cases, no new product paint |

02b33d15 source JavaScript merged cleanly over F7, K14/K15 and SM-RENDU.
Work stopped on the review intake and generated AMD conflicts. Kevin explicitly
approved the prepared resolution for both lots: preserve every Source proof,
add targeted T058/T059 statuses/records, retain all CHANGELOG entries, rebuild
Course Manager from the merged source using the existing Moodle toolchain.
T059 then conflicted only in CHANGELOG. Global nativeVerified/humanAccepted
flags in the review intake remain false; incoming Perf proofs keep their scope.

Course Manager rebuild, ES-module/AMD parsing and the 11-case R10-23 regression
gate pass. Product diff is exactly the imported T058 helper and two inline
functions: no business/local-sm/service/POST/sesskey change, no new CSS/template
paint or Moodle5-only API. Earlier d96c3b05 proof is included in publication.

One supervised principal test:
tools/playwright/inline-mobile-f7-principal-native.spec.js,
grep "Principal T058 T059 and remaining FR cells". First finish the three
F7 cells (FR/legacy390, reactive1280/390): views, mobile menus, pagination,
actual selection/clear/focus and no horizontal page overflow. Clear the real
selection left by opening a card menu before the checkbox transition.

Then adapt the imported final T058 recipe to principal course5: six Group/
Grouping Search/Add/rename panels at1280, normal/reduced Motion, both modes,
initial focus, document Tab order, Escape/Cancel and actual opener return.
Keyboard alternatives use Space selection and native Move for Participant,
Group and Member, nested chooser Escape, Tab/Space destination, confirmation
focus and closure without submission. T059 smoke measures Move, populated-
group Confirmation and Group/Grouping settings at768/390 in both modes,
native and temporary long title separately. No candidate CSS is injected.
Previous Reset/Message/Rollback principal gates run afterwards. Existing
History only; no new fixture/import/rollback/message/membership write.

K16 mobile internal Grouping Search remains a reserved Course Manager fix
for Claude (docs/k16-mobile-grouping-search-2026-10-14.md). Record the genuine
missing command and Reset38px, without forcing hidden controls or claiming
mobile Reset/Cancel parity. Neither current incoming commit implements it.

Claude propagation list: six inline panels and keyboard transfer recipe,
Student Management, initial focus/document Tab/Escape/Cancel/return,1280
normal/reduced in both modes. No new paint recipe. T059 is registry-only:
existing dialog recipe and its768/390 native/long-title states, two modes.
Shared Penpot propagation, Kevin acceptance, full EN/contrast and Moodle4.5
native remain separate. No new F7 performance benchmark is claimed.

Next priority: A-CHECKLIST, then A3V3 with T033 violet#72508C Groups without
grouping underline, then T043/44/46/47/48, A-ADMIN-CONTROLES, A-FLUIDITE,
R10-26, A-PARCOURS-10, R10-02/14/15/21+K17. Mass Import R10-06/T025/T026/K22
and K21 transfer to Codex2. Integrate Claude's on-demand-only commit when its
explicit hash arrives; do not remove legacy or guess that future commit now.
