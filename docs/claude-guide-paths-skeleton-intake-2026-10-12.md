# Complément Claude — parcours et prévention skeleton/rendu

Programme `EED-UI-2026-0073`. Reçu et lu intégralement le12 octobre2026.
Complète les61 tâches initiales et tous les retours R10/SM ; ne les remplace pas.
Checklist humaine ouverte. Travail séquentiel dans les Source/Kit existants.

## Sources immuables et recontrôle

Dans le dossier externe `easystud-claude-interface-review-20261011/revue-2026-10-11` :

- `AUDIT-PARCOURS-GUIDES-2026-10-12.md`, SHA256
  `3e5ed7a9bdd03098d794abde76b018aa51555501d7efe54d5f6f29a793d48212`.
- `PASSATION-PREVENTION-SKELETON-RENDU-2026-10-12.md`, SHA256
  `dfb7b3ef4080f7ea6c3c9ad0f7b7d239e450f64ae4300af65abe22a81eb7710c`.

Claude a lu runtime4492a10, pas le rendu courant en navigateur. Baseline actuelle
recontrôlée Sourceca53971 / Kit7728357(185) / runtime9135235. S1 est encore
présent : highlight1020 dans body, checklist1071, modales1050/1070. Cela confirme
le défaut statique, pas encore la preuve native des12 étapes. T037-A terminé
techniquement reste conservé ; GS1/GS2/GS5/GS8/GS9 restent en attente derrière S1
et les corrections de signaux, sans suppression de leur portée.

## Lots parcours (préfixe PG pour éviter les arbitrages A1/A2/A3 déjà validés)

| Lot | Demande conservée | Ordre / décision | État |
| --- | --- | --- | --- |
| PG-S1 | Highlight au-dessus des modales, checklist au-dessus du highlight ;1020 hors dialogue ; scroll/fermeture/forced-colors | Premier, demande Kevin | Diagnostic courant confirmé ; correctif/test à faire |
| PG-A2 | try-context : toutes les ouvertures du menu participant (clic droit/bouton/appui long), jamais une carte groupe | Après S1 | À faire |
| PG-A1 | try-selection : signal de sélection réelle de participant, pas confirmation de déplacement | Après A2 | À faire |
| PG-A3 | try-actions : requiresStep, garde d'ordre, émetteur précis pour chaque étape ; retirer les faux signaux partagés de ce parcours | Après A1 | À faire ; préserver IDs/progression historique |
| PG-A6 | Rattrapage d'état existant pour sélection/vue/filtre à l'activation d'étape | Après A3, diagnostic navigateur d'abord | Hypothèse à vérifier ; jamais auto-valider création/confirmation serveur |
| PG-A5 | inspect-* : issue après Save vs étape Annuler | Décision Kevin sur contenu/comportement | En attente, pas de relibellé silencieux |
| PG-A7 | choose-grouping : texte Ouvrez l'action vs ouverture automatique | Décision Kevin | En attente |
| PG-A4 | first-structure/create-grouping : conserver, retirer ou ré-exposer | Décision Kevin | En attente ; aucune suppression ni migration automatique |
| PG-A8 | Branche hideChecklist(clearProgress=true) / clearChecklistProgress non utilisée : documenter usage prévu ou retirer sans effacer la progression | Dernier | À auditer |

Les12 cibles modales sont à inventorier depuis le payload actuel, pas le numéro
de ligne ancien. S1 ne modifie ni signaux, ni moteur de complétion, ni persistence,
ni Motion, ni le code métier. Utiliser la détection existante de dialogue externe.
Vérifier le relais des tokens vers le highlight body et le nettoyage de la classe.

Inventaire courant réalisé :9 définitions conservées et12 cibles modales par
langue, validées par `audit-guide-modal-cue-baseline-s1.cjs`. Matrice exacte et
limites de correction dans `guide-modal-highlight-s1-preflight-2026-10-12.md`.
Ce diagnostic ne vaut pas correctif servi ou parcours joué de bout en bout.

**Oracle à corriger avant le test :** pointer-events:none exclut normalement le
highlight d'elementFromPoint. Ne pas lui donner des événements pour satisfaire
le test. Protéger l'état réel none ; lire l'ordre de paint par raster/stacking et
utiliser, si nécessaire, une sonde de hit-test temporaire uniquement dans le test,
restaurée immédiatement. Cette sonde ne prouve pas une interaction du produit.

