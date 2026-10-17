# Phase 6 — état vérifié le 17 octobre, reprise de 15 h 20

Base vérifiée : `2827b7c7`, branche distante Claude au début de cette passe. Les dix-neuf commits ci-dessous sont tous des ancêtres de cette base : le backlog rédigé vers 1 h 30 n’est plus à jour sur ces lignes. Aucun développement produit à refaire pour ces parties.

## Livraisons déjà intégrées

| Lot | Commit intégré | Périmètre vérifié / limites |
| --- | --- | --- |
| S2 | `b7178779` | Provider Privacy des historiques, rétention réglable par défaut à 365 jours, tâche de purge. |
| S4 | `cc346284` | Autorisations et validation des requêtes AJAX et écritures natives. |
| S5 | `c5d73659` | Recherche limitée aux personnes inscrites ; message unique pour les identifiants indisponibles, y compris ambigus. |
| S6 | `8b3810f9` | Lecteurs bornés, encodage et CSV multiligne, aperçu serveur. Le format XLS historique reste soumis à l’erreur contrôlée/conversion faute de lecteur fourni ; pas de certification XLS. L’extension des volumes est livrée séparément avec l’import asynchrone. |
| S7-M5 | `b0a59954` | Cellules texte explicites et neutralisation des préfixes de formule. |
| R6 serveur | `e86281d9`, `a15feb98` | Quatre opérations AJAX, transactions, contrôles de cours et plafond de 500 éléments, lectures groupées et résumés ; accents vérifiés. La partie navigateur est encore une dépendance décrite ci-dessous. |
| R8 | `24f32ec1` | Liste d’historique légère : détails complets chargés au moment utile. |
| R9 | `b0dd1637`, `d7c30b58` | Preuves XLSX réellement formatés et texte UTF-8 ; lecteurs S6 réutilisés. |
| P2 | `05a84c57`, `c33fbbeb`, `de6b6e4b` | Retrait du gabarit, CSS et moteur du tutoriel historique ; oracle final adapté aux contrats actuels. |
| L1/L2 | `df64d0aa`, `c752f775` | CSS par page, racine Guide unique, retrait des sélecteurs historiquement inaccessibles ; feuille globale sans règle. |
| TRI12 | `35f977b2` | Parité des copies du Guide prouvée à ce jalon ; les évolutions Guide suivantes nécessitent le raccord livré puis une nouvelle synchronisation après les agents actifs. |
| TRI19 | `d98e5aa7` | Treize suites isolées et méthodes PHPUnit de politique ajoutées. Exécution native PHPUnit/Behat encore non effectuée. |
| TRI38 | `fcf11a6f`, `8129aef7` | Provenance et garde de version, validation des builds avec Node portable 22.11.0 au jalon précédent. |

Les lots d’avis de débogage sont également déjà présents dans cette lignée ; leur développement n’est pas rouvert. Le détail initial est conservé dans les rapports de branches et l’historique d’`ETAT-LOTS-CODEX1-2026-10-17.md`.

## Contrôles refaits sur la base actuelle

Node portable `C:/dev/tools/node-v22.11.0-win-x64/node.exe`, PHP `C:/xampp/php/php.exe`. Aucun bootstrap Moodle, service ou navigateur natif.

| Porte | Résultat |
| --- | --- |
| Sécurité / import / opérations / historique | 13/13 suites isolées PASS : aperçu, exécution, Privacy S2, AJAX et Gestion S4, identifiants S5, lecteurs S6, export S7-M5, R6, R8, R9, échappement, moteur de filtres. |
| P2 CSS | PASS, 10 assertions et 4 366 règles actives ; cascade actuelle conforme au SCSS, retrait historique toujours vérifié. |
| P2 JS | PASS, contrat historique et contrat actuel, mutations négatives conservées. |
| TRI38 | Préflight `--release` PASS avec Node 22.11.0 et versions de paquets épinglées ; aucun nouveau build de tous les modules revendiqué. |
| Palette des réglages | PASS, valeurs Hex valides/invalide, couleur enregistrée conservée, contraste du rôle calculé. |
| Palette du sélecteur de vue | PASS, contrat actuel des tuiles. |
| Feuille CSS globale | Analyse PostCSS : zéro règle. |

