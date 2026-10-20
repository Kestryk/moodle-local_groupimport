# K20-08 — texte des récapitulatifs du Guide

Base : `48faa2be`, contenant K20-04 `6fb82d36`. Recette authentifiée sur la
copie Moodle 5.1 `:8052`, cours 71, après acquisition de son verrou exclusif.
Aucun HTML reconstruit et aucune injection CSS dans la preuve native.

## Cause et correction

Le récapitulatif portallé hérite de `white-space: nowrap` du contexte de
navigation. K20-04 ajoutait la racine `easyedu-ui` et `overflow-wrap`, mais
`overflow-wrap` n'autorise pas la coupure lorsque `white-space` l'interdit.
La piste intrinsèque de la première vignette grandit donc au-delà de son cadre.

La définition Kit `.easyedu-guide-spec--ready` impose désormais
`white-space: normal`. Les paragraphes peuvent revenir à la ligne ; aucune
modification des textes, polices, padding, rayons ou largeurs. Le même composant
sert les récapitulatifs de Student Management et de Mass Import.

Le SCSS canonique et le SCSS consommateur sont identiques. Le gabarit canonique
et son miroir reçoivent aussi la classe `easyedu-ui` déjà servie par K20-04,
avec la seule adaptation habituelle des noms de partiels pour le consommateur.

## Mesures avant correction

Phrase exacte : « One name per group, or a whole series at once. ».
Mesure du texte peint par `Range.getBoundingClientRect()`, après chargement
des polices et fin des animations finies.

| Largeur | Débordement du cadre | Empiètement sur le padding droit |
| --- | ---: | ---: |
| 1600 | 6,625 px | 23,625 px |
| 1280 | 11,375 px | 28,375 px |
| 768 | 0 px | 0 px |
| 390 | 0 px | 0 px |

Après correction : **0 px de débordement et 0 px d'empiètement sur le padding**
aux quatre largeurs. Les 16 cas natifs passent (64 vignettes), sans erreur
console ou de page, avec `white-space: normal` et le texte contenu verticalement.
Les quatre vignettes de Mass Import restent contenues en FR et EN.
La comparaison PostCSS ordonnée confirme qu'une seule déclaration est ajoutée
dans chacune des deux feuilles Guide/Student Management ; les feuilles globale,
administration et Mass Import restent identiques après normalisation CRLF.

Les trois autres titres de Student Management sont contrôlés dans leur
composition réelle. Les vignettes « Prepare the file », « Review the preview »,
« Run the import » et « Track imports » appartiennent au récapitulatif du
Guide Mass Import : elles sont vérifiées sur sa vraie page, pas substituées
dans la diapositive 13 du Guide Student Management.

## Rejeu et preuves

`tools/release/test-guide-ready-native.cjs` accepte, dans l'ordre : chemin absolu
du module Playwright, URL locale autorisée, fichier du mot de passe administrateur,
dossier externe de preuves, nom de phase. Le test ouvre réellement les deux
Guides, relève leur récapitulatif et parcourt FR/EN × 1600/1280/768/390.
Il exige 16 cas, des paragraphes dans le cadre et son padding à 0,5 px près,
aucun débordement vertical et aucune erreur de page ou de console.
Le dossier externe contient une session privée : ne pas le versionner ni diffuser
ses fichiers d'authentification.

Preuves : `C:/dev/artifacts/k20-08-guide-ready-20261020/` :
`before-strict.json`, `candidate.json`, captures natives, `css-proof.json`,
`moodlecs-full.json`, journaux de build et des tests ciblés.

MoodleCS PHP complet : 0 erreur, 27 avertissements hérités. Aucun PHP/JS produit
touché. La commande MoodleCS sur le SCSS ne traite aucun fichier : ce n'est pas
une validation SCSS ; celle-ci repose sur Sass 1.79.1 et les mesures natives.
T037 et T038 passent. L'aller-retour complet reste en échec sur la dérive
préexistante du module de bulle ; aucune modification de la bulle dans ce lot.

Le fichier global `student-feedback-intake-2026-10-10.json` contient déjà des
marqueurs de conflit à la base `48faa2be`. Il est laissé strictement inchangé ;
le présent rapport porte le statut du lot en attendant sa réparation séparée.
Pas de publication sur localhost : la livraison est une branche à intégrer.
