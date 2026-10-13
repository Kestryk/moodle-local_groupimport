# T058 — reprise bloquée par le prérequis focus non servi

La sonde `tools/playwright/t058-remaining-audit.spec.js` est locale/supervisée,
FR 1280, sur :8051, cours existant 5, sans fixture ni écriture métier.
Un seul test est découvert par appel. Les routes métier sont bloquées.

## Résultats effectivement mesurés

- Message : focus initial dedans, Tab et Maj+Tab restent dedans, Échap ferme,
  retour au déclencheur : PASS, mouvement normal seulement.
- Sélection du premier participant par focus programmatique puis Espace :
  PASS. Cela ne certifie pas sa découverte par Tab depuis le début de page.
- Move ouvert au clavier : focus initial dedans, puis Tab/Maj+Tab sortent,
  Échap ne ferme pas et le focus ne revient pas. La sonde s'arrête à cet échec.
- Axe, contraste de la page initiale : deux titres à 4,17:1 au lieu de 4,5:1,
  texte `#6a7a8a` sur `#f7f9fc`. Cibles : titre de colonne Participants et
  titre sous `.local-groupimport-easystud-participant-groups__create`.
- Zéro écriture demandée/bloquée, zéro erreur JavaScript de page.

## Cause et transfert

Le `amd/src/course_manager.js` servi est identique à celui de ce worktree :
SHA256 `D141622BD6FCAE1BBB8BCD5BAA3AB9422A3DDF17305E23EC8470919BE9DC3435`.
Il ne comporte pas le branchement `focusMoveModal` du correctif déjà livré
`332e47a5`, suivi de `5e27b71b` et de la preuve `128416e8`, dans le worktree
`easystud-perf-server-20261012`. Ne pas réécrire ce correctif ni écraser les
changements SM-RENDU : intégration par Codex1, puis publication sur la copie
autorisée avant une nouvelle mesure. Aucun fichier produit modifié ici.
Les contrastes relèvent du lot SCSS/Kit de Codex1.

Guide, panneaux, mouvement réduit et Rollback ne sont pas atteints par cette
passe. Rollback reste également un constat statique : focus initial sur Submit,
pas de boucle Tab ni restauration explicite dans `initRollbackModal` lu sur le
worktree Perf. Ce constat n'est pas une nouvelle preuve navigateur.
T058 reste ouvert. T059 n'est pas relancé sur ce prérequis défaillant ; sa
première couverture native reste celle de `002596d0`. T060 reste réservé.

## Preuves et limites

- Exécution mesurée : `C:/dev/artifacts/es-t058-rest-fixed-1013/easystud/authenticated/easystud-authenticated-20261013T192921894Z-25420`.
- JSON détaillé : sous `playwright-output`, `t058-remaining.json`.
- Premier appel : `C:/dev/artifacts/es-t058-rest-1013`, erreur de chemin de
  runtime avant navigation ; corrigée dans l'environnement du second appel.
- Spec candidate T059 préparée, non exécutée, conservée hors dépôt :
  `C:/dev/artifacts/es-t059-candidate-20261013.spec.js`. Ses lacunes Confirmation
  et Rollback sont explicites ; ne pas la présenter comme couverture complète.
- Syntaxe Node et `git diff --check` : PASS. Pas de preuve Moodle 4.5 ni de
  validation humaine. Pas de changement de contrat Kit ; rapport local et
  intake assurent la documentation de cette sonde.
