# Tests anciens et libellé du chevron — 17 octobre 2026

Branche `work/codex1/easystud-tests-repin-2-db964-20261017`, base `db964f08` ; successeur sans force-push de la branche précédente. Aucun accès Moodle, session, base de données ou service ; aucun fichier produit JS/AMD/CSS/template modifié. Seul changement produit : deux chaînes singulières FR/EN. Les navigateurs utilisent `setContent` et bloquent toutes les requêtes réseau.

## Avant / après

Les dix tests signalés (dont les trois `test-filter-disclosure-*`) échouent tous sur **108f0b2c**, et encore sur **d01f7208** avant adaptation : 20 exécutions, sans timeout. Nouveau rejeu depuis db964f08 : les dix échouent encore avant adaptation, soit 30 échecs de base documentés au total. Les dix oracles et le test navigateur archivés restent byte-identiques sur db964f08. Les arguments Kit, PostCSS, Playwright et Acorn ont été fournis ; Mass Import atteignait bien son assertion historique de rendu, pas une erreur d'invocation PHP. Sur la base 108f0b2c, le worktree package n'avait ajouté que ses outils de paquet : les entrées de ces contrats étaient inchangées.

Les onze anciens fichiers, y compris le test navigateur du Guide, sont conservés intégralement dans `docs/history/retired-test-contracts-2026-10-17/`. Leurs empreintes correspondent aux blobs de d01f7208. Les comparaisons de fichiers entiers contre une révision antérieure à T055/aux feuilles par page sont **retirées comme contrats obsolètes** ; elles ne sont pas présentées comme des preuves de parité avec cet ancien design. Les successeurs testent les composants actuels. Aucun échec actif n'est ignoré ou converti en succès.

| Test | Contrat actuel vérifié / remplacement explicite |
| --- | --- |
| quiet-selection-recovery | Feuille SM propriétaire : géométrie 1,9 rem / 0,35 rem, repos transparent, focus, survol doux, état désactivé ; absence de composants globaux. Ancienne identité de feuille entière retirée. |
| wave15-corrections-contract | Lit student-management.css et la racine Guide consolidée. Assertions de comportement et de rendu applicables conservées. Seule ancienne obligation de `width:100%` dans le partiel local supprimée : T048 confie ce dimensionnement au Kit. |
| view-icon-palette-preservation | Les quatre états de peinture tiled n'introduisent ni géométrie ni Motion, jetons exacts et section de recette identique au Kit fourni. Ancienne identité du reste de la feuille retirée. |
| guide-navigation-tooltip-source | Cycle du helper modulaire actuel : ancrage, délai de sortie 220 ms, survol de la bulle, Échap, refus de propagation, nettoyage et propriété du plein écran. |
| tooltip-extraction-source | Mixin canonique utilisé, aucune typographie locale ; valeurs compilées exactes et recette identique au Kit fourni. |
| filter-disclosure-local-work / refresh-preservation | Exécute le vrai bindAdvancedFilters : quatre panneaux × deux états, ouverture/fermeture, aria/inert, Motion et cycle pointeur ; aucun scan de cartes/pastilles ni appel de pagination/rafraîchissement global. Les doubles de ces appels interdits ne sont pas fournis. Ancienne identité du contrôleur entier retirée. |
| filter-disclosure-capsule-source | Quatre composants Kit et cibles de compteur ; recette et feuille SM présentes. Ancien snapshot de cascade remplacé. |
| mass-report-semantic-palette | Feuille Mass Import, vrai adaptateur PHP ; peinture sémantique, géométrie/type/Motion, contraste et états Export conservés. Ancienne comparaison avec styles.css de 9726efb1 retirée. Le retour à la palette officielle est désormais mesuré **après chaque transition de palette/état désactivé**, contre le relevé initial, jamais par comparaison d'une feuille à elle-même. |
| modal-focus-scope | Exécute la vraie autorité clavier modal.js : liaison unique, focus initial, Tab aller/retour, Échap déjà traité, garde de fermeture, Motion terminée/annulée, retour du focus et dialogue vide ; les consommateurs et le module généré restent raccordés. Ancienne identité AST de tout course_manager retirée. |

