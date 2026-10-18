# K16-80 — Choix de filtre et libellés de commande

Base `07b1dfe6`, famille F15. Trois variantes Kit : `filter-choice-touch-frame`, `filter-choice-selected` et `pagination-command-label`. Elles centralisent le minimum tactile, la palette sélectionnée et le libellé hérité des commandes de liste. Les seuils responsive, le menu natif, le moteur et les états ARIA restent inchangés.

F15 :13→8 déclarations, aucune nouvelle. Les8 restantes recoupent notamment les commandes de sélection livrées séparément par F10/F14 ; ne pas dupliquer ces corrections. Extraction seule : les quatre CSS complets sont identiques après CRLF/LF, ordre compris. Le contrôle strict impose ensuite une seule addition `line-height:normal` sur les boutons de choix tactiles ; toutes les autres déclarations ordonnées restent identiques.52 SCSS partagés identiques au Kit candidat, global0 règle. Prérequis6317256/84087e4 documentés dans `baseline.json`.

Build conservative Node22.11.0/Sass1.79.1, checker officiel non-PHP0 erreur/0 avertissement et portes sync/T037/T038/aller-retour PASS. Aucun JS, PHP ou template modifié, aucune hausse ESLint AMD.

Recette PASS : commandes de sélection FR/EN1600/390, puis vrais choix de filtre de groupements en390 (Tous/Avec groupes, trois boutons),40 mesures et4 contrôles de masquage au bureau. Les choix réservés au responsive restent masqués à1600 : aucune géométrie desktop fictive. Leurs centres passent de0,84375 à0,0078125px au maximum. Leurs hauteurs deviennent exactement44px dans les deux langues ; en FR, la métrique naturelle réduit l’ancienne hauteur49,375px de5,375px, écart voulu pour centrer les deux lignes sans les couper. EN44px inchangé, rayons/paddings/palette inchangés,0 erreur console. Le Range du texte complet reste contenu dans chaque bouton.

Preuves et reçus : `C:/dev/artifacts/k16-80-filter-choices-20261018/native.json`. Le cours303, les groupements pleins/vides et les comptes synthétiques sont supprimés, le bail est libéré. CSS en mémoire sur :8051 seulement, aucune publication ni cache/fichier runtime changé. Le premier scénario ignorait la fermeture automatique du panneau après choix : il est conservé, le successeur le rouvre par la commande native. L’oracle strict a ensuite conservé l’échec préexistant de centrage ; seul le Kit a été corrigé, pas la tolérance.

## Report Penpot

`filter-choice-touch-frame` et `filter-choice-selected` : filtres Groupements en390, inactif/actif, cibles égales44px, métrique naturelle et recentrage0,84375→0,0078125px ; `pagination-command-label` : commandes des listes1600/390. Reporter aussi la réduction FR49,375→44px, sans changement de padding/rayon/palette. Ne pas rendre les choix mobiles visibles au bureau pour les mesurer.
