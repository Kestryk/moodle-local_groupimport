# K16-80 — Libellés et lignes de bascule

Base `07b1dfe6`, famille F13. Trois sujets : libellé de section, état secondaire de la bascule d’image, ligne de case native dans les filtres. `toggle-check-caption($label:false/true)` et `toggle-check-line` centralisent exactement leurs valeurs acceptées dans le Kit `_forms.scss` ; les consommateurs gardent le placement et le comportement. La recette existante de surface de bascule n’est pas modifiée.

Déclarations locales F13 :21→17, aucune nouvelle. Les17 restantes comprennent des squelettes, l’arbre et le cadre des choix de rôle ; ce lot ne prétend pas les fermer. Les quatre CSS complets sont identiques après normalisation CRLF/LF, ordre des règles et déclarations inclus. Les52 SCSS partagés sont identiques au Kit candidat, styles globaux0 règle. Prérequis approuvés6317256/84087e4 réconciliés dans `baseline.json`, aucune autre branche Kit écrasée.

Build conservative Node22.11.0/Sass1.79.1 et portes sync/T037/T038/aller-retour PASS. Aucun JS, template ou PHP changé, donc pas de hausse ESLint AMD. Checker officiel non-PHP0 erreur/0 avertissement.

Recette native PASS :32 mesures, fiche réelle de groupe puis filtre du catalogue en vue Structure, FR/EN1600/390, activé/désactivé. Dimensions, padding, rayons, couleurs et typographie exactement identiques avant/après ; centres verticaux du contenu et du curseur sur son rail dans la tolérance0,5px,0 erreur console. Preuves dans `C:/dev/artifacts/k16-80-toggle-captions-20261018/native.json`. CSS injecté en mémoire sur :8051 sous bail ; aucun fichier produit runtime, cache ou publication modifié. Le cours synthétique et ses comptes sont supprimés, le bail libéré.

La mesure des pseudo-éléments utilise des sondes absolues portant leurs styles calculés : elle vérifie la géométrie curseur/rail et ne prétend pas centrer horizontalement un curseur qui doit se déplacer. Les deux prédécesseurs échoués ont sélectionné le filtre Participants, puis cherché le catalogue depuis la vue complète ; seuls les accès du scénario ont été corrigés. Assertions, styles et états produit conservés.

## Report Penpot

Variantes `toggle-check-caption` auxiliaire/libellé et `toggle-check-line`. Composants : bascule de fiche groupe et bascule de filtre, états activé/désactivé, bureau/tactile1600/390. Aucune nouvelle valeur visuelle voulue. Ne pas remplacer la recette de surface existante ni son mouvement. Les mesures natives ne constituent pas une validation humaine.
