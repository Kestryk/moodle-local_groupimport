# Ordre d'exécution consolidé — EasyStud, 12 octobre2026

Programme `EED-UI-2026-0073`. Nouvelle directive Kevin : examiner **toute** la
liste, classer par urgence/impact/dépendances, pas par date du retour. Tout doit
être traité. Ceci remplace seulement l'ordre d'exécution Guide-first/dernier
audit-first, pas les demandes, décisions, anciennes preuves ou checklist.
Les cohortes EXEC organisent les lots existants ; ce ne sont pas de nouveaux
lots qui les fusionnent ou de nouveaux plans Platform concurrents.

## Scope et état de départ

- Propriétaire : fenêtre EasyStud/Kit actuelle, worktrees/branches existants.
- Source : `work/port4719pg3/easystud-foundations-student-management-20260928`,
  HEADb48bd20, propre/poussé ; Kit7728357(185), runtime9135235 propre.
- Inclus : priorité locale, correspondance de chaque lot, puis PG-S1 borné.
- Exclus : nouvelles fenêtres/worktrees, CCB, écritures des plans Platform,
  migration aveugle de composant, données réelles, acceptation humaine automatique.
- Runtime : promotion/cache/browser sous bail ; diagnostic source hors bail.

## Pourquoi cet ordre

1. Un défaut de workflow, de cible ou de complétion passe avant une amélioration
   visuelle. Aucun nouveau P0 de perte de données/sécurité n'est prouvé ; si un
   tel défaut apparaît, il interrompt immédiatement la queue.
2. Les recettes qui servent plusieurs pages précèdent leurs compositions :
   modales, typographie/palette/champs/densités, puis Guide/Student/Mass Import.
3. Stabiliser les champs et barres de filtres avant les couloirs évite de régler
   leurs hauteurs/alignements à nouveau. Ne pas confondre changement de structure
   CSS-only approuvé et le lot JS séparé de la vue Complete.
4. Le rename doit être conçu tôt et appliqué de façon contrôlée avant le découpage
   AMD, sinon les namespaces/modules seraient à réécrire. Le design migration
   peut avancer en lecture seule, sans attendre tous les changements visuels.
5. Mesurer avant toute optimisation. Les mesures initiales/faisabilité T052
   peuvent être préparées tôt ; sa baseline volumineuse doit représenter les
   vues stabilisées. Skeletons locaux puis modules mémorisés, T054 **en dernier**
   parmi les optimisations runtime et Off par défaut.
6. Les tests/documentation/contrats/packaging se font à chaque lot, pas seulement
   dans la dernière ligne. La passe finale ajoute les preuves transversales.

## Queue priorisée et dépendances

| Ordre | Travail | Pourquoi / limite |
| --- | --- | --- |
| Continu | Propriété, pins, chaîne design, docs/contrats, distribution SCSS et méthode CCB | Conditions de tous les lots ; exporter ne signifie pas release |
| 1 | PG-S1 : surbrillance des12 cibles en modale | Défaut actuel confirmé, empêche de comprendre/avancer dans le Guide ; prérequis I13 du Loading |
| 2 | PG-A2 → A1 → A3, puis diagnostic A6 et audit A8 ; sélections/transferts | Signaux faux/inaccessibles/ordre ; conserver IDs/progression ; fermer les preuves transactionnelles en fixture seulement |
| 3 | Recettes modales communes → corps/consommateurs Message, actions, cartes, History et Guide | Prérequis de plusieurs vues et skeletons ; conserver focus/Escape déjà corrigés, pas refaire les controles acquis |
| 4 | Tokens/typos/palette, picker/admin/champs, titres/compteurs/actions | Effet sur toutes les compositions ; couleur choisie vs lisible, défauts/persistance séparés ; pas de taille privée |
| 5 | Guide : T037+T060 coordonnés, légendes/lecture, navigation et preuves restantes | La complétion précède la présentation ; respecter première slide, gestes mobile, Overview/cartes/Motion et cue dédiée |
| 6 | Recherches/choices/More Filters : ouverture, fermeture imbriquée, largeur, densité, fluence/hover | Asseoir dimensions et états avant les alignements de colonnes ; anciennes preuves de terminal ne suffisent pas à la fluidité |
| 7 | Student : cartes,3 vues/couloirs, mobile, sticky, select-all membres, pagination et auto-scroll | Après dimensions des contrôles ; T017/18/19/21/36 strictement CSS-only ; T020 JS à part |
| 8 | Mass Import : dépôt/tuile28, proportions/preview/empty/results/history et navigation commune | Réutilise typos/palette/modales corrigées ; animation CSV acceptée inchangée ; pas d'import pour une preuve visuelle |
| 9 | Rename `local_groupimport` → EasyStud compatible upgrade | Lot architectural isolé : identités/config/files/caps/tasks/privacy/routes/AMD/rollback ; pas un simple dossier renommé |
| 10 | T052 : baseline volumineuse, sémantique de sélection, rôles synthétiques conservés | Mesures réelles avant optimisation ; ne pas enlever les rôles QA conservés ni accorder de capacités à des users réels |
| 11 | R10-16/T061 : Kit/Foundations puis AJAX cartes → corps modales → import → régions initiales | I1–I13 avant/après,150ms d'affichage conditionnel, aucune latence artificielle, readiness/error/focus/teardown |
| 12 | T053 et T055 : poids CSS/modules AMD mémorisés et premiers clics | Mesuré ; un premier clic rejoué une fois, loading du code distinct des données du cours |
| 13 | T054 : rendu à la demande navigateur | Dernier gros changement d'optimisation, flag Off, données déjà en mémoire ; Guide ensureRendered/I2–I6 couverts |
| 14 | Audit Claude complet, quality/accessibility/langues/responsive/release, checklist | Pas une nouvelle implémentation CCB ; vrais points restants, compatibilité Moodle finale et validation utilisateur séparée |

