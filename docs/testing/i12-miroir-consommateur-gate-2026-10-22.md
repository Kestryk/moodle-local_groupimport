# I12 — verrou du miroir consommateur, 22/10/2026

> Historique du verrou initial. L’arbitrage Kevin/Claude du 22/10 remplace l’identité CSS bit-à-bit par une preuve native de non-régression visuelle. Voir [le contrat et la publication visuelle](i12-consumer-visual-publication-2026-10-22.md). Les mesures et échecs binaires ci-dessous restent conservés ; ils ne constituent plus un refus de publication à eux seuls.

**BLOQUÉ avant application : la copie exacte du Kit ne respecte pas l’identité CSS requise.** La branche de livraison contient le diagnostic et son outil reproductible uniquement. Aucun fichier produit SCSS, CSS, AMD, template, langue ou miroir n’est modifié.

## Références figées

- EasyStud : `2311f3cfbb15247ed68061dccdf659978cc2ae44`, branche source Claude lue sans écriture. Worktree dédié : `C:/dev/worktrees/easystud-codex2-kit-consumer-i12-20261022`.
- Kit main : `fc3f2460d6df984c6e658f2f489434899b738294`, propre au contrôle.
- Node 22.11.0, dart-sass	1.79.1	(Sass Compiler)	[Dart], PostCSS existant ; aucun paquet installé.
- La mesure compile les deux arborescences via le même build conservateur par page, minification du parent incluse. Les sorties sont externes au dépôt. Elle ne compare pas une CSS candidate fraîche à un ancien build d’une autre version.

## Source embarquée à préserver

Six fichiers partagés diffèrent. Cinq correspondent exactement aux exceptions I12 déjà consignées : tokens, modales, navigation, panneaux, spécimen Guide. Le sixième est `components/_cards.scss` : **95d089ba (K21-37/K21-39) a retiré `person-card-fold-content`**, en même temps que le chevron Participant. Cette suppression, postérieure au snapshot I12, est documentée dans le produit comme une décision de Kevin. Une copie aveugle de fc3f246 réintroduirait ce mixin retiré, même s’il n’est plus appelé et n’émet donc pas de CSS dans ce test. Aucun autre écart partagé non consigné n’a été trouvé.

Les fichiers absents ou supplémentaires ne sont pas en cause : les deux ensembles ont 57 fichiers (56 SCSS et README). L’outil exige l’égalité de cet ensemble avant de construire le candidat. Les hashes normalisés des six fichiers sont conservés dans result.json et comparison-before.json.

## Identité CSS avant/après

| Fichier | Avant (octets) | Copie Kit (octets) | Écart | Bit-à-bit |
|---|---:|---:|---:|---|
| styles.css | 86 | 86 | +0 | PASS |
| styles/student-management.css | 1218501 | 1219888 | +1387 | FAIL |
| styles/mass-import.css | 358326 | 359672 | +1346 | FAIL |
| styles/administration.css | 304236 | 305206 | +970 | FAIL |
| styles/guide.css | 527677 | 527950 | +273 | FAIL |

L’ensemble Sass développé passe de 1483008 à 1486085 octets. **84 entrées de déclaration ajoutées/retirées** sont recensées (contexte, propriété, valeur, importance, multiplicité) ; ce nombre n’est pas présenté comme autant de régressions visuelles. Les sélecteurs et l’ordre CSS peuvent aussi différer ; la condition d’acceptation porte sur les octets complets, pas seulement sur ce delta.

Exemples mesurés :

- Huit propriétés personnalisées supplémentaires dans token-defaults (damier et capsule Guide/navigation), émises dans plusieurs racines.
- Les références privées de capsule Guide passent à des variables publiques avec fallbacks ; certains 1px deviennent 0.0625rem.
- Le fallback du tiroir CCB ajoute des règles de défilement dans le mixin partagé.
- `inset-inline-start: 50%` devient `left: var(--easyedu-sticky-selection-center, 50%)` pour le bandeau et le spécimen remet à zéro le left physique. C’est le report K21-27 souhaité, mais sa présence ne satisfait pas une identité CSS stricte avec le parent actuel.

