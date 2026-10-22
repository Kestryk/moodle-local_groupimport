# K17-09 — Imports volumineux et reprise par le cron

Branche dédiée initialement depuis `bc3f48f8`, puis rebasée sans conflit source sur `abf3c636` (`95c6fd19`). Non publiée sur localhost. Claude intègre et publie après revue.

## Fonctionnement

L’aperçu serveur présente cent lignes par page. Les modifications et exclusions sont conservées dans la session lors d’un changement de page ; la recherche et les commandes de sélection annoncent explicitement leur portée sur la page courante. La confirmation porte sur l’ensemble des lignes conservées, pas uniquement sur les lignes affichées. Le contrat sans JavaScript conserve son marqueur de fin et refuse une publication tronquée.

Jusqu’à mille lignes, l’import synchrone existant est conservé. Au-delà, une tâche adhoc Moodle traite cent lignes par transaction. Appartenances, historique réversible et position suivante sont validés ensemble. Une erreur remet le lot courant en arrière ; le prochain passage du cron reprend après les lots déjà validés. Les caches de groupes sont invalidés après un rollback. La politique de remplacement calcule l’union finale des appartenances et groupements, puis applique les retraits à la fin, plutôt que de remplacer séparément chaque lot.

Un verrou par cours sépare le worker, les effacements Privacy et la rétention. Les droits du demandeur sont revérifiés par le worker ; un compte supprimé/suspendu ou un historique restauré annule l’import. Le suivi privé exige connexion, droit de gestion, sesskey, cours et propriétaire. Il ne renvoie ni identifiant personnel ni détail d’exception. La notification Moodle finale est enregistrée avec son marqueur dans une transaction et n’est pas répétée lors d’une nouvelle exécution de la tâche terminée.

Le plafond configurable vaut 50 000 lignes par défaut et reste borné entre 1 et 100 000. Les gardes précédentes restent actives : fichier de 5 Mio, 64 colonnes et 50 000 cellules notamment. Ces plafonds se cumulent : un fichier de trois colonnes pleines atteint la limite de cellules vers 16 666 lignes ; le réglage de lignes ne supprime pas cette protection. Les tableaux présentés ici ne promettent donc pas 100 000 lignes de trois colonnes.

## Composants et périmètre visuel

Import massif, aperçu et suivi, FR/EN, 1600/768/390 : pagination par les mixins Kit `pagination-controls` et `pagination-arrow-button`, panneau et région live existants pour les compteurs de progression. Le dépôt ne possède pas encore de barre de progression générique publique : la barre privée du Guide n’a pas été détournée. **Besoin Penpot/Kit restant : composant de progression déterminée réutilisable**, à valider avant son adoption ; aucun style de barre local inventé.

La pagination est ajoutée uniquement à la feuille Import massif. Les autres sorties de compilation sans changement sémantique sont conservées à leur contenu initial. Les libellés explicites « cette page » et la description du minimum configurable ont été précisés après la matrice native ; ils passent les contrôles statiques finaux, mais ne sont pas présentés comme déjà photographiés dans cette matrice.

## Preuves natives, copie 8052 sous verrou exclusif

Artefacts complets : `<workspace>/artifacts/background-import-20261017/`. Les premières tentatives en échec sont conservées ; seules les preuves nommées ci-dessous fondent les résultats finaux.

| Contrôle réel | Résultat |
| --- | --- |
| Cron 3 000 lignes | 227 174 ms ; pic 41 943 040 octets ; 3 000 appartenances, 30 groupes, 3 groupements ; une notification |
| Cron 10 000 lignes | 213 123 ms ; pic 75 497 472 octets ; 10 000 appartenances, 100 groupes, 10 groupements ; une notification |
| Nouvelle exécution de la tâche terminée | Appartenances et notification inchangées |
| Erreur injectée dans le deuxième lot | Premier lot de 100 conservé ; aucun effet du lot rejeté et position inchangée ; statut de reprise enregistré |
| Reprise par une nouvelle exécution cron | 201 lignes abouties en 2 592 ms, pic 29 360 128 octets, sans réappliquer le premier lot ; une notification |
| Restauration de l’état importé depuis l’historique | Après retrait natif d’une appartenance : 3 000 puis 10 000 appartenances rétablies |
| Aperçu réel, FR/EN × 1600/768/390 | 6/6 PASS ; 100 lignes DOM pour 10 000 au total ; édition et exclusion conservées après aller-retour de page ; zéro erreur console/page |
| Centrage de la flèche de pagination | Hauteur 32 px ; écarts centre X et Y : 0 px dans les six cas |
| local_codechecker, copie de 86 PHP touchés contrôlée par SHA | 0 erreur, 20 avertissements ; zéro erreur console de l’outil |
| Nettoyage | Onze cours initiaux retrouvés ; cours de test absents ; 101 comptes synthétiques supprimés via les API Moodle ; réglage des identifiants restauré |
| Retour de la copie au plugin initial | Version 2026101700, fichiers initiaux identiques par SHA, table de jobs propre et provider de test retirés, caches purgés, verrou libéré |

Les tombstones et journaux natifs créés par les suppressions sont conservés. Aucun effacement de preuve ou réécriture des journaux Moodle. La reprise validée est celle d’un nouveau processus cron ; la tentative antérieure de reprise dans le même processus, avant l’invalidation du cache, reste un échec documenté. Le test de restauration R8 reconstruit l’état importé ; il ne signifie pas une annulation vers un cours vide. L’aperçu natif ne prétend pas avoir exécuté le clic final de mise en file : les files et exécutions cron ont été mesurées avec les mêmes API produit dans la fixture native contrôlée.

## Contrôles isolés et prérequis de fixtures

Les fixtures ont repris la séparation des doubles testée dans `05a07eab` (lot codechecker), pour ne pas introduire de nouveaux échecs de style. Les assertions S2, S5, S6 et R8 restent actives ; seules leurs dépendances suivent l’extraction vers `importlib.php`, le nouveau plafond et le verrou du cours. Le test du plafond historique de mille lignes reste couvert lorsqu’un plafond de mille est explicitement demandé. Le test de remplacement appelle la vraie méthode privée finale par réflexion ; il ne recopie pas son algorithme.

La porte isolée TRI19 couvre treize suites : aperçu, exécution, Privacy, autorisations AJAX/Gestion, identifiants, lecteurs, export, opérations groupées, historique, XLSX formatés, échappement et moteur de filtres. Les contrôles complémentaires couvrent la persistance de page, la projection Privacy des lignes en attente, la réunion des cibles de remplacement et le navigateur isolé sur 1 500 lignes. Résultats finaux statiques et builds : `<workspace>/artifacts/background-import-20261017/final-static-proof.json`.

Les tests PHPUnit natifs ajoutés ne sont pas annoncés comme exécutés par le lanceur PHPUnit Moodle : leurs deux méthodes sont aussi invoquées par un harnais isolé. Les mesures natives n’exonèrent pas de la revue de la nouvelle table, de l’upgrade 2026101702, des transactions et de la rétention avant intégration.
