# Student Management — couloirs d'identité approuvés

Programme : `EED-UI-2026-0073`, complément aux 61 tâches Claude existantes.
État : proposition approuvée et enregistrée ; pas encore implémentée.
Date de réception et d'approbation par Kevin : 2026-10-12.

## A2 reçu après le premier enregistrement

Kevin choisit **la largeur réellement disponible du panneau**, notamment lorsque
les tiroirs Moodle sont ouverts. Les ratios utiliseront donc une container query
sur l'enveloppe commune de la paire de colonnes, pas sur chaque couloir étroit.
Conserver les seuils d'empilement existants ; vérifier le seuil de ratio proposé
1400px utiles et ses bords natifs dans les trois vues. A2 ne bloque plus T018.
Les mentions « A2 ouvert » plus bas sont l'historique du premier enregistrement.
Le détail pagination reste séparé, car CSS ne peut attribuer `disabled`.

## Périmètre et ordre

| Champ | Valeur |
| --- | --- |
| Propriétaire | Fenêtre d'intégration EasyStud / Kit existante |
| Source | Worktree `easystud-foundations-student-management-20260928`, branche `work/port4719pg3/easystud-foundations-student-management-20260928` |
| Kit | Worktree `easyedu-ui-kit-phase0-mass-admin-20260927`, branche `work/port4719pg3/eed-ui-2026-0073-kit-phase0-mass-admin` |
| Inclus | T017, T018, T019, T021 et T036 ; recette SCSS partagée, compositions liées, trois vues, assets CSS et preuves ciblées |
| Exclus | Modification de templates, classes de markup, attributs `data-*`, PHP produit, JS/AMD, commandes métier, sélection, pagination fonctionnelle et Motion |
| Runtime | Preview Moodle 5.1 existante ; promotion et tests sous les baux habituels, aucun accès concurrent ni push runtime |
| Chaîne | Kit → Foundations Library/Standards → Penpot EasyStud → imports/includes SCSS du consommateur → CSS compilé → preview → tests natifs |
| Escalade | Kevin pour A2 et pour tout besoin fonctionnel incompatible avec la limite CSS uniquement |

La priorité Guide reste en place. R2-1 et R2-3, prérequis explicitement demandés,
sont déjà servis et vérifiés avec R2-2/R2-4/R2-5 sur les assets Source `86e777b`,
Kit `98cfcc7` (0.4.182), runtime `f65e77b`. La preuve combinée est
[guide-review2-mobile-2026-10-12.json](testing/guide-review2-mobile-2026-10-12.json)
(run 12108, 12 cas et 1332 observations). Cela ne clôt pas la checklist humaine.

Le lot couloirs rejoint la tranche Student-US2 / Visual-US4 après ces prérequis,
sans remplacer les lots Guide T014/T015 encore ouverts ni les retours antérieurs.
L'enregistrement de ce complément ne constitue ni une activation de style ni
une acceptation humaine du rendu final.

## Source et arbitrages conservés

Source lue intégralement :
`C:/dev/artifacts/easystud-claude-interface-review-20261011/revue-2026-10-11/PROPOSITION-SM-COULOIRS-2026-10-12.md`.
SHA256 : `8012fc8516ca2771f374fdd6f8d76f1b2a41ad116aeed6b22691f14c1c2df2ec`.

Le document externe dit encore « à valider » ; le message explicite de Kevin
approuve sa proposition de couloirs. Son essai CSS dans le navigateur de Claude
n'est pas du code livré : ne pas copier son injection ni son éventuel `!important`.
Les captures/mesures sont historiques, runtime `4492a10`, pas la baseline actuelle.

L'approbation ne choisit pas explicitement entre viewport et container query :
la proposition renvoie elle-même à A2. Conserver ce point ouvert dans T002/T018.
Ne pas inventer de nouveau breakpoint ni modifier silencieusement les seuils
existants de 1200 / 1024 px. Les ratios ci-dessous sont ceux des propositions ;
leur déclenchement dépend de cette décision et du contrôle des tiroirs Moodle.

## Correspondance des lots

Les `receivedScope` du plan initial et leurs preuves restent immuables. Les
compléments approuvés sont ajoutés dans l'intake, pas substitués aux anciennes tâches.

