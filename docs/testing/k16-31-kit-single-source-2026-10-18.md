# K16-31 — garde-fou Kit unique, 18/10/2026

Base edc26fa9 ; branche work/codex1/easystud-k16-31-20261018. Test statique en mode rapport : sources SCSS/CSS locales, familles F01–F22 de l’inventaire K16-80 et F23–F26 dialogues/messages/cartes/squelettes. Aucun style ni autre code produit modifié.

Commande : `node tools/release/test-kit-single-source.cjs --modules <workspace>/moodle51-build-501/node_modules --json <sortie-absolue.json> --text <sortie-absolue.txt>`. Node 22.11.0 et parsers PostCSS existants, aucune nouvelle dépendance. JSON stdout/liste stderr si --json absent. Code 0 sur les constats et erreurs de parsing inventoriées ; code 2 pour une erreur d’usage ou de dépendance. Aucun mode bloquant encore activé.

Exceptions justifiées en tête du test : Kit embarqué, miroir distribué, générés, dépendances et fixtures/docs, CCB (K18-01). Aucune exception de propriété locale : token var(), responsive, focus, disabled et !important restent signalés. Includes locaux littéraux suivis ; interpolation Sass et runtime non évalués. Les partiels inactifs restent visibles ; aucune affirmation de défaut calculé ou de parité canonique.

Résultat initial : 553 déclarations candidates dans 35 sources, 0 erreur de lecture. Familles chevauchantes ; ne pas additionner leurs comptes. Inventaire complet, classé par famille et fichier:ligne : K16-31-KIT-UNIQUE-INVENTAIRE-2026-10-18.md dans le dossier de revue externe. JSON, liste et empreintes : <workspace>/artifacts/k16-31-kit-unique-20261018.

Contrôles : self-test (huit contrats de parsing + mixin indirect + syntaxe invalide + sept exclusions) ; sonde CLI sur deux constats/une erreur de parsing code 0 ; sources SCSS/CSS identiques par empreintes ; ESLint Moodle du nouveau script et contrôle officiel non-PHP consignés dans les preuves. Aucun build nécessaire (outillage seulement), aucune recette native, aucune publication.

K18-01 : CCB est explicitement exclu du parcours, même si une racine le désigne. La sonde teste ce cas sur un chemin inexistant, sans accéder à un dépôt CCB. Son déploiement est hors périmètre ; aucune source CCB n’est dans les 35 sources inventoriées. Les 553 constats et empreintes restent identiques. Les anciennes branches CCB restent gelées, sans intégration/publication.
