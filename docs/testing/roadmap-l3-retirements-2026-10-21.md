# Roadmap L3 ? S7-M5 et P2, 21/10/2026

Base c737a2e2. Aucun fichier produit modifi?. S7-M5 est d?j? int?gr? sous
b0a59954 ; export.php ?crit toutes les cellules avec report_export::write_row,
TYPE_STRING et neutralise les pr?fixes de formule. Les cinq colonnes sont
identifiant, groupe, groupement, ?tat et d?tails : aucune mesure num?rique
arithm?tique ; les identifiants num?riques restent volontairement du texte.
La fixture isol?e ex?cute le vrai export et relit le XLSX : PASS dans la porte.

P2 est d?j? int?gr? sous 05a84c57/c33fbbeb, oracle courant de6b6e4b.
Le partiel tutorial et son import ont disparu. Comparaison ordonn?e de cascade :
4505 r?gles actives identiques, 49880 octets retir?s (10 assertions PASS).
Le binder, son export AMD et son appel morts sont absents ; le Guide partag? reste.
L'oracle JS historique complet reste fig? ; le contrat actuel suit d?sormais
la racine du Guide dans guide_launcher, extraite depuis navigation. Le lien
import/appel est v?rifi?, 7 mutations sont rejet?es (17 historiques +17 courantes).

La porte ?largie r?v?lait aussi une fixture R6 ancienne : visibilit? absente,
API membre record-ou-ID non simul?e et lecture user born?e manquante. Les doubles
sont raccord?s aux signatures actuelles ; aucun test m?tier supprim?. Le compte
SQL attendu est pr?cis : un instantan? des inscrits + un des utilisateurs (2),
pas le nombre historique 1. Branche visibilit? restreinte test?e explicitement.
34 assertions R6 PASS ; assertions rollback/droits/limites conserv?es.
MoodleCS des trois PHP touch?s : 0 erreur/0 avertissement ; php -l PASS.
Porte isol?e finale : 13/13 PASS, aucun runtime/DB. L'essai initial en ?chec est
conserv? dans release-smoke.json, le r?sultat final dans release-smoke-final.json.

Emplacements ? r?viser : C:/dev/artifacts/roadmap-l1-l4-20261021/l3/,
tools/release/test-tutorial-js-retirement.cjs et les doubles R6 modifi?s.
