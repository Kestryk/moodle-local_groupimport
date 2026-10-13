# T058 — correction bornée du cycle de focus des fenêtres

## Périmètre

Cette correction traite uniquement les fenêtres déjà gérées par les contrôleurs
EasyStud : réglages Group/Grouping, déplacement de participants, groupes et
membres, presse-papiers, confirmation de suppression et historique d'import.
Elle n'ajoute ni commande métier, ni gabarit, ni style, ni dépendance Moodle
5.x. Les écrans de message et Guide conservent leur cycle natif existant et
restent dans le périmètre de l'audit T058, pas de cette correction ciblée.

## Contrat appliqué

Après l'animation d'ouverture, la fenêtre place le focus sur son contrôle de
fermeture (le presse-papiers conserve son champ de texte comme focus initial).
Tab et Maj+Tab restent dans les contrôles visibles et activés de la fenêtre.
Échap laisse d'abord agir un contrôle imbriqué qui l'a déjà consommé ; sinon il
réutilise la fermeture native. Le focus revient au déclencheur seulement après
la fin de l'animation de fermeture et seulement si le navigateur ou Moodle ne
l'a pas déjà placé sur un proxy natif visible.

L'écouteur est local à chaque fenêtre, remplace son prédécesseur lors d'une
réouverture et ne laisse aucun gestionnaire global après retrait d'un éditeur.
Les boutons Annuler, les animations Motion, les requêtes et les données
restent inchangés.

## Preuve de code et build

- `tools/release/test-modal-focus-scope.cjs` borne les changements aux aides de
  focus et aux ouvertures/fermetures autorisées ; il reconstruit les corps métier
  de déplacement et de presse-papiers, et vérifie les AMD générés.
- `tools/release/test-modal-focus-behaviour.cjs` couvre focus initial, boucle
  Tab/Maj+Tab, exclusion des éléments désactivés ou cachés, Échap imbriqué,
  fermeture native, retour différé, animation annulée et priorité d'un proxy
  natif.
- Les deux AMD sont reconstruits avec les toolchains Moodle disponibles ;
  `git diff --check` passe.

La preuve navigateur N1 sur la copie Perf (:8051), en 1280 et 390, reste le
jalon suivant. Elle doit confirmer les sélecteurs réels sans enregistrer,
déplacer, supprimer ni modifier de données. L'audit d'accessibilité global et
la checklist humaine restent ouverts.

## Documentation transverse

Il n'y a pas de modification visuelle ou de contrat de composant du Kit : il
s'agit d'un adaptateur JavaScript local. Le contrat de documentation du Kit ne
requiert donc aucune mise à jour de composant Foundation.