Le classement s'applique aux **portes restantes**, pas à une réécriture de ce
qui est vérifié. Exemples : R10-17 sans fichier, R10-27 saut de scroll, R10-04
repli/sélection et R10-25 flash ont une preuve scoped ; garder le correctif et
faire la couverture manquante. Les sources portant encore `queued` sont des
intakes historiques, pas la preuve que chaque sous-partie n'existe pas.

## Exhaustivité et décisions

Le JSON associé mappe chaque SM-01..73, chaque R10-01..33, chaque T001..T061,
les neuf PG-S1/A1..8, G11-A..I et AUD-CLAUDE-01 vers une cohorte. Les documents
originaux restent la source de la portée détaillée. Les autres demandes Guide
de G2/G3/G5 et G10 sont incluses via SM-19/G11 et les crosswalks conservés :
contenu Student moderne, Guide Mass Import distinct, welcome/reset/fullscreen,
checklist/reprise/locks/annulation/étapes/cursor/dashed/scroll/time-to-read.
Un test de couverture vérifie absence d'oubli/doublon/cycle et scopes intacts.

- Ne pas redemander A1=tuile28px, A2=largeur réelle du panneau, A3=600.
- PG-A4/A5/A7, libellés T038 et proposition de titre T049 attendent Kevin ;
  préparer une proposition et poursuivre un autre lot réalisable en attendant.
- T039 : Kevin a choisi la ligne dédiée Voir dans l'interface. Garder la demande
  alternative/historique, **ne pas implémenter une fusion refusée** pour cocher T039.
- Demander une autorité nouvelle seulement au vrai seuil : fixture métier,
  reset global, Save de réglages, migration réelle ou conflit de propriété.
  Un ordre plus ambitieux n'autorise pas ces mutations à lui seul.
- L'audit Claude de code et de tous les agents est toujours à déléguer à la
  fenêtre choisie par Kevin ; la revue UX reçue n'est pas cet audit complet.

## Lot actif et prochaine action

PG-S1. Diagnostic actuel confirmé par CSS HTTP200/1020 et inventaire offline
9 définitions/12 cibles par langue. Premier patch borné : classe du highlight
externe-dialogue, layer public+1 avec fallback1070, checklist+2,1020 hors modale,
nettoyage sortie/clear ; vérifier les tokens du portail et pointer-events:none.
Pas de refonte du moteur de progression, pas de nouveaux signaux/deadlines.
Source/isolated → catalogue de comportement si requis → build/sync → preview
contrôlée → vrai paint/scroll/fermeture/forced-colors/locale/taille. Aucun PASS
natif ou déploiement S1 n'est revendiqué par la décision de priorité.

## Action humaine

Aucune maintenant : rien à ouvrir, cliquer, exécuter ni répondre. Les décisions
de contenu et la checklist seront présentées au seuil pertinent, avec une
proposition et ses preuves. Validation humaine reste ouverte partout.