| Lot | Complément approuvé | Critère |
| --- | --- | --- |
| T017 | Gouttière unique 1.5rem / 24 px entre couloirs dans les trois vues | Même espace à chaque niveau de grille apparié ; pas de filet ni faux drop target |
| T018 | Groupes / Groupements 1.1fr / 0.9fr au-dessus du seuil A2 ; 1fr / 1fr en dessous | Création et listes suivent le même ratio ; Motion.swap sans saut ni e-mail ordinaire tronqué |
| T019 | Inset symétrique 1rem / 16 px ; retirer les décalages supplémentaires de la liste groupes et de tree | Bords filtre / barre / cartes identiques, delta cible 0 ; barres gauche/droite sur la même ligne |
| T021 | Même rayon et ombre légère au repos pour les cartes des deux colonnes | Rayon canonique correspondant à 12.8 px ; ombre cible `0 1px 2px rgba(31,42,55,.05)` ; hover/drag distincts |
| T036 | Recette partagée « couloir » : surface soft continue, liseré supérieur d'identité 3 px, arrondis haut/bas | Tokens surface/rail/radius, aucun hex spécifique consommateur ; publication source puis trois vues |

T021 conserve aussi sa demande initiale sur les contours des membres/états vides :
ne pas supprimer le pointillé d'une véritable zone de dépôt active. T036 reçoit
un successeur explicite : **16 px** remplace les 14 px de l'essai et une **ombre
de repos légère** remplace la proposition initiale sans ombre. Ne pas effacer
les anciennes valeurs de l'historique ni généraliser ces choix à tout le Kit.

Recette et variantes à préparer :

- Fond `--easyedu-surface-soft`, continu de la création/filtres au bas de la liste ;
  pas de cadre/ombre propre sur le panneau de filtres en tête du couloir.
- Rayons de couloir haut et bas, cible 12 px, portés par les tokens/recettes Kit.
  Les cartes gardent leur rayon partagé distinct ; ne pas confondre les deux rôles.
- Identité via `--easyedu-participant-rail`, `--easyedu-group-rail` ou
  `--easyedu-grouping-rail`, liée aux couleurs configurables déjà présentes.
- 12 px entre barre de liste et première carte ; 10 px entre cartes dans les
  deux colonnes ; vérifier les unités des tokens à la taille de racine réelle.
- Participants & groupes : même recette, identités Participant et Group ; ratio
  proposé initialement 0.9fr / 1.1fr sous réserve A2.
- Groupes & groupements : identités Group et Grouping ; ratio 1.1fr / 0.9fr.
- Vue complète : même recette, hiérarchie Participants / Structure et identités
  des listes conservées ; ratio proposé initialement 0.85fr / 1.15fr sous réserve A2.
- À 1200 px et en dessous, vérifier la structure réellement empilée : arrondis
  haut/bas complets et 16 px entre couloirs empilés ; pas de cascade qui transforme
  les espaces imbriqués en double gouttière.

La création d'une barre absente en Vue complète ou la modification de
`scheduleCompleteListAlignment` relève de T020, pas de cette autorisation CSS.
Le nouveau lot teste la fonction inchangée ; il n'en réécrit pas l'algorithme.

## Pagination : détail retenu, incompatibilité à traiter séparément

Objectif Claude : garder Premier / Dernier désactivés plutôt que masqués à deux
pages, afin de stabiliser la géométrie. Audit Source `555c7f3` :
`amd/src/course_manager.js`, `refreshPagination`, pose `edge.hidden = pages <= 2`
mais ne désactive Premier qu'en première page et Dernier qu'en dernière page.

**CSS ne peut pas attribuer `disabled` à un bouton.** Forcer l'affichage des
boutons `hidden` rendrait donc certains boutons actifs, contrairement à l'objectif,
et dégraderait les sémantiques de visibilité/focus. Ne pas contourner cette limite
avec `pointer-events`, une fausse opacité disabled, un pseudo-bouton ou du JS.

Conserver un sous-lot `pagination-native-disabled` en attente d'autorisation
fonctionnelle séparée. Dans la tranche CSS, vérifier/réserver la géométrie des
emplacements existants sans réafficher les commandes masquées ; cette réserve,
si réalisable, ne doit pas être annoncée comme la demande disabled accomplie.
Ce point ne bloque pas les cinq tâches de couloir indépendantes.

## Séquence de réalisation et preuves à produire

1. Recontrôler SHA, fichiers et grilles des trois vues et les compositions Penpot
   actuelles. Mesurer filtre/barre/première carte, rythme, ombres et vrais wrappers.
2. Ajouter la recette opt-in dans la famille panels/workspace du Kit. Garder les
   imports/includes du plugin comme adaptateurs des sélecteurs existants, sans
   CSS privé divergent ; aucun markup ou moteur modifié.
