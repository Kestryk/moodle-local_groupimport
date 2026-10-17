# K16-17 — rédaction approuvée, 17 octobre 2026

Base : `abf3c636`. Décision K17-17, sections N/O de `VALIDATIONS-EN-ATTENTE-KEVIN.md`, points 31–42. Ce lot modifie uniquement les valeurs des langues FR/EN : 46 valeurs FR et 51 valeurs EN.

La personne du cours est un participant ; l’appartenance à un groupe reste une appartenance de membre. Les comptes et champs Moodle conservent « utilisateur / user ». Les rôles explicitement nommés Étudiant / Student, l’adresse fictive `student.01@example.com` et les noms Projet Orion / TD lundi sont conservés. Les anciens noms de personnes fictives Étudiant 1–4 deviennent Participant 1–4. Les consignes de boîte de dialogue utilisent fenêtre / dialog ; les autres fenêtres de navigateur ne sont pas renommées.

## Contrôle du comportement avant reformulation

| Décision | Preuve du code actuel | Application |
| --- | --- | --- |
| 31 | `manage.php`, contextes de cartes de personnes inscrites ; `classes/local/import_user_lookup.php:36–54`, `get_enrolled_sql` ; `classes/service/membership_transfer.php` distingue les appartenances | Clés de personnes/import ciblées explicitement, aucun remplacement global ; rôle Student conservé dans les filtres illustrés |
| 32 | `amd/src/local/cm/context_menu.js:434–476` envoie `addemails` pour la carte groupe et `addgroups` pour le groupement, sans création de compte ni inscription au cours | Ajouter les participants copiés / Add copied participants ; Ajouter les groupes copiés / Add copied groups |
| 33 | Liens d’espace dans `manage.php` / `index.php`, historique dans le provider Privacy | Import massif / Mass Import pour l’espace ; imports ordinaires en minuscules dans la description d’historique |
| 34 | `guide_discovery.php:365–371`, programme du parcours `practice-membership` ; `manage.php:1702` | Parcours guidé / Guided path, sans changement d’identifiant ni de progression |
| 35 | `move_modal.js` et éditeur utilisent des boîtes de dialogue natives ; chaînes de contexte de destination | Fenêtre / dialog seulement dans les consignes concernées |
| 38 | `index.php:1627–1636` montre l’état initial commun ; formulaire accepte CSV et Excel | Téléversez un fichier CSV ou Excel pour lancer l’import. / Upload a CSV or Excel file to begin the import. |

## Exceptions factuelles, conservées

- **36 : `importrollbackpreserved` n’a plus de consommateur dans le code produit de cette base.** Aucun objet ni compteur producteur ne peut être démontré ; sa valeur historique est conservée. La restauration active utilise `importrollbacksuccess` et les compteurs structurés groups/groupings/members/assignments/skipped.
- **39 : `userautomaticnotfound` et `emailsprocessed` n’ont plus de consommateur dans le code produit de cette base.** Le chemin actif S5 utilise `import_user_lookup::unavailable_message` et `importuserunavailable`, commun aux identifiants inconnus, hors cours ou ambigus. Le remplacer par une affirmation « aucun participant ne correspond » serait inexact pour les ambiguïtés. Ces deux valeurs historiques et leur placeholder restent donc inchangés, conformément à la consigne de vérifier le comportement réel.
- Les chaînes des visites sont modifiées, sans toucher aux visites en base, à leurs identifiants ou à leur règle d’installation. K17-11 reste le lot indépendant de préservation des visites modifiées.

## Vérifications

| Vérification | Résultat |
| --- | --- |
| Clés et ordre FR/EN | PASS, 1 232 affectations par langue, ordre identique |
| Placeholders, ordre et répétitions | PASS par clé, y compris `{$a}`, `{$a->…}` et marqueurs `__…__` |
| Octets hors littéraux et CRLF | Identiques |
| `php -l` des deux langues | PASS |
| MoodleCS du plugin local_codechecker, standard moodle | 0 erreur, 0 avertissement sur les deux fichiers |
| `test-security-escaping.cjs` | PASS, 39 modules cm/sm |
| `git diff --check` | PASS |

Preuves détaillées : `C:/dev/artifacts/redaction-k16-17-20261017/` (`changes.json`, `invariants.json`, `codechecker.json`). Aucun changement CSS, AMD, template ou logique. Recette native non revendiquée pour cette correction de valeurs ; les démonstrations 4/8/11 constituent une branche indépendante.
