# Guide G10 — retours de checklist et nouveaux lots

Programme EED-UI-2026-0073. Demande du 8 octobre 2026, après K1/K2.
Tous les anciens lots et la validation humaine restent ouverts. Ne pas reprendre
les lots Student Management avant cette tranche Guide. Worktrees Source/Kit
existants uniquement ; pas de nouveau writer parallèle dans ces checkouts.

## Ordre et exigences exhaustives

| Lot | Travail demandé | Statut / preuve attendue |
| --- | --- | --- |
| G10-A | Passation au rédacteur : inventaire4 nouvelles +20 héritées, retrait des doublons, format déclaratif, cartes/actions et parcours utiles ; introduction commune au fonctionnement du guide. | Priorité AVANT les autres lots. Prompt rédigé dans PROMPT-PASSATION-GUIDES-CONTENU-2026-10-08.md ; contenu retourné et intégration encore ouverts. |
| G10-B | En-tête Guide strictement conforme au template partagé des autres modales du plugin, en conservant l'icône. Fin « Demonstration complete · summary below. » en gras et vert sémantique avec icône de validation. Cadre d'étape plus visible, bordure sur tous les côtés. | À faire dans Kit, Foundations/Guide Penpot et preview ; lecture du vrai template natif, états desktop/mobile, titres longs et couleurs configurées. |
| G10-C | Trois points après la consigne active, animés successivement ; action >> pour passer à la phase d'animation suivante ; Pause || remplacée par Play en pause. Comportement partagé pour toutes les scènes présentes/futures. | Nouveau contrat moteur + commandes accessibles + états Penpot. Pause conserve le temps/la scène, Skip avance une seule phase sans répéter des effets ; aucun effet métier. Pause/skip/reprise/fin/changement de slide/fermeture/reduced-motion à tester. |
| G10-D | Organisation : après clic Move, avant déplacement des cartes, faire défiler le corps du guide vers l'action visible. Introduction Compare Add/Move déborde encore : corriger son containment. | Rouvrir malgré les preuves précédentes. Règle partagée de révélation avant les événements illustrés, scroll cancellable respectant pause/reduced-motion, sans défiler Moodle derrière. Longs textes EN/FR, desktop/tablette/mobile. |
| G10-E | Checklist réduite : message Everything is set… intégralement lisible, pas tronqué. Reset this path avec bordure visible, petite densité du Kit, pas de nouvelle exception privée. Surbrillance parfois absente entre Select participant et Move ; aucune sur Destination group / Search and choose… | Reproduire avec vraie modale/contrôles natifs avant de corriger ; conserver preuves et Motion. Révéler/surligner le champ de destination réel, annuler les anciennes requêtes sans perdre la suivante. Aucun Move/Create confirmé pour les tests de présentation. |
| G10-F | Bloc parcours mobile : numéro à gauche, texte centré dans chaque étiquette, y compris libellé multiligne Search and choose… ; icône du bloc toujours en haut à gauche. | Publication des variantes liées et contrôle du texte peint, pas seulement du cadre ; préserver le desktop. |
| G10-G | Accueil de première visite DESKTOP : petite popup expliquant le guide et surlignant son bouton avec animation. Mémoire légère côté serveur de l'ouverture réelle. Admin : bouton réinitialisant cet accueil pour tous les utilisateurs. | À concevoir/développer/documenter. Proposition technique à auditer : préférence par utilisateur et identifiant/version d'accueil, epoch global de reset plutôt que mise à jour de tous les comptes. Enregistrer quand le guide est vraiment ouvert, pas quand la popup apparaît. Pas de SQL massif, confirmation admin/capability/sesskey et feedback ; état après reload/autre navigateur, fermeture/refus/reduced-motion. Penpot admin et accueil. |
| G10-H | Plein écran du guide, uniquement desktop, rendu complet Penpot et preview. Slide commune à tous les guides expliquant navigation, démonstration, Show in interface et parcours, avec futures commandes. | Désormais explicitement demandé : remplace le statut « faisabilité seulement » de G7-00. Fullscreen natif sur geste utilisateur, fallback, événements/Escape, sortie avant Show in interface, conservation slide/progression/focus ; aucune action proposée en responsive. Introduction : contenu par rédacteur, moteur/Kit par intégrateur. |

## Répartition

