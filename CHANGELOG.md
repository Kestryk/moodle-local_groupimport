# Changelog

User-facing changes for the `local_groupimport` plugin (EasyStud, formerly Group import CSV). The
full technical/internal history is kept separately for the development team and is not part of
the public package.

## [English]

### 2.0.0 — 2026-10-25

First stable release of EasyStud. Builds on the beta work below with a full pass of polish,
accessibility and compatibility fixes across Student Management, Mass Import and the Guide.

**Added**

- A new, optional **Student Management** interface for managing enrolled
  participants, groups and groupings from a single responsive view,
  alongside the original Mass Import workflow. An administrator can enable
  or disable it for the whole site, and choose which view (Participants,
  Groups, Groupings or the combined view) opens first, and whether
  participant cards are collapsed by default.
- Search, filters, sorting, multiple selection, context menus and
  drag-and-drop for participants, groups and groupings. Every search field
  shares the same size and style as its neighbouring action button.
- Actions to add, move or copy participants between groups and groupings.
  Copying a participant or a group now adds it without removing the
  existing membership; moving it still works as before, with an explicit
  option to remove it from its origin.
- Detail views for participants, groups and groupings, including member
  management with checkbox selection and a removal control that also
  works on touchscreens.
- A built-in discovery **Guide** with guided activities and checklists,
  available in English, French, Portuguese and German. Guided paths that
  require a prerequisite (an enrolled participant, a group, a grouping, or
  two groups with at least one member) are shown as locked until the
  course meets it, with an explanation of what is missing and a direct
  link to complete it.
- Larger Mass Import files are handled more gracefully: imports above
  roughly 1,000 rows now run as a resumable background task with progress
  notifications, and bulk group actions (adding members, removing members,
  deleting groups) are processed in batches with a clear summary when some
  rows could not be applied.
- An administrator-configurable retention period for the import history
  (365 days by default), with a scheduled Moodle task that removes expired
  entries automatically. This cleanup never deletes participants, groups
  or group memberships.
- Personal display and animation preferences (full, reduced or minimal),
  available from the interface, with an institution-wide default that
  administrators can set.
- Responsive layouts for Mass Import, Student Management and
  Administration on narrower screens.
- A redesigned Administration settings page with clearer sections and
  descriptions.
- Loading indicators while the Mass Import, Student Management and
  Administration pages initialise, instead of a blank or partially built
  page.

**Improved**

- A single, consistent visual style across every button, field, card and
  control, even on themes that otherwise force their own colours onto
  Bootstrap-style elements — including the floating Guide launcher, whose
  label now expands cleanly on hover without being clipped.
- A single visible keyboard focus ring on every control, including search
  fields.
- The administrator's "collapse participant cards by default" setting now
  reliably controls the initial state of participant cards, independently
  of automatic compact-density behaviour; a user's own choice during a
  session is preserved across pagination.
- Only one loading indicator is shown per action at a time, matching the
  current screen width (desktop or mobile), instead of both appearing at
  once on narrower screens.
- Participant selection and action menus stay centred on wrapped names in
  narrow cards; names and e-mail addresses remain readable in constrained
  cards.
- Group and grouping names stay readable in narrower, drawer-reduced
  columns, including their title priority and overflow ("More actions")
  behaviour, which now also applies consistently to grouping cards.
- Search fields keep their search icon, full placeholder text and
  single-row layout in narrow columns, and open closed by default.
- The Guide keeps its search icon contained in compact filter fields, its
  focused tab visible between navigation arrows, its concept captions
  properly wrapped, and starts its demonstrations above the comparison
  controls they relate to.
- Keyboard focus is preserved when participant details finish loading.
- The mobile navigation lane keeps its place beside view headings.
- Accessibility: keyboard-only focus handling when removing a member or
  using card menus, tooltips that can be dismissed with Escape, and
  additional accessible names for screen readers.
- Translations corrected and completed across the interface, notifications
  and the Guide, and extended to Portuguese and German.
