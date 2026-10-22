# K16-80 — Enveloppe de dépôt repliable

Base `8355f6f5`, famille F18. Trois sujets : padding du dépôt en prévisualisation/repli/empilement, dégagement de l’en-tête ouvert, cadre de l’en-tête replié/empilé. Variantes Kit `_panels.scss` : `deposit-shell-inset($state:preview/folded/stacked)`, `deposit-shell-heading-clearance`, `deposit-shell-folded-heading($stacked:false/true)`.

Le consommateur conserve ses seuils responsive, grilles, positions des éléments, comportement natif et transitions. Les variantes déplacent les valeurs existantes telles quelles ; aucune nouvelle géométrie ou palette par écran. F18 :9→1 déclarations locales, aucune nouvelle ; la restante est le squelette d’image/dépôt d’une fiche, conservé pour la famille Squelettes. Aucun PHP, AMD ou template modifié, aucune hausse ESLint AMD.

Les quatre CSS complets sont identiques après normalisation CRLF/LF, ordre des sélecteurs/déclarations compris ;52 SCSS partagés identiques au Kit candidat, global0 règle. Le Kit part de e282935 et réconcilie seulement les libellés de bascule intégrés dans8355f6f5 avant cette famille ; preuve `baseline.json`. Les branches sœurs F15/F16 restent distinctes et leurs variantes doivent être conservées lors d’une intégration future.

Build conservative Node22.11.0/Sass1.79.1, checker officiel non-PHP0 erreur/0 avertissement, sync/T037/T038/aller-retour PASS. Recette native PASS : vrai téléversement d’un CSV synthétique via le dépôt Moodle puis prévisualisation, FR/EN1600/390, panneau réellement ouvert/replié,16 mesures et0 erreur console. Preuves dans `<workspace>/artifacts/k16-80-deposit-shell-20261018/native.json`. Aucune confirmation d’import, CSS candidat en mémoire sur :8051 sous bail, aucun fichier runtime/cache modifié. Cours311, comptes et seuls brouillons CSV nommés par cette fixture supprimés ; contrôle indépendant `draft-restored.json` :0 fichier restant, bail libéré.

Les deux états conservent exactement les cadres, paddings, rayons et couleurs avant/après. Bureau : largeur ouverte429,34375px/repliée77,59375px ; mobile342,78125px dans les deux états. Padding13,6px, repli bureau13,6×8,8px, dégagement d’en-tête ouvert43,2px, tête repliée4px en haut. Tuile35,1875px centrée0px, bouton32px conservé avec glyphe centré verticalement±0,5px, horizontalement0px. Aucune nouvelle revendication de cible tactile44px pour ce bouton32px préexistant.

La première capture a mesuré des transitions de descendants et l’état de survol restant après le clic ; échec conservé. Le successeur attend les animations finies du sous-arbre, place le pointeur hors commande et vérifie réellement `aria-expanded` après sa mise à jour asynchrone avant de mesurer l’en-tête. L’assertion prématurée et son échec sont aussi conservés. Les critères de centrage et les styles produit ne changent pas ; la comparaison finale des géométries reste exacte.

## Report Penpot

Les trois variantes ci-dessus composent la carte Dépôt d’Import massif, en prévisualisation ouverte/repliée, bureau1600 et empilement390, FR/EN. Aucun nouveau style voulu. Tuile CSV et bouton de dépliage gardent leurs définitions Kit ; la recette doit mesurer leur contenu et les cadres/paddings/rayons/couleurs avant/après. Le report Penpot et la validation humaine restent à faire par les responsables désignés.
