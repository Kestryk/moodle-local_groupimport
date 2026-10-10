# Source-member guided path - 10 October 2026

Programme EED-UI-2026-0073, G11-E. Source scope from clean6087be5 in the existing
worktree. Writer proposal `reorganise-source-members` is integrated as a distinct
optional path, not a replacement for global Participant assignment.

## Scope

Four EN/FR milestones appear on the existing Organisation lesson through the
canonical guided-card recipe. No new style/template/Kit component or Penpot
family. Reading IDs, twelve-slide order, migration mappings, archived curriculum
and all four existing path definitions remain unchanged. Existing shared
Foundations composition is reused; final content slides need not be duplicated.

| Step | Real target | Completion source |
| --- | --- | --- |
| Select source members | Native member checkboxes in the Groups catalogue | Existing selection refresh, after action enablement/proxy rendering |
| Open member Move | Native selected-members toolbar or responsive proxy | Real typed member dialog opening with selected Group/User pairs and destinations |
| Choose destination | Canonical searchable choice in member-context dialog | Authoritative select change to a different existing group |
| Confirm move | Native member-context confirmation button | Only the existing successful guarded `movemembers` response |

The shared completion guard is parameterized with two named native wrappers.
It still rejects hidden checklists, disconnected workspaces, wrong path,
out-of-order/disabled milestones. No broad drag/copy/create signal completes a
member exercise. Native transaction payload, snapshot deduplication, cache/error
handling, commands and accepted Motion are unchanged. Guide never submits Move.

The opener reveals the Groups workspace and uses the existing member disclosure.
It does not reset filters, auto-select members or create course data. Re-entering
an already-active desktop Groups workspace avoids an unnecessary mode reset.
Previous-step review closes only a member-context Move dialog with its native
exit; another dialog context is preserved. Prerequisites are explicitly stated:
an existing member and a different destination group. Empty courses cannot
complete the path, and the Guide does not fabricate or clean up exercises.

## Validation and limits

`test-guide-source-member-path.cjs <php>`: PASS actual EN/FR four-step data,
unchanged original paths/reading IDs, exact unrelated native source/PHP/strings,
guarded signals and unchanged canonical presentation/CSS/engine.
`test-guide-source-member-layout.cjs`: PASS12 actual-renderer/built-AMD invitation
cases (EN/FR,1280/768/390, normal/reduced), counting all title/copy/four labels/
action text and painted containment. This is isolated, not Moodle proof.
PHP lint and Course Manager AMD/map build pass. Moodle floor remains5.1.

`guide-source-member-targets-native.spec.js` is local-supervised, not CI-ready:
saved credentials, runtime lease and existing populated course are required.
It opens the actual new path, selects a real member, searches/chooses another
group, verifies exact member context and destination/confirmation highlights,
reviews an earlier step without losing selection, reopens and Cancels. All
business writes are blocked. No creation, confirmation, Save, Send or fixture.
Shared registry submission/planning remains owned by the Platform window.

Native/served proof and human acceptance remain separate. The last mutating
milestone is source-guarded only until a separately authorized business exercise.
French native workflow, reduced native workflow and advanced editing remain open.
Older SM/Mass Import lots are retained. Rollback: remove this additive path,
invitation, strings/adapter signals/openers and matching rebuilt AMD/map; do not
reset user progress or the older paths. No runtime-data cleanup is required.