Le helper partagé `tools/release/lib/current-presentation-contracts.cjs` évite les oracles divergents. Les vérifications de recette Kit acceptent le chemin en argument. Les lectures normalisent CRLF sans modifier les fichiers produit.

## Résultats

- 17 portes statiques/VM existantes ou adaptées : PASS (détail JSON joint), dont escaping, moteur de filtres et les cinq contrats CRLF.
- Mass Import : **387 assertions isolées PASS**, six palettes, 1600/768/390, PHP réel ; aucune preuve d'intégration Bootstrap/Moodle revendiquée.
- Guide : **9 cas navigateur PASS**, trois libellés FR/EN courts/longs × 1280/768/390 ; peinture, limites écran, clavier, clic, défilement, vrai plein écran, teardown/rebind. Ajouts : rester sur la bulle au-delà de 220 ms, premier Échap réservé à la bulle, second rendu au Guide. La fixture utilise la classe actuelle du libellé et force explicitement une troncature pour éprouver ce chemin ; ce n'est pas une modification du style produit.
- Six mutations en mémoire rejetées par les assertions : focus supprimé, padding tiled parasite, graisse de bulle erronée, mauvaise touche Échap, pagination appelée lors du dépliage, capsule manquante. Aucun fichier produit muté.
- `php -l` FR/EN et fixture : PASS. Aucun build requis : aucun amd/src ni SCSS modifié.
- Le miroir corrigé reste sur sa **branche distincte** : T037 14, T038 47 et roundtrip 6 exports AMD / 3 SCSS / 2 templates PASS avec le Kit db964 (base d4cdfe5, A11Y et patch Codex2). Cette branche de tests ne prétend pas réparer à elle seule le miroir.

## « Voir les 0 membres »

`manage.php` transmet déjà count_template ; `local/sm/index.js` choisit la forme selon Intl.PluralRules ; `local/cm/group_cards.js` affecte cette valeur au texte masqué et à aria-label. La feuille SM masque `members-toggle-label` : le libellé résiduel est accessible, sans rendu visible. Aucun comportement du chevron changé.

Ajout de `groupmembersshowall_one` : FR **Voir 0 membre / Voir 1 membre**, EN **See 1 member** ; les formes plurielles existantes restent inchangées (EN zéro : See all 0 members). Le test exécute le vrai helper PHP et le vrai countLabel JS sur 0/1/2/23 en FR/EN, vérifie leur accord et le raccord aria : **8 cas PASS**. Aucun changement de JS ni de build.

## Reproduction locale isolée

Node : `<workspace>/tools/node-v22.11.0-win-x64/node.exe` ; PHP : `<php-root>/php/php.exe`.
Modules Moodle/Acorn/PostCSS : `<workspace>/moodle51-build-501/node_modules` (ou MOODLE_NODE_MODULES pour le helper).
Kit : `<workspace>/worktrees/easyedu-ui-kit-guide-db964-20261017`.
Playwright : `<workspace>/Moodle 51/MoodleWindowsInstaller-latest-501/server/moodle/local/groupimport/tools/playwright/node_modules` ; fournir `/playwright` au test Guide, le répertoire node_modules au test Mass Import ; PHP en troisième argument Mass Import. Chrome installé, mode headless.

Logs complets, lanceurs, comparaison des bases et mutations : `<workspace>/artifacts/a11y-followup-db964-20261017/`. Les JSON versionnés contiennent les résultats et empreintes ; aucun secret ni log volumineux embarqué. Ces preuves sont isolées : aucune recette native ni acceptation humaine nouvelle.

Reprise 6 h 10 : seul CHANGELOG/intake a nécessité une union ; toutes les valeurs de db964 sont conservées, ajout de testsRepin220261017 uniquement. Les deux chaînes se sont appliquées sans conflit. Aucun fichier source de Claude modifié ; les anciennes branches poussées restent conservées.
