# Deferred Foundations / EasyStud visual checklist

## Checklist de validation humaine — état du 4 octobre 2026

Toutes les cases ci-dessous attendent la validation utilisateur. Les preuves
techniques historiques sont conservées plus bas et dans les documents de lot.
Elles ne valent pas validation globale des derniers fichiers.

### Où regarder et ce qui est disponible

- Preview locale : `http://localhost/local/groupimport/manage.php?id=5`
  (Student Management), `http://localhost/local/groupimport/index.php?id=5`
  (Mass Import), et les réglages EasyStud de l'administration Moodle.
- Dernier code intégré dans le dépôt de preview : `ff7838a`, Kit déclaré
  `0.4.80`. L'affichage effectif et les tests récents restent à vérifier après
  rétablissement de la base Moodle.
- Réglages de vues, color picker/couleurs et nouvelle animation des dropdowns :
  intégrés dans le dépôt de preview, mais dernières vérifications navigateur
  et publication Penpot encore en attente.
- Dernière proposition SM-20 Mass Import : modifications de travail non
  committées dans EasyStud, non appliquées au dépôt de preview. Kit `0.4.81`
  poussé, publication Penpot absente. Icônes des deux panneaux 35,2 px au lieu
  de 40,8 px, grille initiale sans minimum fixe et état vide extensible sont
  des propositions à confronter à Penpot avant intégration.
- Autres composants : les lignes ci-dessous regroupent les changements déjà
  intégrés et leurs éventuels écarts de propagation. La disponibilité dans
  Penpot est à vérifier composant par composant.

### Student Management — desktop, tablette et mobile 390 px

- [ ] Titres de page/colonnes/vues : tailles et couleurs harmonieuses ; noms des
  participants d'un groupe plus discrets que le titre du groupe.
- [ ] Description, navigation et sélecteur de vue : espacement régulier ;
  options centrées ; icônes contenues et alignées verticalement.
- [ ] Navigation mobile : fond opaque, police du kit, icônes/état actif lisibles,
  bouton sticky accessible. L'audit complémentaire SM-27 reste à faire.
- [ ] Cartes participant repliées/dépliées : toutes les informations présentes,
  checkbox, nom, badges, courriel et œil correctement alignés.
- [ ] Cartes groupe/groupement : titres, compteurs et actions alignés, actions
  compactes ; bordures des cartes imbriquées contenues.
- [ ] Groups without grouping : icône visible, repli et contenu corrects.
- [ ] Membres d'un groupe : noms, checkbox et suppression alignés, densité
  cohérente ; état vide étendu et centré.
- [ ] Recherche et création : mêmes proportions/rayons ; plus centré dans les
  deux boutons de création ; focus et disabled cohérents.
- [ ] More Filters : un bloc unique, disposition Toggle/Reset et espace sous
  les listes satisfaisants ; hover desktop/mobile cohérent.
- [ ] Choix multiples : recherche groupes/groupements/rôles, sélections
  conservées pendant la recherche et croix d'effacement utilisable.
- [ ] Fermeture More Filters : un clic ferme le dropdown ouvert et tout le
  bloc ; répéter ouverture/fermeture pour vérifier la stabilité.
- [ ] Sélection filtrée : tout sélectionner, filtrer, désélectionner puis
  sélectionner les résultats ne resélectionne que les résultats filtrés.
- [ ] Sélection de membres : le bouton Move participants du haut et le menu
  contextuel deviennent disponibles pour les membres sélectionnés.
- [ ] Recherche dans une carte groupe : loupe/menu responsive, recherche,
  résultat vide et Cancel fonctionnent avec les bons composants.
- [ ] Ajout par identifiant : panneau dans la bonne carte, noms reconnus sous
  le champ, inconnus en état erreur ; comportement mobile conforme.
- [ ] Menus contextuels desktop et actions mobiles : styles, icônes, focus,
  placement et commandes attendues ; aucun chevauchement.
- [ ] Sticky Clear selection desktop et barre d'action mobile : lisibilité,
  centrage, fermeture et pagination non masquée. Penpot du sticky desktop
  reste à publier.
- [ ] Pagination/sort : alignement, clavier, premier/dernier états ; pagination
  basse ancrée au bas et colonnes de même hauteur.
- [ ] Drag Single participant/groupe : aperçu compact, identité lisible,
  détails et contrôles absents, aucun carré bleu, aucun stack/compteur.
- [ ] Drag Multiple : même aperçu avec stack et compteur centrés ; indication
  de destination autorisée/interdite lisible.
- [ ] Animations acceptées des cartes : déplier/replier/afficher tout fluides,
  focus conservé ; reduced motion utilisable.

### Modales — desktop et mobile

- [ ] Participant/groupe/groupement : contenu complet, champs/images/listes,
  titres, repli, scrolling et fermeture conformes aux vues existantes.
