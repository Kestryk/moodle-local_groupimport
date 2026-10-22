# OLD-C / K17-10 — 19 octobre 2026

## Périmètre et référence

Base EasyStud : 5dc4215c, branche work/codex1/easystud-old-c-20261019.
Base Kit : 88d3f8e, branche work/codex1/easyedu-kit-old-c-20261019.
Référence : PENPOT-PASSE/PASSE-2026-10-17.md (K17-10), f17-multi-tagged-values.json,
f17-multi-chip-geometry-fixes.json et export SVG f17-multiple-choice-standard.svg.
Foundations 08.4.1, Selection chip / S 2a31d374-d2a1-80fd-8008-ac72eaf42b3c.
Aucune écriture Penpot, CCB, branche Claude ou localhost :80.

L'administration active le mode à étiquettes du sélecteur Kit existant pour ses
sélections multiples (alloweduserfields). Les sélections simples et les autres
sélecteurs multiples conservent leur compteur. Aucun changement de stockage,
de droits, de formulaire PHP natif, ni de version de base de données.

## Mesures isolées PASS

| Élément | 1600 | 390 tactile |
|---|---:|---:|
| Champ régulier | 38 px | 44 px |
| Champ compact | 32 px | 44 px |
| Étiquette | 24 px | 24 px |
| Police d'étiquette | 11 px / 400 | 11 px / 400 |
| Espacement / padding latéral | 8 / 8 px | 8 / 8 px |
| Cible du chevron | 32 px | 44 px |
| Cible Tout retirer | 28 px | 44 px |
| Cible de retrait d'une étiquette | 24 px | 24 px |
| Écart maximal des centres texte / croix / chevron | 0 px | 0 px |
| Débordement des contrôles horizontal / vertical | 0 / 0 px | 0 / 0 px |

8 cas FR/EN × deux largeurs × contrôleur plugin/Kit. Nouvelle passe avec la
feuille administration.css complète : 8 PASS. Les deux suites sont en HTML
isolé, pas dans Moodle. Fonte Inter et vraie police FA chargées avant mesure.
Les libellés sont intrinsèques, sans largeur 88/108 px codée pour les exemples
Penpot. Le champ grandit naturellement si les valeurs passent à la ligne.

Retrait individuel, filtrage sans perte des valeurs masquées, données FormData,
options désactivées, clear-all, focus, reset et restauration du select natif :
PASS. Texte injecté traité comme texte, aucune image/HTML interprété. Aucun
bouton imbriqué. Les noms accessibles contiennent la valeur complète.

## Contrôles et parité

- MoodleCS complet PHP : 0 erreur, 19 avertissements préexistants.
- php -l : settings.php et les deux fichiers de langue PASS.
- ESLint : searchable_choices 0 erreur / 2 avertissements, admin_choices 0/0,
  sans augmentation. Les sources JS/SCSS gardent CRLF ; PHP suit eol=lf.
- Builds AMD dédiés admin_choices/searchable_choices et styles conservative :
  PASS, Node 22.11.0 / Sass 1.79.1. Aucun autre AMD recompilé.
- Escaping, moteur de filtres et exports AMD : PASS.
- Test adapter compilé : 9 PASS (1600/768/390 × full/reduced/minimal).
  L'ancien oracle échouait déjà sur 5dc4215c, en assimilant la préférence système
  à une coupure. Le successeur vérifie la préférence EasyStud : disclosure full,
  fondu reduced <=120 ms sans hauteur/transform, aucune animation minimal.
  L'accès au déclencheur devient sémantique ; le premier bouton est désormais
  le retrait d'une étiquette. Les assertions Reset/focus/valeurs sont conservées.
- CSS : toutes les règles existantes, dans leur ordre et contexte média,
  restent identiques. Seuls selection-chip et --tagged sont ajoutés. styles.css
  global : 0 règle. SCSS complet et helper de rendu tagged identiques au Kit.
  Les différences Intl/M3 antérieures entre contrôleurs sont laissées intactes.
- Moodle 4.5 : aucun nouvel appel API Moodle ; même configmultiselect et même
  démarrage AMD. La validation native 4.5 n'est pas certifiée par ce lot.

## Recette native bloquée — ne pas déclarer acceptée

Premier verrou libre : :8052, acquis atomiquement au nom codex1-old-c-20261019.
Copie de base synchronisée et purgée. Les anciens localhost-admin.secret et
claude-sm-test.secret du protocole ont disparu ; le chemin de remplacement a
été demandé. Aucun mot de passe réinitialisé, aucun compte créé, aucune donnée
de test écrite. Le candidat n'a pas été copié sur le pool faute de connexion.
La copie reste sur la base 5dc4215c. Le verrou est libéré à la remise du lot.

Recette réutilisable : tools/release/test-admin-tagged-choices-native.cjs.
Arguments : module Playwright absolu, pool.json détenu, nom admin, fichier secret,
dossier de sortie neuf. Elle refuse hors 8052/8054/8055 et hors verrou détenu,
mesure FR/EN 1600/390 hasTouch, restaure la sélection du DOM et ne soumet pas les
réglages. Elle reste NON exécutée ; aucun PASS natif Moodle n'est revendiqué.

## À reporter / reste à faire

Codex n°2 / Penpot : variante Selection chip 24 avec retrait Kit Close 24,
caret Desktop32 et Clear28, Touch44 ; champ 38/32/44, wrapping automatique.
Valider en natif la largeur du wrapper Moodle et les libellés FR réels ; puis
Claude pourra intégrer et publier. Aucun test avec un lecteur d'écran vocal.

Preuves lourdes : <workspace>/artifacts/old-c-20261019 (validated-bundle-focus,
validated-page-css-focus, css-parity.json, phpcs-after.json, eslint.json, logs).
Les premiers échecs de construction et d'oracle sont conservés.

### Complément de contrôle

Kit canonique 3d1b5951a1757eb6909b56a777a0ea60866ebf1d : tests historiques single/multiple 1600/768/390 PASS sur la base et sur le candidat lors de la comparaison finale. Un premier passage candidat a échoué sur le clic physique après fermeture ; preuve conservée (kit-legacy.log), non reproduit dans la confirmation base/candidat, moteur Motion non modifié. Les nouvelles suites ajoutent aussi le cas vide : clear caché, aucune étiquette, placeholder localisé. Le verrou :8052 est effectivement libéré ; candidateCopied=false.

Retrait pendant la fermeture Motion : 8 cas par suite PASS ; le focus revient au déclencheur et jamais à la recherche devenue inerte.
