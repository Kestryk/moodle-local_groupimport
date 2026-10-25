<!-- Immutable received plan. Progress belongs in testing/claude-interface-review-intake-2026-10-11.json. -->
# Tasks: Harmonisation de la composition EasyStud (Guide, Student Management, Mass Import)

**Input** : `PROPOSITION-GUIDE.md`, `PROPOSITION-STUDENT-DESKTOP.md`, `INSTRUCTIONS-MASS-IMPORT.md`, `ARBITRAGES-FOUNDATIONS.md` (même dossier).

**Prérequis** :
- Lecture des quatre fichiers ci-dessus.
- Validation par Kevin de la proposition qui concerne le lot.
- Contrats EasyStud : `AGENTS.md`, `easyedu-kit-docs/`.

**Format** : modèle `tasks-template.md` de GitHub Spec Kit, adapté à la chaîne EasyEdu. L'outil Spec Kit n'est pas installé, seule sa structure est reprise.

**Organisation** : un parcours utilisateur (US) par surface, dans l'ordre de priorité de la mission. Chaque US se livre et se teste seule.

## Format : `[ID] [P?] [Story] Description`

- **[P]** : peut avancer en parallèle (fichiers différents, pas de dépendance).
- **[Story]** : US1 Guide, US2 Student Management, US3 Mass Import.
- **Chemins** : relatifs à la racine EasyStud Source (`C:/dev/worktrees/easystud-foundations-student-management-20260928`), sauf mention Kit.
- **Chaîne de livraison** pour chaque tâche visuelle : Kit, puis Foundations, puis composition Penpot produit, puis classes et markup du plugin, puis assets compilés, puis preview Moodle contrôlée. Une tâche n'est terminée qu'avec sa preuve native, sans acceptation humaine revendiquée.

## Parcours utilisateur (résumé)

- **US1 — Guide (P1)** : comprendre une démonstration avant qu'elle joue, avec un seul endroit pour la piloter et le résultat visible sans défiler.
  - *Test indépendant :* slide « Organiser » à 1600×900, 1280×800 et 390×844. Mode visible avant Démarrer ; état et commandes visibles pendant la lecture ; appartenances finales visibles sans défilement manuel en desktop.
- **US2 — Student Management desktop (P2)** : lire et comparer les deux colonnes sans compression ni rupture d'alignement, dans les trois vues.
  - *Test indépendant :* les 3 vues à 1600 et 1280. Gouttière identique ; listes et panneaux de filtres sur le même bord ; pas de bande vide en vue complète.
- **US3 — Mass Import (P3)** : une carte de dépôt hiérarchisée, alignée et centrée, en équilibre avec Student Management.
  - *Test indépendant :* état vide à 1600 et 1280. Bouton centré (delta ≤ 1 px) ; 2 bords gauches au plus ; aucune icône de sous-section ≥ 35 px.

---

## Phase 1 : Préparation

- [ ] T001 Relever les SHA Source, Kit et runtime, et l'état des fichiers, puis comparer avec `HANDOFF.md` (`1c1fcb8` / `730b0dd` / `02d8c78`). Recontrôler les constats si un SHA a bougé.
- [ ] T002 [P] Obtenir de Kevin l'arbitrage A1 (tuile de sous-section) et A2 (ratio par conteneur ou viewport) de `ARBITRAGES-FOUNDATIONS.md`.
- [ ] T003 [P] Comparer les propositions aux compositions Penpot « Guide Easystud » (`b564c72c…`) et « EasyStud » (`220f6449…`), sur le canal MCP de l'intégrateur. Cette revue n'a pas pu le faire.

## Phase 2 : Correctifs bloquants isolés

Ce sont de petits défauts avérés, sans décision de design.

