# Arrêt Kevin — candidat groupe non publié

Reprise : Source2b95f515, runtimece778875, Kit423f691, aucun cherry-pick. Deux fichiers de test non commités (group-grid-centres-native.spec.js et summarize-group-grid.cjs), aucun fichier produit non commité. Dernière fixture201539797 complètement restaurée ; relations préexistantes inchangées. Aucun processus interrompu n'a été relancé sans nouveau lease.

Audit Kevin inchangé, run easystud-authenticated-20261015T203352900Z-31332 : PASS, zéro FAIL sur le candidatce778875. Cela ne certifie pas l'absence d'aggravation des points A–J. La recette groupe complète n'est pas acquise : premier FR1600 vide/plein + pied réel conforme (colonnes0 à .008px, header.5px, chevron/sélection32px, hit-tests et sélection/désélection4membres PASS), puis échec de capture sur le panneau Groupes masqué après changement de vue. Aucun échec n'est supprimé ni remplacé par une acceptation. Les deux tests préparés restent des candidats non exécutés.

Décision appliquée : conserver la branche groupe et le Kit poussés ; rétablir sur localhost le code validé du raccord listes longues (Source43cb82da, runtime de référencec61d6e12), sans ce candidat groupe. Ne plus coder A–J ce soir. Aucun autre lot commencé.

## Relevé Git ciblé A–J (sans recette supplémentaire)

Les hashes ci-dessous introduisent les règles identifiées ; ils ne constituent pas une certification de la cause visuelle complète.

| Point | Commit/règle identifié ; limite |
|---|---|
| A | fd944999, scss/easyedu/components/_cards.scss, person-card-aligned-content : meta-label visuellement masqué (clip). Origine du tassement global : inconnue. |
| B | Cause du bouton cassé inconnue. fd944999 introduit filter-actions-stacked / selection-recovery-action ; 46916cb6 ajoute filter-panel-trailing-actions dans _k16-finish.scss ; raccord de désactivation dans local/cm/filters.js par2f2443c9. |
| C | Nouveau style vide : fd944999 (Kit entity-card-empty-line) puis2f2443c9 (templates/sm/group_card.mustache, local/cm/cards.js). Candidatcb3cbf1a et2b95f515 changent sa grille ; cause de l'aspect signalé non recettée. |
| D | 56ba011f intégréfedda1eb : local/cm/long_lists.js syncMemberWindow masque les anciens toggles et borne les lignes ; group_cards.js retourne par ce nouveau chemin. Le déplacement de contrôle du candidat2b95f515 n'est pas retenu sur localhost. |
| E | ee938afc : local/cm/filters.js force count=0 quand aria-expanded=false (absence repliée confirmée par diff). Kit filter-disclosure-count ramené16px parfd944999 ; origine de l'écart chevron/glyphe non établie. |
| F | cfe7ac6a : _card-labels.scss harmonise la barre32px ; fd944999 : _k16-finish.scss adopte pagination-select-button pour le rayon. Origine exacte du style cassé de Réinitialiser : inconnue. |
| G | Grossissement au survol/clic : inconnu. cfe7ac6a fixe les contrôles32px dans _card-labels.scss ; règles hover/focus dans Kit _pagination.scss et focus.ring. Aucun grossissement précis attribué sans recette. |
| H | Cause visuelle précise inconnue. fedda1eb /56ba011f, long_lists.js syncMemberWindow : masquage général puis exception ungrouped ; placement conditionnel du toggle. |
| J | Recette ovale Kit action-menu-trigger :34448eb2, scss/easyedu/components/_buttons.scss (radius999px, min-width2.08rem/min-height1.64rem) ; consommation bandeau _layout.scss par46b6e74c. Jaune : rôle primary-soft configurable, origine Git de la valeur active inconnue. |

Preuves : git log -S et diffs ciblés, aucune correction de ces points. I n'a pas été demandé. Référence de la recette listes longues : docs/testing/long-lists-k16-22-parity-2026-10-15.md (32états,1042pastilles22px,centrage0,10fiches différées,fixtures restaurées).

## Retour effectu?

- Branche candidate conserv?e : work/codex1/easystud-k16-pills-20261015 ; produit2b95f515, sauvegarde977d0b57 puis pr?sent rapport. Kit423f691 conserv? sur sa branche, non consomm? par le runtime r?tabli.
- Branche de repli isol?e : work/codex1/easystud-validated-localhost-20261015, commitdf94819a. Revert propre des seuls trois commits de candidat groupe, sans conflit source ; arbre Git exactement identique ? Source43cb82da.
- Runtime final57f92492 : diff int?gral contre runtime valid?c61d6e12 vide, caches purg?s. Les18?checs groupe historiques de la r?f?rence ne sont pas une nouvelle certification0FAIL ; le0FAIL du soir concerne uniquement le candidat retir?ce778875.
- Aucun3ac0523e, b6fdedb3, Z-A/K16-14 ou R6/R8/R9 commenc?. Arr?t ? la consigne Kevin ; aucune recette lourde suppl?mentaire ni correction A?J.
