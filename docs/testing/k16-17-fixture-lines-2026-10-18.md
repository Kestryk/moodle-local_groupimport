# K16-17 — fixtures, 18/10/2026

Base 36988602. Une famille : repli de littéraux constants, dans cinq fixtures. Aucun Guide/carte/modal animations, JS, SCSS, template ou fichier produit modifié. Les chaînes CLI/SQL gardent exactement les mêmes octets ; les concaténations constantes repliées donnent les mêmes valeurs et la même suite d’instructions PHP.

MoodleCS complet : 0 erreurs/29 avertissements → 0 erreurs/23 avertissements. PHP lint et comparaison de jetons avec fusion des seuls littéraux constants PASS. Porte release isolée : 13 contrôles PASS. Aucune recette native ; ces fixtures ne sont pas exécutées contre Moodle. Sources JS identiques : ESLint sans augmentation ; aucun build requis.

Restent des lignes Guide réservées, les gardes et require_login des harnais à risque et le diagnostic XLSX long à reprendre dans un lot distinct. Ne pas masquer leurs avertissements. Preuves : <workspace>/artifacts/k16-17-mechanical-20261018/easy-*.json. Aucune publication.

Complément : diagnostic XLSX replié à jetons strictement identiques ; 355 contrôles S7-M5 PASS, codechecker ciblé 0 erreur/0 avertissement, php -l PASS. Total avertissements calculé 23 → 22 ; zones Guide et gardes conservées.
