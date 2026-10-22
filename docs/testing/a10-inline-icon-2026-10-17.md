# A10 — espacement des icônes d’ajout, Bootstrap 4/5

Base source : `4474ffde`. Deux boutons des formulaires d’ajout par texte utilisent désormais `easyedu-inline-icon--leading` au lieu de l’utilitaire Bootstrap 5 `me-1`. La recette publique Kit `inline-icon-leading` conserve le contrat d’espacement existant de 0,25 rem (4 px à la racine 16 px), avec la propriété logique `margin-inline-end`. Aucune logique, taille, peau de bouton, carte, langue, JS ou gabarit modifié. Le PHP est strictement identique à la base après inversion des deux chaînes de classes.

Kit : `work/codex1/easyedu-kit-a10-inline-icon-20261017`, base `480fdf4`, commit `6f3279c`. Les deux partiels sont identiques au consommateur. Documentation du composant mise à jour ; aucune branche principale ni composant propre à un autre projet modifié.

## Preuves isolées

- CSS Bootstrap réellement compilés depuis les sources Moodle 4.5.11 et 5.1 ; contrôle headless sur 16 pages, 32 boutons, FR/EN, 1600 et 390. Ces sondes de framework ne sont pas une recette native Moodle.
- 4.5 : marge de l’icône 0 → 4 px ; 5.1 : 4 → 4 px. La géométrie complète mesurée en 5.1 est identique avant/après. Centre horizontal du contenu à 0 px du centre du bouton ; zéro erreur console/page.
- Compilation Node 22.11.0 / Sass 1.79.1 conservative : PASS. Une règle opt-in ajoutée par feuille ; toutes les règles ordonnées précédentes conservées, feuille globale zéro règle.
- PHP lint et MoodleCS du fichier touché : zéro erreur, zéro avertissement. Contrôles officiels non-PHP : zéro erreur, zéro avertissement. PHP conservé en LF, SCSS en CRLF.
- Moteur de filtres, échappement, T037 (17), T038 (49), aller-retour Guide/Kit : PASS. Aucun raccord Guide modifié.

Preuves : `<workspace>/artifacts/codex1-a10-inline-icon-20261017/`, notamment `measurements.json`, `checks.json`, `moodlecs-final.json` et les CSS des deux générations de Bootstrap. La première sortie MoodleCS liée à la conversion CRLF du PHP est conservée ; le fichier final est en LF et repasse à 0/0.

`version.php` et son minimum Moodle restent inchangés. Aucune publication localhost et aucune installation/mise à niveau 4.5 effectuée.

Suite A10 : vérification des contrôles Bootstrap et des fenêtres natives, puis installation vierge et migration sur une copie 4.5 désignée. Les recettes Guide/cartes restent chez leurs agents ; ni leurs contrôleurs ni leurs gabarits ne sont modifiés ici. Ne pas abaisser `requires` avant ces preuves.