- Course page navigation adjusted for full compatibility with Moodle 5.3.

**Compatibility**

- Supports Moodle 4.5 LTS through 5.3.
- Release AMD assets are built and verified with Moodle's own official
  Grunt pipeline, byte-for-byte, to guarantee they match what Moodle's own
  build tooling would produce.

### 1.0 — Group import CSV (2026-02-13)

Original release, on which EasyStud is built. The technical plugin
identity (`local_groupimport`) is unchanged, so sites can upgrade without
moving data or changing URLs.

- Import participants into course groups from a CSV, XLS or XLSX file.
- Automatic detection of common column names, with an editable preview of
  the rows before import.
- Learner identification using any identifier field enabled by the
  administrator (username, email, ID number or an approved custom profile
  field), with support for mixing identifier types in the same file.
- Automatic creation of missing groups and, optionally, groupings.
- Additive imports, or explicit synchronisation of the groups listed in a
  file.
- A course-level, reversible history of import operations, with the
  ability to restore an import without discarding unrelated later changes.
- A styled Excel example file with instructions and sample rows.

## [Français]

### 2.0.0 — 25/10/2026

Première version stable d'EasyStud. S'appuie sur le travail de bêta ci-dessous avec une passe
complète de finition, d'accessibilité et de compatibilité sur la gestion des participants,
l'Import massif et le Guide.

**Ajouté**

- Une nouvelle interface optionnelle de **gestion des participants**
  (« Student Management ») permettant de gérer les participants inscrits,
  les groupes et les groupements depuis une seule vue responsive, en plus
  du mode Import massif d'origine. Un administrateur peut l'activer ou la
  désactiver pour tout le site, choisir la vue qui s'ouvre en premier
  (Participants, Groupes, Groupements ou la vue combinée), et décider si
  les cartes participant sont repliées par défaut.
- Recherche, filtres, tri, sélection multiple, menus contextuels et
  glisser-déposer pour les participants, groupes et groupements. Chaque
  champ de recherche partage la même taille et le même style que le
  bouton d'action voisin.
- Actions pour ajouter, déplacer ou copier des participants entre groupes
  et groupements. Copier un participant ou un groupe l'ajoute désormais
  sans retirer son appartenance existante ; déplacer fonctionne comme
  avant, avec une option explicite de retrait de l'origine.
- Des fiches de détail pour les participants, groupes et groupements, avec
  gestion des membres par case à cocher et un contrôle de retrait
  utilisable aussi sur écran tactile.
- Un **Guide** de découverte intégré proposant des parcours accompagnés et
  des listes de vérification, disponible en français, anglais, portugais
  et allemand. Les parcours qui nécessitent un prérequis (un participant
  inscrit, un groupe, un groupement, ou deux groupes dont un avec un
  membre) apparaissent verrouillés tant que le cours ne le remplit pas,
  avec une explication du prérequis manquant et un lien direct pour le
  compléter.
- Les fichiers d'Import massif volumineux sont mieux gérés : au-delà
  d'environ 1 000 lignes, l'import s'exécute désormais en tâche de fond
  reprise automatiquement, avec des notifications de progression, et les
  actions groupées (ajout ou retrait de membres, suppression de groupes)
  sont traitées par lots avec un résumé clair lorsque certaines lignes
  n'ont pas pu être appliquées.
- Une durée de conservation de l'historique des imports réglable par
  l'administration (365 jours par défaut), avec une tâche planifiée
  Moodle qui supprime automatiquement les entrées expirées. Cette purge
  ne supprime jamais les participants, les groupes ni les appartenances.
- Des préférences personnelles d'affichage et d'animation (complet, réduit
  ou minimal), accessibles depuis l'interface, avec une valeur par défaut
  réglable par l'administration pour tout l'établissement.
- Une présentation responsive pour l'Import massif, la gestion des
  participants et l'Administration sur les écrans plus étroits.
- Une page de réglages d'Administration réorganisée, avec des sections et
  des descriptions plus claires.