3. Publier Library et Standards Foundations avec les trois identités et états
   desktop/empilé. Vérifier sauvegarde, texte/icônes, géométrie et raster avant
   propagation aux trois compositions produit liées.
4. Synchroniser les seuls modules nécessaires et compiler avec le Sass déjà
   utilisé par le consommateur. Comparer le CSS complet hors périmètre ; vérifier
   l'identité intégrale des templates, JS/AMD, PHP et Motion avec la baseline.
5. Promouvoir les commits privés poussés dans la preview propre, sous bail,
   puis exécuter les tests natifs suivants. Ne pas tester un style seulement injecté.
6. Enregistrer séparément source, design sauvegardé, preview servie, preuve native
   et validation humaine. Aucun de ces quatre premiers états ne ferme le dernier.

## Matrice native obligatoire — §4 de Claude et contrôles liés

| Contrôle | Action / preuve exigée |
| --- | --- |
| Trois vues | EN/FR, 1600 et 1280 ; delta des deux bords filtre/barre/cartes, barres sur une même ligne, gutter et rythmes, titres longs contenus |
| Empilement | Frontière 1200 et de part et d'autre, 1000, tablette et 390 ; bonnes identités, arrondis, espace 16 px, aucune superposition ni overflow |
| Groupe → Groupement | Vrai geste souris jusqu'à cible visible ; aucun fond interceptant ; auto-scroll haut/bas préservé ; annuler avant tout changement métier |
| Membre → Groupe | Même contrôle de cible, hit-testing et auto-scroll ; préserver sélection et dialogue existants ; aucune confirmation métier dans un test de présentation |
| Sticky / pagination | Sélection réelle, premier/milieu/dernier résultat, 1/2/>2 pages et filtrage existant ; aucune action recouverte, géométrie documentée et hidden/disabled natifs inchangés |
| Motion.swap | Bascule des trois vues en normal-motion ; mesures intermédiaires et finales, pas de saut de largeur ; reduced-motion contrôlé séparément |
| Vue complète | `scheduleCompleteListAlignment` inchangé ; listes encore alignées au chargement, après filtre, changement de page et disclosure |
| Guide | « Voir dans l'interface » vers cartes et panneaux, cible réellement peinte/cliquable, retour ; aucune nouvelle cible ou attribut |
| Palette | Couloirs/liserés suivent les tokens configurables, pas les hex de l'essai ; ne pas enregistrer un réglage global juste pour prouver une couleur |

Le geste drag et sa confirmation métier sont des preuves distinctes : si un
transfert réel est nécessaire, demander le lot fixtures/baux/cleanup dédié,
jamais déplacer silencieusement des utilisateurs réels pour valider le CSS.
Les captures restent hors Git, manifestées ; classer les scénarios de source
comme candidats local-supervised, pas comme tests CI déjà exécutés.

## État de cette réception

- Recontrôle initial : Source `555c7f3`, Kit `cb9edab`, runtime `a453c47`,
  trois worktrees propres. Source/Kit ont un upstream et zéro avance/retard ;
  la branche runtime locale conserve ses commits de preview, sans push.
- Validation statique passée : JSON lisible, exactement 61 IDs uniques,
  champs et statuts des 61 tâches initiales inchangés, cinq compléments présents,
  prérequis R2-1/R2-3 retrouvés dans la preuve versionnée, `git diff --check`.
- Plan/intake/contrat/changelog mis à jour ; 61 IDs initiaux conservés.
- Recette Kit, publication Foundations/produit, CSS et tests natifs du couloir :
  **à faire**, aucune preuve inventée à partir de l'essai de Claude.
- A2 reste ouvert ; le détail pagination nécessite une autorisation distincte
  s'il faut obtenir réellement l'état disabled demandé.
- Les autres demandes EasyStud, Mass Import, Guide et futures CCB restent dans
  leurs lots ; aucune modification CCB ni donnée Moodle dans cette réception.
- Aucun nouveau test navigateur, build, changement Penpot, purge ou promotion
  runtime pour cette réception documentaire. Les preuves Guide citées restent
  leurs résultats antérieurs vérifiés dans les documents, pas des tests rejoués.
- Rollback documentaire : retirer ce seul complément par un commit inverse,
  jamais restaurer globalement le worktree ni altérer le plan initial immuable.
- Aucune action humaine maintenant. Prochaine revue : les trois vues après la
  livraison technique du couloir, avec la checklist conservée ouverte.
