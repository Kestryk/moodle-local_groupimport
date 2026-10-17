# Sessions en lecture seule — diagnostic du 17 octobre 2026

## Conclusion

Le HTTP 500 de la recette `perf-v2-config` provient du prérequis MUC de Moodle, avant toute navigation mesurée et avant `local_groupimport_get_state`. Il ne prouve pas une écriture illégale de ce service. Aucun correctif du plugin ni changement de configuration de :8051 dans ce lot.

## Preuves locales

- Rapport initial : `C:/dev/worktrees/easystud-codex2-perf-v2-20261017/docs/testing/perf-v2-config-17-10-2026.md`, lignes 20–28. Le refus apparaît après la connexion et cite `core/navigation_cache`.
- Moodle 5.1, `lib/classes/session/manager.php:172–178` : lorsque `enable_read_only_sessions` est actif, la présence de `$_SESSION['SESSION']->cachestore_session` déclenche exactement cette exception, avec les définitions trouvées. Ce contrôle intervient dans le démarrage de session ; il n'analyse pas les mutations du service EasyStud.
- `lib/db/caches.php:639–643` : `core/navigation_cache` est une définition `MODE_SESSION`, TTL 1800. `cache/stores/session/lib.php:59–66` conserve par défaut les données de ce stockage dans `$SESSION`.
- EasyStud `db/services.php:28–37` : `get_state` est un service `read`, `ajax`, avec `readonlysession => true`. `classes/external/get_state.php:65–79` valide contexte et capacité puis construit et sérialise l'état.
- La lecture de `classes/service/course_state.php` et de ses dépendances directes ne révèle pas d'affectation à `$SESSION` ; `classes/local/state_version.php:50–53` lit la version en base. Une éventuelle écriture dans un cache MUC n'est pas, en soi, une écriture de session PHP. Cette inspection n'est pas une certification dynamique de tous les chemins du cœur ou des extensions.

## Configuration à recommander à Edunao

Séparer le gestionnaire de session PHP et les caches MUC de mode session. Configurer un gestionnaire compatible avec la lecture seule, par exemple Redis ou database. Dans **Administration du site → Plugins → Mise en cache → Configuration**, créer un stockage MUC compatible avec le mode session hors de `$SESSION`, par exemple Redis, puis y mapper **toutes** les définitions de mode session, y compris `core/navigation_cache`. Vérifier aussi les mappings par défaut et les extensions installées ; ne pas traiter cette seule définition comme une liste exhaustive. Activer ensuite le drapeau. Cette séquence suit la [documentation Moodle 5.1](https://docs.moodle.org/501/en/Session_handling#Read_only_sessions) et le [contrat MUC](https://moodledev.io/docs/5.1/apis/subsystems/muc).

Le réglage suivant ne remplace ni le mapping MUC ni un gestionnaire compatible :

```php
$CFG->enable_read_only_sessions = true;
```

Un déploiement progressif peut d'abord employer `enable_read_only_sessions_debug` pour relever les mutations interdites sans activer le fonctionnement réel en lecture seule. Aucun gain de performance n'est affirmé avant une nouvelle mesure.

## Porte de rejeu pour Codex n°2

1. Conserver les valeurs initiales et l'export de la configuration MUC ; utiliser les identifiants et préfixes Redis propres à la copie.
2. Configurer le gestionnaire et tous les mappings, puis ouvrir une nouvelle session authentifiée. Vérifier connexion et page Moodle sans EasyStud avant de tester le plugin.
3. Rejouer `get_state` et `get_details` avec HTTP 200, réponse sans erreur et absence d'avis d'écriture en session. Tester en parallèle les actions d'écriture, qui doivent garder le verrou natif.
4. Rejouer la matrice et les mesures B/C de la recette initiale ; restaurer les réglages de la copie à la fin selon son protocole.

**Limite :** aucun changement ni rejeu natif des configurations B/C dans ce lot ; le propriétaire de :8051 les réalisera. Aucun cache du cœur n'est désactivé et aucune exception Moodle n'est masquée.