La fenêtre contenu produit un plan dédupliqué, des textes EN/FR, des scripts de
scènes et des parcours déclaratifs, sans toucher au Kit, au plugin, au runtime,
à Foundations ou au serveur de l'intégrateur. La fenêtre intégration reste
propriétaire des composants, interactions, préférences serveur, admin et preview.
Tout besoin de nouveau contrôleur/signal est signalé, pas inventé comme existant.
Le statut « rédigé » n'est ni « implémenté », ni « publié », ni « validé ».

## Portes de validation

1. Passation et mémoire documentaire ; pas encore de modification visuelle.
2. Reproduction des problèmes signalés, contrôle de la source et baseline.
3. Contrat/implémentation canonique Kit, publication Foundations puis Guide
   Penpot, contrôles source/saved/painted indépendants.
4. Synchronisation ciblée EasyStud, build, commits privés poussés, preview gérée.
5. Tests ciblés desktop/tablette/mobile, EN/FR, mouvement normal/réduit,
   lifecycle/focus/pause/skip/reset. Pas de données réelles créées/déplacées/envoyées.
6. Nouvelle checklist humaine. Aucune validation globale déduite de cette intake.

## État initial

Source2b22de1, Kit08c9abb/0.4.147, runtimef6ce474, propres au dernier checkpoint.
K1/K2 passent leurs six routes clavier ; le retour utilisateur rouvre les
problèmes de présentation/surbrillance ci-dessus. Aucun nouveau contrôle,
accueil serveur, reset global ou plein écran n'est encore implémenté dans G10.
Les anciens SM/G5 et le guide Mass Import distinct restent enregistrés.

## G10-B — implementation checkpoint (8 October)

Canonical Kit0.4.148 extracts the existing entity heading/icon recipes, without
changing emitted native dialog declarations. Guide consumes those recipes and
the shared modal title identity colour. Narration gets a complete primary
border and a strong accent finish/check; reset hides the check. The Source
sync helper now includes canonical dialog primitives/classes, avoiding private
consumer copies. Sass1.79.1 and AMD builds pass; generated CSS differences are
restricted to Guide selectors. No scene timing/card Motion was changed.

Actual Moodle Mustache + built AMD + Moodle FontAwesome isolated test passes
EN/FR at1280/768/390, with matching entity header geometry and reset/completion
paint. Six keyboard normal/reduced regressions and canonical sync pass.
The failed fixture setups are recorded, not treated as product regressions.

Four canonical Reading providers and four linked Standard specimens updated
in Foundations, plus nine linked Guide instances with original copy/host bounds
retained. Initial raster exposed a clipped icon; actual descendants corrected
at providers before Standard propagation. Corrected Standard raster inspected.
Guide headers, final saved/raster proof, managed preview and human acceptance
remain OPEN. Exact bounded evidence:
`docs/testing/guide-g10-b-presentation-2026-10-08.json`.

Successor: five ordinary Guide header compositions updated with linked close/
compass retained; mobile title uses modal role rather than uppercase eyebrow.
The API rejected documented `textTransform=null`; accepted `none` restores
normal casing. Mobile raster inspected after that correction. Nine Reading
links have saved containment/link/host-bounds proof (32 descendants). Historical
G9 full-product reader now fails its pinned Practice-header coordinates, which
were intentionally revised; keep that record unchanged, use G10 Reading-only
successor, and retain broader header saved/coverage audit as open.
Candidate native scenario: `tools/playwright/guide-g10-chrome.spec.js`; must
run through saved-credential/lease wrapper after ordered promotion.

First native G10 run failed a harness exact-float assertion during opening:
31.76280975341797px vs31.762802124023438px. It had no page errors or blocked
writes; credentials/child/runtime lease cleaned up. Follow-up waits for finite
dialog opening animations and two paints, then compares square geometry within
.001px (serialization precision, not a relaxed visual layout tolerance). Keep
failed run `easystud-authenticated-20261008T152319023Z-56720` and immutable source.

Second native run `easystud-authenticated-20261008T152458589Z-2600` exposed an
actual integration omission: rendered Moodle template lacked the completion
check, while embedded template/controller and SCSS were current. Add the runtime
Mustache to canonical sync, retaining only translated hover/compact completion
labels; extend the isolated fixture to render that actual consumer template.
Do not report this failed run as presentation success. No course writes/errors;
credential/lease/child cleanup passed. Corrective preview/test still required.

