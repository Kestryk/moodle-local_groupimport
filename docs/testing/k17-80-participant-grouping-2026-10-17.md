# K17-80 — filtre Groupement partagé entre les vues

Base : `71a8f0cd`. Branche : `work/codex1/easystud-k17-80-20261017`.

Le contrôle existait dans le gabarit commun, mais une classe le masquait hors de la vue Participants et groupes. Le contrôleur ignorait aussi sa valeur hors de cette vue. Retrait de cette classe et de cette condition ; suppression de l’import devenu inutilisé. Un seul champ conserve la sélection pendant les changements de vue. Les libellés FR/EN, le composant Kit, le moteur partagé et les feuilles CSS restent inchangés.

## Contrôles isolés

- Moteur de filtre existant, sélection des résultats filtrés et échappement : PASS.
- Nouveau test : 60 cas FR/EN, vue complète, Participants et groupes, Structure et panneaux responsive ; sélection simple, multiple, sans groupement et effacement, puis combinaison ET avec le filtre Groupe et conservation de la pagination : PASS.
- Builds SM et Course Manager avec Node 22.11.0 : PASS. Seuls le compilé workspace et sa map diffèrent après génération.
- ESLint avec configuration Moodle, normalisation LF identique avant/après : une erreur préexistante de variable inutilisée et un avertissement de ternaire imbriqué, sans augmentation. L’import rendu inutile par ce changement est retiré.
- MoodleCS : zéro erreur sur le plugin PHP complet ; avertissements existants dans le JSON associé. Contrôles officiels non-PHP de local_codechecker : zéro erreur, zéro avertissement.
- Sources/gabarit conservés en CRLF. Aucun PHP modifié. Aucun accès Moodle, navigateur authentifié ou publication ; ces tests isolés ne constituent pas une recette native ni une acceptation visuelle.

Commandes : `node tools/release/test-filter-engine.cjs`, `node tools/release/test-participant-grouping-filter-views.cjs`, `node tools/release/test-security-escaping.cjs`, `powershell -NoProfile -File tools/release/test-student-filtered-select-all-contract.ps1`.

Builds : `node tools/release/build-sm-amd.js <workspace>/moodle51-build-501`, puis `node tools/release/build-course-manager-amd.js <workspace>/moodle51-build-501/node_modules`, avec `<workspace>/tools/node-v22.11.0-win-x64/node.exe`.

Preuves détaillées : `<workspace>/artifacts/codex1-k17-80-20261017/`.

Éléments exposés pour le suivi Penpot : champ Kit de sélection multiple recherchable ; colonne Participants de Student Management ; filtres ouverts en vue complète ; mêmes états vide/sélectionné/réinitialisé que la vue Participants et groupes. Aucun jeton, taille, rayon, couleur ou recette visuelle ajouté.