Une parité visuelle isolée d’I12 ne prouve donc pas l’identité binaire demandée ici. Aucun oracle n’a été relâché et aucun CSS compilé ancien n’a été conservé artificiellement pour masquer l’écart de source.

## Contrôle reproductible

Outil versionné : `tools/release/audit-kit-consumer-sync.cjs`. Arguments absolus, sorties hors sources obligatoires, refus d’écraser un run existant. Il copie seulement SCSS et les six fichiers du compilateur vers deux espaces de mesure ; la copie Kit intervient dans le candidat de mesure uniquement. L’outil vérifie que les sources Kit/produit n’ont pas changé pendant le contrôle.

```powershell
& '<Node 22.11.0 absolu>' '<worktree>\tools\release\audit-kit-consumer-sync.cjs' '<Kit main absolu>' '<Sass 1.79.1 module absolu>' '<PostCSS module absolu>' '<nouveau dossier externe absolu>'
```

Résultat réel : **exit 1 attendu**, `identical=false`, `sourceUnchanged=true`, `runtimeAccess=false`. Les quatre builds de page ont compilé ; ce FAIL est un résultat de comparaison, pas une panne Sass. Le script passe aussi le contrôle de syntaxe Node.

## Décision nécessaire avant la suite

1. Reporter d’abord au Kit la suppression K21-37 du mixin Participant, sans restaurer le chevron produit.
2. Choisir le contrat de publication : conserver l’exigence bit-à-bit et adapter la compatibilité/publication du Kit pour ce consommateur, ou autoriser séparément les deltas CSS documentés d’I12/K21-27 avec une recette native dédiée. Cette seconde voie modifierait le critère explicitement demandé ; elle n’est pas appliquée dans ce lot.

Le Kit canonique fc3f246 et la branche Claude restent intacts. Le worktree ne contient aucune synchronisation partielle prête à intégrer par erreur. Les fichiers docs/tests sont prêts à relire et la branche sera poussée pour conserver la preuve. Aucun runtime, cache, compte ni donnée de test n’a été touché.

## État de la file

| Point | État |
|---|---|
| 1. Miroir consommateur | Non appliqué ; gate FAIL et source plus récente à préserver |
| I13 | Non commencé : dépend du point 1 validé |
| X4 | Non commencé : même dépendance |
| X5 | Non commencé ; aucun retrait de !important ni recette visuelle revendiquée |
| X6 | Reporté explicitement ; aucun changement de classe BS4 ou attribut |

Documentation/contrat : ce lot ajoute une preuve et un outil de diagnostic, aucun comportement réutilisable ni livraison visuelle ; le changelog et le contrat UI ne changent donc pas. La roadmap versionnée de ce lot est cette table ; l’audit et le registre Kevin reçoivent le blocage.

## Emplacements à réviser

- `docs/testing/i12-miroir-consommateur-gate-2026-10-22.md` : ce bilan.
- `tools/release/audit-kit-consumer-sync.cjs` : contrôle reproductible.
- Dossier de preuve : `C:\dev\artifacts\easystud-claude-interface-review-20261011\revue-2026-10-11\I12-CONSOMMATEUR-20261022`.
- `gate-1/result.json` : tous les hashes SHA-256, tailles, identités des builds et références.
- `gate-1/declaration-delta.json` : contexte précis des 84 entrées.
- `gate-1/before/` et `gate-1/candidate/` : deux compilations conservées.
- Commit source à préserver : `95d089ba8fa3d4d226faff664ab82f4cce3f8469`.

Prochain modèle proposé : standard, après arbitrage du contrat de publication. Prochaine tâche : lever le gate d’identité du miroir avant I13. Escalade : évolution du critère bit-à-bit ou divergence supplémentaire de la source.
