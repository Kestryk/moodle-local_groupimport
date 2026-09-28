# Jeu CSV mixte — Moodle 5.1 local, cours 5

Fichier : `mass-import-mixed-course5.csv`

Ce jeu correspond à l'état local vérifié le 28 septembre 2026. Les champs
d'identification activés sont `username` et `email`. Il ne contient aucun compte
personnel : seuls les comptes synthétiques `test.etudiant.*` sont utilisés.

## Scénarios attendus

| Lignes | Scénario | Attendu en prévisualisation |
| --- | --- | --- |
| 2–3 | Compte, groupe et groupement déjà présents | Compte reconnu ; placement déjà présent ou sans ajout à effectuer |
| 4 | Compte présent, groupe et groupement présents, placement absent | Ajout proposé dans `Group 5` et rattachement à `Groupement B` |
| 5 | Compte présent, nouveau groupe, groupement présent | Création du groupe et ajout proposés |
| 6 | Compte présent, même nouveau groupe, nouveau groupement | Réutilisation du groupe et création/rattachement du groupement proposés |
| 7–8 | Email puis username inconnus | Erreur de compte inconnu ; aucune création de groupe issue de ces seules lignes |
| 9 | Compte présent avec nouveaux noms contenant des espaces | Création et placement proposés |
| 10–11 | Même compte exprimé par username puis email, même destination | Contrôle du traitement d'un doublon logique |
| 12 | Groupe obligatoire manquant | Ligne invalide |
| 13 | Identifiant étudiant obligatoire manquant | Ligne invalide |

## Utilisation sûre

1. Ouvrir `/local/groupimport/index.php?id=5`.
2. Déposer le CSV et lancer uniquement la prévisualisation.
3. Comparer les lignes reconnues, inconnues et invalides au tableau ci-dessus.
4. Ne pas confirmer l'import si l'objectif est seulement visuel.

Confirmer l'import modifie réellement les groupes, groupements et appartenances
du cours. Si un test fonctionnel complet est volontairement confirmé, utiliser
l'historique d'import EasyStud pour examiner puis restaurer le lot.

Le fichier dépend de la fixture locale actuelle. Revérifier les comptes et
placements avant de le réutiliser après une reconstruction de Moodle.
