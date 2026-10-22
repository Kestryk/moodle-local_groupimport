# I12 — publication du miroir consommateur, 22/10/2026

## Contrat accepté

L’arbitrage Kevin/Claude du 22/10 remplace l’identité CSS compilée bit-à-bit par une preuve native et visuelle de non-régression. Le Kit est la définition SCSS canonique ; chaque plugin en embarque une copie autonome. Une règle dormante ou un fallback équivalent peut modifier les octets compilés sans modifier le rendu. Un vrai changement visuel reste un échec à signaler, jamais une exception implicite.

L’ancien [diagnostic binaire](i12-miroir-consommateur-gate-2026-10-22.md) et ses mesures restent conservés. Le contrôle `audit-kit-consumer-sync.cjs` rapporte désormais les différences ; `--require-byte-identity` permet de rejouer explicitement l’ancien critère. Cet outil ne certifie pas la parité visuelle à lui seul.

## Sources et publication

- Produit figé : `2311f3cfbb15247ed68061dccdf659978cc2ae44`, livré depuis le worktree Codex dédié ; aucune écriture sur la branche Claude.
- Kit : `b88e14f` retire uniquement le mixin obsolète `person-card-fold-content` (K21-37, 13 lignes). Le chevron Participant n’est pas restauré.
- Kit main `40a4c06` documente l’autorité canonique et le nouveau contrat de publication ; mêmes SCSS que b88e14f.
- Copie canonique dans le worktree consommateur : **57/57 fichiers partagés identiques après normalisation BOM/CRLF, dont 56 SCSS**. Aucun changement produit plus récent n’a été écrasé.
- Build officiel par page : Node 22.11.0, Sass 1.79.1 et minification conservatrice du parent. Les cinq sorties finales, y compris styles.css, ont le même SHA-256 que la candidate native auditée.

Les écarts de taille avec le parent restent attendus : Student Management +1387 octets, Mass Import +1346, Administration +970, Guide +273 ; styles.css global inchangé. Les fichiers générés restent minifiés, sans compilation expanded ni @charset.

## Audit des quatre groupes

Les 84 entrées de déclaration sont toutes classées dans `delta-groups.json` ; ce ne sont pas 84 régressions visuelles.

| Groupe | Entrées | Vérification et résultat |
|---|---:|---|
| Tokens supplémentaires | 33 | Résolutions des couleurs/contrôles des quatre pages inchangées ; API damier CCB conservée mais non utilisée sur ces pages |
| Fallbacks Guide/navigation, px/rem et émissions équivalentes | 38 | Nav, capsules, fenêtres Guide et huit tiroirs EasyStud : géométrie et peinture calculée inchangées |
| Fallback de défilement du tiroir sans scroller interne | 7 | Les tiroirs EasyStud gardent leur scroller interne ; aucun changement de débordement, padding ou défilement mesuré |
| Bandeau de sélection K21-27 / spécimen | 6 | Six états sélectionnés vérifiés ; frame bureau visible, masquage compact canonique conservé ; aucun déplacement introduit |

**38 cas retenus neutres** : FR/EN × 1600/768/390 sur Student Management, Mass Import, Administration et Guide (24), huit ouvertures de tiroir EasyStud (768/390) et six sélections Participant. **0 erreur de page, 0 erreur console, 0 écriture de cours**. `movestatus`, POST de lecture observé, est identifié comme tel sans enregistrer de sesskey.

Le maximum de variation géométrique des six cas Guide définitifs est 0 px ; leurs couleurs, fonds, polices, tailles, filtres, SVG et positions de fond calculés sont identiques. Les autres cas retenus n’ont aucun delta de peinture calculée ni delta géométrique dépassant 0,5 px. Les captures sont conservées avant/après, sans masquer de contrôle produit.

### Contrôles du harnais et preuve raster

Le harnais tourne dans Chromium headless sur le vrai Moodle :8051 et le cours 5 existant. Seuls les fichiers CSS candidats sont substitués par interception réseau ; données, contrôleurs, templates, rôle et réponses métier restent natifs. La CSS finale compilée est ensuite contrôlée contre les octets réellement substitués.

Les premiers passages sont conservés séparément : attente de navigation au login trop large, rechargement non atomique d’une feuille qui remettait la bande de pastilles à zéro, frame flottante volontairement masquée en compact, et dernière frame d’apparition d’une bulle. Les successeurs attendent les états réels, préchargent la feuille avant permutation atomique et ne figent que les décorations infinies à une phase commune. Aucun oracle de géométrie ou de couleur n’est relâché.

Les PNG complets ne sont pas tous identiques en octets. À 768, le témoin **CSS de référence → même CSS de référence** reproduit exactement le changement raster apparent : 1880 pixels avec un delta de canal supérieur à 16, maximum 90, concentrés dans les glyphes d’en-tête. La capture **après candidate Kit** et la capture **après témoin référence** sont strictement identiques : **0 pixel différent** sur tout le viewport. Les captures avant de ces deux contrôles diffèrent seulement de 2 pixels d’un niveau de canal. C’est donc un effet reproductible de rechargement/rastérisation du harnais, pas une modification de la recette Kit. Les autres écarts raster résiduels (anticrénelage, chrome Moodle) restent documentés, pas supprimés des preuves.

## Vérifications et réserves

- 23/23 exemples Sass Kit PASS ; syntaxe Node du contrôle et du scénario vérifiée.
- Les builds par page réussissent et `native-acceptance.json` vérifie les 38 clés de couverture, l’absence d’erreur/écriture, la parité des sources et les SHA-256 du CSS audité.
- Réserve indépendante : le contrôle global `test-source-authority.cjs` signale `guide/amd/src/easyedu_guide.js`, où le refactoring produit I14 des lecteurs de scènes est postérieur au snapshot Kit. Aucun moteur Guide n’est écrasé ou copié dans ce lot SCSS ; cette propagation JS reste séparée.
- Aucun serveur redémarré, aucune configuration modifiée, aucun cours/compte/groupe créé. Caches purgés uniquement sur :8051 ; branches Claude et autres runtimes intacts. Les wrappers enregistrent la libération des leases et l’effacement des identifiants process-locaux.
- Classement du scénario : candidat natif supervisé (`tools/playwright/i12-consumer-visual-native.spec.js`), limité volontairement au runtime :8051 ; aucune exécution CI autonome revendiquée.

## Emplacements à réviser

Preuves externes : `C:/dev/artifacts/easystud-claude-interface-review-20261011/revue-2026-10-11/I12-CONSOMMATEUR-20261022/`.

- `native-acceptance.json` : 38 mesures retenues, source exacte du scénario, chemins des JSON bruts et des captures avant/après.
- `delta-groups.json`, `gate-2.log` et `C:/dev/scratchpad/i12-22/gate-2/` : classification exhaustive, compilations et hashes.
- `guide-control-cross-pixels.json` et `pixel-audit-easystud-authenticated-20261022T002349874Z-24788.json` : contrôle raster de référence.
- `kit-examples.json`, `kit-source-authority.log` : tests Kit et réserve I14 explicite.
- `C:/dev/scratchpad/i12-22/baseline/deployment.json` : déploiement de la référence et snapshot du runtime précédent.
- `C:/dev/scratchpad/i12-22/runs/easystud/authenticated/` : captures, journaux, manifests et cleanup des enfants appartenant à ce lot.

I12 consommateur est validé selon le contrat arbitré. I13/X4/X5 peuvent maintenant commencer dans un lot distinct ; X6 reste reporté pour la compatibilité Moodle 4.5.
