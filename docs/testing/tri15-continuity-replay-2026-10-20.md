# TRI 15 — protocole de continuité V1 vers V2

## Définir la version de départ

La référence stable locale est le tag `v1.0-groupimport-csv`, commit
`741a3e66`, daté du 13 février 2026. Son manifeste déclare
`version=2026010503`, `release=0.1`, maturité stable, minimum Moodle 4.1.
Le nom du tag ne doit pas être confondu avec le champ release ni avec une
preuve de diffusion d'un zip sur Marketplace.

`a10f47b0` introduit le gestionnaire EasyStud (`2026060600`, beta).
`58747296` introduit l'historique (`2026061901`, beta). La V1 stable n'a
aucune table d'historique : lui inventer des lignes V1 serait une fausse preuve.
Le deuxième scénario couvre donc cette étape intermédiaire explicitement.
La cible de cette recette est `95b1c161`, version interne `2026101801`,
minimum Moodle 4.5 ; le composant reste `local_groupimport`.

## Préconditions impératives pour chaque version Moodle

1. Une copie jetable, dont la **base** et le **code cœur** sont de la même
   version (4.5 ou 5.1). Vérifier le champ `config.version` en lecture seule.
   Ne jamais brancher un cœur 4.5 sur une base 5.1, ni forcer la version du cœur.
2. Un verrou exclusif de copie. Sauvegarder exactement code du plugin et
   wrapper config avant manipulation. Ne jamais baisser la version du plugin
   dans la base partagée : utiliser une base neuve ou une vraie copie jetable.
3. Copier aussi les fichiers Moodle référencés, pas seulement la base, dans
   un dataroot distinct. Caches, sessions et nom du cookie également distincts.
4. PHP compatible avec le cœur, débogage développeur actif. Aucun cron
   automatique sur la base jetable pendant les instantanés de migration.
5. Aucune commande `admin/cli`. Employer un script temporaire CLI qui inclut
   le config de la copie, vérifie URL et nom exact de base, puis les API Moodle.

## Scénario A : vraie V1 stable

1. Extraire exactement le tag stable dans `local/groupimport`. Sur une base
   jetable existante utilisée comme socle, supprimer uniquement ses tables et
   réglages de plugin, poser sa version V1 et reconstituer ses capacités avec
   le code V1. Purger avant de créer les données pour éliminer les observers V2.
   Cette variante est une reconstitution sur un cœur déjà installé, pas une
   installation fraîche du serveur de février 2026.
2. Poser `alloweduserfields=email,idnumber` et `defaultuserfield=email`.
   Student Management doit être absent, pas artificiellement activé.
3. Créer un cours de test, un enseignant et quatre participants inscrits avec
   leurs rôles natifs. Créer un groupe rempli, un groupe vide et un groupement,
   avec descriptions et idnumbers, et leurs liens.
4. Soumettre réellement à la V1 un CSV `useridentifier;groupname;groupingname` :
   une appartenance existante, un nouveau membre d'un groupe existant et un
   membre d'un nouveau groupe/groupement. Résultat attendu : trois groupes,
   deux groupements, quatre appartenances et cinq inscriptions.
   Dans cette recette, le fichier de brouillon est préparé par l'API File de
   Moodle ; le POST est celui du vrai formulaire, pas un importeur simulé.
5. Ajouter une visite d'établissement et une copie personnalisée d'une visite
   livrée. Capturer tous les enregistrements de groupes, groupements, membres,
   liens, inscriptions, rôles, réglages, tours et étapes (IDs compris).
6. Copier le code V2. Purger les métadonnées de plugins après l'échange de
   code, puis vérifier que seul `local_groupimport` attend une mise à niveau.
   Script temporaire, jamais `admin/cli` :

   ```php
   define('CLI_SCRIPT', true);
   require('/absolute/path/to/disposable/config.php');
   // Assert exact disposable wwwroot and dbname here before any write.
   require_once($CFG->libdir . '/upgradelib.php');
   purge_all_caches();
   core_plugin_manager::reset_caches(true);
   // Abort if any other component needs an upgrade.
   upgrade_noncore(false);
   upgrade_finished();
   purge_all_caches();
   ```

7. Capturer à nouveau. Exécuter `test-tri15-continuity.cjs` sur les deux JSON.
   Aucune modification de groupes, groupements, membres, inscriptions, rôles
   ou réglages V1 n'est permise. Les visites personnalisées et leurs étapes
   restent identiques ; seul le retrait intentionnel des visites livrées non
   modifiées est permis (désactivation, jamais suppression).
8. Vérifier sur navigateur enseignant FR/EN, bureau et mobile : Mass Import
   s'ouvre ; la gestion native des participants reste disponible ; l'URL
   `manage.php` redirige vers Mass Import tant que l'administrateur n'a pas
   activé Student Management ; soumettre un aperçu V2 sans confirmer l'import.
   Le nouveau look et l'identification automatique sont voulus, pas une preuve
   de conservation du rendu pixel à pixel de V1.

## Scénario B : historique intermédiaire existant

1. Dans la même copie jetable remise au point de départ approprié, utiliser
   le schéma exact de l'historique `2026061901` du commit `58747296` : dix
   champs, sans `changesjson` ni champs de restauration. Vérifier les
   déclarations XMLDB contre cette révision, pas contre un schéma inventé.
2. Poser deux historiques synthétiques rattachés au cours/auteur : un de
   dix jours et un de quatre cents jours. Garder noms, empreintes, compteurs,
   politique et date. Poser la version intermédiaire et les réglages V1.
3. Rejouer `upgrade_noncore(false)` uniquement sur la copie. Les deux lignes
   doivent survivre à la migration, avec le même ID et tous leurs champs.
   Les champs nouveaux sont ajoutés sans transformer ces anciennes lignes en
   opérations restaurables. Vérifier leur présence et l'état legacy dans l'UI.
4. La rétention par défaut devient 365 jours. **L'upgrade ne purge pas les
   historiques ; un futur cron peut le faire.** Pour conserver une archive de
   400 jours, régler une durée supérieure avant le premier cron et/ou exporter
   la base. Ne pas annoncer une conservation éternelle des historiques.

## Nettoyage et preuves

Fermer uniquement ses contextes Playwright. Restaurer les octets exacts du
code/wrapper config de la copie initiale, vérifier leurs SHA-256, supprimer
uniquement sa base jetable après contrôle de son nom et libérer son verrou.
Ne pas restaurer la base d'origine à partir de données de test : elle n'a
jamais été modifiée. Conserver rapports JSON, journaux, captures avant/après,
révisions Git et les échecs de préparation séparément des preuves finales.

Commande de comparaison, sans connexion Moodle :

```text
node tools/release/test-tri15-continuity.cjs <before.json> <after.json> <proof.json>
```

La préparation native doit adapter seulement chemins/URL/base de copie ;
elle ne doit contourner ni les contrôles de version ni les capacités Moodle.