## Lots skeleton et performances — ordre obligatoire

1. T052 : cours de test volumineux et mesures avant optimisation ; relever la
   sélection de résultats (toutes pages vs page), compteurs et signaux actuels.
2. Recettes manquantes Kit → Foundations : groupe avec membres, groupement,
   ligne participant, tableau d'import, corps de modale. Pas de CSS compensatoire.
3. R10-16 : actions AJAX ciblées → corps de modales → Mass Import → chargement
   initial par régions. Chaque région garde géométrie, erreur/retry et teardown.
4. T055 : modules AMD différés ; trigger occupé, require mémorisé, premier clic
   mis en attente/rejoué exactement une fois ; aucun squelette pleine page.
5. T054 **en dernier**, après T052, US2/US5 stables et I2–I6 natifs : rendu des
   données déjà en mémoire, drapeau désactivé par défaut, deux chemins testés.
   Aucun chargement réseau au clic. Skeleton de liste seulement si T052 mesure
   réellement un rendu supérieur à100ms. Ne pas revendiquer un gain non mesuré.
6. T061 et R10-17 restent liés à tous ces lots : états unifiés, titres présents,
   aucune latence artificielle et preuve finale indépendante.

## Contrat commun d'état occupé

- Indicateur local seulement après150ms sans résultat ; ne pas retarder la réponse.
- Géométrie finale conservée : rail/hauteurs/colonnes, écart avant/après≤1px ou
  CLS≈0 mesuré. Ne pas reconstruire les cartes juste pour afficher le loading.
- aria-busy sur la région ; skeleton aria-hidden ; annonce courte si attente>1s
  puis à la fin. Conserver/restaurer le focus sur l'équivalent ou le conteneur.
- Zone occupée non interactive/non dépositaire ; autres zones utilisables.
- Message Kit/retry sur timeout/erreur, nettoyage destroy/reset/resize.
- Reduced-motion et forced-colors : pas de shimmer ; mixins Kit, sans surcharge.
- Modale : titre présent, corps skeleton, pied visible/désactivé ; Escape actif
  pendant chargement, focus de contenu quand prêt, surbrillance après readiness.

## I1–I13 : grille avant/après chaque lot

Tous les lots de ce chantier doivent renseigner les13 lignes avant et après.
Une ligne non touchée est explicitement « non applicable à ce lot » avec raison
et référence préservée ; pas un PASS natif inventé. Le garde-fou reste requis.

| Invariant | Contrôle conservé |
| --- | --- |
| I1 data-* publics | Inventaire diff + specs existantes sans modification de sélecteurs |
| I2 cibles Guide | Rendre vue/page/carte et attendre la région prête avant highlight ; jamais un skeleton |
| I3 signaux de complétion | Réponse serveur/modèle, jamais présence DOM, rendu/re-rendu/loading |
| I4 sélection | Même sémantique mesurée avant ; modèle conserve simple/multiple/Ctrl/Shift/results/sticky |
| I5 compteurs | Modèle de données ; skeleton au lieu d'une valeur provisoire fausse |
| I6 drag/drop | Cibles hors page accessibles, auto-scroll conservé ; pas de skeleton sur la cible active |
| I7 filtres/pagination | Résultats comparatifs identiques sur le cours T052 |
| I8 Motion | swap/dépliages/cartes conservés ; fondu court sans rejouer l'animation de carte |
| I9 focus/clavier | Tab/Escape/Entrée, focus conservé au remplacement/module ready |
| I10 modales | Focus readiness, Escape même occupé, retour focus/pied visible |
| I11 AMD différé | require unique mémorisé ; premier clic une fois ; AMD nommé/build/jsrev vérifiés |
| I12 drapeau T054 | Off par défaut ; ancien/nouveau rendu testés ; rollback par réglage |
| I13 highlight modal | Même calque fonctionnel du dialogue, après chargement ; scroll/fermeture corrects |

Les exercices de bout en bout qui confirment une création/déplacement nécessitent
un cours de test dédié, une fixture supervisée et son bail. Aucun scénario métier
sur données réelles. Tests open/cancel, états QA simulés, confirmation native et
acceptation humaine sont quatre preuves distinctes.
