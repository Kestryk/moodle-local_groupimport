# A10 ? minimum d?installation, 20 octobre 2026

Base : 39e856d0. Branche : work/codex1/easystud-a10-bootstrap-20261020.

L?inventaire est relu avant modification. Les deux espacements d?ic?nes de manage.php sont d?j? int?gr?s (396220c1 ? d1bcc365) ; les six selects conservent form-select et custom-select. Le masquage public Kit et la signature XLSX compatible sont ?galement int?gr?s. Aucun nouvel usage Bootstrap 5 sans repli n?est identifi? par le balayage PHP/AMD/templates/SCSS ; les occurrences SCSS visant le DOM natif ne sont pas des d?pendances exclusives.

## Modification

requires passe de 2025100600 ? 2024100700 pour permettre l?installation sur Moodle 4.5. La version interne 2026101801, le sch?ma, la maturit? BETA et la release restent identiques. Aucun champ supported n?est ajout?. Le README distingue minimum d?installation et certification native. Aucun PHP m?tier, template, style ou module AMD n?est modifi? ; aucune compilation d?asset produit n?est n?cessaire.

## Contr?les

- php -l version.php : PASS ; MoodleCS moodle : 0 erreur, 0 avertissement.
- Contrat du minimum et m?tadonn?es inchang?es : PASS ; six selects doubles, deux recettes Kit d?ic?ne, masquage public conserv?s.
- test-security-escaping.cjs et test-filter-engine.cjs : PASS ; aucun AMD modifi?, donc aucune augmentation ESLint.
- test-readfilter-compat.cjs : PASS, 19 cas par interface r?elle PhpSpreadsheet des sources Moodle 4.5 et 5.1, sans bootstrap Moodle.
- Playwright Chrome headless hors serveur : FR/EN ? 1600/390 ? CSS Bootstrap r?el 4.5/5.1, 8 cas et 48 selects. Marge logique d?ic?ne 4 px ; masquage 1 ? 1 px ; s?lections et FormData coh?rents ; nom accessible du bouton trouv? ; aucun d?bordement horizontal, aucune erreur console/page. Les m?mes CSS produit inchang?s sont utilis?s. Les premiers essais de harnais avaient un nom accessible incluant le ? + ? et omettaient la racine easyedu-ui ; corrections limit?es ? la fixture.
- Les feuilles Bootstrap sont compil?es uniquement en m?moire avec Node 22.11.0 / Sass 1.79.1. Aucun build AMD/styles produit, aucun runtime, aucune publication.

## Limites et recette phase 10

Ce contr?le de classes/CSS n?est pas une recette Moodle authentifi?e ni une certification 4.5. Restent ouverts : installation vierge ; migration V1?V2 et conservation des r?glages, donn?es, historique et visites personnalis?es ; Student Management / Import massif ; fen?tres et clavier/focus ; XLSX r?el ; Privacy export/effacement/r?tention et t?ches cron/adhoc. ? ex?cuter par Codex n?2 sur la copie d?sign?e en phase 10 (K18-04), sans provisionnement par ce lot.

Le registre intake de la base contient des marqueurs de conflit (d?s la ligne 1759). Il reste intact : l?entr?e additive est livr?e s?par?ment dans a10-intake-additions-2026-10-20.json, ? fusionner par l?int?grateur apr?s r?paration du registre.

## Preuves et reproduction

Dossier externe : C:/dev/artifacts/a10-bootstrap-20261020/ (inventaire, JSON navigateur, sondes PHP, MoodleCS). Tests versionn?s dans tools/release/test-a10-bootstrap-*.cjs.

Commande navigateur : node tools/release/test-a10-bootstrap-browser.cjs <sass-absolu> <playwright-absolu> <chrome.exe-absolu> <sources-moodle45> <sources-moodle51> <dossier-preuves-externe>. Le script lit uniquement les SCSS des th?mes ; il n?inclut ni config.php ni bootstrap Moodle.