## G10-C — next implementation boundary

### WIP checkpoint after interruption recovery

Canonical playback implementation and localized actual consumer Mustache/AMD
are synchronized and built. Shared small selection-action/icon recipes skin
both controls. Pause retains reading and freezes illustration/copy/scroll;
Next serializes one phase while keeping paused state. Idle/finished/advancing
controls are disabled. Activity dots stop in pause/reduced motion and hide at
completion. No course transaction or fixture is introduced.

Isolated actual-consumer test passes EN1280/FR390 normal and EN768 reduced,
including all Actions phases advanced while paused through the final recap,
copy/scroll freeze, paired drag clocks, reset/departure/Escape and ghost cleanup.
Six keyboard routes pass. An intermediate clock assertion ran before WAAPI
pause readiness; the harness now awaits `ready`, like the paired-drag assertion.

Foundations six Reading providers (Active/Paused/Finished desktop/phone), five
canonical-derived playback specimens and linked Standard checkpoint are present.
Initial raster exposed phone dots over text; corrected providers and reset linked
specimens, then inspected the corrected Standard raster. No duplicate writes
after the slow read. External media: `g10-c-playback-20261008`, retained diagnostic
and successor. Still OPEN: hover/focus catalogue, exact saved-file proof,
Guide-product copy/geometry propagation, managed preview and native playback.
Runtime remains at72dbfc5 (G10-B), not this G10-C source WIP. G10-D..H and the
combined human checklist remain open. Do not mark the released Kit updated.

Successor: nine Guide Reading links reset from Foundations and original product
copy/host coordinates restored;25 correlated phone elements moved28px to retain
clearance below the taller banner. New bounded C link record preserves B as a
historical proof. Mobile product raster inspected. Saved containment caught
desktop dots positioned from unsettled text bounds; corrected from settled paint
and retained the failure. Saved persistence successor, remaining hover/focus,
native preview and human acceptance are still open.

Saved Guide successor now passes9 roots/128 visible descendants, exact product
copy and all25 phone clearance shifts. Tablet corrected raster inspected.
The earlier immediate saved retry saw the pre-save dot position; no tolerance
was weakened. Foundation saved successor, hover/focus specimens and native
playback remain open; all evidence stays separate from the human checklist.

Canonical Kit0.4.149 is now pinned for this bounded Guide slice. Four Hover/Focus
playback compositions preserve existing selection-action paint; linked Standard
specimens published and raster inspected. Foundations saved gate passes30 roots/
260 visible descendants across six Reading and nine Playback providers. This
supersedes the earlier WIP design gaps, not its recorded failures. Candidate
native spec `guide-g10-playback.spec.js` checks1280/390 normal and768 reduced
without fixtures or course writes. Ordered preview must include6e05ed3, dcb14da,
5dfd9db and this successor; do not omit the documentary predecessor.

Managed preview applied these four commits with cache purge to3e7058b. First
native playback run `easystud-authenticated-20261008T175051760Z-59528` failed
at its new pause selector: the sticky narration is a sibling above the scene,
not a descendant. Actual template confirms this; isolated test already scopes
to the slide. Child/credential/runtime lease cleanup passed, no fixture.
Keep the failed run; correct only native selector scope and add15s action timeout
so a harness miss does not wait the full4-minute scenario budget. Product timing,
card Motion and selectors in shipped code unchanged. Native successor required.

Second run `easystud-authenticated-20261008T175604911Z-52080` reached the correct
Moodle URL and DOMContentLoaded but timed out waiting for full window load during
login after the new15s global action timeout. Fix login's DOMContentLoaded
navigation boundary explicitly, apply bounded control timeout after login and
keep a60s navigation timeout. No rendering assertion reached; do not count this
as product failure or success. Child/credentials/lease cleanup passed, no fixture.

Native successor `easystud-authenticated-20261008T175707682Z-38024` passes against
served3e7058b:1280/390 normal motion and768 reduced. Single-phase paused advance,
resume, final recap/reset/departure, equal30.39px control heights and no overflow.
No browser errors, blocked writes or fixtures; credentials cleared, owned child
closed and runtime lease released. G10-C implementation/design/native gates
complete, human acceptance OPEN. Test harness corrections do not change served
assets. Preserve failed runs and the canonical/source/native scope distinctions.

