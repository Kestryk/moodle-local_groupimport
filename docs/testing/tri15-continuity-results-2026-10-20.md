# TRI 15 — continuité V1 vers V2, résultats

**Résultat : PASS pour les deux migrations natives 5.1 ; certification globale
4.5/5.1 non acquise.** Aucun code produit modifié.

Référence V1 : tag `v1.0-groupimport-csv`, `741a3e66`, version `2026010503`,
release `0.1`. Référence intermédiaire avec historique : `58747296`,
version `2026061901`. Cible exacte : `95b1c161`, version `2026101801`.
Le tag local ne prouve pas quel paquet a réellement été installé chez chaque
établissement. Le protocole de rejeu est livré dans
`tri15-continuity-replay-2026-10-20.md`.

## Isolation

Verrou du pool `8052.lock` acquis au nom du lot. Sauvegarde du code de la copie
et de son wrapper config. Base originale `moodle51claude` clonée dans la base
jetable `easystud_tri15_20261020` (494 tables). Dataroot/cache/sessions distincts ;
les fichiers référencés et le pack français sont également copiés, en lecture
seule depuis l'original. La base d'origine n'est jamais abaissée ou modifiée.

La V1 est reconstituée dans la base jetable, avec son code exact, ses capacités,
ses réglages et sans table EasyStud nouvelle. Ce n'est pas un serveur V1
historique conservé depuis février : le cœur utilisé est Moodle 5.1.3.
La migration appelle réellement `upgrade_noncore(false)`, après vérification
que seul le plugin attend une mise à niveau. Aucune commande `admin/cli`,
aucun redémarrage ni arrêt de processus par nom. Aucun accès 5.3 ou `:80`.

## Scénario A — V1 stable

Un enseignant et quatre participants, cinq inscriptions et leurs rôles ;
deux groupes initiaux dont un vide, un groupement, descriptions/idnumbers ;
réglages `alloweduserfields=email,idnumber` et `defaultuserfield=email`.
CSV réellement soumis au formulaire V1 : appartenance existante, ajout dans
un groupe existant, création d'un groupe et d'un groupement.

| Vérification | Avant / après | Verdict |
| --- | --- | --- |
| Groupes complets, IDs, descriptions, idnumbers et dates | 3 / 3, lignes identiques | PASS |
| Groupements complets et liens | 2 / 2, lignes identiques | PASS |
| Appartenances aux groupes | 4 / 4, lignes identiques | PASS |
| Inscriptions au cours et rôles | 5 / 5, lignes identiques | PASS |
| Deux réglages V1 non standard | valeurs identiques | PASS |
| Visite d'établissement et visite livrée personnalisée | mêmes IDs, contenu et étapes | PASS |
| Version du plugin | 2026010503 → 2026101801 | PASS |
| Student Management après upgrade | absent → 0 | PASS |
| Historique stable V1 | table absente → table vide | PASS |
| Champs de restauration et tâche de rétention | créés/enregistrés | PASS |

La V1 stable ne possédait pas d'historique persistant : aucune ligne ne peut
être présentée comme un import V1 restaurable. Les réglages nouveaux
`motionlevel=full` et `historyretentiondays=365` sont introduits ; ils ne
remplacent pas les deux réglages V1 contrôlés.

## Scénario B — historique intermédiaire

Le schéma historique de `2026061901` est comparé à la déclaration réelle du
commit `58747296` : mêmes champs, clés et index. Deux lignes synthétiques
du cours sont posées dans ce schéma, avec noms/empreintes/compteurs/politique
et dates (10 et 400 jours), sans JSON de restauration. Le scénario n'est pas
présenté comme un import V1 stable qui n'existait pas.

Les 13 contrôles du comparateur passent : groupes/groupements/appartenances,
inscriptions/rôles et champs des comptes, paramètres et visites inchangés, deux lignes d'historique
avec mêmes IDs et chaque champ d'origine conservé. Les nouveaux champs sont
ajoutés sans réécriture des anciennes valeurs. **La migration ne purge pas la
ligne de 400 jours.** Le cron futur de rétention, distinct de l'upgrade, pourra
la supprimer avec le défaut 365 jours ; l'administrateur doit régler sa durée
avant le premier cron s'il veut la conserver.

