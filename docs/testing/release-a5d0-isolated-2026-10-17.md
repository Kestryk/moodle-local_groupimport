# Porte isolée et paquet a5d0ffab — 17/10/2026

Node portable22.11.0. Sources propres à a5d0ffab au moment de la fabrication du zip ; les seules modifications ultérieures de cette branche sont des rapports. Aucun build/runtime Moodle, service, base, cache ou publication.

- TRI19 `test-release-smoke-isolated` :13/13 suites PASS, dont aperçu/exécution, confidentialité S2, requêtes S4, message unique S5, lecture S6, export S7-M5, R6, R8, R9, escaping et filtres. Les fixtures PHP utilisent leurs doubles isolés et les seules bibliothèques sources nécessaires.
- Compléments : escaping, export CSV, accueil Guide, filtres, pastilles16cas, P2 CSS, Guide T037/T038/roundtrip PASS (9/10 portes supplémentaires).
- **P2 JS : FAIL conservé** dans test-tutorial-js-retirement.cjs. La comparaison globale de l’orchestrateur avec05a84c57 n’autorise pas l’ajout ultérieur de bindAccessibleNames (d01f7208). Projection complémentaire sans ces deux ajouts : suppression P2 identique. Ce constat ne remplace pas la porte historique et ne vaut pas PASS global. Aucun test n’a été affaibli/modifié.
- Inventaire5.3 rectifié :0 appel exécutable de user_get_user_details dans le PHP produit, les deux occurrences signalées sont des commentaires ; core/log résolu via la table ES du cœur5.3 (ligne1642, appel interne1929). Console native5.3 non recettée ici.

## Paquet

`local_groupimport-a5d0ffab.zip` :1 964 949octets,306fichiers, racinegroupimport/.
SHA-256 :5113d999d2c5bd759e8a868b31daea3059677ebcaa91a4264cb938f2060a5797.
Contrôles indépendants Python zipfile :CRC complet PASS, unicité/chemins PASS, correspondance octet à octet avec les sources suivies PASS, présence version.php/lang/db/amd/build PASS ;0fichier de développement détecté. Le manifeste exclut1600fichiers suivis ; outils, docs, tests, fixtures, captures, sandbox, node_modules/vendor sont absents. Aucune installation réelle revendiquée.

Le zip, sa preuve, son manifeste et l’inventaire inclus/exclus sont dans le dossier de revue `paquets/`. Journaux bruts et oracles conservés : `C:/dev/artifacts/release-a5d0-20261017/`. La synchronisation Kit reste une branche de préparation distincte ; main et EasyStud produit sont inchangés.
