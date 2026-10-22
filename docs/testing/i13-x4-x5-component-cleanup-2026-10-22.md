# I13 / X4 / X5 — composants, tokens et spécificité

Base : publication consommateur I12 `9838d0b0`, Kit de base `40a4c06`, branche X5 livrée `94b4029` (lecture distante concordante). Branche produit dédiée `work/codex2/easystud-kit-consumer-i12-20261022` ; branche Kit `work/codex2/easyedu-x5-specificity-20261022`. Aucun changement de la branche Claude, aucun déploiement sur localhost:80. Recette uniquement sur :8051 ; livraison des branches, sans publication.

## Changements

- **I13** : règles des deux partiels de lots replacées dans leurs sept composants ; `_k16-finish.scss`, `_k17-car.scss` et leurs imports supprimés. L’audit de la migration seule conserve exactement les **21 488 entrées** (sélecteur, média, propriété, valeur, priorité, multiplicité). Les deux modules drag utilisent `responsiveWorkspaceQuery` ; chaîne média résultante strictement identique, aucun nouveau breakpoint.
- **X4** : **6 occurrences**, **4 tokens existants** (`surface`, `count-bg/border/text`). Trois substitutions soft candidates ont été rejetées au pilote : elles suivaient une palette configurable au lieu de la peinture fixe initiale. Aucun token approximatif créé. **22 lignes de couleurs restent intactes**, dont `#72508c` dans `_card-titles.scss`, faute d’équivalent sémantique exact accepté. Les tailles rem et les tokens de breakpoint ne sont pas traités.
- **X5** : six priorités Guide retirées (bouton de lancement normal/hover/focus), deux longhands d’aide redondants retirés. Guide **49→43**, aide **33→31**, responsive **18→18**. Les priorités de focus/Motion/disabled, de hidden et d’adaptation Moodle sont conservées ; ce lot ne prétend pas éliminer toutes les priorités.
- **X6** : reporté et intact ; aucune migration Bootstrap4, template ou contrôleur hors les deux imports média I13.

## Recette native avant/après

**78 cas uniques contrôlés : 66 paires strictement neutres et 12 cas de défilement neutralisés par un témoin CSS identique**, FR/EN × 1600/768/390 : Student Management, Mass Import, Administration, Guide, filtres, groupe et groupement sélectionnés, aide normale/survol/focus et lancement Guide normal/survol/focus. Comparaison des CSS sur le même DOM Moodle réel ; aucun contrôleur ou réponse métier simulé. Seuil de géométrie ≤0,5px, styles calculés et textes/classes strictement identiques, aucune augmentation de débordement. **0 erreur JS, 0 erreur console, 0 écriture de cours** ; les POST movestatus sont des lectures consignées séparément. Captures PNG avant/après et mesures fragmentées conservées.

La première matrice complète reste immuable : 60 cas neutres,18écarts de harnais. Les bulles ont un délai natif400ms et peuvent se fermer pendant l’échange de CSS. Chromium a aussi changé le scroll interne du Guide pendant ce même échange : le témoin CSSidentique→CSSidentique reproduit17/40px enFR et38/34px enEN aux deux largeurs compactes. Les contrôles compacts du Guide après cet échange correspondent au candidat. Aucun de ces échecs n’est effacé.

Deux successeurs réappliquent symétriquement les **mêmes actions natives** avant et après le chargement de CSS : attendre la bulle visible, écarter le pointeur avant entrée clavier, remettre la cible Guide en vue et ré-entrer dans son survol/focus. Aucune mutation directe de scrollTop, aucun clic forcé, masquage d’overlay, retiming Motion ou assertion relâchée. Résultat : **12/12 états d’aide et 6/6 états Guide bureau strictement neutres**, intégrés aux 48 autres cas directs de la matrice. Les **12 états Guide compact** gardent leur échec brut de position absolue : chacun ne présente que la translation verticale exactement reproduite dans le témoin CSS identique, avec couleurs, textes, classes, dimensions et coordonnées relatives inchangés. Le contrôle final les classe explicitement à part ; aucun échec brut n’est rebaptisé PASS dans sa spec. La comparaison raster n’est pas annoncée bit-à-bit universelle : les styles calculés sont identiques, les différences de composition/anticrénelage restent dans les preuves ; la paire aide-focusFR390 inspectée est exactement identique en pixels.

Les deux specs historiques et les runs échoués restent distincts. Le successeur versionné `tools/playwright/i13-cleanup-paint-states-native.spec.js` est un candidat de recette/CI à rattacher par le propriétaire du registre partagé ; la recette locale8051 ne constitue pas une acceptation humaine ou une preuve Moodle4.5/5.3.

## Contrôles de source et builds

- Build AMD officiel : exit0, deux modules et leurs maps seulement.34 maps modifiées seulement par les EOL de sourcesContent ont été conservées depuis le parent après vérification des mappings et du contenu source décodé.
- ESLint comparatif : drag_drop **1 erreur/2avertissements→1/2**, drag_support **0/0→0/0** ; max-len antérieur non corrigé hors scope.
- Échappement, moteur de filtre et contrat d’aide9 assertions : PASS ; **23/23 exemples Sass** et export public SCSS du Kit : PASS.
- Audit Kit : **64 constats**, identiques à la base40a4c06 ;29connus et35hors baseline historique. L’option FailOnNewWarning reste rouge également sur la base, aucune nouvelle alerte introduite, baseline non modifiée.
- **56/56 SCSS partagés identiques** entre Kit candidat et consommateur (normalisation CRLF). CSS par page généré avec l’outil officiel conservateur ; pas de CSS expanded ni @charset ajouté.

## Réserves explicites

X4 reste partiel : les22 lignes restantes nécessitent un choix de token sémantique, pas un remplacement de couleur ressemblante. X5 garde43/31/18 priorités justifiées ou insuffisamment couvertes pour un retrait sûr. X6 reste reporté. La réserve I12 du miroir JS Guide/I14 appartient à un autre lot : aucun moteur/template générique n’est recopié ici. Les corrections et preuves de ce lot doivent être intégrées depuis les branches dédiées ; aucun main Kit n’est modifié dans cette livraison.

## Emplacements à réviser

Preuves externes : `<workspace>/artifacts/easystud-claude-interface-review-20261011/revue-2026-10-11/I12-CONSOMMATEUR-20261022/` : `cleanup-native-acceptance.json`, `cleanup-final-source-audit.json`, `audit-i13-linear.log`, `eslint-comparison.json`, `x5-kit-examples.json`, `x5-contextual-contract-final.log`, `x5-kit-audit{,-base}.log`, `x5-package-final.log`, `cleanup-guide-control-{fr,en}.json`, `cleanup-raster-sample.json` et le point de reprise. Les JSON d’acceptation listent chaque cas et ses captures/raw.

Runs natifs : matrice `20261022T053330116Z-67500`, contrôles `054530208Z-54340` / `054710462Z-66904`, aide `055132128Z-49372`, Guide `055531825Z-45728`, sous `<workspace>/scratchpad/i12-22/runs/easystud/authenticated/`. Les deux harnais intermédiaires non livrés sont archivés dans `harnais-predecesseurs/`, sans suppression.

Build final : les cinq CSS (globale vide de présentation + quatre pages, Administration comprise) sont exactement celles du candidat natif b6fbef81. Parité des56 SCSS partagés confirmée avec94b4029. Configuration et empreintes du cours5 identiques après restauration des préférences. Aucun cours/compte créé pour cette recette.
