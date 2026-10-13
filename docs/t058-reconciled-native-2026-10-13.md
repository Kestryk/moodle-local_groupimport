# T058 — version réconciliée servie et contrôle ciblé

Autorisation Kevin : déployer la révision exacte `49072e22` de
`work/claude/easystud-corrections-20261013` sur la copie :8051.
Un checkout détaché propre a été créé pour ce déploiement ; aucun checkout
de Claude ou Codex1 n'a été modifié.

`Deploy-PerfCopy.ps1` a synchronisé et vérifié les 1396 fichiers suivis, sans
miroir ni suppression des dépendances locales. Manifeste et empreintes :
`C:/dev/artifacts/es-deploy-49072e22/deployment.json`.
Réservations runtime/cache dédiées acquises et libérées ; `purge_all_caches()`
effectué sur l'URL :8051 et la base `moodle51perf`, y compris cache de langues
pour les nouvelles chaînes `_one` de `6ddcd146`. Aucune fixture présente.

## Passe native du successeur 58ddce18

| Mode | FR1280 | FR390 |
| --- | --- | --- |
| Actuel / legacy | PASS, 9 fenêtres | PASS, 3 fenêtres |
| À la demande / reactive | PASS, 9 fenêtres | PASS, 3 fenêtres |

Spec : `tools/playwright/t058-modal-focus-native-successor.spec.js`.
À 1280 : Participant, réglages Group/Grouping, Move Groupes/Membres/Participants,
Confirmation suppression, Clipboard, History. À 390 : Participant, Clipboard,
History. Les chemins de réglages directs ou via menu suivent l'état natif.
Les assertions conservent focus initial, boucle Tab, Échap et retour au
déclencheur attendu. Aucune commande métier soumise.

Preuve : `C:/dev/artifacts/es-t058-49072/after/matrix.json`, quatre exécutions,
une seule passe, un test découvert par appel. Les rapports par fenêtre et les
preuves de nettoyage sont sous les `runRoot` de cette matrice. Les 24 cas sont
terminés, sans erreur de page ni écriture bloquée. History390 passe dans les
deux modes ; cette passe unique ne démontre pas une stabilité statistique.
Mode initial absent et préférence Guide restaurés (`restored=true`).

Cette preuve ferme le blocage d'intégration décrit dans
`t058-remaining-blocker-2026-10-13.md`, pas l'audit global T058. Message, Guide,
Rollback, panneaux, mouvement réduit, contrastes et alternative clavier
complète suivent dans le complément ; T059 et la recette humaine restent
ouverts. Aucun fichier produit ni contrat Kit modifié par ce lot de preuve.
