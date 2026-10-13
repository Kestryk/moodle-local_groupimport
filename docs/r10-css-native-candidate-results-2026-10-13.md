# R10 — preuves des candidats CSS, base 49072e22

Source des candidats : branche `work/port4719pg3/easystud-r10-css-20261013`,
worktree `C:/dev/worktrees/easystud-r10-css-20261013`. Changements produit
limités à `_structure.scss`, `_layout.scss` après retrait du candidat R10-18. Aucun
JS, Guide, administration, Kit ou fichier généré commité. Codex1 intègre,
reconstruit, propage Kit/Foundations et publie ; ce n'est pas encore servi.

## Résultats vérifiés

Sass et diff-check PASS. `r10-css-visible-successor-49072.spec.js` PASS sur
:8051 en mode Actuel, FR/EN, 1600/1280/390, CSS injecté temporairement :

- R10-09 : compteurs visibles et Select all = 25,90625 px à 1600/1280 dans
  les deux langues. À 390 le compteur est nativement caché ; il reste caché,
  aucune égalité avec un élément non peint n'est revendiquée.
- R10-22 : flèches de 29,59 à 25,90625 px aux trois largeurs ; glyphes inchangés.
- R10-12 : bordure et fond de repos transparents ; fond doux au survol,
  anneau de focus conservé. Mesures de transition conservées, pas présentées
  comme couleurs terminales ni comme validation humaine.
- Contraste : couleur calculée des titres `rgb(92,108,125)` = `#5c6c7d` ;
  ratio sRGB calculé **5,11:1** sur `#f7f9fc`. Le token était déjà appliqué
  par la typographie tardive de 49072e22 ; le commit retire la déclaration
  obsolète `#6a7a8a`. Les palettes personnalisées ne sont pas certifiées.
- Aucun accroissement du surplus horizontal : 18 px préexistants sur le root
  à 1600/1280, zéro à 390. Ce PASS de non-régression ne ferme pas les 18 px.

`test-r10-component-css.cjs` PASS, 22 relevés isolés : 0/1/999/libellés longs
FR/EN, rôle non interactif du compteur, flèche au repos/survol/focus, Clear
disabled, cible fine >=24 px et cible coarse 44 px. Fixtures HTML isolées,
pas une preuve native tactile ni de navigation première/dernière page.

## Preuves et limites

- Native candidat final : `C:/dev/artifacts/es-r10-css-v3-49072`.
- Isolé : `C:/dev/artifacts/es-r10-isolated.json`.
- Prédécesseurs immuables : `es-r10-css-49072` (surplus root),
  `es-r10-css-v2-49072` (comparaison erronée du compteur caché).
- R10-18 : `r10-18-eye-candidate.spec.js` PASS diagnostic, 24 mesures FR
  (servi/candidat, 390/768/1024, compact/sélectionné/déplié/nom long). Delta
  identique +0,953125 px dans tous les cas : défaut non reproduit sur cette
  carte, candidat sans effet retiré. Preuve `C:/dev/artifacts/es-r10-eye-49072`.
  Autres badges/cartes et cas exact Kevin restent ouverts.
- Compilation finale sans R10-18 : `es-r10-final.css` ; 22 contrôles isolés
  repassent (`es-r10-final-isolated.json`). La preuve native groupée est celle
  du candidat v2 ; le retrait de R10-18 est justifié par les mesures identiques.
- Les intakes conservent `nativeVerified=false`, `previewServed=false`,
  `designPublished=false`, `humanAccepted=false` pour les lots complets.
