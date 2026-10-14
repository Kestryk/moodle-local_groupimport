# K22 — titres centrés sur leurs tuiles

Référence validée par Kevin : `PENPOT-S1-4-k22-mass-import-2026-10-14.png`, fournie par Claude le 14 octobre après-midi. La première ligne de chaque titre se centre sur sa tuile de 28 px ; les titres multilignes conservent `align-items: start`. Le retrait de texte de 40 px, les descriptions, étiquettes, boutons et légendes gardent leurs recettes.

Le seul changement K22 est dans `_mass-import.scss` : la marge supérieure des titres Identification et Dépôt vaut `(taille de tuile - hauteur de ligne du titre) / 2`. Les tokens typographiques existants donnent 4,592 px. Aucun changement dans le Kit, le DOM, les commandes ou les titres traduits.

La passe native ciblée `easystud-authenticated-20261014T140503492Z-26216` sur :8051 couvre FR1600/1280/390, puis deux titres longs à 390. Les écarts initiaux de +5,002 et -2,592 px deviennent -0,014 px. Les dimensions des tuiles restent 28 px, le retrait 40 px, la taille de texte 15,68 px et la hauteur de ligne 18,816 px. Le titre Identification français se replie déjà sur deux lignes à 390. Les textes temporaires des cas longs sont restaurés.

Ce run emploie le candidat de la série incluant T025/T026/R10-06 : leurs changements restent dans leurs commits séparés. La règle K22 fonctionne avec le titre direct de l'ancien dépôt et avec le conteneur de texte T025. Les mêmes mesures finales confirment les espacements 4/12/8 px et le ratio vide 1,12/0,88 ; aucun import ni enregistrement de réglage.

Pour Claude/Penpot : titres des sous-sections Identification automatique et Dépôt avec tuile Small 28 px ; recette de centrage de première ligne ; écran Mass Import, carte vide, états normal et titres longs, FR1600/1280/390. La composition est approuvée, la propagation Library/standards/toutes les planches Foundations et EasyStud reste à confirmer. Codex1 portera la recette dans le Kit canonique si nécessaire ; Codex2 ne modifie pas les copies partagées.
