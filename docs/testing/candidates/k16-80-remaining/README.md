# Candidats de recette K16-80

Ces quatre recettes conservent les oracles natifs exécutés et leurs fixtures :
métriques de texte/glyphe, aperçu de fiche, états de cartes et composants en attente.
Les preuves d’exécution sont externes et ne sont pas des médias versionnés.

Les sources sont archivées comme texte, avec les chemins de machine remplacés par
des paramètres nommés. Les empreintes source/candidat sont dans registry.json.
Le statut est **candidate**, pas un test CI exécutable ni une certification Docker.
Le seul travail de préparation a remplacé les chemins ; les assertions n’ont pas
été affaiblies. Les prédécesseurs échoués restent dans leurs artefacts externes.

Avant une adoption CI : raccorder le runner authentifié partagé et son chargeur
de credentials process-local, découvrir une seule recette, prendre le bail du
runtime de test et le bail de mutation de fixture, matérialiser les chemins et
le répertoire de sortie externe. Ne jamais versionner l’état d’authentification.
Les fixtures n’appartiennent qu’au cours synthétique marqué et doivent être
restaurées en finally. Aucun test ne doit prendre localhost:80 par défaut.

L’adaptateur doit conserver tous les états/largeurs/langues, les sondes Range,
les temps d’animation comparés, les assertions console et les retours à ready.
Le code archivé ne remplace pas les contrôleurs du produit et ne se charge
jamais dans Moodle. Son adoption automatisée nécessite une nouvelle recette.