- [ ] Move participants/groups : recherche de destination et dropdown au thème,
  liste lisible, état vide et checkbox Remove from original grouping conformes.
- [ ] Actions de modale : Cancel et action principale en bas à droite, même
  hauteur et même densité ; icône/texte centrés avec un espace correct.
- [ ] Message : header correct, champ sans poignée de redimensionnement,
  loader du kit sans halo bleu, destinataires et états loading/sending/error.
- [ ] Clipboard/confirmation/suppression : contenu, couleurs, Close/Cancel et
  retour du focus corrects ; aucune action destructive nécessaire pour revoir.

### Mass Import et Administration

- [ ] Mass Import initial : proportions des panneaux, titres/descriptions et
  tailles d'icône cohérents ; état vide de droite satisfaisant.
- [ ] Dépôt : nuage centré et proportionné, drag-over/interdit, fichier présent,
  type de fichier, suppression, progression et erreurs lisibles.
- [ ] CSV en preview : repli/ouverture progressive, timing du chevron et
  position du CSV stables en fermeture ; vérifier les clics rapides.
- [ ] Tableau : headers alignés, champs corrects, status centrés avec padding,
  warnings/exclusions distincts et contrôles de sélection lisibles.
- [ ] Boutons Preview/Replace/Export/Import/Cancel : centrage prévu, hauteur,
  couleur et espacement icône/texte corrects.
- [ ] Historique/rapport/rollback : contenu complet, badges et lignes alignés,
  actions correctement placées.
- [ ] Skeleton : apparition douce, shimmer léger et continu, rails discrets,
  absence de chevauchement en mobile.
- [ ] Administration mobile : textes contenus, champs lisibles, boutons alignés.
- [ ] Color picker : tailles/états/Hex/swatches cohérents ; publication
  Foundations et EasyStud encore en attente pour les derniers changements.
- [ ] Couleurs configurables : palette appliquée aux deux vues, valeurs invalides
  signalées, contraste et retour aux valeurs par défaut cohérents.
- [ ] Vue initiale/Complete : préférence admin respectée ; Complete masquée
  laisse deux vues centrées ; routage mobile Participants/Groups/Groupings correct.

### Livraisons restant ouvertes

- [ ] Réconcilier les dernières propositions avec Foundations et chaque
  composition EasyStud liée, puis contrôler le rendu local correspondant.
- [ ] Finir l'audit global des corps de cartes/modales, menus, états et
  compositions responsive avant de déclarer tous les composants intégrés.
- [ ] Migration technique `local_groupimport` vers `local_easystud` : lot SM-25
  encore ouvert, avec plan de compatibilité et de retour arrière nécessaire.
- [ ] Guide : programme différé jusqu'à la fin des autres intégrations,
  dans son projet partagé dédié.

Les premières corrections à examiner sont SM-20 (proposition non intégrée),
SM-29 (animation dropdown intégrée sans nouvelle preuve navigateur/Penpot),
et SM-23/24/28 (color picker, palette et vues admin avec les mêmes gates ouverts).

Requested 2026-10-01: continue implementation; review the combined changes later.
This is a living checklist, not a claim that every component is implemented.
Technical checks and human visual acceptance remain separate.

## Student Management

- [ ] Compact selection toolbar and mobile tray: Inter/600/12.48px, shared gap,
  semantic danger hover/focus and neutral disabled; 30.4px compact / 37.6px tray.
  Six non-mutating native cases pass, including the actual tray-height successor.
  Global human acceptance and complete type/view propagation stay open.

- [ ] Participant/Group/Grouping detail/settings chrome: shared Inter title,
  icon/eyebrow, right-aligned matched native actions and normal open/close; source-complete
  conditional content. Shared headers and three desktop product specimens
  updated; 9 scoped 1600/768/390 cases pass in the current local preview. Native
  Participant entry/focus is verified; Group/Grouping use desktop open then
  resize, not an invented mobile menu command. Native body scrolling exposes
  all action centres. Body
  styling, complete responsive product compositions and human acceptance open.

- [ ] Compact simplified Participant/Group drag previews: identity and title,
  no card contents or action/selection controls, bounded footprint, no opaque
  moving-icon square; Multiple only has rear layers and extra-item count.
  Managed native-event proof `easystud-authenticated-20261004T001137528Z-50096`
  passes Participant/Group Single/Multiple plus allowed and danger targets at
  1600px without Drop or business write. Human acceptance and mobile
  non-drag alternatives remain open.
- [ ] Native message modal: inherited Kit font/tokens outside the workspace,
  canonical textarea, header/body/footer, right-aligned matched Send/Cancel and close action.
- [ ] Move participants/groups dialogs: canonical destination/menu and actions,
  source-complete Penpot specimens including origin option and empty state.
