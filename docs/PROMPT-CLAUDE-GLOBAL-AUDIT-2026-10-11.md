# Prompt de passation — audit global EasyStud / UI Kit

Tu prends le lot AUD-CLAUDE-01 du programme EED-UI-2026-0073. Réalise un audit
en lecture seule, sans refactoriser ni modifier code, Git, Penpot, caches ou
données Moodle. Ne commit/push/stash/reset/clean/rebase aucun worktree. Une autre
fenêtre poursuit le développement : vérifie son checkpoint et les fichiers dirty
avant lecture ; si le contenu évolue, consigne les SHA réellement audités.

## Sources sur cette machine

- EasyStud : C:/dev/worktrees/easystud-foundations-student-management-20260928.
  Branche work/port4719pg3/easystud-foundations-student-management-20260928.
  Checkpoint documentaire déjà poussé b1cb8e1 ; produit f6e9143.
- Kit : C:/dev/worktrees/easyedu-ui-kit-phase0-mass-admin-20260927.
  Branche work/port4719pg3/eed-ui-2026-0073-kit-phase0-mass-admin.
  Checkpoint 7bff6ed120f799a88694a26fc918f3f000e9dab7.
- Platform : C:/dev/easyedu-platform, contrats transverses en lecture seule.
- Preview Moodle : C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/moodle/local/groupimport.
  Branche preview/moodle51/easystud-phase0-mass-admin ; checkpoint documentaire
  d31eb8f866f4692f6137b47858c9ec0d341ad456, produit ec4987e.
  Ces chemins/pins sont des points de départ, pas une garantie de l'état futur.

Ne change pas la branche ni les fichiers d'une autre fenêtre pour obtenir ces
révisions. Relever HEAD/branche/dirty suffit ; utilise les blobs Git pour figer
une comparaison si nécessaire. Ne lis/imprime aucun secret ou état authentifié.

## Lecture obligatoire

Inventorie puis lis tous les AGENTS.md et fichiers d'instructions agent des
deux projets, leurs contrats et les références applicables. Ne scanne pas les
profils navigateur, caches, node_modules ou sessions privées. Pars du README
Platform AI, puis des AGENTS/contrats propres aux projets. Signale documents
obsolètes, doublons ou règles contradictoires avec leurs preuves, pas par intuition.

Pour le contexte de travail, lire notamment :

- docs/claude-global-audit-roadmap-2026-10-11.md.
- docs/guide-engineering-projection-2026-10-11.md et le ledger restant associé.
- docs/student-feedback-successor-2026-10-10.md et son intake JSON.
- Les lots SM antérieurs référencés : ils ne sont pas perdus ni tous acceptés.
- Contrats SCSS/publication/synchronisation/distribution Kit, preuves source
  Penpot et scénarios natifs pertinents. Conserver leur portée et révision exactes.

Les entrées chronologiques « pending » ne décrivent pas forcément l'état actuel.
La projection actuelle et ses preuves successorales priment ; les diagnostics
historiques restent utiles pour comprendre les erreurs et leurs corrections.

## Questions de l'audit

1. Le code PHP/AMD/Mustache/SCSS est-il lisible, bien organisé et documenté ?
   Quelles duplications, branches mortes ou responsabilités mêlées sont prouvées ?
2. Les composants génériques appartiennent-ils réellement au Kit ? Détecter
   les styles privés, inline, tailles/couleurs/offsets exceptionnels et les
   divergences entre canonical/embedded/generated. Distinguer adaptateur métier
   légitime et duplication du moteur/du style partagé.
3. Typographie, couleurs, hiérarchie, espacements, centrage d'icônes, boutons,
   badges, menus, modales, responsive et loading sont-ils harmonieux ? Comparer
   les références sauvegardées Penpot/Foundations et les styles émis. Une lecture
   SCSS ne suffit pas pour prétendre avoir vérifié le rendu navigateur.
4. Où améliorer performances, accessibilité, robustesse async, cleanup, états et
   tests ? Les recommandations doivent préserver comportements métier, Motion
   acceptée et progression Guide. Ne propose pas des délais artificiels comme
   correction de course async ni une suppression de styles sans connaître leurs usages.
5. Les pratiques d'intégration sont-elles réutilisables pour CCB sans exposer les
   fichiers agent/audits dans les distributions publiques ? Ne modifie pas CCB.

## Preuves et accès

Kit -> Foundations -> Penpot produit -> classes plugin -> preview supervisée :
vérifier cette chaîne sans considérer un lien de composant comme preuve pixel.
Ne travaille pas à l'aveugle si Penpot ou la preview est inaccessible ; indique
précisément les limites et propose le contrôle manquant. Tout accès navigateur
authentifié utilise le wrapper/lease et un scénario borné coordonné avec le
propriétaire. Aucun Save/Move/import/envoi/reset global pour fabriquer une preuve.

Ne confonds pas historique QA artificiel et action métier réelle, géométrie
numérique et acceptation humaine, résultat de démo et succès Moodle. La checklist
humaine reste ouverte. Claude n'est pas autorisé à l'approuver à la place de l'utilisateur.

## Rapport attendu

Rends une synthèse compréhensible, puis des constats priorisés avec identifiant,
fichier/ligne ou composant, preuve, risque/impact, proposition, effort indicatif,
tests nécessaires et lot existant lié. Sépare bugs établis, hypothèses à mesurer
et améliorations facultatives. Liste les instructions lues et les limites.
N'invente pas de chiffres de tokens, coût ou gain de performance sans mesure.

Remets tes artefacts hors worktrees dans un dossier d'audit dédié et donne son
chemin. Aucun changement source n'est demandé. Termine par une proposition de
lots de correction sans doublonner la roadmap existante. L'intégrateur examinera
ensuite les conclusions avant toute implementation.
