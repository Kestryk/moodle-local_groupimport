# Rédaction K16-17 hors Guide — correctif de périmètre du 17 octobre, 14 h 50

Base : `2827b7c7` (GTXT). Branche : `work/codex1/easystud-redaction-hors-guide-20261017`. Ce lot remplace la livraison de rédaction `e5ffb78d` ; ne pas intégrer cette ancienne livraison complète.

Le correctif de Kevin de 13 h 45 retire les démonstrations à Codex et réserve à GTXT les textes du Guide. Cette branche modifie uniquement des valeurs des langues FR/EN hors de ce périmètre : **32 valeurs FR et 37 EN**. Les valeurs GTXT des clés `tutorial*`, `guide*`, `discovery_*`, `*_path_*`, de checklist, des visites Moodle `tour_*` et de `quickcreatehelp` sont conservées exactement. Trente et une modifications de l’ancienne livraison sont ainsi écartées. Les chaînes communes aux écrans métier peuvent également être réutilisées par les spécimens ; leurs clés métier restent les mêmes.

## Sens des libellés et comportement vérifié

| Famille | Consommateur ou preuve | Formulation retenue |
| --- | --- | --- |
| Personnes et appartenances | `manage.php:389–398`, `classes/local/import_user_lookup.php`, `classes/service/membership_transfer.php` | Participant pour la personne inscrite au cours ; membre pour l’appartenance à un groupe ; utilisateur pour les champs ou comptes Moodle. |
| Ajouts et presse-papiers | `amd/src/local/cm/context_menu.js:434–476`, `manage.php:2878`, recherche limitée aux inscriptions du cours | Ajouter les participants copiés / Add copied participants ; ajout de participants, sans création de compte ni nouvelle inscription au cours. |
| Espace d’import | Liens et titres `manage.php` et `index.php` | Import massif / Mass Import ; import en minuscules dans les phrases. |
| État initial d’import | État initial commun et formulaire CSV/Excel dans `index.php` | Texte approuvé « Téléversez un fichier CSV ou Excel pour lancer l’import. » et équivalent anglais. |
| Erreur de colonnes | `index.php:214–232` | La colonne d’identifiant peut être `email`, la colonne de groupe `group`, et `grouping` est facultative. La seule clé littérale `participant` n’est pas acceptée comme en-tête par cette base : le texte ne la promet plus. |
| État vide et suppression de groupes | `amd/src/local/cm/group_cards.js:804`, `quick_actions.js:444` | « membre » pour les personnes appartenant au groupe. Aucun changement du composant, du chevron, du focus ou de ses attributs. |
| Grammaire française | Clés `contextcopymembername`, `previewuseralreadyingroup` | « Copier le nom du participant » et « Ce participant… ». |

Les valeurs historiques `importrollbackpreserved`, `emailsprocessed` et `userautomaticnotfound` restent inchangées : aucun consommateur produit actuel ne permet de valider les compteurs ou l’affirmation demandée. Le chemin S5 actif traite aussi les identifiants ambigus avec son message unique. Les exemples techniques et noms anglais sont conservés ; aucun remplacement global.

## Vérifications

- Syntaxe PHP : deux fichiers PASS.
- Standard Moodle du moteur fourni par `local_codechecker` 5.1.0 : **0 erreur, 0 avertissement** sur les deux fichiers. Contrôle CLI du plugin ; aucune nouvelle recette UI sur une copie occupée n’est revendiquée.
- 1 232 clés par langue : clés, ordre, placeholders et répétitions inchangés ; octets hors valeurs et fins de ligne conservés.
- Toutes les valeurs protégées ci-dessus sont identiques à `2827b7c7`, dont `quickcreatehelp`.
- `test-security-escaping.cjs` : PASS, 39 modules ; `git diff --check` : PASS.
- Aucun AMD, CSS, gabarit, module de carte ou données de visite en base modifiés. Aucun accès runtime, build, publication ou prise de bail.

Preuves : `docs/testing/k16-17-redaction-hors-guide-2026-10-17-proof.json` et `C:/dev/artifacts/redaction-hors-guide-20261017/`.

## Livraisons retirées de l’intégration

Les démonstrations sont déjà conservées sur `work/codex1/easystud-guide-demos-4-8-11-20261017` (`3ab5e9e1`, `af4ec2b5`). Elles sont **retirées de l’intégration et réservées à GDEMO**, avec leurs captures et preuves historiques. Le commit Kit associé `a9cc96fa` est également à exclure ; la branche Kit `work/codex1/easyedu-kit-sync-v2-hors-demos-20261017`, poussée à `79d7639`, s’arrête avant cette modification. Aucune réécriture ni suppression de ces anciennes branches.