- [ ] Modal footer pairs: same font/height/padding/radius, adaptive translated
  width and right-aligned wrapping. Four paired Foundation / eleven product
  readbacks recorded 2026-10-03; current local preview has 9 entity + 9 Move +
  3 Message cases PASS and 21 inspected final captures. Evidence:
  `testing/student-modal-preview-2026-10-03.json`. Human tick remains deferred;
  foreign CCB body-edge overlaps and all-state/body parity are separate gaps.
- [ ] Creation + centred in solid/outline buttons; adjacent search/add fields
  have coherent height/radius; Ungrouped identity icon remains visible.
- [ ] Reduced workspace/column/view-title sizes and softer card-title contrast,
  paired canonical Kit/Foundation and product/native coverage.

- [ ] Clipboard canonical multiline field and recognized/unknown result pills,
  six native rows, lookup, resize, close/focus at desktop/tablet/mobile;
  scoped 5.1 technical proof passed; human acceptance remains deferred.

- [ ] Foundation Textareas for Group/Grouping identifier additions; multiline
  values, recognition, focus, vertical resize and native responsive routing;
  reflowed panels/cards, equal columns and bottom-anchored pagination.

- [ ] Real Foundation Text fields for creation/Rename; native focus, placeholder,
  filled value and responsive hit geometry; no disguised Search instances.

- [ ] Measured identity typography/colours, subordinate group-member names.
- [ ] Compact Add/Save/Cancel labels, vertical icon/text centres and common gap.
- [ ] Inline identifier results use shared Success/Error pills; recognised
  names, unknown identifiers and card metadata remain distinct.
- [ ] Container-search Cancel matches the compact Foundation secondary action.
- [ ] Product Grouping-add examples: full-width field, linked Add/Cancel below,
  separated recognition pills; originals retained and native actions unchanged.
- [ ] Mobile drawer has an opaque surface after its opening transition.
- [ ] Context menu labels match Foundations; foreign CCB drawer occlusion resolved.
- [ ] All product layout-toggle glyphs stay inside their matching centred slots.

- [ ] Workspace title/description/navigation spacing and centred view toggles.
- [ ] More filters stays one unified block in desktop and mobile.
- [ ] Participant, group and grouping headers: checkbox/title/badge/actions align.
- [ ] Detailed participant metadata: all information retained, 84px + 8.8px grid.
- [ ] Sorting and top/bottom pagination containment at desktop/tablet/mobile.
- [ ] Narrow 320px density: readable selected/unselected cards; taller endpoint.
- [ ] Native disclosure/focus and original animations retained.
- [ ] Drag Single: compact identity/name summary, moving outline/badge and rail;
  no controls, details, stack or count. Source card stays unchanged.
- [ ] Drag Multiple: same flair, two rear layers, inset `+N` extra-item counter.
- [ ] Quieter 28/22px workspace and 20px panel titles, 12px view labels;
  softer card/member identity text, harmonised search/create fields and plus.
- [ ] Drag target allowed, incompatible/danger, error and cancelled states.

  Technical desktop checkpoint: allowed Participant→Group / Group→Grouping
  and participant refusal on empty Groupings pass in Single/Multiple.
  Final danger capture inspected. Error messages and mobile alternatives remain
  separate; this is not a human tick of the combined checklist item.
- [ ] Context menus, sticky mobile actions and non-drag alternatives remain usable.
- [ ] Student Management shows the administrator-selected initial workspace;
  hiding Complete view leaves a centred two-option desktop switcher, and the
  compact Participants / Groups / Groupings switcher remains usable.
- [ ] Direct card actions: eight families aligned; Rename/Unlink product instances.

  Technical checkpoint: `easystud-authenticated-20261001T193408313Z-42096`
  passes 1600/768/390 geometry, hover/focus and search open/close. Desktop and
  mobile captures inspected. No command mutation. Product Rename/Unlink
  instances remain to propagate; this does not tick human acceptance.

## Mass Import and administration

- [ ] Typography, spacing, centred actions, shared navigation and mobile layout.
- [ ] File present/remove, type icon, upload progress and drag-over frames.
- [ ] Preview table headers, status badges, row selection and report actions.
- [ ] Re-upload disclosure and loading/skeleton states.
- [ ] Administration responsive fields, descriptions and modal content fit.

## Evidence and remaining coverage

Later Move checkpoint: six linked product states use regular shared actions
and neutral native destination shells. Ten regular Standard/Library states and
two shell fingerprints match; native six-case run
`easystud-authenticated-20261002T183714504Z-31732` passes at 1600/390.
No-destination branches are static/Penpot only. See the Move JSON readback
and modal contract for close/shell/checkbox paint gaps.

