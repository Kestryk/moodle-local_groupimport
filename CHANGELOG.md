- 2026-10-24 Preserve page width when opening the Guide on a page with a document scrollbar, and restore the original padding on close.

- 2026-10-24 Keep narrow grouping names readable by letting the existing More control yield its reserved title space, as on group cards.

- 2026-10-24 Keep Guide navigation pills stationary while pressed so a click selects the intended slide; focused navigation remains revealable without activating a slide.

- 2026-10-24 Keep Group and Grouping names readable in drawer-narrowed columns by wrapping terminal controls after the existing action-menu fallback.

## 2026-10-24 — Course block drawer

- Keep real Moodle course blocks out of Student Management and Mass Import so their workspace retains its width. Blocks remain available on native course pages.

## K23-36 / G2 / G3 — 2026-10-24

- Keep group counts and action controls inside drawer-narrowed headers, allow open action menus outside list clipping, and reconcile header actions before a view is revealed.

# Changelog

User-facing changes for the `local_groupimport` plugin (EasyStud, formerly
Group import CSV). Dates reflect the development history of this beta;
the plugin has not yet been published on the Moodle Marketplace. The full
technical/internal history is kept separately for the development team and
is not part of the public package.

## [English]

### 0.4.2-beta — in development

**Added**

- A new, optional **Student Management** interface for managing enrolled
  participants, groups and groupings from a single responsive view,
  alongside the original Mass Import workflow. An administrator can enable
  or disable it for the whole site, and choose which view (Participants,
  Groups, Groupings or the combined view) opens first.
- Search, filters, sorting, multiple selection, context menus and
  drag-and-drop for participants, groups and groupings.
- Actions to add, move or copy participants between groups and groupings.
  Copying a participant or a group now adds it without removing the
  existing membership; moving it still works as before, with an explicit
  option to remove it from its origin.
- Detail views for participants, groups and groupings, including member
  management with checkbox selection and a removal control that also
  works on touchscreens.
- A built-in discovery **Guide** with guided activities, available in
  French and English. Guided paths that require a prerequisite (an
  enrolled participant, a group, a grouping, or two groups with at least
  one member) are shown as locked until the course meets it, with an
  explanation of what is missing and a direct link to complete it.
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

- Keep participant selection and action menus centred on wrapped names in narrow cards.

- Keep the search icon inside compact Guide filter fields.

- Place the membership demonstration start above its comparison controls.

- Keep the focused Guide tab visible between the navigation arrows.

- Preserve keyboard focus when participant details finish loading.

- Keep complete search and creation labels visible in narrow columns.

- Keep names and email addresses readable in constrained participant cards.

- Reserve the mobile navigation lane beside view headings.

- Identifier examples in the Guide keep their cards contained at tablet widths.

- Guide concept captions wrap within their cards when opened from desktop navigation.

- Accessibility: keyboard-only focus handling when removing a member or
  using card menus, tooltips that can be dismissed with Escape, and
  additional accessible names for screen readers.
- French interface: corrected and completed translations across the
  Student Management interface, notifications and the Guide.
- Course page navigation adjusted for compatibility with Moodle 5.3.

**Compatibility**

- Experimental installation support for Moodle 4.5 LTS; full native
  certification is still pending and will be confirmed before this
  version is advertised as supporting it.
- Experimental compatibility work for Moodle 5.3; full native
  certification is still pending.

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

### 0.4.2-beta — en développement

**Ajouté**

- Une nouvelle interface optionnelle de **gestion des participants**
  (« Student Management ») permettant de gérer les participants inscrits,
  les groupes et les groupements depuis une seule vue responsive, en plus
  du mode Import massif d'origine. Un administrateur peut l'activer ou la
  désactiver pour tout le site, et choisir la vue qui s'ouvre en premier
  (Participants, Groupes, Groupements ou la vue combinée).
- Recherche, filtres, tri, sélection multiple, menus contextuels et
  glisser-déposer pour les participants, groupes et groupements.
- Actions pour ajouter, déplacer ou copier des participants entre groupes
  et groupements. Copier un participant ou un groupe l'ajoute désormais
  sans retirer son appartenance existante ; déplacer fonctionne comme
  avant, avec une option explicite de retrait de l'origine.
- Des fiches de détail pour les participants, groupes et groupements, avec
  gestion des membres par case à cocher et un contrôle de retrait
  utilisable aussi sur écran tactile.
- Un **Guide** de découverte intégré proposant des parcours accompagnés,
  disponible en français et en anglais. Les parcours qui nécessitent un
  prérequis (un participant inscrit, un groupe, un groupement, ou deux
  groupes dont un avec un membre) apparaissent verrouillés tant que le
  cours ne le remplit pas, avec une explication du prérequis manquant et
  un lien direct pour le compléter.
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

- Maintien du centrage de la sélection et des actions sur les noms multilignes des cartes étroites.

- La loupe reste dans le champ de recherche du Guide compact.

- Le démarrage de la démonstration précède le comparatif des actions.

- Les onglets du Guide restent visibles quand ils reçoivent le focus.

- Le chargement des détails participant conserve le focus clavier dans la fiche.

- Les champs de recherche et de création gardent leurs libellés complets dans les colonnes étroites.

- Les noms et adresses restent lisibles dans les cartes participant étroites.

- Le titre des vues conserve sa place à côté du bouton de navigation mobile.

- Les cartes d’exemple des identifiants du Guide restent contenues sur tablette.

- Les légendes des repères du Guide restent dans leurs cartes depuis la navigation de bureau.

- Accessibilité : navigation au clavier pour le retrait d'un membre et les
  menus de carte, infobulles refermables avec la touche Échap, et noms
  accessibles complétés pour les lecteurs d'écran.
- Interface française : traductions corrigées et complétées dans
  l'interface de gestion des participants, les notifications et le Guide.
- Navigation des pages de cours ajustée pour la compatibilité avec
  Moodle 5.3.

**Compatibilité**

- Installation expérimentale avec Moodle 4.5 LTS ; la certification
  native complète reste à confirmer avant d'annoncer cette compatibilité.
- Travaux de compatibilité expérimentaux avec Moodle 5.3 ; la
  certification native complète reste à confirmer.

### 1.0 — Group import CSV (2026-02-13)

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
