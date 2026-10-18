# K16-80 — Pieds et actions de fenêtre

Base `07b1dfe6`. Les recettes `dialog-footer` et `dialog-footer-link` passent du module de composition local au Kit `_modals.scss`. Le module local conserve deux délégations d’API ; `$dialog-divider` devient un alias de la valeur Kit. Ni les sélecteurs ni leur position dans chaque feuille ne changent. Le contrôle strict a révélé des décentrages préexistants de0,8984375px pour le lien et0,953125px pour les boutons : la hauteur de ligne naturelle les corrige dans les seules recettes Kit de pied, sans décalage local.

- F09 :9 →0 déclarations locales, aucune nouvelle ; deux variantes Kit ajoutées, sans nouvelle valeur visuelle.
- Extraction seule : quatre CSS complets identiques à la base après seule normalisation CRLF/LF. Correction de centrage : seulement trois déclarations `line-height:normal`, deux ajoutées aux boutons des pieds et une remplaçant1.2 pour le lien. Toutes les autres déclarations ordonnées restent identiques ; liste exacte dans `centre-parity.json`. Global :0 règle de présentation.
- Les52 SCSS partagés correspondent au Kit candidat. Son socle reprend aussi les trois prérequis déjà validés des branches précédentes : `_menus.scss` de6317256, `_cards.scss` et `_forms.scss` de84087e4. Preuves de hash dans `C:/dev/artifacts/k16-80-dialog-actions-20261018/baseline.json` ; aucune autre définition antérieure écrasée.
- Build conservative Node22.11.0/Sass1.79.1 ; sync,T037,T038,aller-retour PASS ; checker officiel autres fichiers0 erreur/0 avertissement. Aucun JS modifié, aucune hausse ESLint.
- Recette native FR/EN1600/390 PASS :8 mesures de pied avant/après, soit24 mesures de contrôles. Lien Moodle, Annuler/Enregistrer : centres0px après, contre0,8984375/0,953125px avant. Boutons de hauteur37,59375px exactement égale et inchangée ; lien24,796875→25px (+0,203125px). Dimensions du pied, paddings, rayons, couleurs et largeurs inchangés,0 erreur console. Résultat final dans `C:/dev/artifacts/k16-80-dialog-actions-20261018/native.json`.

La même recette de pied est compilée dans Mass Import ; le delta CSS exact y est prouvé, sans prétendre à une nouvelle recette native d’import/restauration. Aucun JS, template, clavier ou comportement modifié. Le candidat est injecté en mémoire du navigateur sur :8051 sous bail ; aucune publication, purge ou copie produit. Fixtures synthétiques restaurées et bail libéré ; l’échec strict préexistant et le pilote restent archivés.

## Report Penpot

Recettes ajoutées au Kit : `dialog-footer`, `dialog-footer-link` ; variable partagée `dialog-divider`. Composants : pied de fenêtre, actions secondaires/principales et lien externe ; fiche groupe, états au repos/prêt, FR/EN1600/390. Report de la correction de centrage0,90–0,95px et de la ligne du lien+0,203125px ; aucune nouvelle couleur, aucun nouveau rayon ni composition. Les consommateurs Mass Import utilisent aussi la métrique corrigée.
