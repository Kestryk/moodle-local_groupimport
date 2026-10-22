# K16-80 — Cadres des commandes de sélection

Base `07b1dfe6`, famille F14 de l’inventaire (les sélecteurs de sélection recoupent F10/F15). Deux variantes Kit ajoutées : `pagination-select-frame($height)` et `pagination-select-compact`. La première reçoit le jeton de hauteur accepté de la ligne de résultats ; la seconde centralise la densité compacte, ses largeurs et son padding. La priorité `width:auto!important` existante est déplacée, aucune priorité nouvelle n’est introduite.

F14 :8→4 déclarations, aucune nouvelle. Les4 restantes correspondent au pied de carte et à la palette déjà traitée séparément par F10 ; ne pas compter ces recoupements comme des nouveaux défauts ou dupliquer la correction F10. Les quatre CSS complets sont identiques après normalisation CRLF/LF, ordre inclus ;52 SCSS partagés identiques au Kit candidat, global0 règle. Prérequis6317256/84087e4 enregistrés dans `baseline.json`.

Build conservative Node22.11.0/Sass1.79.1, checker officiel non-PHP0 erreur/0 avertissement, sync/T037/T038/aller-retour PASS. Aucun AMD/PHP/template modifié, aucune hausse ESLint AMD.

Recette native PASS : commande réelle Tout sélectionner/Tout désélectionner, FR/EN1600/390,16 mesures avant/après. Hauteurs exactement25,90625px au bureau et29,59375px en mobile, paddings/rayons/couleurs/type identiques ; écart maximal de centre0,4375px, aucune erreur console. Preuves dans `<workspace>/artifacts/k16-80-selection-frames-20261018/native.json`. CSS candidat en mémoire sur :8051, cours300 et comptes synthétiques supprimés, bail libéré. Aucune publication ou modification de fichier runtime/cache.

## Report Penpot

`pagination-select-frame` et `pagination-select-compact` : barre de sélection, états sélection/désélection, bureau/tactile1600/390. Conserver la géométrie et les couleurs acceptées ; aucune nouvelle valeur visuelle voulue. La variante de palette discrète est livrée séparément par F10.
