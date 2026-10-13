# T059 — audit responsive des surfaces EasyStud

## Statut et limites

Cet audit N1 lit uniquement la copie Perf Moodle 5.1 servie sur `:8051` en
français. Il ne modifie ni données de cours, ni gabarit, ni JavaScript, ni
SCSS. Il qualifie les conteneurs réellement servis et les dialogues atteignables
sans créer de jeu de données ; il ne vaut ni recette visuelle humaine, ni
validation complète de toutes les branches conditionnelles.

Le runner authentifié a terminé avec `status: passed` le 13 octobre 2026. Les
artefacts bruts sont conservés hors dépôt sous :

`C:\dev\artifacts\easystud-t059-responsive-audit-20261013-evidence\easystud\authenticated\easystud-authenticated-20261013T094808717Z-10808`

Le nettoyage du runner confirme que les identifiants ont été effacés, que le
bail `groupimport-perf-runtime-write` a été libéré et qu'aucune fixture n'a été
créée.

## Méthode

`tools/playwright/t059-responsive-audit.spec.js` charge séparément les trois
surfaces, avec les trois dimensions suivantes :

| Palier | Dimensions | Surfaces lues |
| --- | --- | --- |
| tablette large | 1024 × 900 | Student Management, Mass Import, Administration |
| tablette | 768 × 900 | Student Management, Mass Import, Administration |
| mobile | 390 × 844 | Student Management, Mass Import, Administration |

Pour Student Management, le script relève l'état initial ainsi que les trois
bascules compactes Participants, Groupes et Groupements. Il relève la largeur
du document et du conteneur EasyStud. Pour chaque palier, il ouvre ensuite les
dialogues Participant, Clipboard et History réellement accessibles, vérifie
leur confinement horizontal, puis Échap et le retour du focus au déclencheur.
Les routes métier sont bloquées avant toute interaction ; une écriture demandée
ferait échouer le test.

## Résultat natif

Les neuf combinaisons surface × palier ont été chargées. Aucun des états lus
n'a de débordement horizontal : `rootOverflow = 0` partout et
`documentOverflow = -15` (largeur de scrollbar, donc absence de surplus).
Les dimensions du conteneur Student Management se contractent bien de 857 px
à 1024, 601 px à 768 et 349 px à 390.

Les neuf dialogues réellement ouverts sont tous contenus horizontalement :

| Palier | Participant | Clipboard | History |
| --- | --- | --- | --- |
| 1024 | 16–993 px | 232,5–776,5 px | 136,5–872,5 px |
| 768 | 16–737 px | 104,5–648,5 px | 16–737 px |
| 390 | 10,4–364,6 px | 10,4–364,6 px | 16–359 px |

Pour les neuf cas : ouverture réussie, Échap ferme la fenêtre et le focus
revient au déclencheur attendu. Le rapport brut ne contient ni erreur de page,
ni écriture métier bloquée, ni constat d'audit à corriger.

## Couverture restant ouverte

- Les modèles présents mais non ouverts dans cette lecture sont Move et
  Confirmation. Ils exigent une sélection ou une action qui créerait un état
  métier ; leur audit reste couvert par T058, pas par cette sonde responsive.
- Les réglages avancés Group/Grouping et la modale de message ne sont pas dans
  le DOM de ce cours au chargement. Leur accessibilité responsive reste à
  vérifier dans un scénario disposant des droits et données correspondants.
- Rollback est présent sur Mass Import mais aucune entrée d'historique n'a été
  créée juste pour l'ouvrir. Son rendu à ces largeurs reste ouvert.
- Guide, contraste perceptif, lecture de longs libellés traduits et validation
  humaine aux tailles intermédiaires ne sont pas déduits de cette mesure.

La checklist humaine EasyStud reste donc ouverte.