Later paired checkpoint (2026-10-02): Clipboard neutral shell and public
modal/navigation layer have linked Foundation Standard/Library Desktop/Narrow
and product specimens. The 1rem help/field gap and wrapping results fit;
the previous host is preserved hidden. See the neutral-lookup JSON readback.
Baseline run `20261002T201951972Z-46704` confirms three covered helper
characters at 390; post-promotion proof remains pending. No human item is ticked.

Final scoped proof: `easystud-authenticated-20261002T205725336Z-32120` passes
at 1600/768/390 on runtime `b8a3c0f`; 111 helper characters unobscured at each
width, neutral chrome/title/help roles, field states, results and focus return.
Three captures inspected/pinned and cleanup complete; no fixture/business
command. This supersedes the overlap for Clipboard only. Human items stay open.

Clipboard field/results run `easystud-authenticated-20261002T185415434Z-42396`
passes 1600/768/390 controls, with cleanup. Whole-dialog visual acceptance is
still open: a floating navigation trigger covers help at 390. The failed
mid-transition field-sampling run is retained and the harness now waits for
terminal paint. Human items remain unchecked; this does not validate all cards,
menus, actions or mobile overlays.

Workspace/native portal technical checkpoint:
`easystud-authenticated-20261002T171159560Z-11724` passes on runtime `a364b014`
through source `0deb382`, Kit 0.4.53, at 1600/768/390. Message phone body fits
its field without the former fixed-shell gap. Paired Foundation Standard/Library
and product Desktop/Narrow message specimens use linked compact actions;
11 active Student boards have updated role readbacks. Final message/Move/drag
captures inspected and pinned, cleanup complete, no business mutation.
See `docs/student-workspace-controls-2026-10-02.md` and the paired JSON readback.
Move Penpot anatomy, native-close/header paint, untested states and human
acceptance stay open. No checklist item is ticked from automation.

Inline lookup final run `easystud-authenticated-20261002T050512385Z-40496`
passes six Group/Grouping previews at 1600/768/390, recognised/unknown labels,
shared typography/colours/padding, containment and unobscured paint hits.
Desktop search Cancel blue-border/halo keyboard focus passes; native responsive
direct search remains hidden. Seven final PNGs inspected/pinned, no command or
fixture mutation; original Motion unchanged. Initial focus-border failure and
covered/hidden-trigger diagnostics remain preserved. No human item is ticked.

Preview recovery 2026-10-02: runtime `020cf4c` is clean and caches refreshed.
Member-row run `easystud-authenticated-20261002T041025264Z-44664` passes
1600/768/390 role/centre/containment and keyboard checks. Normal-motion nested
disclosure/focus run `20261002T041123913Z-45996` also passes at 1440px.
Four PNGs inspected and pinned; no business-data mutation. Native densities
remain 42px desktop / 37.6px responsive, not Foundation 52px adoption.
No human checklist item is ticked from these automated results.

Final roles/states: `easystud-authenticated-20261001T212924094Z-41672`
passes on preview `2dc94de5`; whole-view capture inspected. Native context
run `20261001T213015887Z-41920` passes typography/centres/focus in all nine
cases, but its OVERALL result stays failed for three 390px foreign-overlay
hit targets. No business data changed. Penpot has 12 linked member specimens;
narrow/whole-card exports and 42px native versus 52px default density remain
to reconcile after reconnect. None of these facts tick human acceptance.

Narrow diagnostic: `easystud-authenticated-20261001T180425356Z-36668`.
Native desktop member disclosure: `easystud-authenticated-20261001T180240745Z-42952`.
Generated media lives under the approved external artifact root, never Git.
Drag flair and control-opacity proof:
`easystud-authenticated-20261001T185153936Z-4892`, on Moodle preview `f45e2f5`.
Participant/Group Single/Multiple, 1600px, native dragstart/dragend only; no drop.
Native inputs remain hidden, custom checkbox size/rounding matches the source.
The first run passed its narrower assertions but screenshot inspection found
the opacity defect; preserve that distinction, not just the final passing run.
Allowed/empty-Grouping refusal run:
`easystud-authenticated-20261001T192313452Z-43724`, preview `023fbee`.
Native start/over/leave/end only, no drop or mutation. Remaining danger cases,
error feedback and whole-view/mobile coverage still need their own slices.
# Guide refinement G6 — pending human review

- [ ] Keep Overview and natural teaching-card rendering; checklist remains native.
- [ ] Show/Return quiet action; return copy never runs behind its controls.
- [ ] Group names full-width field, blue bold #/@/* notation and Warning recovery.
- [ ] Menus near the contrasted cursor; soft instruction/neutral-end transitions.
- [ ] Quiet result copy remains readable, including mobile.
- [ ] Shared Guide utility catalogue publication in Foundations, separately from
  the linked Warning instances and Guide-page review specimens.