Preuves structurées : `docs/testing/phase6-status-2026-10-17-proof.json` ; logs complets dans `C:/dev/artifacts/reprise-1520-20261017/`. Les assertions n’ont pas été affaiblies et aucun test n’a été retiré.

## Travail restant et propriétaires

| Élément | État actuel et suite autorisée |
| --- | --- |
| R6 navigateur | Le serveur limite toujours une requête à 500 éléments ; les sélections plus grandes demandent des requêtes bornées et un suivi côté navigateur. Les appels vivent dans `amd/src/local/cm/actions.js` et `quick_actions.js`, modules réservés à Claude et proches des lots CAR. Transmettre ce raccord au propriétaire ; aucune levée du plafond serveur ni changement des listes par Codex dans cette passe. L’import asynchrone `d451ed13` concerne la confirmation de fichiers, pas ces opérations de sélection. |
| TRI2 — Recommencer un parcours | Pas de bouton/action `restart` ou « Recommencer » dans le moteur et gabarit de la base vérifiée. Cela touche le cadre de fin et le Guide désormais possédé par GNAV/GDEMO, avec composition de fin K17-33 en cours. Réservé au propriétaire de ce lot ; aucune modification Guide par Codex. |
| TRI8 — temporisation | La mesure existe : campagne Codex2 `work/codex2/perf-v2-20261017`, rapport `perf-v2-17-10-2026.md`, base `74323514` ; p95 de 298,9 ms à 3 000 participants en 390 px. Cela justifie l’essai, mais ne détermine pas une temporisation optimale. Investigation/essai dans les modules de filtrage `local/cm` réservés à Claude, avec relecture des nouvelles cartes après CAR. Aucun délai arbitraire ajouté. |
| TRI12 — parité actuelle | Le raccord ANIM/E1–E4 `56627fda` et Kit sans démos `79d7639` sont livrés pour intégration. Les nouvelles modifications de GNAV/GDEMO doivent ensuite être reportées dans les miroirs. Les démos Codex retirées `3ab5e9e1`/`af4ec2b5`/`a9cc96fa` sont exclues. La preuve ancienne ne vaut pas parité globale du Guide actif. |
| TRI19 — gate native | Le socle existe et la porte isolée passe. Initialiser PHPUnit et Behat sur une installation de test explicitement dédiée, puis rejouer après le gel des gabarits ; les scénarios Behat historiques ont encore des sélecteurs de bureau anciens. Pas d’exécution sur les copies/baux des agents Claude. |
| TRI31 — couleurs personnalisées partout | Contrats statiques ciblés PASS ; la recette globale de toutes les surfaces et variantes reste à faire après CAR/GNAV et la standardisation. Aucun changement visuel ni règle de couleur inventé pour satisfaire le tableau. |

S2–S7-M5, R8/R9, P2 et L1/L2 sont donc intégrés et contrôlés ; R6, TRI12 et TRI19 gardent les limites précisées ci-dessus. TRI2/8/31 ne sont pas déclarés terminés. Les recettes natives et l’acceptation visuelle restent distinctes des preuves isolées.

## Point de la grande série et arrêt des doublons

- K17-07 : Fermer/navigation/aide du Kit, commit `67f4010b`, sont déjà identiques dans la base plugin. La ligne Kit propre sans démos atteint `79d7639`, sans fusion de `main`.
- Fiches K16-43/44 et retrait tactile K16-79 : livrés dans `04728cac`, en attente d’intégration dans la base vérifiée. Six cas natifs de fiches PASS ; la mesure des cartes hors fenêtre n’est pas couverte par cette preuve. Pas de redéveloppement.
- Sessions en lecture seule : rapport `PERF-SESSIONS-LECTURE-SEULE-2026-10-17.md`, livraison `cbc67b24`. La configuration MUC et le rejeu sur la copie de Codex2 restent nécessaires ; aucune cause plugin démontrée ne justifie un correctif supplémentaire. La copie 8051 n’a pas été touchée.
- Barre de progression de l’import : besoin Penpot conservé pour Codex2, conformément à la nouvelle répartition.

Point détaillé : `C:/dev/artifacts/reprise-1520-20261017/POINT-SERIE-0930.md`. Cette passe ne reprend aucun lot GTXT, GDEMO, CAR ou GNAV et ne publie rien.
