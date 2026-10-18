# K16-80 — Champs en ligne

Base `07b1dfe6`, famille F16. Quatre sujets d’une même famille : minimum tactile des contrôles de renommage, surface de l’éditeur, métrique/padding des actions et minimum du champ de création. Variantes Kit : `inline-edit-touch-control`, `inline-edit-surface`, `inline-edit-action($compact:false/true)`, `inline-create-touch-field`.

Le contenu du mixin de surface conserve l’ordre exact des déclarations de disposition du consommateur. Aucun breakpoint, moteur, contrôle natif, texte, template ou comportement n’est modifié. Les valeurs acceptées sont déplacées telles quelles, sans nouveau style par écran. Le contrôle natif strict impose ensuite une hauteur de ligne naturelle aux actions pour corriger leur décentrage préexistant de0,703125px. Les définitions CCB ne sont pas consultées ni modifiées.

F16 :22→15 déclarations locales, aucune nouvelle. Les15 restantes comprennent notamment des recoupements de sélection, des squelettes et l’administration ; elles restent dans l’inventaire. L’extraction seule conserve les quatre CSS complets après normalisation CRLF/LF, ordre inclus. Le correctif de métrique ajoute exactement une règle `line-height:normal` sur les actions de renommage ; toutes les autres déclarations ordonnées sont identiques. Les52 SCSS partagés correspondent au Kit candidat, global0 règle. Prérequis approuvés6317256/84087e4 enregistrés dans `baseline.json`.

Build conservative Node22.11.0/Sass1.79.1 PASS, checker officiel non-PHP0 erreur/0 avertissement, sync/T037/T038/aller-retour PASS : preuves dans `C:/dev/artifacts/k16-80-inline-fields-20261018/`. Aucun AMD/PHP/template modifié, aucune hausse ESLint AMD.

Recette native PASS : renommage réel d’un groupe puis champ de création, FR/EN1600/390,16 mesures avant/après et0 erreur console. CSS en mémoire sur :8051 sous bail, fixture synthétique isolée. Les centres des deux boutons passent de0,703125 à0,0078125px maximum. Leurs hauteurs restent exactement égales :26px au bureau et44px en mobile. Le champ conserve son cadre distinct de38px au bureau et44px en mobile. Aucun changement des largeurs, paddings, rayons, couleurs ou tailles de police.

Le prédécesseur de scénario trouvait deux déclencheurs Renommer en mobile ; la cible directe a été limitée au formulaire d’en-tête. L’oracle suivant exigeait à tort la même hauteur pour le champ et les boutons au bureau : sa preuve est conservée, la distinction des cadres acceptés est explicite. La règle des deux boutons de hauteur égale et du centrage±0,5px reste stricte. L’échec de centrage préexistant est conservé avant le correctif Kit ; seule la hauteur de ligne est modifiée.

Le cours306 et ses comptes synthétiques ont été supprimés, le bail est libéré. Aucun fichier runtime/cache modifié, aucune publication localhost. Focus, annulation et moteur de renommage ne changent pas ; cette recette de métrique ne constitue pas un nouvel audit clavier complet.

## Report Penpot

Les quatre variantes ci-dessus composent l’éditeur de nom et le champ de création ; états ouverts, bureau/tactile1600/390. Conserver les valeurs validées, la grille et les breakpoints du consommateur. Reporter la métrique naturelle des actions et le recentrage0,703125→0,0078125px ; aucun cadre ne change. La validation native, sa restauration de données et la validation humaine sont distinctes.