Next G10-D boundary: after simulated Move confirmation hides, reveal the scene
stage through the same pause-aware cancellable scroll owner BEFORE measuring
card displacement. Reproduce on offscreen/tall Guide bodies and assert paired
card visibility/motion; recheck long Compare Add/Move EN/FR text containment.
Do not change Moodle's background scroll or accepted drag/card choreography.
G10-E..H, content-writer return and all older Student Management lots stay open.

G10-B native successor passes `easystud-authenticated-20261008T152735563Z-19344`
against runtime72dbfc5:1280 normal-motion,768/390 reduced-motion. Header16px/700,
32px compass centered/no overflow, strong green finish/check, full2px border,
reset hides check. No errors/blocked writes/course transactions or fixtures;
credentials cleared, owned child stopped and lease released. Retention dry-run
0 candidates/0 deletions. This verifies served behavior, not human acceptance.
Broader Penpot header propagation/painted-copy audit remains open.

The current scene already owns an AbortController, WAAPI animation set (including
the reveal scroll clock), reading timeout and drag-overlap frame. Reuse those
owners; do not add a disconnected second animation or generic slide Next button.

- Pause must retain remaining reading time and pause every current/new scene
  animation, including scroll and copy fade. Departure/reset aborts all pending
  waits regardless of pause; never leave an unresolved pause gate.
- Next phase acts on the current illustration phase only. Serialize rapid clicks
  and preserve each phase's final presentation effects exactly once. If paused,
  expose the next narration without silently restarting playback.
- Dots animate only while explanation runs; pause/finish/departure stops them.
  Reduced motion removes bouncing, not the indication or keyboard controls.
- Shared localized labels and accessible button states belong to Kit/controller
  config, with EN/FR labels supplied by EasyStud. Public small icon-button recipes,
  no inline style overrides. Preserve current teaching cards/drag choreography.
- Tests must cover pause during reading/fade/drag/scroll, resume remaining time,
  skip during each phase, double click, final phase, reset, scene comparison,
  slide change and close while paused. No course operation may be invoked.

The preceding engine boundary is historical: G10-C controls are now implemented
and served, as the successor evidence above records. G10-D..H and the content
writer's returned proposals remain independent lots, not implied acceptance.

## G10-D — source and isolated checkpoint

Kit0.4.150 reveals the card stage after illustrated confirmation hides and before
transfer geometry is measured. It reuses the existing pause-aware cancellable
scroll owner; accepted card/drag timing and appearance remain unchanged.

The prior built controller reproduces the bug at1280: moving card top78.03px,
Guide body top211.73px/bottom569.02px. Successor passes EN/FR1280, EN768, FR390:
visible desktop transfer, completion, unchanged Moodle background scroll and
long Compare intro containment. G10-C playback regression also passes. The first
test setup inspected a transitioning hidden slide; it now waits for its actual
visible intro, rather than weakening the containment assertion.

Foundations MCP is live on08.14 Standards. This behavioral correction introduces
no new visual provider or layout; existing G10-C Reading/Playback geometry stays
unchanged. Penpot does not execute the Moodle scene controller. The design
contract and native evidence are independent from static provider coverage.

Native playback candidate is extended with post-confirmation reveal and Compare
intro containment. Managed preview/native proof pending. Next: finish this gate,
then G10-E reduced checklist, reset border and native destination highlights.
G10-F..H, broader G10-B headers, returned content, older Student Management and
the combined human checklist remain open. No data mutation is part of this lot.

Native run easystud-authenticated-20261008T181650311Z-59964 failed before any
Guide assertion: login redirected to the correct manage.php URL but waiting for
DOMContentLoaded timed out. Cleanup passed (credentials, child and runtime
lease), no fixture. Retain failure. Successor waits for redirect commit, avoids
redundant navigation when already on the requested URL, then retains the strict
real EasyStud loading-state=ready gate. No product assertion is relaxed.

G10-E presentation WIP, not yet served: baseline reproduces hidden full message
in completed minimized checklist. Canonical discovery completion now exposes
the full wrapping message beneath its compact header; Reset consumes existing
bordered neutral selection-action instead of borderless capsule recovery.
Actual rendered EN/FR desktop/phone completion and all G10-B header/finish
checks pass. Native highlights, Penpot publication and human review still open.

