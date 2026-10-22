# K16-17 — pré-passe, correctifs mécaniques sûrs, 18/10/2026

Base c41871e9 ; branche work/codex1/easystud-k16-17-safe-strings-20261018. Deux sujets seulement ; aucune publication.

- manage.php lit désormais messagesendunavailable dans local_groupimport. La clé core_message/cannotsendmessages manque en Moodle 4.5, mais existe en 5.1/5.3. Deux chaînes locales ajoutées en fin de fichier : « Cannot send messages » et « Impossible d’envoyer des messages ». Aucun autre texte ni clé réordonné ou modifié ; la donnée de démarrage et son consommateur restent identiques.
- Deux lignes de index.php et quinze lignes de quatre fixtures sont repliées. Même suite de jetons PHP exécutables, mêmes littéraux et ordre d’évaluation ; aucune logique modifiée. Sept lignes de données/contrats non repliées et les zones Guide réservées restent dans l’inventaire.

Contrôles : PHP lint sur les huit PHP touchés PASS ; MoodleCS standard moodle, fichiers touchés : 0 erreur / 1 avertissement restant (littéral long r6-bulk-actions-isolated.php). Contrôle officiel des autres fichiers : 0 erreur. Test du libellé, thème/palette, ellipses, porte isolée release import/sécurité (13 contrôles) PASS. Aucun accès Moodle, navigateur, base ou cache.

Node 22.11.0 ; AMD sources identiques à la base. ESLint Moodle, entrées normalisées LF avant/après : 105 erreurs et 580 avertissements préexistants, augmentation 0. Le premier relevé sur CRLF est conservé à part et ne sert pas de référence. Aucun AMD, SCSS ou gabarit touché : aucun build requis ni généré modifié.

L’intake reçoit uniquement k1617PrepasseSafe20261018 en fin d’objet ; ordre et valeurs des anciennes entrées vérifiés identiques. Les marqueurs de conflit sont absents.

Inventaire complet : <workspace>/artifacts/easystud-claude-interface-review-20261011/revue-2026-10-11/AUDIT-K16-17-PREPASSE-2026-10-18.md. Détails bruts : <workspace>/artifacts/k16-17-prepasse-20261018/ (PHP/other avant, touched-final-phpcs.json, fix-verification.json, extra-final.json, eslint.json, fixture-wraps.json, release-smoke.json).

Restent hors correctif : CCB 861 erreurs/31 avertissements ; doublon de clé Guide ; séparateur non UTF-8 dans advanced_settings.js ; diagnostics techniques et décisions éditoriales ; contrôles natifs 4.5 par Codex n°2. Aucun zéro global ou natif n’est revendiqué.
