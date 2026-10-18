# G2D — parité Kit et contrats de tests, 18/10/2026

Base 695a9bdd ; branche work/codex1/easystud-g2d-kit-tests-20261018. Kit : work/codex1/easyedu-kit-g2d-parity-20261018. Aucun changement produit dans le plugin : ni SCSS, ni gabarit, ni AMD, ni feuille générée. Aucune publication ni recette runtime dans ce lot.

Le Kit reçoit les trois fichiers du miroir Guide (contrôleur, gabarit principal et spécimen groupement) et huit fichiers SCSS dont les valeurs font foi dans le plugin accepté. Outre discovery/Guide/specimen, les définitions communes card-actions, feedback, focus, navigation et preferences sont alignées pour satisfaire la parité complète des 52 fichiers partagés. Aucun arbitrage visuel nouveau. La bulle est déjà identique dans le runtime, le miroir et le Kit : empreintes normalisées vérifiées, aucun changement artificiel. Kit main et CCB inchangés.

| Test demandé | Ancien contrat en échec | Successeur |
|---|---|---|
| L1 dead-selector | Projection de 8129aef7 comparée à toute la feuille courante | Projection historique exacte vers 33aeacfb conservée ; absence actuelle des trois branches mortes et du grip retiré exigée séparément |
| L1/L2 current-cascade | Base389b832d et priorité d’un grip retiré | Base par défaut HEAD, base explicite encore possible ; comparaison complète des règles ordonnées, compilation, zéro règle globale et 52 fichiers Kit conservées ; grip absent obligatoire |
| Complete-view ungrouped | Lit styles.css désormais vide | Lit la feuille Student Management et normalise seulement la présentation CSS avec PostCSS ; tous les critères de masque/centrage/titre/focus restent exigés |
| Card action overflow/sort | Lit le monolithe avant T055 et une ancienne règle responsive | Lit les modules CM propriétaires et leurs builds ; empilement actions ouvert/sort, pagination, propagation, retour responsive, placement et typographie conservés ; déclencheur tactile Kit actuel exigé |
| Action-button alignment | Feuille globale et ancienne fiche avant T048 | Feuille Student Management, trigger commun G2D et lien de pied de fiche T048 ; garde les critères d’espacement, Foundation, alignement, renommage, actions mobiles et fixture supervisée |

Le lecteur CSS de test développe uniquement les sélecteurs séparés par des virgules et la présentation des déclarations ; il n’en change aucune valeur. Il ne rend pas les tests de source équivalents à une recette visuelle.

Complément lié à la bulle : le test Light conserve la définition complète historique du composant, ses douze métriques et la cascade de tous les autres sélecteurs. Seuls le popover de spécimen accepté par G2D (définition canonique complète contrôlée) et l’ancienne surface easyedu-control-tooltip retirée par K-BUBBLE sont distingués. Le retour de cette surface est explicitement refusé, et le renderer de bulle unique est comparé en entier au Kit. Aucun autre oracle n’est modifié.

PASS : les cinq tests, synchronisation avec PluginRoot explicite, T037, T038, aller-retour, Light et injection négative d’un grip retiré. Le test négatif échoue comme attendu et la feuille est restaurée octet pour octet. Build de preuve Node22.11.0/Sass1.79.1 : quatre feuilles inchangées, zéro règle globale. Checker officiel non-PHP 0 erreur/0 avertissement ; ESLint des scripts modifiés normalisé en LF pour l’analyse, CRLF préservé sur disque : aucune hausse, les scripts analysés finissent à 0/0. Aucun test runtime ni code métier n’est ajouté.

Preuves : C:/dev/artifacts/g2d-guide-kit-tests-20261018/ (journaux avant/après, l1l2-final.json, bubble-parity.json, retired-grip-fault.json, eslint.json, codechecker.json). Les prédécesseurs échoués restent conservés. Le correctif de chevron9e5e6111 / Kit6317256 est indépendant : intégrer aussi ces deux successeurs pour une ligne complète, puis rejouer les portes sur les pointes appariées.