Native successor182002627Z-55368 passes desktop card visibility/contained intro,
then the phone's natural validation reading exceeds Playwright's default5s
completion assertion. Unlike the former skipped phase, normal playback retains
word-count reading plus reveal/confirmation clocks. Bound this completion check
at30s, without changing engine duration. No page errors/blocked writes/fixtures;
cleanup passed. Preserve failed evidence, require successor.

Operational correction: a combined git/test command was accidentally launched
from the runtime instead of Source. Git committed nothing (runtime was clean),
but pushed the unchanged9bf0d41 private preview branch and established upstream.
No main/prod change or data write. Do not delete/reset this branch automatically.
Future Git staging/push is explicitly scoped to Source/Kit worktrees only.

Native successor easystud-authenticated-20261008T182313016Z-48272 passes1280/390
normal and768 reduced against runtime9bf0d41. Post-confirmation transfer is
visible, long Compare intro contained, background scroll unchanged, playback
completion/reset/departure clean. No errors/blocked writes/course operations or
fixtures; credential/child/lease cleanup passed. Retention dry-run0 candidates,
0 deletions. Foundations Motion contract text updated and painted bounds fit
750x74. G10-D native gate complete; human acceptance stays OPEN.

G10-E Foundations: new Reduced Complete Phone provider358x150, linked Standard
and two Path invitation Reset providers. Saved gate passes6 roots/190 visible
descendants. Initial raster exposed catalogue overlap: move the new variant to
separate Library/Standard hosts at2480, preserve failed image, inspect corrected
raster. Product Guide new linked example at886/11486 is visible but NOT saved:
editor displays autosave failure and saved readback has no new ID. Preserve the
open editor, no reload/close. Exact reconstruction in product-links evidence.
No product-reset propagation or saved success claimed. Native highlight candidate
uses a bounded path starting at real selection to avoid Create/Move data writes.

Next: recover product save safely after capturing its error; finish G10-E native
milestone/highlight proof, then F responsive path alignment, G server welcome/
admin reset and H desktop fullscreen. Broader B headers/content writer/old lots
and combined human checklist remain OPEN.

G10-E successors: footer Reset belongs to In-progress footer, not Path invitation.
Correct the evidence scope; read saved Foundation through the owned Guide context
without navigating its unsaved editor: actual6 roots/62 descendants pass. Error
report identifies stale Guide footer Phone nested component and missing swap slot.
Preserve report/raster/reconstruction first, reload only the integrator's failed
editor, reset the whole actual footer parent through public API retaining its
copy/bounds, then recreate the owned completion example. Saved Guide2 roots/26
descendants now pass; corrected raster inspected, no error toast. The prior
unsaved instance ID is retained in evidence, not claimed as persisted.

Source/Kit presentation changes pushed, ordered preview through e0627c2 served at
runtime9de50d7 with cache purge. Native E run183619952Z-55040 reproduces absent
highlight after real Select participant: checkbox and completion succeed, Move
step active/control available, highlight hidden. No errors/blocked writes or
business transactions; credential/child/lease cleanup passed. The test uses a
three-step presentation path beginning at selection, not a fabricated Create
completion. Follow-up adds bounded event/current-target diagnostics; do not
close native E or infer full curriculum proof from the presentation fixture.

Diagnostic successor184216654Z-39824 passes actual desktop Select→Move and native
destination highlight aligned. It then fails a harness desktop-only layout click
at390, before phone selection: use the actual mobile workspace tab, not a hidden
desktop button. Isolate temporary path storage per viewport, so the phone does
not resume the unfinished desktop exercise. Keep both failures; first absent
desktop highlight was not reproduced in successor, do not invent a product fix.
Native phone/repeat stability still open; no business write/fixture requested.

Phone successor184446788Z-49456 exposes another harness-only carryover: slicing
the already bounded3-step config again leaves only Choose destination. Select
the three actual milestone IDs idempotently and assert exactly3 before init.
Desktop native selection/move/destination passed again, no errors/blocked writes
or transactions. Preserve failure; do not modify product lifecycle to compensate.

G10-F source WIP: only the phone invitation labels use a fixed left counter track
and a centred wrapping text track. Actual EN/FR six labels pass range-based line
centering (French destination wraps with0.008px centering error), no overflow.
Desktop/tablet header, minimized-completion and green-finish regressions pass.
Version/pin, Foundations/provider propagation and native serving still pending.

