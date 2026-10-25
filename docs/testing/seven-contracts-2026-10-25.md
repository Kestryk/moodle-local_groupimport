# Qualification des sept contrats restants

Base : `11f472f1766089811840e72c114beb51787c9e02`. Aucun changement produit,
AMD, PHP, SCSS, template, permission ou donnée métier. Le bilan porte sur les
contrats ; un PASS isolé ne vaut pas recette native Moodle.

| Contrat | Décision | Preuve et portée |
|---|---|---|
| `test-card-selection-keyboard-source.cjs` | Réparé | T055 a déplacé les producteurs hors du monolithe. Extraction AST des trois fonctions réelles `createMemberItem`, `createGroupElement`, `createGroupingElement`, exécutées dans Chrome. Les trois templates actuels fournissent quatre autres occurrences. Tab séquentiel et Espace on/off sur les sept cases, `tabIndex=0`, enabled ; aucune case simulée dans les producteurs. Les collaborateurs hors création des cases sont doublés. |
| `test-filter-reset-field-peer-consumer-preservation.cjs` | Réparé | `eba10dbbcfea89a9b0b1a8d7ba0d82e60821b3c4` retire explicitement les quatre anciennes adoptions field-peer dans le produit. La variante Kit demeure : parité du mixin, échelle M=38px et cible tactile=44px vérifiées. Les quatre commandes Reset actuelles sont conservées. |
| `test-filter-track-focus-consumer-preservation.cjs` | Réparé | Les deux labels publics track-focus restent présents. Comparaison compilée de la source courante avec/sans cette seule inclusion, au lieu du CSS global retiré par I9. Focus clavier, exclusion disabled, forced-colors et égalité de toutes les règles hors opt-in sont exigés. |
| `test-guide-chrome-preservation.cjs` | Conservé en doute, FAIL | Desktop32 et la piste 4px restent des attentes valides, mais les six modules canoniques épinglés diffèrent du miroir courant. Aucun nouveau checkpoint Kit/consommateur accepté n'est identifié pour le périmètre complet de cascade ordonnée. Le test et ses assertions restent intacts. |
| `test-guide-review2-preservation.cjs` | Conservé en doute, FAIL | Les durées 420/280ms et le listener orientation existent encore. Le moteur canonique `guide/amd/src/easyedu_guide.js` et le miroir embarqué ne sont pas identiques ; le snapshot `fead185` précède les nouvelles dépendances, le plein écran et les évolutions du curriculum. Il faut réconcilier ce moteur et le périmètre de la comparaison avant de certifier la préservation du reste. Aucun changement d'attendu. |
| `test-guide-t037-finished-preservation.cjs` | Retiré, obsolescence confirmée | K17-33, commit `b86b564883ed91f5a19526f464125e8f543dc5f4`, retire explicitement le sélecteur accent/700 et ajoute une carte de fin sobre, titre ink/600 et aide muted/400. Ce test exige exactement le delta désormais annulé. Blob récupérable : `1ebe1264fe5096d493da7f72b1f42f2bd7b17773`. Jamais compté PASS. |
| `test-participant-panel-title.cjs` | Réparé | Décision K15-25 `c1f0cf0234c3f3b891e1f762853caa747fb37d24` : le titre de colonne devient le `get_string('participants')` du cœur ; le sélecteur de vue garde « Participants & groups / Participants & groupes ». Le test exécute l'expression réelle extraite du producteur relocalisé I3 et contrôle les deux slots de titre et les libellés FR/EN distincts. |

## Préservation CSS actuelle

Le helper de compilation en mémoire `lib/scss-optin-preservation.cjs` compile
deux fois la même source actuelle, avec et sans une inclusion publique précise.
Chaque sélecteur, déclaration, priorité et ascendance conditionnelle non concerné
doit être identique et dans le même ordre. Les changements de géométrie, de
typographie ou de Motion sont interdits dans le delta focus. Les deux règles
field-peer restent exactement box-sizing/min-height puis la cible tactile.
4973 règles hors field-peer et 4972 hors track-focus sont préservées. Il ne
s'agit pas d'une comparaison actuelle contre elle-même : une seule inclusion
est retirée dans le second arbre Sass, sans modifier les fichiers du dépôt.

## Pourquoi les deux doutes Guide ne sont pas retirés

Le Kit examiné est `0aba403c090fbe70e39baa06c88220e4403c2aa3`. Les modules
`_preferences-classes`, `_card-actions`, `_guide`, `_guide-discovery`,
`_guide-specimen` et `_animations` diffèrent tous des copies embarquées. La différence de `_card-actions` est limitée aux commentaires ; les cinq autres modules diffèrent aussi hors commentaires. Le moteur
canonique et le miroir diffèrent également. Accepter le miroir comme nouvelle
référence dans ces tests ferait disparaître une vraie assertion de parité ; copier
le Kit dans le produit pourrait annuler des adaptations légitimes. Cette décision
de synchronisation dépasse la réparation du harnais. Les SHA-256 et contrôles
bornés sont conservés dans la preuve de qualification externe.

## T037 : conserver les autres preuves sans les confondre

`test-guide-t037-finished-paint.cjs` n'est pas supprimé ni assoupli dans ce lot.
Son rejeu isolé produit 112 observations en échec : il pose seulement les attributs
finished sur la narration initiale, sans exécuter le renderer de la nouvelle carte
de fin, puis exige l'ancien accent/700. Le diff K17-33 permet de trancher le retrait
du contrat de préservation historique ; il ne transforme pas ce diagnostic isolé
en recette native PASS de la nouvelle carte. Une qualification du test de peinture
doit viser les vrais éléments `.easyedu-guide-scene__finished-title` et `__finished-hint`
après une lecture complète, avant de conclure sur le rendu actuel.

## Rejeu et limites

Les sept échecs initiaux sont reproduits avant modification. Quatre sont réparés,
un est retiré avec son blob récupérable et deux restent explicitement FAIL.
Le catalogue contient le bilan daté du rejeu complet et les résultats individuels.
Les recettes natives non provisionnées sont bloquées, jamais promues PASS à partir
d'anciens résultats. Aucun fichier produit changé, donc aucun rebuild AMD requis.
Le test `test-security-escaping.cjs` reste obligatoire avant livraison.

## Rebase final et bilan consolidé

Le HEAD intégré a avancé vers `dd8bff741d3bad950f0d1a75003834857d1cdbea`
pendant ce lot (défaut de repli des participants). Rebase sans conflit ; aucun
producteur visé par les quatre réparations n'a changé. 110 contrats susceptibles
de dépendre des participants, de la densité ou des modules cm/sm ont été rejoués
sur cette base (102 exécutés et 8 bloqués), y compris le nouveau contrat `test-participant-collapse-default.cjs`
(24 contrôles PASS). Les 106 autres entrées gardent explicitement leur révision
d'exécution 11f472f1 dans le catalogue. Ce bilan consolidé ne revendique pas un
second rejeu intégral sur le nouveau HEAD. Les quatre réparations et la sécurité
restent PASS après rebase ; les deux contrats Guide restent FAIL.