- [ ] T004 [P] [US1] **Tiroir Moodle au-dessus du Guide (G11).** À l'ouverture du Guide, poser une classe sur `body` qui masque `.drawer-toggler`, et la retirer à la fermeture.
  - Fichiers : `amd/src/easyedu_guide.js` (ouverture et fermeture) et la feuille d'adaptation Moodle du Guide.
  - Test : 390×844, aucun élément Moodle peint sur la modale (`elementFromPoint` sur la ligne « Voir dans l'interface ») ; la checklist reste au-dessus des modales.
- [ ] T005 [P] [US3] **Centrage du bouton « Prévisualiser l'import » (M12, M13).** Rendre `.felement` pleine largeur dans `.easyedu-form-actions`, masquer la colonne de libellé vide et centrer la note.
  - Fichier : `scss/views/_mass-import.scss`.
  - Test : delta de centre ≤ 1 px à 1600 et 1280 ; pieds de modale inchangés.
- [ ] T006 [P] [US1] **Espace entre la note d'introduction et la barre d'état (G9).**
  - Fichier : SCSS Discovery embarqué. Corriger côté Kit si la règle y vit, puis synchroniser.

**Checkpoint** : T004 à T006 servis et vérifiés nativement, chacun avec sa preuve.

## Phase 3 : US1 — Guide (P1) 🎯

- [ ] T007 [US1] Penpot « Guide Easystud » : composer la slide « Organiser » avec l'en-tête de scène unique (mode, Démarrer, statut, Pause, Suivant) et les appartenances prévues au repos. Faire valider par Kevin avant le code.
- [ ] T008 [US1] Réordonner les blocs de slide : titre et phrase, puis scène, puis points à retenir, puis parcours. Fusionner l'intro de scène redondante avec le texte de slide (G4, G8, G12).
  - Fichiers : `templates/easyedu_guide.mustache:141-547` et le contenu FR/EN dans `lang/*/local_groupimport.php`.
  - Ne pas changer les ID ni `readingIndexMigrations`.
- [ ] T009 [US1] Déplacer `__live` dans la `section.easyedu-guide-scene` comme en-tête, et y remonter les boutons `add`/`move` sous forme de sélecteur `aria-pressed` (G1, G2).
  - Fichiers : `templates/easyedu_guide.mustache:195-327` et `amd/src/easyedu_guide.js`, si des sélecteurs dépendent de la position.
- [ ] T010 [US1] Afficher `__memberships` dès le repos avec l'issue prévue du mode choisi, et la mettre à jour au changement de mode.
  - Fichier : `amd/src/easyedu_guide.js`. Données : phases et appartenances existantes.
- [ ] T011 [US1] Statut « Étape n/N · Mode » ; bordure neutre au repos, primaire en lecture ; Pause et Suivant masqués avant le premier démarrage (G5, G6).
  - Fichiers : contrôleur, puis Kit `_guide-discovery.scss` (bordure `__live`), puis synchronisation.
- [ ] T012 [US1] Fin de démo : faire défiler jusqu'au bas des appartenances ; récapitulatif en divulgation Motion ouverte d'office (G3). Motion des divulgations conservé.
- [ ] T013 [P] [US1] Allègement du cadre (G7) : afficher `easyedu-guide-modal__step-count` dans le pied et retirer la rangée de libellé de progression (piste conservée, palette R10-03) ; sous 40rem, masquer le sous-titre d'en-tête.
- [ ] T014 [P] [US1] Slide 1 (G10) : spécimens pour « Regarder à votre rythme » et « Lire en plein écran » ; spécimens en contour, jamais en bouton primaire plein ; légende « Aperçu ». Pas d'exercice de groupe (contrat R10-29).
- [ ] T015 [US1] Preuve native : 18 cas de scène existants (EN/FR × 1280/768/390), plus ce nouveau critère : mode visible avant Démarrer ; appartenances visibles en fin de démo sans défilement manuel à 1280×800.
  - Mouvement réduit : issue statique.
  - Clavier : ordre de tabulation, Escape, focus de retour.

**Checkpoint US1** : le Guide est livrable seul. **Coordination** avec R10-28, R10-29, R10-30 et R10-31 : leurs correctifs sont recomposés, pas annulés.

## Phase 4 : US2 — Student Management desktop (P2)

- [ ] T016 [US2] Penpot « EasyStud » : vérifier la marge de page de référence et les ratios proposés sur les trois vues, puis faire valider par Kevin.
- [ ] T017 [US2] Gouttière unique de 1.5rem dans les trois vues (S1).
  - Fichiers : `scss/components/_layout.scss:916-921` (`__layout`), `scss/components/_structure.scss:219-225` (contenu participants), règles de l'arbre et de la ligne de création.
- [ ] T018 [US2] Ratios asymétriques au-dessus du seuil retenu en T002 (S2).
  - Participants & groupes : 0.9fr / 1.1fr. Groupes & groupements : 1.1fr / 0.9fr. Vue complète : 0.85fr / 1.15fr. 1fr / 1fr en dessous.
  - Fichiers : les mêmes SCSS, plus `scss/responsive/_desktop.scss`.
- [ ] T019 [P] [US2] Aligner le départ de `structure-groups__list` sur le panneau de filtres (S3). Vérifier d'abord le rôle du `padding-left` de 0.72rem (ombre, glisser).
- [ ] T020 [US2] Vue complète : barre de liste de la structure dans la bande réservée, avec adaptation de `scheduleCompleteListAlignment` ; ligne de création sur 2 lignes entre 1 025 et 1 399 px (S4, S5).
  - Fichiers : `templates/manage.mustache`, `amd/src/course_manager.js`, SCSS de structure.
- [ ] T021 [P] [US2] Carte groupe : retirer la bordure de la zone membres et remplacer l'état vide pointillé par une légende, si ce n'est pas une zone de dépôt (S6).
- [ ] T022 [US2] Preuve native, 3 vues à 1600 et 1280, plus 1 000 px (empilement) :
  - aucun e-mail ordinaire tronqué ;
  - même x pour filtres, barre et première carte ;
  - glisser-déposer : cible visible, auto-scroll non interrompu ;
  - barre collante et pagination visibles.

**Checkpoint US2.** **Coordination** avec R10-07 / SM-65, R10-08, R10-09, R10-10 et R10-13 sur les mêmes zones.

## Phase 5 : US3 — Mass Import (P3)

- [ ] T023 [US3] Hiérarchie des sous-sections (M8) selon l'arbitrage A1 : `type-card-title` en 600 et glyphe sans tuile, ou tuile `small`.
  - Fichiers : `scss/views/_mass-import.scss`, adaptateur `scss/easyedu/adapters/_moodle-file-deposit.scss` (source Kit si la règle y vit).
- [ ] T024 [US3] Deux bords gauches au plus dans la carte de dépôt ; même surface pour les deux sous-sections ; « Formats acceptés » en légende sans surface (M9, M10).
- [ ] T025 [US3] Densité du dépôt : 4 px / 12 px / 8 px (M11).
- [ ] T026 [US3] État vide en `1.12fr / 0.88fr`, ratios de `has-preview` inchangés (M1). À faire après T023 à T025.
- [ ] T027 [US3] Mesurer avec un fixture de prévisualisation **existant** les états M2 et M3 : colonne CSV ouverte et repliée, centrage de la tuile. Ne rien importer.
- [ ] T028 [US3] Historique : pastilles de statut si la valeur est > 0, actions sur une ligne (M15, M16). **Après coordination** avec les lots couleurs et pop-ups R10.
- [ ] T029 [US3] Preuve native à 1600, 1280 et 390, vide et historique, puis prévisualisation via fixture.

**Checkpoint US3.**

## Phase N : Transverse

- [ ] T030 [P] Marge de page commune Student Management / Mass Import (S9, M4) et navigation identique entre les deux pages (M6), une fois la référence Penpot tranchée en T016.
- [ ] T031 Mettre à jour les registres EasyStud (projection, intake) avec un lot et une preuve par tâche, sans fermer la checklist humaine.

## Phase 6 : US4 — Harmonisation visuelle avancée (P4, après validation de Kevin)

Sources : `PROPOSITIONS-UI-AVANCEES.md` et `maquette-harmonisation.html`.

- **Objectif :** un écran moins agressif, avec une couleur par rôle (bleu = action, vert = position, encre = lecture, gris = information) et des titres de carte qui ressortent.
- **Test indépendant :** à 1600, compter les éléments bleu primaire visibles au repos dans Student Management. Il ne doit rester que les boutons et la sélection, plus aucune icône d'action de carte au repos. Les titres de carte doivent être l'élément le plus contrasté de leur ligne.

- [ ] T032 [US4] Vérifier dans Penpot Foundations la couleur peinte du titre de carte (#16324f ou #264861, contradiction dans `docs/components/cards.md:70` et `:75` du Kit) ; faire trancher A3 par Kevin.
- [ ] T033 [US4] Titres de carte, option retenue : couleur via `--easyedu-card-identity-title-color`, letter-spacing 0 dans `card-title`. Côté Kit si la recette change, puis Foundations, puis synchronisation EasyStud.
- [ ] T034 [P] [US4] Compteurs « n membre(s) / groupe(s) » : pastille remplacée par `card-title-context`. Pastille de groupement en `--easyedu-grouping-soft` sans bordure.
  - Fichiers : `templates/manage.mustache` (rendu des compteurs), `amd/src/course_manager.js` si les compteurs sont mis à jour dynamiquement.
  - **Coordination R10-09** (compteurs) et **R10-10** (badges).
- [ ] T035 [P] [US4] Actions de carte : teinte de repos `--easyedu-text-muted`, primaire au survol, au focus et sur carte sélectionnée. Contraste ≥ 3:1 à vérifier.
- [ ] T036 [US4] Couloirs : fond `--easyedu-surface-soft`, rayon 12px, padding 14px par colonne ; panneau de filtres sans cadre ni ombre en tête de couloir ; cartes sans ombre au repos (ombre au survol et sur la carte saisie).
  - Après T017 et T018 (gouttière et ratios).
- [ ] T037 [P] [US4] Guide GS1, GS2, GS5, GS8 et GS9 : largeur de lecture 42rem, titre en encre (**coordination R10-31**), étiquette de démo, étiquettes de zone, points à retenir en 3 colonnes.
- [ ] T038 [US4] Guide GS3 et GS4 : onglets par chapitre et numérotés, libellés courts (chaînes FR/EN validées par Kevin), pictogramme de parcours au lieu du badge « GUIDE » (**coordination R10-32**).
- [ ] T039 [US4] Guide GS10 : **seulement si Kevin accepte de modifier le contrat** de la ligne de cue commune (EasyStud AGENTS.md:265-269).
- [ ] T040 [US4] Preuve native : captures avant / après à 1600, 1280 et 390, FR et EN, sans acceptation humaine revendiquée.

**Checkpoint US4.**

## Phase 7 : US5 — Contrat de modale unique, porté par Foundations (P2, demandé explicitement par Kevin)

Source : `PROPOSITION-MODALES.md`.

**Décisions de Kevin :**
- **En-tête** : celui des modales de carte (`entity-dialog__header`).
- **Pied** : celui du Guide, toujours visible, avec des boutons de 1.9rem.
- **Foundations** : Codex **met à jour Foundations**, le Kit puis Penpot, avant les consommateurs.

**Test indépendant :** les 9 modales inventoriées partagent le même en-tête (eyebrow, titre, tuile 32, fermer 30), le même pied (collant, filet, fond, boutons 30.4px, primaire à droite) et une seule classe de fermeture. Escape ferme chacune d'elles, et le focus entre dans la modale à l'ouverture.

- [ ] T041 [P] [US5] **D1 (défaut avéré)** : modales de carte (participant, groupe, groupement). Déplacer le focus dans le dialogue à l'ouverture, faire fermer par Escape et rendre le focus au déclencheur.
  - Fichier : `amd/src/course_manager.js` (ouverture des modales `data-easystud-user-modal` et `data-easystud-advanced-settings-modal`).
  - Test natif : `activeElement` dans le dialogue ; fermeture par Escape ; focus revenu sur le bouton œil ou engrenage.
- [ ] T042 [P] [US5] **D3** : accents des chaînes FR, dans `lang/fr/local_groupimport.php` et les `aria-label` ou infobulles codés dans le JS.
  - Chaînes : « Paramètres avancés », « Aucune image de groupe configurée », « Aucun fichier sélectionné », « Données de configuration ».
  - Rechercher les autres chaînes sans accent du même type.
- [ ] T043 [US5] Kit : recette publique `dialog-header`, unifiant `entity-dialog__header`, `easyedu-dialog-header` et confirmation, avec eyebrow, titre, tuile et variantes `--danger` / `--success`. Une seule classe de fermeture : `easyedu-dialog-close`, 30px.
- [ ] T044 [US5] Kit : recette publique `dialog-footer`, extraite du pied du Guide.
  - Grille de dialogue `auto 1fr auto` et défilement du corps seul.
  - Filet #d9e2ec, fond #fbfdff, padding 10/18.
  - Boutons Small 1.9rem, 0.78rem/600, min-width 5.75rem, gap 10px.
  - Tactile (`pointer: coarse`) : `--easyedu-touch-target-min`.
  - Ordre : tertiaire à gauche, secondaire puis primaire à droite.
- [ ] T045 [US5] Penpot Foundations : mettre à jour la famille Modal ou Dialog (Library + Standards) avec T043 et T044, puis faire valider par Kevin. Publier Foundations.
- [ ] T046 [US5] EasyStud : adopter le contrat dans `easystud-modal` (Déplacer, Confirmer la suppression), puis dans `import-modal` (Restaurer). Le pied centré Bootstrap 36px disparaît.
  - Fichiers : `templates/manage.mustache`, `index.php` (ou son template), `scss/views/_mass-import.scss`, `amd/src/csv_import.js` si les sélecteurs changent.
- [ ] T047 [US5] Historique des imports : en-tête au contrat ; pied avec résumé (« n imports ») et Fermer.
- [ ] T048 [US5] Modales de carte : structure commune « entity dialog » (identité, informations sans cartes de champ, relations en `card-disclosure` + `related-person-row` / `related-tags` sans défilement imbriqué, image via `easyedu-file-deposit`), pied collant avec « Modifier dans Moodle » à gauche. Corriger les libellés D5.
  - **D2 est corrigé par le pied collant.**
  - Test : à 1280×800, Enregistrer visible sans défiler.
- [ ] T049 [US5] Guide : en-tête avec l'eyebrow « GUIDE EASYSTUD », l'exception décidée par Kevin le 11/10 ; toutes les autres modales ont « EASYSTUD », et les autres plugins le nom de leur plugin. Sous-titre retiré de l'en-tête. Proposer en Penpot un titre qui ne répète pas l'eyebrow. Pied déjà conforme.
  - **Coordination R10-01** (palette des pop-ups).
- [ ] T050 [US5] Modale Message (Moodle core) : habiller `modal-header` et `modal-footer` avec les classes du contrat, sans réécrire la modale core. Titre court « Envoyer un message » ; titre visible pendant le chargement (D4).
- [ ] T051 [US5] Preuve native, les 9 modales à 1600, 1280×800 et 390, FR et EN :
  - mesures d'en-tête et de pied identiques ;
  - Escape et focus ;
  - aucun bouton de pied hors écran.

**Checkpoint US5.**

**Dépendances :**
- T041 et T042 sont indépendants et peuvent partir tout de suite.
- T043 et T044, puis T045, puis T046 à T050.
- T048 peut suivre T046 en parallèle de T047, T049 et T050, s'il touche des fichiers différents.

## Phase 8 : US6 — Performances et qualité continue (P3, mesurer avant d'optimiser)

Ajoutée le 11/10 à la demande de Kevin.

**Mesures de départ** (runtime `02d8c78`, cours de test : 24 participants, 54 groupes, 14 groupements, Moodle probablement en mode développement) :

| Élément | Mesure |
| --- | --- |
| `styles.css` | 1 337 650 octets, 289 `!important`, 70 partiels SCSS |
| `amd/build/course_manager.min.js` | 311 995 octets (10 428 lignes de source) |
| `easyedu_guide.min.js` | 95 317 octets |
| Student Management | 13 878 éléments DOM dans le plugin ; 171 nœuds `[data-easystud-group-id]` dont **161 non visibles** (autres vues ou pages pré-rendues) |
| Chargement | DOMContentLoaded 6.0s, load 6.5s : **non représentatif**, `core/first.js` fait 969 Ko, les caches JS semblent désactivés |

**Aucun gain n'est chiffré tant que T052 n'est pas fait.**

**Contrainte de Kevin (11/10) :** l'interface doit rester **dynamique, sans chargement au clic**. Changer de page, de vue ou de filtre reste instantané et conserve les animations. Le rendu à la demande se fait **côté navigateur**, à partir de données chargées une fois. La pagination serveur par AJAX est exclue en première approche.

- [ ] T052 [US6] **Audit mesuré**, prérequis de toute optimisation.
  - Cours de test **dédié et volumineux**, créé par fixture explicite, jamais sur données réelles : environ 800 participants, 150 groupes, 40 groupements, appartenances multiples.
  - Mesures en conditions proches de la production (caches Moodle actifs), **à coordonner** avant tout changement de configuration du runtime :
    - nombre d'éléments DOM ;
    - DOMContentLoaded / load ;
    - tâches longues (Performance API) au chargement, au changement de vue, de page et de filtre, et à l'ouverture de « Plus de filtres » (lien R10-11) ;
    - taille des réponses AJAX ;
    - nombre de requêtes SQL de `manage.php` et des endpoints (perfdebug Moodle).
  - Livrer un rapport avant / après réutilisable.
- [ ] T053 [P] [US6] **Poids CSS.**
  - Vérifier si `styles.css` est bien chargé sur **toutes** les pages Moodle via le CSS du thème : mesurer sur une page hors plugin.
  - Audit Coverage : doublons entre Kit embarqué et adaptateurs historiques `scss/components`, `views` et `responsive`.
  - Proposer, sans l'appliquer d'office, un découpage : socle minimal global, styles de pages chargés seulement sur les pages du plugin via `$PAGE->requires->css()`.
  - Réduire les `!important`.
- [ ] T054 [US6] **Rendu à la demande côté navigateur** (après T052, US2 et US5, pour travailler sur une mise en page stable ; derrière un drapeau de configuration).
  - D'abord une note de conception : le modèle de données devient la source de vérité ; seules la page et la vue visibles sont dans le DOM ; préparation de la page suivante pendant les temps morts.
  - Fonctions à porter sur les données plutôt que sur le DOM :
    - recherche et filtres ;
    - Tout sélectionner, sélection multiple et barre collante ;
    - compteurs ;
    - glisser-déposer entre pages ;
    - cibles du Guide (« Voir dans l'interface » doit rendre la carte cible avant de la surligner) ;
    - animations de cartes et de vues inchangées.
  - Critère : aucune requête réseau au changement de page, de vue ou de filtre ; durée mesurée avant / après sur le cours de T052. **Pas de cible chiffrée inventée** : la fixer après T052.
- [ ] T055 [P] [US6] **Découpage JS.** Charger à la première utilisation les modules modales, glisser-déposer, filtres avancés, ainsi que le Guide à son ouverture. Mesurer le poids initial avant / après.
- [ ] T056 [P] [US6] **Tests de non-régression visuelle par contrat.**
  - Captures et mesures automatiques des en-têtes et pieds des 9 modales.
  - Gouttières des 3 vues, bords gauches de Mass Import, centrage du bouton principal.
  - Un échec si une valeur du contrat dérive.
- [ ] T057 [P] [US6] **Contrôle automatique des textes FR et EN** : accents manquants, pluriels « (s) », capitales, chaînes et `aria-label` codés en dur dans le JS hors fichiers de langue.
- [ ] T058 [P] [US6] **Passe d'accessibilité complète** : focus, Escape et retour du focus sur **toutes** les modales et panneaux (D1 laisse penser qu'il y a d'autres cas), contraste des éléments neutres d'US4, mouvement réduit, alternative clavier au glisser-déposer.
- [ ] T059 [US6] **Passe tablette (768–1024) et mobile (390)** des trois surfaces et des modales, non couverte par la revue Claude.
- [ ] T060 [P] [US6] **Hygiène des tokens** : remplacer les tailles en dur du SCSS Discovery (`.88rem`, `.78rem`, `.68rem`) par les rôles typographiques du Kit, et réduire les surcharges locales.
- [ ] T061 [P] [US6] **États de chargement et états vides unifiés** : squelettes Kit, titres présents pendant le chargement (D4), même composant d'état vide partout.

**Checkpoint US6** : rapport T052 avant / après, sans acceptation humaine revendiquée.

**Dépendances :**
- T052 avant T053, T054 et T055.
- T054 après US2 et US5.
- T056 à T061 parallélisables, mais T056 après US5 pour figer le contrat.

## Dépendances

- **Phase 1** : aucune dépendance. T002 et T003 conditionnent T018, T023 et T030.
- **Phase 2** : peut démarrer tout de suite. T004, T005 et T006 sont indépendants.
- **US1, US2 et US3** : indépendants entre eux après la phase 1, mais dans l'ordre de priorité de la mission si une seule fenêtre intègre.
- **Dans US1** : T007, puis T008, puis T009, puis T010 et T011, puis T012, puis T015. T013 et T014 sont parallèles.
- **Dans US3** : T023, T024 et T025, puis T026.

## Parallélisme possible

- T004, T005 et T006, sur des fichiers différents.
- T013 et T014 pendant T009 à T012, s'ils ne touchent pas les mêmes blocs du template. Sinon, les faire en séquence.
- T019 et T021 en parallèle de T017 et T018.

## Stratégie

1. **D'abord la phase 2** : trois défauts avérés, petits, avec une preuve rapide.
2. **Ensuite US1 complet** : c'est la priorité utilisateur. Démo à Kevin.
3. **Puis US2 et US3**, un lot et une preuve par tâche.

## Priorités mises à jour après le complément « modales »

Les défauts avérés passent devant :
1. **T041** : focus et Escape des modales de carte.
2. **T004** : tiroir Moodle au-dessus du Guide.
3. **T005** : centrage du bouton « Prévisualiser l'import ».
4. **T042** : accents.

Ensuite, US1 (Guide) et US5 (contrat de modale dans Foundations) peuvent avancer en parallèle, car ils touchent des fichiers différents, sauf T049.

## Trois actions prioritaires (première passe)

1. **T004** : tiroir Moodle au-dessus du Guide. Défaut visible en mobile, correction isolée.
2. **T009 + T010** : mode Ajouter / Déplacer et résultat prévu **avant** la démo. C'est la demande centrale du Guide.
3. **T005** : bouton principal Mass Import décentré de 15 px. Cause identifiée, correction d'une règle.