G10-E diagnostic successor184711909Z-52880 reproduces hidden highlight again,
despite active Move step and available control. Former checklist highlights
shared the transient Show-in-interface5.2s timeout. Canonical0.4.153 separates
these lifetimes: active checklist highlight persists until step/path change;
Show-in-interface remains transient. Isolated built consumer passes next-target
replacement and stop cleanup; native regression explicitly waits6.5s before
opening real Move and checks destination geometry. This is a candidate, not a
claim that every intermittent transition is fixed. No business writes/fixtures.

G10-F canonical0.4.152 source pin pushed atdbf09f6. Existing Foundations Phone
provider already uses centred copy and left counters; implementation matches
that design without redrawing it. Native promotion pending. G10-G/H remain open.

Native successor190124360Z-43640 passes1280/390 normal Motion at runtime0b8626a:
real checkbox selection, active Move highlight still visible after6.5s, actual
Move dialog opened and destination searchable-choice highlight aligned within
2px. Cancel and path close succeed. No page errors, blocked writes, fixture or
confirmed course transaction. Credential/child/lease cleanup passes. Retention
dry-run0 candidates/0 deleted. Source/Kit branches pushed clean. This closes the
bounded native E presentation gate, not full Create/Confirm or human acceptance.
Phone invitation CSS0.4.152 is now served; range-based isolated F proof remains
distinct from a dedicated native mobile invitation visual acceptance.

Foundations Standard Motion copy now specifies task highlight lifetime through
step change/close. Settled painted copy749.25x44.375 fits750x74. No geometry,
accepted card Motion or other window's design was changed. Four E design rasters
are pinned; failed overlap/autosave diagnostics retained, no media deleted.

Next G10-G: server-backed actual-open marker and one global welcome generation
for admin reset, then desktop invitation design/motion and safe adapter. G10-H
desktop fullscreen, broader B headers, writer content and all older lots remain
OPEN; no automatic human acceptance or lost backlog.

G10-G server candidate now exists in classes/local/guide_welcome.php, deliberately
unconnected. Native Moodle preferences + one opaque config generation avoid
mass user updates. Mark actual opening only, reject stale-page generations,
current user only; reset requires site configuration capability. Isolated PHP
contract and lint gates added; real PHPUnit candidate retained (local PHPUnit
absent). Full design, actual-open engine hook, POST/sesskey controllers,
confirmation/feedback, privacy export and native acceptance remain pending.
No active preview preference/configuration or course data changed by this work.

G10-G Foundations ordinary draft480x140 prepared by cloning/detaching only Resume
root and retaining linked canonical Small primary/neutral actions, paired30.4px.
Existing Inter12.16 copy and12.48 actions; settled text fits, raster inspected.
Not published as component yet, no product/UI activation. Exact IDs and all
remaining gates in guide-g10-g-welcome-draft-2026-10-08.json. A width getter error
created only an empty owned host; inspected partial state and finished the same
host with resize(), no duplicated write or discarded unsaved work.

G10-G successor: Kit0.4.154 opt-in desktop invitation + genuine-open event shared
primitive implemented, documented and pushed. Actual built consumer EN/FR
normal/reduced passes480x140, equal action heights, no auto-opening, no seen event
on dismissal, event on real opening, destroy and1023/390 suppression. Existing
header/completion/label regressions pass. Foundations draft promoted retaining
linked nested buttons and a linked Standard copy; saved proof separate. Product
has no welcome fields/eligibility adapter yet, so no active preference writes.

G10-G saved Foundations gate passes2 roots/14 visible descendants. Standard
linked instance retains copy/button geometry and painted containment. Raster
captured separately; product link, server activation, admin reset/privacy/native
welcome remain pending. No completed Guide lot or human acceptance inferred.

G10-G source successor now wires desktop invitation eligibility, separate actual-
open Moodle adapter, POST/course capability/sesskey current-user acknowledgement,
stale generation rejection, and explicit admin confirmation/POST reset. Privacy
metadata/export added before activation. All paint remains in canonical Kit,
including opt-in dialog body lane0.4.155. Isolated built adapter/state/static
security and PHP lint pass. Native test candidate allows only own QA preference
acknowledgement; no global reset/course mutation. Native execution pending.
Guide first-visit Foundation instance added on a separate79 host after existing
boards, preserving nested providers/paint. Saved product/raster proof separate.
Admin Penpot confirmation composition, H fullscreen and all older gates remain
OPEN; this source wiring does not close the combined checklist.

