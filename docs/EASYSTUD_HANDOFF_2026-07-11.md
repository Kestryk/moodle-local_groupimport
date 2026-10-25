# Passation EasyStud / EasyEdu UI kit - 2026-07-11

Le bloc ci-dessous est un prompt prêt à transmettre à une autre fenêtre Codex.

```text
Tu reprends le développement de EasyStud / GroupImport et de son kit UI partagé.

Dépôts et branches de référence :
- Plugin Moodle 51 :
  C:\dev\Moodle 51\MoodleWindowsInstaller-latest-501\server\moodle\local\groupimport
  branche feature/easyedu-ui-moodle51
- Kit UI partagé :
  C:\dev\easyedu-ui-kit
  branche feature/easyedu-visual-parity-2026-07
- Version du kit intégrée : 0.4.28
- Commit kit de référence : 28c578c

Lis d'abord :
- easyedu-kit-docs/ai/AI_RULES.md
- easyedu-kit-docs/ai/IMPLEMENTATION_CHECKLIST.md
- easyedu-kit-docs/ai/COMPONENT_CONTRACT.md
- easyedu-kit-docs/ai/GUIDE_PARITY_CHECKLIST.md
- easyedu-kit-docs/ai/MOODLE_PLUGIN_RULES.md
- easyedu-kit-docs/components/animations.md
- easyedu-motion-kit/README.md
- tools/playwright/README.md
- CHANGELOG.md, en priorité les entrées du 9 au 11 juillet 2026

Règle absolue :
Toute évolution visuelle ou comportement réutilisable doit être implémenté et
documenté dans C:\dev\easyedu-ui-kit avant ou en même temps que son adaptation
dans le plugin. Le plugin doit rester autonome : il embarque une copie du kit,
sans dépendance runtime vers le dépôt externe. Les thèmes Moodle peuvent
surcharger les variables --easyedu-*, mais ne doivent jamais pouvoir réactiver
le mouvement interdit par l'accessibilité.

État fonctionnel livré :
1. Guide EasyEdu partagé
- EasyStud utilise le template, le SCSS et le contrôleur AMD génériques du kit.
- Les scènes pédagogiques riches, guided paths, checklists, highlights,
  return-to-guide, slides verrouillés et navigation ont été restaurés.
- Les cibles ouvrent la vue et le panneau nécessaires avant le highlight.
- Les checklists valident les actions réelles et non le simple clic sur une étape.
- Le guide garde un fallback local uniquement si le rendu partagé échoue.

2. Moteur de mouvement
- Source canonique : easyedu-ui-kit/motion/amd/src/easyedu_motion.js.
- Adaptation plugin : amd/src/motion.js, module local_groupimport/motion.
- API : init, isEnabled, expand, collapse, resize, enter, exit, swap,
  scroll, cancel et timing.
- Durées publiques : fast 100 ms, normal 160 ms, slow 220 ms.
- Les disclosures sont proportionnels à la distance, plafonnés à 260 ms.
- Les animations sont annulables et les effets Web Animation terminés sont
  retirés après cleanup pour éviter les hauteurs figées.
- Le réglage admin enableanimations est actif par défaut.
- prefers-reduced-motion est toujours prioritaire.

3. Recettes obligatoires
- Petit panneau recherche/coller : Motion.expand/collapse distance-aware puis
  focus uniquement après résolution de la promesse.
- Carte participant unique : Motion.resize sur la carte uniquement ; calculer
  les tags avant la mesure de hauteur finale.
- Liste des membres : resize mesuré ; ne pas animer le groupement parent.
- Changement Participants / Complete / Groups & groupings : swap atomique avec
  exit:false et resize:false, puis une seule entrée de 160 ms.
- Pagination et tri dans une colonne scrollable : fondu uniquement avec
  exitDistance:'0px', distance:'0px' et resize:false. Ne jamais traduire ni
  interpoler la hauteur de la liste, sinon une scrollbar temporaire apparaît.
- Quand une recherche ouvre aussi un grand parent, appliquer l'état du parent
  atomiquement et animer seulement le panneau demandé.

4. Optimisations déjà réalisées
- Une sélection ne reconstruit plus toutes les listes paginées.
- Les lectures de largeur des tags sont regroupées avant les écritures DOM.
- Le changement de vue ne lance plus plusieurs recalculs filtres/pagination.
- Les focus et aperçus textuels ne concurrencent plus les premières frames.
- Ouvrir, fermer puis rouvrir une liste ne conserve aucun effet d'animation.
- La sélection unique participant ne provoque plus d'exception ni de
  chevauchement avec la carte suivante.

5. Validation navigateur
- Outil : tools/playwright/run-motion-audit.ps1.
- Un seul worker, car le Moodle Windows local supporte mal plusieurs connexions.
- Le mot de passe doit venir de EASYEDU_MOODLE_PASSWORD ou de la saisie sécurisée.
- Les tests couvrent mouvement normal/réduit, hauteurs intermédiaires,
  open-close-open, clics rapides, petits panneaux, vues atomiques et largeur de
  pagination stable.
- Le chargement local Moodle peut être lent ; ne pas confondre le temps serveur
  avec le coût d'une interaction déjà rendue.

Mesures de référence après optimisation :
- carte participant : frames autour de 16 ms, sans animation résiduelle ;
- changement de vue : environ 34-35 ms de préparation et une entrée de 160 ms ;
- recherche courte : environ 121 ms d'animation ;
- panneau textuel : environ 149 ms d'animation ;
- pagination : aucune translation et largeur de colonne stable à chaque frame.

Validation minimale avant commit :
- compiler SCSS du plugin ;
- reconstruire les AMD modifiés ;
- analyser les sources AMD avec Babel ;
- php -l sur les PHP modifiés ;
- scripts/audit-kit.ps1 -FailOnNewWarning dans le kit ;
- git diff --check dans les deux dépôts ;
- purger les caches Moodle ;
- exécuter le scénario Playwright ciblé puis la suite complète si nécessaire.

Dette d'audit Moodle connue au moment de la passation :
- 9 avertissements non bloquants ;
- possibles concaténations dans les fichiers de langue EN/FR ;
- PARAM_RAW à revoir dans ajax.php et index.php ;
- écriture temporaire native dans index.php ;
- get_records() potentiellement volumineux dans ajax.php, index.php, manage.php
  et settings.php.
Ne mélange pas leur correction avec une évolution visuelle sans vérifier les
contrats d'import et les volumes réels.

Ne réintroduis pas :
- transition CSS max-height en parallèle du contrôleur ;
- animations imbriquées sur enfant et parent auto-sized ;
- chaînes de setTimeout pour recalculer les hauteurs ;
- pagination avec translateY ou animation de hauteur ;
- focus pendant une ouverture ;
- rebuild global de pagination pour une simple sélection ;
- override local d'un composant qui doit appartenir au kit.

Avant toute modification, vérifie git status dans les deux dépôts et ne supprime
jamais les changements d'une autre fenêtre. Après une évolution du kit,
synchronise SCSS, documentation, contrats AI et paquet motion dans le plugin,
recompile puis documente le changelog à la date du jour.
```