Le comparateur versionné est aussi testé négativement : suppression d'un
membre, modification du paramétrage, suppression d'une ligne d'historique
ou d'une étape de visite sont toutes rejetées. Ce n'est pas un simple test
de compteurs identiques.

## Interface native 5.1

Le pilote V1 corrigé passe ses deux pages à 1600/390 : import CSV exécuté,
champ email par défaut et seuls email/idnumber proposés, 0 avis PHP,
0 erreur console et aucun débordement horizontal mesuré.

Le premier contrôle V2 passe quatre pages : formulaire Mass Import disponible,
redirection de `manage.php` vers Mass Import, page native des participants
préservée et formulaire mobile. Aucun import V2 confirmé dans ce contrôle.
Ces captures initiales portent des noms FR mais montrent en réalité de l'EN :
le dataroot neuf n'avait pas encore le pack de langue. Elles ne certifient donc
pas le FR. Un successeur copie le pack et vérifie explicitement `html[lang]` ;
son résultat est conservé séparément dans `history-browser.json` : **PASS,
quatre pages**, langue FR vérifiée à 1600 et EN à 390, deux historiques visibles,
aucune action de restauration proposée pour ces lignes anciennes. Les quatre
pages n'ont ni débordement horizontal, ni avis PHP, ni erreur console.

La préparation a également conservé ses échecs : observer V2 invoqué avant
la purge du code V1, fichier manquant dans le dataroot neuf (404), et métadonnées
de plugins obsolètes après l'échange de code. Les successeurs corrigent la
préparation, pas le produit. Les anciens JSON/journaux restent disponibles.

## Moodle 4.5 — BLOQUÉ, procédure livrée

Le dossier `C:/dev/Moodle45-Clean/server/moodle` contient un cœur 4.5.11.
Mais sa configuration vise `http://localhost` et la base désignée déclare
`config.version=2025100603` : elle est en 5.1. Contrôle SQL en lecture seule,
sans bootstrap du cœur 4.5. Cette combinaison ne constitue pas une copie 4.5
utilisable. Le dossier `C:/dev/Moodle 45` reste interdit et n'est pas sollicité.

Une véritable recette 4.5 demande une copie dédiée dont cœur et base sont
tous deux en 4.5, avec port isolé, dataroot propre, accès et verrou fournis.
Rejouer les deux scénarios du protocole ; ne jamais forcer la version de la
base actuelle pour faire démarrer le cœur 4.5. **Aucun PASS 4.5 annoncé.**

## Preuves et limites

`C:/dev/artifacts/tri15-continuity-20261020/` : snapshots avant/après,
`v1-migration-checks.json`, `history-migration-checks.json`,
`comparator-negative.json`, journaux d'upgrade, `probe45.json`,
captures et JSON navigateur. Le code de test ne lit aucun secret dans les
rapports versionnés ; les wrappers config et secrets restent hors Git.

Cette passe ne certifie pas un import V2 confirmé, son retour arrière,
Privacy/cron ni toutes les configurations d'établissements. Elle établit la
conservation des scénarios ci-dessus et l'accès au flux historique attendu.
La recette 4.5 reste une porte avant production, pas une simple réserve visuelle.

## Fin de recette

Copie 8052 restaurée : 1 280 fichiers comparés par SHA-256, aucun écart ;
wrapper config restauré avec la même empreinte. Base jetable supprimée,
verrou libéré. Preuves : `restore-code-proof.json`, `restore.json`,
`cleanup-proof.json`. Aucun fichier produit publié sur localhost.

Contrôles hors runtime : comparateur A 12 PASS, comparateur B 13 PASS,
quatre mutations destructives rejetées ; syntaxe Node et `git diff --check`
PASS. Aucun PHP produit touché : pas de nouvelle erreur MoodleCS possible
dans ce lot de documentation et de comparateur autonome.
