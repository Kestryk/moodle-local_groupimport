# T014 — six aperçus non interactifs

Programme `EED-UI-2026-0073`, Guide prioritaire, complément aux 61 tâches.
Source baseline `7332375`, Kit baseline `cb9edab`, preview baseline `a453c47`.
Worktrees Source/Kit et branches existants seulement ; aucune donnée Moodle.

## Portée

Compléter les aperçus de la première slide : Navigation, Pause/Suivant,
Surbrillance, Parcours, Checklist et Plein écran. Chaque aperçu porte la légende
Preview/Aperçu ; le parcours reprend Small primary-outline. Les contrôles montrés
sont des spans/illustrations, pas des boutons ou actions factices : aucune cible,
commande, invitation de parcours, tabindex ou modification de progression.
Le vrai réglage/capacité Plein écran conserve sa visibilité desktop uniquement.

La recette vient du Kit183 (`78d7dd5`), synchronisée par le script existant.
Les autres introductions et illustrations de cartes gardent leur texte/structure.
Toute la typographie, le moteur Guide/AMD, les commandes métier et Motion sont
inchangés. La seule fonction de données modifiée est `common_introduction(true)` ;
sa branche false reste la variante sans aperçus. Une chaîne de légende par langue.

## Preuves et diagnostics conservés

-60 cas isolés EN/FR × 1280/768/390 × normal/reduced × cinq leçons passent dans
  `test-guide-introduction-specimens-t014-current-type.cjs`. Six aperçus, absence
  de commandes/focus, contour, typographie, stockage et capacité-off sont vérifiés.
- Garder les deux sondes échouées : le premier héritait d'un comptage de colonnes
  au niveau de la liste, pourtant volontairement mono-colonne ; le second attendait
  l'ancien titre 14.08 px, remplacé avant T014 par le rôle déjà approuvé 16 px.
  Corriger ces oracles n'a changé ni le produit ni les critères de containment.
- `test-guide-introduction-t014-preservation.cjs` compare le CSS complet hors
  apparence des seuls aperçus et les moteurs/AMD/Motion/templates métier complets.
  Les titres, scènes, parcours et la classe PHP hors données opt-in sont identiques.
- Compilation Sass consommateur existante, syntaxe PHP et `git diff --check` passent.
  AMD identique : aucun rebuild JavaScript requis pour ce lot présentation/données.

## Foundations

Les deux providers existants Introduction controls sont enrichis, sans nouvelle
famille de bouton/glyphe/typo : Desktop `1b9939cf-2f95-805b-8008-c3828739bece`,
Mobile `1b9939cf-2f95-805b-8008-c382a5a0c003` ; mains `c38268dcea49` / `c3829149de6c`.
Dimensions finales 1100×902 et 342×1294.8 ; aucune collision avec la planche suivante.

Standards liés : `c8f59096-02cd-803e-8008-c71721d7ae00` et
`c8f59096-02cd-803e-8008-c71723183721`. Anciennes copies et exemple plein archivés
par visibilité, récupérables ; pas de suppression. Quatre racines sauvegardées et
captions Inter12.16 vérifiées, quatre rasters conservés. Le catalogue mobile montre
cinq notions : le Plein écran reste une capacité desktop, pas un bouton mobile.

La publication Standards a expiré côté MCP, mais les IDs exacts créés ont été
retrouvés et vérifiés : aucun rejeu ni doublon. Un premier raster affichait encore
le libellé générique malgré la donnée textuelle correcte. Le glyphe Route est lié
et normalisé depuis son provider ; texte et font finaux Inter12.48 sont vérifiés
dans les quatre objets sauvegardés. Une reflow asynchrone a laissé temporairement
12.58 px ; elle a été réconciliée et restaurée, jamais retenue comme nouvelle taille.

## Produit et preview — gates séparés

La définition du provider était encore en cache côté Guide après le changement
Source. Pas de bouton natif de mise à jour disponible. Les cinq compositions
Guide de référence ont été vérifiées dans la sauvegarde avant rechargement exact
de l'onglet propriétaire 9225 ; aucun onglet utilisateur ou autre canal modifié.
La première reconnexion a retrouvé l'iframe avant son chargement ; un contrôle
lecture seule a ensuite confirmé son état et permis une reconnexion bornée.
La définition Source902/1294.8 est désormais reçue sur MCP4411 uniquement.

Deux compositions produit liées, chapitre90, sont sauvegardées et leurs rasters
inspectés : les six exemples desktop et cinq mobile reprennent les providers
existants. Aucun contrôle reconstruit ou détaché. Le détail des IDs est dans
`product-created.json` et `product-saved-and-raster.json` hors Git. Les références
Common introduction sans aperçus restent valides et ne sont pas remplacées.

La promotion locale propre, le test `guide-introduction-t014-native.spec.js` et
la checklist humaine restent des gates distincts, encore ouverts à cette étape.
Le PASS isolé et la paire de compositions sauvegardées ne sont pas une preuve
Moodle. Ce test natif candidat couvre EN/FR,1280/768/390/320, normal/reduced ;
il bloque les writes et nettoie uniquement son espace QA, backups inclus.

La preview Source442d95f est servie à runtime583fdca (caches purgés). Native28596
a validé dix cas sans erreur/commande métier, puis son budget global360s s'est
terminé pendant une navigation FR. Échec et nettoyage complet conservés.
Le successeur borné900s ajoute seulement des timings/progress de cas ; pas de
délais individuels augmentés, assertions retirées ou changement produit.

Après rechargement du Guide, une notification de bibliothèque est devenue
disponible. Son clic natif a expiré côté Playwright mais avait été appliqué.
Le contrôle strict a trouvé deux anciennes largeurs de labels162→97 et leurs
glyphes recentrés. Les copies ont été réconciliées sans rejeu de mise à jour :
les deux lanes162 sont restaurées et les quatre références87/88 passent ensuite
le même fingerprint complet. Aucun changement de police, de texte ou de code.

Artefacts externes manifestables : `%LOCALAPPDATA%/EasyEdu/artifacts/easystud/guide-t014-20261012-a`.
Captures initiales, finales, timeouts et réconciliations sont conservés séparément.
Scénario candidat local-supervised ; CI/Docker et fixtures métier hors périmètre.

Suite : terminer produit → preview → preuve native T014, puis T015 et les anciens
lots. Les couloirs Student approuvés restent dans leur plan CSS-only, sans perte
de tâches ou arbitrages. Aucune action humaine maintenant, validation regroupée plus tard.