G10-G Guide instance saved/raster gates pass1 root/7 visible descendants. Shared
standalone token scope0.4.156 explicitly supplies defaults on the reset page
without changing normal inherited custom palettes. Actual reset Mustache EN/FR
1280/768/390 layout passes paired heights/20px padding/primary paint/long copy.
Only new owned scope hunk copied; unrelated Kit filter-track-focus class remains
outside this batch. No native/global-reset or admin Penpot confirmation proof yet.

G10-G native baseline served dc76075/cache purge. Runs202747658Z-53756 and
203022143Z-55920 fail invitation visibility before preference acknowledgement.
Eligibility true, no page errors/blocked writes/course mutation; cleanup passes.
Diagnostic confirms launcher visible after loading. Shared0.4.157 waits for
the loading shell's real reveal using bounded owned observers, no polling or
consumer styling. EN/FR normal/reduced delayed-visibility regressions pass.
Corrected native proof remains pending; H fullscreen and older lots still open.

Native successor203306236Z-52108 at200860d passes genuine first opening/own-user
acknowledgement, persisted reload and GET/invalid-sesskey rejection. It then
reveals a real admin reset rendering error: settings.php adds a body class during
header/navigation construction. Restrict settings presentation initialization to
its exact /admin/settings.php section before output; retain tree registration on
other admin pages. No global reset/course writes; cleanup passes. Native full
successor/admin-cancel/mobile gates pending. Earlier actual first-opening proof
remains valid even when the next test correctly sees an already-seen account.

Native successor203632655Z-34796 PASS at75311dd, cache purge verified. Account
already seen from the previous genuine acknowledgement: welcome remains hidden,
reload persists, GET/invalid sesskey rejected, admin confirmation opens with
paired action heights and Cancel preserves state, phone welcome suppressed.
Zero page errors/blocked writes/course transaction/fixtures; credential, child
and lease cleanup pass. First actual opening belongs to the retained previous
run, not artificially repeated. Native global reset remains unconfirmed.
Admin Penpot80 host consumes existing neutral confirmation provider; settled
labels/action widths fixed without a new master/font/skin. Saved1 root/15
visible descendants and raster inspected. Full native/design pixel parity and
human acceptance remain open. G10-H desktop fullscreen is the next tranche;
all earlier recorded lots remain retained.

G10-H canonical lifecycle candidate started, deliberately not synchronized or
activated in EasyStud. Real isolated Chrome API test passes desktop entry/exit,
denied-request ordinary-mode fallback, compact unavailability and teardown.
The helper never exits another element's fullscreen. Remaining sequence:
linked Foundation Expand/Compress Small controls and Desktop Guide composition;
integrate native lifecycle with existing Escape/focus and await exit before
Show in interface/close; preserve slide/progression/accepted animations;
translate controls, add scoped shared layout, regression and managed native
preview. No fullscreen option visible in current Moodle yet. Common intro
content and all older product lots remain separate/open.

G10-H source integration now consumes shared native lifecycle, Small header
controls, translated EN/FR labels and public fullscreen layout. Linked Foundation
Library/Standard4 roots/28 descendants and Guide2 roots/14 descendants saved;
rasters inspected (bounded controls/compositions, not whole-guide audit).
Actual built-consumer Chrome PASS normal/reduced entry, Escape preserving Guide
and slide, close exit, Show in interface exit/focus, denial fallback and phone
suppression. Existing EN/FR1280/768/390 chrome regression PASS. Native scenario
added; ordered managed preview must include e18b33b and05a8a91 documentary
predecessors before this candidate. Runtime proof and human checklist still open.
Common introduction/curriculum remains a separate writer-dependent remainder.

Native G10-H run213506218Z-46584 fails the strict fullscreen width oracle by15px
before Escape/close/target/mobile proof. No page errors, blocked/course writes or
fixtures; lease/credentials/child cleanup PASS. Preserve unchanged scenario.
Diagnose native document scrollbar containing-block width; shared fullscreen
viewport units/border-box/overflow successor only, no plugin-local CSS and no
weakened oracle. Managed correction/native successor pending.