- Des indicateurs de chargement pendant l'initialisation des pages Import
  massif, gestion des participants et Administration, à la place d'une
  page vide ou partiellement construite.

**Amélioré**

- Un style visuel unique et cohérent pour chaque bouton, champ, carte et
  contrôle, même sur les thèmes qui imposent par ailleurs leurs propres
  couleurs aux éléments de style Bootstrap — y compris le bouton flottant
  du Guide, dont le libellé se déplie désormais proprement au survol sans
  être tronqué.
- Un seul anneau de focus clavier visible sur chaque contrôle, y compris
  les champs de recherche.
- Le réglage administrateur « replier les cartes participant par défaut »
  contrôle désormais fiablement l'état initial des cartes participant,
  indépendamment du comportement automatique de densité compacte ; le
  choix de l'utilisateur en session est conservé après pagination.
- Un seul indicateur de chargement par action est affiché à la fois, selon
  la largeur d'écran réelle (bureau ou mobile), au lieu des deux à la fois
  sur les écrans étroits.
- Maintien du centrage de la sélection et des actions sur les noms
  multilignes des cartes étroites ; les noms et adresses restent lisibles
  dans les cartes participant contraintes.
- Les noms de groupe et de groupement restent lisibles dans les colonnes
  réduites par le tiroir, y compris la priorité du titre et le
  comportement de débordement (« More actions »), désormais cohérent
  aussi sur les cartes de groupement.
- Les champs de recherche gardent leur loupe, leur texte de substitution
  complet et une saisie sur une seule ligne dans les colonnes étroites, et
  s'ouvrent fermés par défaut.
- Le Guide garde sa loupe contenue dans les champs de filtre compacts, son
  onglet actif visible entre les flèches de navigation, ses légendes de
  repère correctement renvoyées à la ligne, et démarre ses démonstrations
  au-dessus du comparatif auquel elles se rapportent.
- Le focus clavier est conservé lorsque le chargement des détails
  participant se termine.
- La zone de navigation mobile conserve sa place à côté du titre de la
  vue.
- Accessibilité : navigation au clavier pour le retrait d'un membre et les
  menus de carte, infobulles refermables avec la touche Échap, et noms
  accessibles complétés pour les lecteurs d'écran.
- Traductions corrigées et complétées dans l'interface, les notifications
  et le Guide, et étendues au portugais et à l'allemand.
- Navigation des pages de cours ajustée pour une compatibilité complète
  avec Moodle 5.3.

**Compatibilité**

- Compatible avec Moodle 4.5 LTS jusqu'à 5.3.
- Les ressources AMD de la version publiée sont construites et vérifiées
  avec le pipeline Grunt officiel de Moodle, à l'octet près, pour garantir
  qu'elles correspondent exactement à ce que produirait l'outillage de
  build de Moodle lui-même.

### 1.0 — Group import CSV (13/02/2026)

Version d'origine sur laquelle EasyStud est construit. L'identité
technique du plugin (`local_groupimport`) reste inchangée, afin que les
sites puissent mettre à niveau sans déplacer de données ni changer
d'URL.

- Import des participants dans les groupes d'un cours à partir d'un
  fichier CSV, XLS ou XLSX.
- Détection automatique des noms de colonnes courants, avec un aperçu
  modifiable des lignes avant l'import.
- Identification des apprenants par tout champ activé par
  l'administrateur (nom d'utilisateur, adresse e-mail, numéro
  d'identifiant ou champ de profil personnalisé approuvé), avec la
  possibilité de mélanger plusieurs types d'identifiants dans un même
  fichier.
- Création automatique des groupes manquants et, en option, des
  groupements.
- Imports additifs, ou synchronisation explicite des groupes listés dans
  un fichier.
- Un historique réversible des opérations d'import au niveau du cours,
  avec la possibilité de restaurer un import sans annuler les changements
  ultérieurs non liés.
- Un exemple de fichier Excel mis en forme, avec des instructions et des
  lignes représentatives.
