# K17-79 — espacement des filtres Participants

Base `4474ffde`, branche `work/codex1/easystud-k17-79-20261017`.

Une définition de disposition dessert les deux vues et le responsive. Utilisation du jeton existant `--easyedu-gap` : 16 px par défaut entre blocs/filtres, sa moitié pour les titres/champs (8 px). Aucun style de composant, jeton ou valeur en pixels ajouté. Le sélecteur d’adoption de la recette de pied de filtre exclut maintenant la grille de champs, qui hérite ainsi de son espacement de disposition ; la recette Kit n’est pas modifiée.

## Mesures avant/après

Gabarit Mustache du produit rendu par le vrai moteur Mustache, contrôles recherchables et Motion compilés du produit, feuilles CSS avant/après, Chrome headless Node uniquement. FR/EN × 1600/390 × vue complète/Participants et groupes : 8 comparaisons, zéro erreur console/page, hauteurs des contrôles strictement inchangées. Ce sont des mesures hors Moodle : les trois copies du pool étaient verrouillées, aucune réservation ni copie n’a été modifiée.

| Écart | Avant | Après |
| --- | ---: | ---: |
| Barre de recherche → premier titre de filtre | 6,0625 px | 19,515625 px |
| Écart de grille | 12 px | 16 px |
| Titre → contrôle | 5,59375 px | 8 px |

Les huit comparaisons donnent ces mêmes valeurs ; positions du DOM arrondies au pas du moteur de rendu. Voir les assertions JSON associées, y compris la conservation des hauteurs.

## Vérifications

- Build Node 22.11.0 / Sass 1.79.1, mode conservative : PASS.
- Cascade ordonnée inchangée sur les trois pages hors trois règles ajoutées et les deux sélecteurs de la recette de pied explicitement restreints ; aucune autre déclaration modifiée. Feuilles Import massif et administration inchangées ; feuille globale zéro règle.
- Moteur partagé et 60 cas K17-80 : PASS. Aucun JS, PHP, gabarit, langue, Guide ou carte modifié.
- Contrôles officiels non-PHP de local_codechecker : zéro erreur, zéro avertissement.
- Les premiers échecs de montage de fixture et de découverte de la cascade sont conservés dans le dossier de preuves ; les résultats finaux portent sur les sources finales.

Pour Penpot : colonne Participants, panneau Plus de filtres ouvert, vues complète et Participants et groupes, FR/EN, 1600 et 390 ; espacements par défaut 16/16/8 px. Recette native et acceptation humaine restent à faire après intégration par Claude. Aucune publication localhost.

Preuves : `<workspace>/artifacts/codex1-k17-79-20261017/`.
