# K21-01 — note du spécimen Assignment

Base : `c3c04450`. Guide Student Management, diapositive 12 (index 11).
Copie Moodle 5.1 attribuée `:8052`, cours 71 ; verrou acquis avant copie et
purge. Vrais gabarits, traductions, AMD et CSS, sans injection HTML/CSS.

## Cause mesurée et correction

Le paragraphe contenant `guidespec_assignment_note` hérite de
`white-space: nowrap`, comme sa carte `.easyedu-guide-spec__activity`, le flux,
le spécimen et la modale. En bureau, le texte peint dépasse la carte ; les
contraintes `min-width: 0` de la grille ne neutralisent pas cet héritage.
En compact, une règle responsive rétablit déjà `normal`, ce qui explique
l'absence du défaut à 768 et 390 avant correction.

K20-08 ne couvre que le récapitulatif Ready, pas le spécimen Assignment.
La règle ciblée existait déjà sur la branche non intégrée K20-16 (`4024ffa4`).
Ce lot reprend cette même intention, sans ajouter un deuxième mécanisme :
la recette Kit `guide-specimen` définit `white-space: normal` et
`overflow-wrap: anywhere` pour les descriptions de sa carte d'activité.
Elle ne change ni police, largeur, texte, padding, Motion, contrôleur ni logique métier.

## Mesures natives

Débordement du texte peint par Range par rapport au bord droit de la carte :

| Largeur | EN avant | FR avant | Après FR/EN |
| --- | ---: | ---: | ---: |
| 1600 | 278,203125 px | 279,953125 px | 0 px |
| 1280 | 285,796875 px | 287,546875 px | 0 px |
| 768 | 0 px | 0 px | 0 px |
| 390 | 0 px | 0 px | 0 px |

Les huit cas avant sont conservés séparément des huit cas après. Le test
vérifie la phrase anglaise exacte, les trois descriptions par carte, les
limites gauche/droite/basse et le padding droit, après chargement des polices
et fin des animations finies. Il ne coupe pas la phrase acceptée K18-25.
Les captures avant/après EN 1600/390 restent hors Git.

## Source unique et périmètre

Le SCSS canonique et consommateur sont identiques. La branche Kit dédiée
part de `b8c9262`, ligne Guide préparée incluant K20-08, sans modifier main.
Ce lot ne réintègre pas les autres changements de l'ancienne branche K20-16.
Le miroir ne porte pas de copie supplémentaire de cette recette SCSS : le
mapping de `sync-easyedu-guide.ps1` cible le SCSS consommateur directement.

Node 22.11.0 / Sass 1.79.1, build conservatif par page. La preuve PostCSS
compare les règles ordonnées : seuls deux ajouts identiques sont admis, un
dans `styles/student-management.css`, un dans `styles/guide.css`. Toutes les
règles existantes restent identiques ; administration, Mass Import et la
feuille globale sont inchangés. Les styles des autres diapositives et de
Ready ne sont donc pas modifiés par ce lot.

T037 et T038 passent avant et après. L'aller-retour complet échoue déjà avant
sur la dérive du module de bulle. Le contrôle de synchronisation complet
signale sept dérives hors de ce correctif (gabarits Guide, bulle, boutons,
jetons, actions de carte, responsive) ; aucune application automatique du
sync, aucune correction de ces zones dans ce lot. Le spécimen est ALIGNED.

MoodleCS PHP complet : 0 erreur, 22 avertissements historiques, aucun PHP touché.
Tests escaping et filtre PASS. `node --check` du nouveau test et
`git diff --check` PASS. Aucun AMD produit modifié, donc pas de build AMD.
Les résultats d'audit et la restauration figurent dans le résumé JSON et
le rapport externe final ; ne pas confondre portes ciblées et parité globale.

Audit général réellement rejoué sur le candidat : FR 89 PASS / 0 FAIL / 12 INFO,
EN 89 PASS / 0 FAIL / 12 INFO. Après correction : huit cas natifs, 24 descriptions,
zéro débordement gauche/droite/vertical ou dans le padding droit, zéro erreur
console/page. La capture complémentaire à 390, après défilement normal jusqu'à
la carte, montre la note entièrement au-dessus du pied (bas 900,34375 px ;
début du pied 918 px). Les captures initiales à 390 ne certifient pas cette
visibilité, car elles conservent la position de défilement initiale.

## Rejeu

`tools/release/test-guide-assignment-native.cjs` accepte les chemins absolus
du module Playwright, de l'URL de copie attribuée, du fichier secret existant,
d'un dossier de sortie neuf, puis une phase. La phase `before` conserve les
mesures sans exiger leur nullité ; toute autre phase exige exactement 0 px.
L'authentification reste seulement en mémoire. Ne pas publier de fichier secret
ou de session ; restaurer la copie et libérer son verrou après exécution.

Preuves : `<workspace>/artifacts/k21-01-native-20261021/` :
`before/measurements.json`, `after/measurements.json`, `css-proof.json`,
`audits.json`, journaux des portes, `cleanup.json` et captures manifestées.
La clé d'intake est isolée dans `k21-01-intake-2026-10-21.json` : l'intake
historique global invalide à la base est laissé intact.
