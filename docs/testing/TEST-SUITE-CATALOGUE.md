# Catalogue de la suite interne EasyStud

## Périmètre et état des preuves

Inventaire des fichiers actifs vérifié le **25 octobre 2026**, sur la branche canonique au commit `68b4a9335d1bf16aaf470727775b8f9d2e5a3643`. Ce catalogue couvre exclusivement `tools/release/test-*.cjs`; il ne remplace ni PHPUnit/Behat ni la recette native avant production.

**216 actifs : 93 PASS, 112 FAIL, 11 bloqués, 0 timeout. 12 retirés, hors total actif et jamais comptés PASS.**

Ces statuts sont les **derniers résultats documentés**, pas une certification du HEAD courant : les 215 scripts du bilan « suite2 » conservent leur résultat du 25/10 (92 PASS / 112 FAIL / 11 bloqués). Le seul ajout depuis ce bilan, `test-guide-welcome-control-clearance.cjs`, a été exécuté sur le HEAD ci-dessus : PASS, six placements et opt-in consommateur/miroirs. Aucun rejeu global dans ce lot documentaire. Les changements ultérieurs de sources, dépendances ou fixtures peuvent invalider un ancien PASS comme un ancien FAIL. Avant mise en production, rejouer et dater les résultats.

| Catégorie principale exclusive | Scripts actifs |
|---|---:|
| Contrat actuel — sécurité/comportement | 103 |
| Contrat actuel — navigateur isolé | 59 |
| Préservation historique | 31 |
| Recette native Moodle | 14 |
| Outillage de build/diagnostic | 9 |

Un contrat peut mêler préservation et assertions encore actuelles : son classement indique sa dominante, jamais une autorisation de retrait. Les sept contrats historiques encore en doute restent FAIL avec leurs assertions intactes. Un navigateur isolé utilise Chrome/HTML/AMD réels mais **aucune session Moodle**; il ne doit pas être présenté comme une recette native. Les comparaisons de cascade et de sources épinglées restent historiques même si elles protègent aussi un comportement actuel.

## Sources et règles de lecture

- Bilan durable de la première passe : [quality-pass-2026-10-25.md](quality-pass-2026-10-25.md).
- Réparations des producteurs I3 : [fixtures-post-i3-2026-10-25.md](fixtures-post-i3-2026-10-25.md), puis [fixtures-suite-2026-10-25.md](fixtures-suite-2026-10-25.md).
- Dernier bilan complet utilisé et sept doutes restants : [fixtures-suite2-2026-10-25.md](fixtures-suite2-2026-10-25.md).
- Douze décisions de retrait et blobs récupérables : [contracts-decisions-2026-10-25.md](contracts-decisions-2026-10-25.md).
- Les raisons individuelles des FAIL et blocages sont recopiées ci-dessous pour survivre aux artefacts externes. Elles proviennent de `final-triage.json`, `remaining-failures.json` et `blocked-prerequisites.json` de la passe suite2. Un FAIL de harnais/source historique ne constitue pas automatiquement un bug produit.
- Provenance externe de cette consolidation : `fixtures-suite2-20261025/` (dernier bilan), `quality-20261025/TESTS-225-DETAIL.md` et `complete/results.json` (bilan initial), rapports `RAPPORT-FIXTURES-POST-I3-20261025.md`, `RAPPORT-FIXTURES-SUITE-20261025.md`, `RAPPORT-FIXTURES-SUITE2-20261025.md`, `RAPPORT-CONTRATS-DECISIONS-20261025.md`. Ces noms identifient les preuves archivées, sans imposer un disque local pour utiliser le catalogue.

## Exécution et fréquence

Lancer depuis la racine du plugin avec la version Node prévue par le projet : `node tools/release/<script>.cjs <arguments>`. Lire les arguments et les assertions du script avant exécution : certaines dépendances Sass, PostCSS, Mustache, PHP, Kit ou références Git doivent être fournies explicitement. Une absence d’argument/fixture est un blocage de harnais, pas un échec produit. Ne pas lancer tous les scripts indistinctement : certains écrivent des preuves ou nécessitent des fixtures et une session Moodle.

Pour tout lot, exécuter les contrats de sa zone. Avant chaque mise en production et après une montée de version Moodle, rejouer les contrats actuels applicables, la sécurité, le build et les parcours natifs représentatifs; conserver les historiques sans modifier leurs références pour obtenir un PASS. Les candidats diagnostiques ne sont pas automatiquement des gates de publication. Aucune modification de code, de test ou de CHANGELOG dans cette livraison documentaire.

Les recettes natives exigent une copie autorisée/verrouillée (pool 8052/8054/8055 ou copie dédiée 5.3 selon le script), les données et références attendues, et des identifiants supervisés de processus. Utiliser Playwright Node headless, preuves hors dépôt, aucune sauvegarde de secret/session. Ne jamais contourner un verrou ni remplacer 5.3 par 5.1 pour débloquer un test.

## Contrat actuel — sécurité/comportement

| Script | Ce qu’il vérifie | Quand le lancer | Dernier statut documenté |
|---|---|---|---|
| [test-approved-card-title-weight-candidate.cjs](../../tools/release/test-approved-card-title-weight-candidate.cjs) | Compile en mémoire un candidat de titre à graisse 600 sans modifier les sources Kit. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-approved-card-title-weight-candidate) |
| [test-bulk-batches.cjs](../../tools/release/test-bulk-batches.cjs) | Vérifie les lots de 500 éléments maximum, leur fusion et l’arrêt sur erreur. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-card-detail-labels.cjs](../../tools/release/test-card-detail-labels.cjs) | Vérifie les libellés FR/EN des menus de détails, leurs commandes et les chemins ARIA/help. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-card-modal-keyboard-generated.cjs](../../tools/release/test-card-modal-keyboard-generated.cjs) | Vérifie le gel historique du contrôleur, le focus/Échap et l’identité des sources AMD générées. | À chaque lot touchant dialogues et focus. À inclure dans la sélection avant production. | FAIL — [raison](#raison-card-modal-keyboard-generated) |
| [test-card-modal-keyboard-preservation.cjs](../../tools/release/test-card-modal-keyboard-preservation.cjs) | Vérifie le clavier du module modal actuel et son identité dans la sourcemap distribuée. | À chaque lot touchant dialogues et focus. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-empty-pagination-slots.cjs](../../tools/release/test-empty-pagination-slots.cjs) | Vérifie les transitions vide/rempli, les sélections désactivées et les zones latérales inertes. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-entity-deferred-fields.cjs](../../tools/release/test-entity-deferred-fields.cjs) | Vérifie le rendu différé du corps des entités par le renderer partagé. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-fiches-k16-43-44-contract.cjs](../../tools/release/test-fiches-k16-43-44-contract.cjs) | Vérifie les renderers de relations, leur échappement, les résumés et les points d’intégration Kit. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-fiches-k16-43-44-contract) |
| [test-filter-choice-shared-motion.cjs](../../tools/release/test-filter-choice-shared-motion.cjs) | Vérifie les quatre familles de filtres et leur injection de la dépendance Motion partagée. | À chaque lot touchant filtres, recherche ou réglages associés. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-filter-disclosure-local-work-preservation.cjs](../../tools/release/test-filter-disclosure-local-work-preservation.cjs) | Vérifie que le dépliage des filtres conserve le travail local attendu sans restauration du monolithe historique. | À chaque lot touchant filtres, recherche ou réglages associés. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-filter-disclosure-refresh-preservation.cjs](../../tools/release/test-filter-disclosure-refresh-preservation.cjs) | Vérifie le comportement de rafraîchissement des filtres dans le successeur du contrat historique. | À chaque lot touchant filtres, recherche ou réglages associés. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-filter-engine.cjs](../../tools/release/test-filter-engine.cjs) | Vérifie les filtres et l’index participants sur un état de cours synthétique. | À chaque lot touchant filtres, recherche ou réglages associés. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-folded-group-member-selection.cjs](../../tools/release/test-folded-group-member-selection.cjs) | Vérifie la sélection des membres après ouverture, repli et réouverture du groupe. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-french-editor-accents.cjs](../../tools/release/test-french-editor-accents.cjs) | Vérifie les cinq corrections d’accents FR et la conservation des autres chaînes et sources. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-french-editor-accents) |
| [test-french-editor-label-contract.cjs](../../tools/release/test-french-editor-label-contract.cjs) | Vérifie les cinq libellés FR et le pipeline ARIA/help réutilisable. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-french-editor-label-contract) |
| [test-group-toggle-count-labels.cjs](../../tools/release/test-group-toggle-count-labels.cjs) | Vérifie les libellés de décompte PHP/JS et le maintien des contrôles à icône seule. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-active-curriculum.cjs](../../tools/release/test-guide-active-curriculum.cjs) | Vérifie les migrations vers le curriculum actif à douze diapositives à partir des payloads historiques. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-active-curriculum) |
| [test-guide-activity-context-bridge.cjs](../../tools/release/test-guide-activity-context-bridge.cjs) | Vérifie les helpers de contexte activité et leur raccordement au véritable adaptateur de destination Groupe. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-activity-context-bridge) |
| [test-guide-activity-grouping-authority.cjs](../../tools/release/test-guide-activity-grouping-authority.cjs) | Vérifie les décisions de l’adaptateur natif de destination de groupement sans commande Moodle. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-activity-grouping-authority) |
| [test-guide-activity-path.cjs](../../tools/release/test-guide-activity-path.cjs) | Vérifie les payloads bilingues du parcours activité et le cloisonnement de ses signaux de complétion. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-activity-path) |
| [test-guide-advanced-edit-entry.cjs](../../tools/release/test-guide-advanced-edit-entry.cjs) | Vérifie la garde de disponibilité d’entrée dans l’édition avancée. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-advanced-edit-entry) |
| [test-guide-api-lazy.cjs](../../tools/release/test-guide-api-lazy.cjs) | Vérifie le chargement différé du moteur Guide, la façade légère et les cas exigeant son chargement immédiat. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-close-contract.cjs](../../tools/release/test-guide-close-contract.cjs) | Vérifie le rendu des croix de fermeture, leurs libellés accessibles et les branches legacy/Discovery. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-current-curriculum.cjs](../../tools/release/test-guide-current-curriculum.cjs) | Inventorie les adaptateurs de présentation réellement exposés par le curriculum courant. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-current-curriculum) |
| [test-guide-current-path-coverage.cjs](../../tools/release/test-guide-current-path-coverage.cjs) | Vérifie la couverture des parcours dans les payloads bilingues de production. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-curriculum-candidate.cjs](../../tools/release/test-guide-curriculum-candidate.cjs) | Vérifie hors ligne les destinations et migrations du candidat de curriculum sans toucher au stockage utilisateur. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-editor-inspection.cjs](../../tools/release/test-guide-editor-inspection.cjs) | Vérifie les parcours d’inspection FR/EN, leurs ouvreurs typés et leurs prérequis. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-editor-inspection) |
| [test-guide-filter-path.cjs](../../tools/release/test-guide-filter-path.cjs) | Vérifie les étapes et signaux typés de complétion du parcours de filtrage. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-filter-path) |
| [test-guide-filter-scope-authority.cjs](../../tools/release/test-guide-filter-scope-authority.cjs) | Vérifie les autorités existantes d’exclusion, de résultats et de sélection utilisées par le parcours filtres. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-first-introduction.cjs](../../tools/release/test-guide-first-introduction.cjs) | Vérifie la première introduction et les migrations historiques sans perdre les leçons ni la progression. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-first-introduction) |
| [test-guide-floating-launcher.cjs](../../tools/release/test-guide-floating-launcher.cjs) | Vérifie les états et interactions du lanceur Guide flottant au défilement. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-floating-launcher) |
| [test-guide-fullscreen-release.cjs](../../tools/release/test-guide-fullscreen-release.cjs) | Vérifie la fermeture du Guide après une sortie plein écran navigateur pendant le déparking de l’hôte. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-inspection-activation.cjs](../../tools/release/test-guide-inspection-activation.cjs) | Vérifie l’activation des illustrations Groupe/Groupement et la conservation de Participant et des autres leçons. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-inspection-activation) |
| [test-guide-inspection-data.cjs](../../tools/release/test-guide-inspection-data.cjs) | Vérifie les quatre contextes d’inspection traduits et les adaptateurs et leçons conservés. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-inspection-data) |
| [test-guide-k18-controls.cjs](../../tools/release/test-guide-k18-controls.cjs) | Vérifie la primitive Motion, la garde de repli de checklist et le curriculum PHP. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-k18-controls) |
| [test-guide-k20-14-17.cjs](../../tools/release/test-guide-k20-14-17.cjs) | Vérifie les récapitulatifs propres à chaque guide, la disposition finale et le wrapping Assignment. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-mobile-action-identity.cjs](../../tools/release/test-guide-mobile-action-identity.cjs) | Vérifie l’identité stable des commandes mobiles et la mise à jour de leur contexte. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-mobile-action-identity) |
| [test-guide-modal-header-t049.cjs](../../tools/release/test-guide-modal-header-t049.cjs) | Vérifie le contrat d’en-tête optionnel, le titre court téléphone et les points d’intégration du lanceur Guide. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-modal-header-t049) |
| [test-guide-modern-curriculum.cjs](../../tools/release/test-guide-modern-curriculum.cjs) | Vérifie les contenus et migrations du curriculum modernisé. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-modern-curriculum) |
| [test-guide-move-context.cjs](../../tools/release/test-guide-move-context.cjs) | Vérifie les six cas d’ouverture du déplacement, ses cibles PHP et les contextes autorisés. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-nav-pointer-focus.cjs](../../tools/release/test-guide-nav-pointer-focus.cjs) | Vérifie le clic des pastilles, le défilement par flèches et la distinction entre focus et activation. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-nav-pointer-focus) |
| [test-guide-navigation-tooltip-source.cjs](../../tools/release/test-guide-navigation-tooltip-source.cjs) | Vérifie le contrat courant des bulles de navigation sans réintroduire le gel du fichier historique. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-navigation-tooltip-source) |
| [test-guide-path-facts-delivery.cjs](../../tools/release/test-guide-path-facts-delivery.cjs) | Vérifie que l’AMD livré publie les prérequis du cours jusque dans le Guide porté hors de sa racine. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-pending-highlight-source.cjs](../../tools/release/test-guide-pending-highlight-source.cjs) | Vérifie la file de cibles, l’AMD/map courants et l’absence de sourcesContent publics. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-reading-order.cjs](../../tools/release/test-guide-reading-order.cjs) | Vérifie l’ordre visuel avant explication et l’opt-in de contenu redondant dans les payloads traduits. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-reading-order) |
| [test-guide-scrollbar-lock.cjs](../../tools/release/test-guide-scrollbar-lock.cjs) | Vérifie les propriétaires du verrou de scroll et la restauration exacte du padding et de sa priorité. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-selection-copy.cjs](../../tools/release/test-guide-selection-copy.cjs) | Vérifie les explications FR/EN de sélection et leurs touches sans changer les commandes. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-selection-copy) |
| [test-guide-simplecreate.cjs](../../tools/release/test-guide-simplecreate.cjs) | Vérifie la création simple et son récapitulatif à partir du programme PHP et de Mustache. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-simplecreate) |
| [test-guide-source-member-path.cjs](../../tools/release/test-guide-source-member-path.cjs) | Vérifie les quatre étapes membres, les parcours conservés et les signaux de production protégés. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-source-member-path) |
| [test-guide-t037-reading-composition.cjs](../../tools/release/test-guide-t037-reading-composition.cjs) | Vérifie la composition de lecture T037 et le remplacement intentionnel de l’ancienne disposition intermédiaire. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-t037-reading-composition) |
| [test-guide-t038-navigation.cjs](../../tools/release/test-guide-t038-navigation.cjs) | Vérifie le badge texte Guide et la bulle Kit unique dans la navigation T038/GNAV. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-t038-navigation) |
| [test-guide-welcome-control-clearance.cjs](../../tools/release/test-guide-welcome-control-clearance.cjs) | Vérifie six placements de l’invitation, l’opt-in consommateur et la parité des miroirs. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — rejoué sur ce HEAD (6 cas) |
| [test-guide-welcome-security.cjs](../../tools/release/test-guide-welcome-security.cjs) | Vérifie le raccordement POST/login/capacité/sesskey/utilisateur courant/Privacy de l’invitation. | À chaque lot touchant sécurité, permissions, données ou langues. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-import-component-loading.cjs](../../tools/release/test-import-component-loading.cjs) | Vérifie que le bootstrap cible le vrai formulaire après un spécimen Guide inerte. | À chaque lot touchant Mass Import : formulaire, preview ou rapport. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-import-file-required-late-ready.cjs](../../tools/release/test-import-file-required-late-ready.cjs) | Vérifie les gardes de fichier requis et la récupération après disponibilité tardive du sélecteur. | À chaque lot touchant Mass Import : formulaire, preview ou rapport. À inclure dans la sélection avant production. | FAIL — [raison](#raison-import-file-required-late-ready) |
| [test-import-file-required.cjs](../../tools/release/test-import-file-required.cjs) | Vérifie les gardes du sélecteur de fichier et de soumission du formulaire d’import. | À chaque lot touchant Mass Import : formulaire, preview ou rapport. À inclure dans la sélection avant production. | FAIL — [raison](#raison-import-file-required) |
| [test-initial-state-transport.cjs](../../tools/release/test-initial-state-transport.cjs) | Vérifie le transport initial à usage unique, la validation du payload et les requêtes de repli. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-k16-14-copy-command.cjs](../../tools/release/test-k16-14-copy-command.cjs) | Vérifie que Copy utilise addusers et déduplique les membres sans modifier les paires de Move. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-k16-14-copy-command) |
| [test-k16-15-dialog-member-state.cjs](../../tools/release/test-k16-15-dialog-member-state.cjs) | Vérifie la sélection/retrait de membres, les types compatibles et le focus après dernier retrait. | À chaque lot touchant dialogues et focus. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-k16-sort-desc.cjs](../../tools/release/test-k16-sort-desc.cjs) | Vérifie les tris descendants, les égalités stables et les IDs hors page sans modifier le modèle. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-k21-uninstall.cjs](../../tools/release/test-k21-uninstall.cjs) | Vérifie les métadonnées Privacy et le cycle de désinstallation avec doubles isolés. | À chaque lot touchant sécurité, permissions, données ou langues. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-k21-write-paths.cjs](../../tools/release/test-k21-write-paths.cjs) | Vérifie les branches d’écriture réelles avec doubles transactionnels des API Moodle. | À chaque lot touchant sécurité, permissions, données ou langues. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-k23-nav-lanes.cjs](../../tools/release/test-k23-nav-lanes.cjs) | Vérifie l’ordre responsive, l’action de liste partagée et la conservation des couloirs desktop. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-k23-nav-lanes) |
| [test-kit-native-select-variants.cjs](../../tools/release/test-kit-native-select-variants.cjs) | Vérifie les variantes regular/touch des select natifs, leur affordance et leurs états disabled. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-kit-native-select-variants) |
| [test-l1l2-current-cascade.cjs](../../tools/release/test-l1l2-current-cascade.cjs) | Vérifie la cascade courante du Guide à racine unique indépendamment des gels historiques. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-l1l2-current-cascade) |
| [test-lang-ellipsis.cjs](../../tools/release/test-lang-ellipsis.cjs) | Vérifie l’ellipse U+2026 dans les traductions et le libellé anglais d’action en cours. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-language-key-uniqueness.cjs](../../tools/release/test-language-key-uniqueness.cjs) | Vérifie l’unicité des clés de langue et la parité des ensembles FR/EN. | À chaque lot touchant sécurité, permissions, données ou langues. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-layout-swap-list-arrival.cjs](../../tools/release/test-layout-swap-list-arrival.cjs) | Vérifie la transition de vue, la suppression des arrivées imbriquées et la conservation de la pagination. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-loading-late-ready.cjs](../../tools/release/test-loading-late-ready.cjs) | Vérifie les états prêt/tardif/jamais initialisé et la conservation du fail-open et des fondus. | À chaque lot touchant bootstrap et chargement. À inclure dans la sélection avant production. | FAIL — [raison](#raison-loading-late-ready) |
| [test-loading-progress-deadline.cjs](../../tools/release/test-loading-progress-deadline.cjs) | Vérifie la progression, le blocage, le plafond d’attente et la récupération tardive avec temps virtuel. | À chaque lot touchant bootstrap et chargement. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-long-lists.cjs](../../tools/release/test-long-lists.cjs) | Vérifie les seuils de longues listes et les requêtes sur l’état complet hors fenêtre DOM. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-member-snapshot-detached.cjs](../../tools/release/test-member-snapshot-detached.cjs) | Vérifie la sélection de 800 membres dont 792 lignes détachées et le refus des lignes hors espace de travail. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-message-language-compat.cjs](../../tools/release/test-message-language-compat.cjs) | Vérifie les messages FR/EN d’indisponibilité sans dépendance à une chaîne cœur Moodle 5.x. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-mobile-compact-profile.cjs](../../tools/release/test-mobile-compact-profile.cjs) | Vérifie les états de densité et de profil compact ainsi que l’intégrité de l’AMD généré. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-mobile-compact-profile) |
| [test-mobile-move-availability-source.cjs](../../tools/release/test-mobile-move-availability-source.cjs) | Vérifie la disponibilité de Move en compact et la conservation de la préférence desktop. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-mobile-participant-memberships.cjs](../../tools/release/test-mobile-participant-memberships.cjs) | Vérifie la densité du profil et des appartenances dans les contrôleurs modulaires courants. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-mobile-participant-title-clearance.cjs](../../tools/release/test-mobile-participant-title-clearance.cjs) | Vérifie le dégagement du titre participant et la conservation des liaisons d’actions mobiles. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-mobile-participant-title-clearance) |
| [test-modal-focus-behaviour.cjs](../../tools/release/test-modal-focus-behaviour.cjs) | Vérifie le comportement de focus des helpers du module modal extrait par T055. | À chaque lot touchant dialogues et focus. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-modal-focus-scope.cjs](../../tools/release/test-modal-focus-scope.cjs) | Vérifie le confinement clavier, le refus d’Échap et le retour du focus selon l’issue Motion. | À chaque lot touchant dialogues et focus. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-motion-levels-generated.cjs](../../tools/release/test-motion-levels-generated.cjs) | Vérifie les exports et les trois niveaux Motion de l’AMD généré, y compris WAAPI et les replis. | À chaque lot touchant Motion et animations. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-page-bootstrap.cjs](../../tools/release/test-page-bootstrap.cjs) | Vérifie la configuration de bootstrap, l’ordre, l’idempotence et le rejet des payloads invalides. | À chaque lot touchant bootstrap et chargement. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-page-css-subsequence-guide.cjs](../../tools/release/test-page-css-subsequence-guide.cjs) | Vérifie la sous-séquence de sélecteurs Guide dans les feuilles minifiées et l’absence de styles étrangers. | À chaque lot touchant build, dépendances ou packaging. À inclure dans la sélection avant production. | FAIL — [raison](#raison-page-css-subsequence-guide) |
| [test-page-css-subsequence.cjs](../../tools/release/test-page-css-subsequence.cjs) | Vérifie l’ordre des sous-séquences CSS par page après normalisation de minification. | À chaque lot touchant build, dépendances ou packaging. À inclure dans la sélection avant production. | FAIL — [raison](#raison-page-css-subsequence) |
| [test-participant-density-final-height.cjs](../../tools/release/test-participant-density-final-height.cjs) | Vérifie que la hauteur finale et la taille de page sont résolues avant Motion sans repagination différée. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-participant-grouping-filter-views.cjs](../../tools/release/test-participant-grouping-filter-views.cjs) | Vérifie le partage du filtre et du contrôle de groupement participant entre les vues. | À chaque lot touchant filtres, recherche ou réglages associés. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-participant-overflow-scroll.cjs](../../tools/release/test-participant-overflow-scroll.cjs) | Vérifie les clics de débordement du participant, le scroll et la préservation des sources non concernées. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-participant-overflow-scroll) |
| [test-participant-panel-title.cjs](../../tools/release/test-participant-panel-title.cjs) | Vérifie les libellés FR/EN du panneau Participants et la conservation de la navigation compacte. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-participant-panel-title) |
| [test-quiet-selection-recovery.cjs](../../tools/release/test-quiet-selection-recovery.cjs) | Vérifie la récupération silencieuse de sélection dans le contrat courant successeur. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-quiet-selection-recovery) |
| [test-r10-23-autoscroll.cjs](../../tools/release/test-r10-23-autoscroll.cjs) | Vérifie le scheduler d’autoscroll avec géométrie et temps contrôlés sans changer le ghost ni les commandes métier. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-r10-23-autoscroll) |
| [test-readfilter-compat.cjs](../../tools/release/test-readfilter-compat.cjs) | Vérifie le filtre de lecture de tableur contre les interfaces de bibliothèque fournies. | À chaque lot touchant build, dépendances ou packaging. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-refactor-mechanical.cjs](../../tools/release/test-refactor-mechanical.cjs) | Compare strictement 27 sorties JSON des producteurs avant/après le refactoring mécanique. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-refactor-mechanical) |
| [test-release-smoke-isolated.cjs](../../tools/release/test-release-smoke-isolated.cjs) | Exécute les contrôles de fumée isolés sans bootstrap Moodle, réseau ni base de données. | À chaque lot touchant build, dépendances ou packaging. À inclure dans la sélection avant production. | FAIL — [raison](#raison-release-smoke-isolated) |
| [test-responsive-membership-toggle.cjs](../../tools/release/test-responsive-membership-toggle.cjs) | Vérifie la disponibilité du toggle à partir de l’index complet, y compris les conteneurs vides et les changements en direct. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-role-density-mode.cjs](../../tools/release/test-role-density-mode.cjs) | Vérifie les modes de densité des rôles et la conservation de la sélection dans les modules actuels. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-security-csv-export.cjs](../../tools/release/test-security-csv-export.cjs) | Vérifie la neutralisation des formules de tableur et les guillemets RFC 4180 à l’export CSV. | À chaque lot touchant sécurité, permissions, données ou langues. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-security-escaping.cjs](../../tools/release/test-security-escaping.cjs) | Vérifie escapeHtml et l’absence de concaténation HTML non échappée dans les modules cm/sm. | À chaque lot touchant sécurité, permissions, données ou langues. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-selection-availability-scope.cjs](../../tools/release/test-selection-availability-scope.cjs) | Vérifie les disponibilités de sélection et la conservation du pliage, des commandes et de Motion. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-selection-availability-scope) |
| [test-tooltip-extraction-source.cjs](../../tools/release/test-tooltip-extraction-source.cjs) | Vérifie le contrat courant d’extraction des bulles sans restaurer le gel historique complet. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-tooltip-light-source.cjs](../../tools/release/test-tooltip-light-source.cjs) | Vérifie la recette courante de bulle Light et la conservation de ses règles d’intégration. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-tooltip-light-source) |
| [test-tours-off.cjs](../../tools/release/test-tours-off.cjs) | Vérifie l’absence d’installation de tours et le retrait limité aux tours livrés non modifiés. | À chaque lot touchant sécurité, permissions, données ou langues. À inclure dans la sélection avant production. | FAIL — [raison](#raison-tours-off) |
| [test-tutorial-js-retirement.cjs](../../tools/release/test-tutorial-js-retirement.cjs) | Vérifie le retrait JS du tutoriel historique et les intégrations survivantes dans les sources et l’AMD. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-tutorial-js-retirement) |
| [test-tutorial-retirement.cjs](../../tools/release/test-tutorial-retirement.cjs) | Vérifie la cascade après retrait CSS du tutoriel contre son partiel historique archivé. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-tutorial-retirement) |
| [test-view-icon-palette-preservation.cjs](../../tools/release/test-view-icon-palette-preservation.cjs) | Vérifie le contrat courant de palette des icônes de vue sans figer le fichier historique entier. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |

## Contrat actuel — navigateur isolé

| Script | Ce qu’il vérifie | Quand le lancer | Dernier statut documenté |
|---|---|---|---|
| [test-a10-bootstrap-browser.cjs](../../tools/release/test-a10-bootstrap-browser.cjs) | Vérifie en navigateur isolé les sélecteurs natifs et leur compatibilité de présentation Bootstrap. | À chaque lot touchant bootstrap et chargement. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-admin-tagged-choices-browser.cjs](../../tools/release/test-admin-tagged-choices-browser.cjs) | Vérifie les choix multiples à étiquettes FR/EN, leurs valeurs de formulaire et leur cycle de vie. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-admin-tagged-choices-browser) |
| [test-after-render-browser.cjs](../../tools/release/test-after-render-browser.cjs) | Vérifie les notifications du vrai module après-rendu et la livraison des mutations DOM. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-card-overflow-dispatch.cjs](../../tools/release/test-card-overflow-dispatch.cjs) | Vérifie le menu overflow lors de sa reconstruction et la propagation réelle des clics. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-compat53-lanes.cjs](../../tools/release/test-compat53-lanes.cjs) | Vérifie la peinture des couloirs 5.3 et la cascade ordonnée dans un rendu isolé. | À chaque lot touchant compatibilité Moodle et composants natifs. À inclure dans la sélection avant production. | FAIL — [raison](#raison-compat53-lanes) |
| [test-compat53-navigation.cjs](../../tools/release/test-compat53-navigation.cjs) | Vérifie l’adaptateur de navigation sur des hôtes legacy/React synthétiques et l’hydratation tardive. | À chaque lot touchant compatibilité Moodle et composants natifs. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-display-preferences-browser.cjs](../../tools/release/test-display-preferences-browser.cjs) | Vérifie en Chrome isolé la modale de préférences FR/EN, sa géométrie et ses interactions. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-floating-guide-navigation-root.cjs](../../tools/release/test-floating-guide-navigation-root.cjs) | Vérifie que le lanceur flottant reconnaît une navigation racine comme une navigation descendante. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-gmi-initial-checklist.cjs](../../tools/release/test-gmi-initial-checklist.cjs) | Vérifie l’évitement initial des notifications par la checklist, sans chevauchement transitoire. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-gmi-initial-checklist) |
| [test-guide-action-explanations.cjs](../../tools/release/test-guide-action-explanations.cjs) | Vérifie le rendu et le confinement FR/EN des explications d’actions du Guide. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-activity-dot-layout.cjs](../../tools/release/test-guide-activity-dot-layout.cjs) | Vérifie la géométrie des points de phase aux trois largeurs et dans les états de lecture. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-activity-dot-layout) |
| [test-guide-creation-layout.cjs](../../tools/release/test-guide-creation-layout.cjs) | Vérifie le confinement des explications de création FR/EN aux différentes largeurs. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-demonstration-entry.cjs](../../tools/release/test-guide-demonstration-entry.cjs) | Vérifie l’entrée volontaire dans les démos, lecture/pause/reset et la peinture Small en Chrome isolé. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-demonstration-entry) |
| [test-guide-discovery.cjs](../../tools/release/test-guide-discovery.cjs) | Vérifie les transitions du Guide, le départ de scène et le nettoyage à la fermeture/destruction. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-discovery) |
| [test-guide-editor-inspection-layout.cjs](../../tools/release/test-guide-editor-inspection-layout.cjs) | Vérifie le confinement des invitations d’inspection d’éditeur FR/EN. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-explanation-recomposition.cjs](../../tools/release/test-guide-explanation-recomposition.cjs) | Vérifie l’ordre et l’espacement des explications traduites dans le renderer courant. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-explanation-recomposition) |
| [test-guide-g8-lifecycle.cjs](../../tools/release/test-guide-g8-lifecycle.cjs) | Vérifie la reprise/annulation, l’expiration et les réinitialisations propres au parcours G8. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-g8-lifecycle) |
| [test-guide-g9-lifecycle.cjs](../../tools/release/test-guide-g9-lifecycle.cjs) | Vérifie Reset/réentrée, annulation/rechargement et les signaux natifs tardifs du parcours G9. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-g9-lifecycle) |
| [test-guide-g9-presentation.cjs](../../tools/release/test-guide-g9-presentation.cjs) | Vérifie animations, chevauchement des cibles de dépôt et checklist longue avec les pauses de narration G9. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-g9-presentation) |
| [test-guide-header-palette.cjs](../../tools/release/test-guide-header-palette.cjs) | Vérifie la palette du header et le transfert de ses variables après portage du Guide. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-method-layout.cjs](../../tools/release/test-guide-method-layout.cjs) | Vérifie le confinement des explications de méthode FR/EN dans le renderer réel. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-mistakes-layout.cjs](../../tools/release/test-guide-mistakes-layout.cjs) | Vérifie le confinement des explications d’erreurs à éviter FR/EN. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-modern-curriculum-layout.cjs](../../tools/release/test-guide-modern-curriculum-layout.cjs) | Vérifie la géométrie du curriculum modernisé dans les renderers isolés. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-modern-curriculum-layout) |
| [test-guide-narration-copy.cjs](../../tools/release/test-guide-narration-copy.cjs) | Vérifie le confinement des narrations traduites et la présence des noms illustrés et du contexte mobile. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-navigation-tooltips.cjs](../../tools/release/test-guide-navigation-tooltips.cjs) | Vérifie les bulles Kit par survol, clavier, clic, Échap, scroll, plein écran et rebind. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-practice-path.cjs](../../tools/release/test-guide-practice-path.cjs) | Vérifie les six étapes traduites du parcours pratique, ses prérequis et ses signaux ordonnés. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-practice-path) |
| [test-guide-presentation-follow-up.cjs](../../tools/release/test-guide-presentation-follow-up.cjs) | Vérifie les animations synchronisées, le dépôt, la comparaison et le scroll de checklist longue G7. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-presentation-follow-up) |
| [test-guide-progress-palette.cjs](../../tools/release/test-guide-progress-palette.cjs) | Vérifie la peinture de progression par défaut/personnalisée et sa restauration après portage. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-recap-layout.cjs](../../tools/release/test-guide-recap-layout.cjs) | Vérifie le confinement des explications de récapitulatif FR/EN. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-recap-t012-browser.cjs](../../tools/release/test-guide-recap-t012-browser.cjs) | Vérifie les récapitulatifs T012 via les templates traduits et les AMD Guide/Motion réels. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-recap-t012-cancellation-browser.cjs](../../tools/release/test-guide-recap-t012-cancellation-browser.cjs) | Vérifie l’annulation et le nettoyage des récapitulatifs T012 avec le véritable AMD. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-review1-compact.cjs](../../tools/release/test-guide-review1-compact.cjs) | Vérifie Ready/lecture/pause/finish/reset et le confinement Review1 en compact FR/EN. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-review1-compact) |
| [test-guide-scene-header.cjs](../../tools/release/test-guide-scene-header.cjs) | Vérifie le propriétaire du header de scène, ses choix idle, la géométrie Small et les contrôles de lecture. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-scene-header) |
| [test-guide-selection-copy-layout.cjs](../../tools/release/test-guide-selection-copy-layout.cjs) | Vérifie le confinement du texte de sélection et des touches traduites. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-shortcuts-layout.cjs](../../tools/release/test-guide-shortcuts-layout.cjs) | Vérifie le confinement des explications de raccourcis FR/EN. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-single-root-browser.cjs](../../tools/release/test-guide-single-root-browser.cjs) | Vérifie le rendu du Guide à racine unique depuis son programme PHP et ses templates. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-single-root-browser) |
| [test-guide-slide-title-layout.cjs](../../tools/release/test-guide-slide-title-layout.cjs) | Vérifie le confinement et la typographie des titres de diapositive FR/EN. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-slide-title-layout) |
| [test-guide-source-member-layout.cjs](../../tools/release/test-guide-source-member-layout.cjs) | Vérifie le confinement FR/EN des invitations portant sur les membres du groupe source. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-t037-finished-paint.cjs](../../tools/release/test-guide-t037-finished-paint.cjs) | Vérifie la peinture de fin T037 sur états synthétiques, sans certifier la lecture native. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-t037-finished-paint) |
| [test-guide-welcome-adapter.cjs](../../tools/release/test-guide-welcome-adapter.cjs) | Vérifie le POST d’invitation, la coalescence, l’acquittement, les générations périmées et le nettoyage. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-guide-welcome-reset-layout.cjs](../../tools/release/test-guide-welcome-reset-layout.cjs) | Vérifie en navigateur isolé la disposition de l’invitation et de sa réinitialisation. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | FAIL — [raison](#raison-guide-welcome-reset-layout) |
| [test-import-preview-browser.cjs](../../tools/release/test-import-preview-browser.cjs) | Vérifie 1500 lignes de preview, leur filtrage et les champs effectivement soumis. | À chaque lot touchant Mass Import : formulaire, preview ou rapport. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-k16-kit-measures.cjs](../../tools/release/test-k16-kit-measures.cjs) | Mesure en Chrome isolé les composants Kit et leurs cibles géométriques. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-k16-kit-measures) |
| [test-k16-participant-pills.cjs](../../tools/release/test-k16-participant-pills.cjs) | Vérifie la géométrie et les décomptes des pastilles de participants. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-k20-guide-responsive-browser.cjs](../../tools/release/test-k20-guide-responsive-browser.cjs) | Vérifie la checklist et le bandeau guided path avec le vrai Guide traduit dans un navigateur isolé. | À chaque lot touchant Guide : contenu, contrôleur ou styles. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-k20-notifications.cjs](../../tools/release/test-k20-notifications.cjs) | Vérifie les dimensions et la peinture des notifications compactées. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-k21-summary-t055.cjs](../../tools/release/test-k21-summary-t055.cjs) | Vérifie les formes FR/EN des décomptes et le repli sur les valeurs serveur lorsque le modèle est incomplet. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-l1-dead-selector-browser.cjs](../../tools/release/test-l1-dead-selector-browser.cjs) | Vérifie le rendu du Guide après nettoyage de sélecteurs depuis le programme PHP et Mustache. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-l1-dead-selector-browser) |
| [test-long-lists-motion-browser.cjs](../../tools/release/test-long-lists-motion-browser.cjs) | Vérifie le vrai dépliage des longues listes avec la source Motion explicitement épinglée. | À chaque lot touchant Motion et animations. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-long-lists-pills-browser.cjs](../../tools/release/test-long-lists-pills-browser.cjs) | Vérifie la politique de payload et les pastilles du renderer partagé sur longues listes. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-long-lists-pills-browser) |
| [test-long-lists-render-browser.cjs](../../tools/release/test-long-lists-render-browser.cjs) | Vérifie les fenêtres DOM bornées et les totaux détachés avec les vrais templates de cartes. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-mass-report-semantic-palette.cjs](../../tools/release/test-mass-report-semantic-palette.cjs) | Vérifie les rôles sémantiques de couleur des rapports et les palettes personnalisées/restaurées. | À chaque lot touchant Mass Import : formulaire, preview ou rapport. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-mobile-group-header-wrap.cjs](../../tools/release/test-mobile-group-header-wrap.cjs) | Mesure le wrapping de l’en-tête Groupe et ses états d’éditeur en fixture CSS isolée. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-mobile-group-header-wrap) |
| [test-mobile-selection-first-row.cjs](../../tools/release/test-mobile-selection-first-row.cjs) | Mesure l’alignement des contrôles de première ligne et leur cible tactile de 44px. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-mobile-selection-first-row) |
| [test-page-css-production-cssom.cjs](../../tools/release/test-page-css-production-cssom.cjs) | Compare la cascade CSSOM de production en conservant sélecteurs, déclarations, priorités et tokens de valeur. | À chaque lot touchant build, dépendances ou packaging. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-participant-deferred-focus.cjs](../../tools/release/test-participant-deferred-focus.cjs) | Vérifie en Chromium le focus et l’état des relations après rendu différé du participant. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | PASS — bilan suite2 |
| [test-shared-pill-renderer-framed.cjs](../../tools/release/test-shared-pill-renderer-framed.cjs) | Vérifie le renderer partagé des pastilles, les sentinelles, les titres et les compteurs dans son cadre. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-shared-pill-renderer-framed) |
| [test-shared-pill-renderer.cjs](../../tools/release/test-shared-pill-renderer.cjs) | Vérifie les vingt cas du renderer partagé de pastilles, ses totaux et sa géométrie. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-shared-pill-renderer) |
| [test-student-card-selection-anchor-browser.cjs](../../tools/release/test-student-card-selection-anchor-browser.cjs) | Mesure les six géométries desktop de l’ancrage de sélection par rapport au titre. | À chaque lot touchant Student Management : cartes, sélection ou rendu. À inclure dans la sélection avant production. | FAIL — [raison](#raison-student-card-selection-anchor-browser) |

## Préservation historique

| Script | Ce qu’il vérifie | Quand le lancer | Dernier statut documenté |
|---|---|---|---|
| [test-a10-bootstrap-baseline.cjs](../../tools/release/test-a10-bootstrap-baseline.cjs) | Vérifie le minimum Moodle 4.5 et les adaptations Bootstrap des doubles sélecteurs. | À chaque lot touchant bootstrap et chargement. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-a10-bootstrap-baseline) |
| [test-a10-visually-hidden.cjs](../../tools/release/test-a10-visually-hidden.cjs) | Vérifie le jeu exact des sélecteurs visually-hidden et l’absence de modification de la cascade existante. | À chaque lot touchant compatibilité Moodle et composants natifs. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-a10-visually-hidden) |
| [test-card-selection-keyboard-source.cjs](../../tools/release/test-card-selection-keyboard-source.cjs) | Vérifie les exclusions tabindex des checkbox et la préservation du reste des sources. | À chaque lot touchant Student Management : cartes, sélection ou rendu. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-card-selection-keyboard-source) |
| [test-filter-reset-field-peer-consumer-preservation.cjs](../../tools/release/test-filter-reset-field-peer-consumer-preservation.cjs) | Vérifie l’adoption bornée du focus Reset field-peer et la préservation de la géométrie et de la cible tactile. | À chaque lot touchant filtres, recherche ou réglages associés. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-filter-reset-field-peer-consumer-preservation) |
| [test-filter-track-focus-consumer-preservation.cjs](../../tools/release/test-filter-track-focus-consumer-preservation.cjs) | Vérifie l’adoption du focus track-focus sans modifier les autres états ni la géométrie. | À chaque lot touchant filtres, recherche ou réglages associés. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-filter-track-focus-consumer-preservation) |
| [test-group-header-wrap-source.cjs](../../tools/release/test-group-header-wrap-source.cjs) | Vérifie le delta de wrapper du groupe et la conservation des autres styles et commandes. | À chaque lot touchant Student Management : cartes, sélection ou rendu. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-group-header-wrap-source) |
| [test-guide-active-curriculum-source.cjs](../../tools/release/test-guide-active-curriculum-source.cjs) | Vérifie les deux lignes d’activation du curriculum et la conservation des commandes natives. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-active-curriculum-source) |
| [test-guide-activity-dot-source.cjs](../../tools/release/test-guide-activity-dot-source.cjs) | Vérifie que le passage aux points de phase conserve minuteries, contrôleur et autres styles. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-activity-dot-source) |
| [test-guide-chrome-preservation.cjs](../../tools/release/test-guide-chrome-preservation.cjs) | Vérifie le chrome Guide et la préservation des règles et comportements hors delta autorisé. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-chrome-preservation) |
| [test-guide-creation-source.cjs](../../tools/release/test-guide-creation-source.cjs) | Vérifie le delta d’explication de création et la conservation des contenus, commandes et assets non concernés. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-creation-source) |
| [test-guide-demonstration-source.cjs](../../tools/release/test-guide-demonstration-source.cjs) | Vérifie le delta borné d’entrée en démo contre le moteur de référence et la préservation des autres styles. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-demonstration-source) |
| [test-guide-explanation-recomposition-source.cjs](../../tools/release/test-guide-explanation-recomposition-source.cjs) | Vérifie que la recomposition ne modifie que la famille SCSS/CSS autorisée. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-explanation-recomposition-source) |
| [test-guide-fullscreen-glyph-source.cjs](../../tools/release/test-guide-fullscreen-glyph-source.cjs) | Vérifie le delta de glyphe plein écran, sa règle CSS et la reproduction AMD/map. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-fullscreen-glyph-source) |
| [test-guide-introduction-t014-native-budget-preservation.cjs](../../tools/release/test-guide-introduction-t014-native-budget-preservation.cjs) | Vérifie la reconstruction du prédécesseur T014 hors instrumentation globale de budget/progression. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | PASS — bilan suite2 |
| [test-guide-method-source.cjs](../../tools/release/test-guide-method-source.cjs) | Vérifie le delta de méthode et la conservation des autres contenus et commandes. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-method-source) |
| [test-guide-mistakes-source.cjs](../../tools/release/test-guide-mistakes-source.cjs) | Vérifie le delta d’explication des erreurs et la préservation des autres sources. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-mistakes-source) |
| [test-guide-modal-layer-s1-consumer.cjs](../../tools/release/test-guide-modal-layer-s1-consumer.cjs) | Vérifie les couches Guide/dialogue et la préservation intégrale des autres sources contre le snapshot S1. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-modal-layer-s1-consumer) |
| [test-guide-modern-curriculum-source.cjs](../../tools/release/test-guide-modern-curriculum-source.cjs) | Vérifie les deltas de sources autorisés par la modernisation du curriculum. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-modern-curriculum-source) |
| [test-guide-progress-palette-source.cjs](../../tools/release/test-guide-progress-palette-source.cjs) | Vérifie le delta des deux déclarations de piste Discovery et la conservation des autres sources. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-progress-palette-source) |
| [test-guide-recap-source.cjs](../../tools/release/test-guide-recap-source.cjs) | Vérifie le delta d’explication des récapitulatifs et la préservation des autres contenus. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-recap-source) |
| [test-guide-review2-preservation.cjs](../../tools/release/test-guide-review2-preservation.cjs) | Vérifie le delta Review2 autorisé et la préservation des durées, de l’orientation et des autres sources. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-review2-preservation) |
| [test-guide-shortcuts-source.cjs](../../tools/release/test-guide-shortcuts-source.cjs) | Vérifie la réutilisation de l’explication existante des raccourcis sans nouveau contrôleur ni contenu. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-shortcuts-source) |
| [test-guide-single-root-cascade.cjs](../../tools/release/test-guide-single-root-cascade.cjs) | Vérifie les sélecteurs, déclarations et l’ordre de cascade de la consolidation à racine unique. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-single-root-cascade) |
| [test-guide-slide-title-source.cjs](../../tools/release/test-guide-slide-title-source.cjs) | Vérifie que le delta typographique ne concerne que le titre principal de diapositive. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-slide-title-source) |
| [test-guide-t037-finished-preservation.cjs](../../tools/release/test-guide-t037-finished-preservation.cjs) | Vérifie le delta de peinture finale T037 et le gel des autres styles, moteurs et contenus. | À chaque lot touchant Guide : contenu, contrôleur ou styles. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-guide-t037-finished-preservation) |
| [test-k23-style-scope.cjs](../../tools/release/test-k23-style-scope.cjs) | Vérifie les ajouts responsive et la préservation des règles CSS hors de leur périmètre. | À chaque lot touchant Student Management : cartes, sélection ou rendu. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-k23-style-scope) |
| [test-l1-dead-selector-cascade.cjs](../../tools/release/test-l1-dead-selector-cascade.cjs) | Vérifie la projection de cascade historique du nettoyage de sélecteurs. | À chaque lot touchant Student Management : cartes, sélection ou rendu. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | PASS — bilan suite2 |
| [test-mobile-selection-first-row-source.cjs](../../tools/release/test-mobile-selection-first-row-source.cjs) | Vérifie le delta de deux règles de première ligne et la préservation du reste des sources. | À chaque lot touchant Student Management : cartes, sélection ou rendu. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-mobile-selection-first-row-source) |
| [test-modal-yield-source.cjs](../../tools/release/test-modal-yield-source.cjs) | Vérifie le delta de visibilité partagée et de classe template, sans changement des autres contrôleurs. | À chaque lot touchant dialogues et focus. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-modal-yield-source) |
| [test-search-field-density.cjs](../../tools/release/test-search-field-density.cjs) | Vérifie la recette de largeur intrinsèque, la parité Kit et la conservation de la cascade hors champs concernés. | À chaque lot touchant filtres, recherche ou réglages associés. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-search-field-density) |
| [test-section-icon-intrinsic-width.cjs](../../tools/release/test-section-icon-intrinsic-width.cjs) | Vérifie les cinq déclarations de largeur intrinsèque et la conservation du reste du CSS généré. | À chaque lot touchant Student Management : cartes, sélection ou rendu. Requalifier avant une évolution intentionnelle de cette zone; garder l’oracle tant que la décision manque. | FAIL — [raison](#raison-section-icon-intrinsic-width) |

## Recette native Moodle

| Script | Ce qu’il vérifie | Quand le lancer | Dernier statut documenté |
|---|---|---|---|
| [test-admin-tagged-choices-native.cjs](../../tools/release/test-admin-tagged-choices-native.cjs) | Vérifie les choix multiples des réglages sur Moodle réel sans enregistrer les réglages. | Avant production et après montée Moodle; à chaque lot touchant Student Management : cartes, sélection ou rendu, avec copie/fixture attribuée. | FAIL — [raison](#raison-admin-tagged-choices-native) |
| [test-compat53-native.cjs](../../tools/release/test-compat53-native.cjs) | Vérifie les vues et diagnostics natifs de compatibilité sur la copie Moodle 5.3 dédiée. | Avant production et après montée Moodle; à chaque lot touchant compatibilité Moodle et composants natifs, avec copie/fixture attribuée. | bloqué — [raison](#raison-compat53-native) |
| [test-fiches-k16-43-44-browser.cjs](../../tools/release/test-fiches-k16-43-44-browser.cjs) | Vérifie nativement les modales de fiches et leurs données sur la fixture dédiée. | Avant production et après montée Moodle; à chaque lot touchant Student Management : cartes, sélection ou rendu, avec copie/fixture attribuée. | bloqué — [raison](#raison-fiches-k16-43-44-browser) |
| [test-guide-assignment-native.cjs](../../tools/release/test-guide-assignment-native.cjs) | Mesure le confinement réel des textes Assignment FR/EN dans le Guide Moodle. | Avant production et après montée Moodle; à chaque lot touchant Guide : contenu, contrôleur ou styles, avec copie/fixture attribuée. | PASS — bilan suite2 |
| [test-guide-footer-display-native.cjs](../../tools/release/test-guide-footer-display-native.cjs) | Mesure nativement le footer du Guide et la checklist restaurée sans action métier. | Avant production et après montée Moodle; à chaque lot touchant Guide : contenu, contrôleur ou styles, avec copie/fixture attribuée. | bloqué — [raison](#raison-guide-footer-display-native) |
| [test-guide-ready-native.cjs](../../tools/release/test-guide-ready-native.cjs) | Vérifie nativement les écrans Ready authentifiés sans reconstruire le HTML ni injecter de CSS. | Avant production et après montée Moodle; à chaque lot touchant Guide : contenu, contrôleur ou styles, avec copie/fixture attribuée. | bloqué — [raison](#raison-guide-ready-native) |
| [test-initial-state-transport-native.cjs](../../tools/release/test-initial-state-transport-native.cjs) | Vérifie sur Moodle authentifié le transport de l’état initial, sous verrou de copie allouée. | Avant production et après montée Moodle; à chaque lot touchant Student Management : cartes, sélection ou rendu, avec copie/fixture attribuée. | bloqué — [raison](#raison-initial-state-transport-native) |
| [test-k21-visual-controls-native.cjs](../../tools/release/test-k21-visual-controls-native.cjs) | Mesure les contrôles visuels natifs contre une référence historique externe sous verrou. | Avant production et après montée Moodle; à chaque lot touchant Student Management : cartes, sélection ou rendu, avec copie/fixture attribuée. | PASS — portée limitée à More FR/1600 dans suite2 |
| [test-mass-import-component-loading-native.cjs](../../tools/release/test-mass-import-component-loading-native.cjs) | Mesure pending/ready, la cascade CSS, les bornes des champs et Motion sur Moodle réel. | Avant production et après montée Moodle; à chaque lot touchant Mass Import : formulaire, preview ou rapport, avec copie/fixture attribuée. | bloqué — [raison](#raison-mass-import-component-loading-native) |
| [test-mi-guide-compass-390-browser.cjs](../../tools/release/test-mi-guide-compass-390-browser.cjs) | Vérifie nativement la boussole compacte et les cibles Show sur les pages d’import vides et de preview. | Avant production et après montée Moodle; à chaque lot touchant Guide : contenu, contrôleur ou styles, avec copie/fixture attribuée. | bloqué — [raison](#raison-mi-guide-compass-390-browser) |
| [test-mi-guide-path-browser.cjs](../../tools/release/test-mi-guide-path-browser.cjs) | Vérifie les six étapes réelles de preview, la reprise après reload et l’absence d’import confirmé. | Avant production et après montée Moodle; à chaque lot touchant Guide : contenu, contrôleur ou styles, avec copie/fixture attribuée. | bloqué — [raison](#raison-mi-guide-path-browser) |
| [test-old-b-controls-native.cjs](../../tools/release/test-old-b-controls-native.cjs) | Mesure les contrôles OLD-B sur Moodle réel sans écrire les appartenances ni enregistrer l’admin. | Avant production et après montée Moodle; à chaque lot touchant Student Management : cartes, sélection ou rendu, avec copie/fixture attribuée. | bloqué — [raison](#raison-old-b-controls-native) |
| [test-participant-density-native.cjs](../../tools/release/test-participant-density-native.cjs) | Mesure nativement les transitions de densité et les hauteurs sur la copie allouée. | Avant production et après montée Moodle; à chaque lot touchant Student Management : cartes, sélection ou rendu, avec copie/fixture attribuée. | bloqué — [raison](#raison-participant-density-native) |
| [test-sm53-ready.cjs](../../tools/release/test-sm53-ready.cjs) | Mesure les états Ready et les erreurs de page sur la fixture Moodle 5.3 dédiée. | Avant production et après montée Moodle; à chaque lot touchant Student Management : cartes, sélection ou rendu, avec copie/fixture attribuée. | bloqué — [raison](#raison-sm53-ready) |

## Outillage de build/diagnostic

| Script | Ce qu’il vérifie | Quand le lancer | Dernier statut documenté |
|---|---|---|---|
| [test-build-versions.cjs](../../tools/release/test-build-versions.cjs) | Vérifie les versions Node/Sass et leur cohérence avec les outils de build. | Ponctuel après changement de build, dépendances ou packaging. | PASS — bilan suite2 |
| [test-execution-priority-coverage.cjs](../../tools/release/test-execution-priority-coverage.cjs) | Vérifie les identifiants, cohortes et dépendances du plan d’exécution et ses gates humains. | Ponctuel après changement de Student Management : cartes, sélection ou rendu. | FAIL — [raison](#raison-execution-priority-coverage) |
| [test-guide-inspection-build.cjs](../../tools/release/test-guide-inspection-build.cjs) | Vérifie la reproduction AMD/map de l’inspection et l’absence de sourcesContent publics. | Ponctuel après changement de build, dépendances ou packaging. | FAIL — [raison](#raison-guide-inspection-build) |
| [test-guide-mirror-roundtrip.cjs](../../tools/release/test-guide-mirror-roundtrip.cjs) | Vérifie l’aller-retour des exports et fichiers entre le Kit canonique et ses miroirs. | Ponctuel après changement de Guide : contenu, contrôleur ou styles. | FAIL — [raison](#raison-guide-mirror-roundtrip) |
| [test-guide-path-context-build.cjs](../../tools/release/test-guide-path-context-build.cjs) | Vérifie les exports appelables de contexte de parcours et la préservation des fichiers produit protégés. | Ponctuel après changement de build, dépendances ou packaging. | FAIL — [raison](#raison-guide-path-context-build) |
| [test-guide-pending-highlight-diagnostic.cjs](../../tools/release/test-guide-pending-highlight-diagnostic.cjs) | Mesure l’état de peinture et les cibles courante/en attente du surlignage Guide. | Ponctuel après changement de Guide : contenu, contrôleur ou styles. | PASS — bilan suite2 |
| [test-kit-single-source.cjs](../../tools/release/test-kit-single-source.cjs) | Inventorie les écarts de source Kit et leurs exceptions explicites sans certifier la parité canonique. | Ponctuel après changement de build, dépendances ou packaging. | PASS — bilan suite2 |
| [test-retired-transcript-wraps.cjs](../../tools/release/test-retired-transcript-wraps.cjs) | Vérifie la reconstruction exacte des octets des transcriptions archivées après wrapping physique. | Ponctuel après changement de build, dépendances ou packaging. | PASS — bilan suite2 |
| [test-source-line-endings.cjs](../../tools/release/test-source-line-endings.cjs) | Vérifie que les fichiers JS/SCSS/CSS suivis respectent les fins de ligne LF attendues par le contrat. | Ponctuel après changement de build, dépendances ou packaging. | PASS — bilan suite2 |

## Raisons des FAIL et prérequis bloquants

Les diagnostics ci-dessous conservent la qualification de la dernière passe. Une assertion restée FAIL doit être rejouée contre ses véritables producteurs avant tout nouveau diagnostic. Le défaut tactile natif 24/44px reste un FAIL retenu, hors périmètre de correction documentaire.

<a id="raison-a10-bootstrap-baseline"></a>
### test-a10-bootstrap-baseline.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Qualification historique/source ou harnais encore ouverte.

<a id="raison-a10-visually-hidden"></a>
### test-a10-visually-hidden.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: student-management: exact announced selector set — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-admin-tagged-choices-browser"></a>
### test-admin-tagged-choices-browser.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: One tagged rendering contract — Divergence Kit/consommateur ou geometrie a verifier.

<a id="raison-admin-tagged-choices-native"></a>
### test-admin-tagged-choices-native.cjs

**FAIL** — Qualification historique/source ou harnais encore ouverte — Qualification historique/source ou harnais encore ouverte.

<a id="raison-approved-card-title-weight-candidate"></a>
### test-approved-card-title-weight-candidate.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Use the established consumer Sass 1.89.2 — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-card-modal-keyboard-generated"></a>
### test-card-modal-keyboard-generated.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-card-selection-keyboard-source"></a>
### test-card-selection-keyboard-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Only ten real checkbox tabindex exclusions removed; all markup/styles preserved — Qualification historique/source ou harnais encore ouverte.

<a id="raison-compat53-lanes"></a>
### test-compat53-lanes.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: student-management: only lane boundary paint and exact inherited K20-04 wrapping rule — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-compat53-native"></a>
### test-compat53-native.cjs

**bloqué** — Port 8053 fixe et fixture propre 5.3; hors verrou 8052. Aucun detournement vers 5.1..

<a id="raison-execution-priority-coverage"></a>
### test-execution-priority-coverage.cjs

**FAIL** — const before=JSON.parse(execFileSync('git',['show','b48bd20:'+f],{encoding:'utf8'})),now=JSON.parse(fs.readFileSync(f,'utf8')); — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-fiches-k16-43-44-browser"></a>
### test-fiches-k16-43-44-browser.cjs

**bloqué** — Port 8055 fixe, entites et modes de fiche de fixture specifique; pas le cours 71 standard..

<a id="raison-fiches-k16-43-44-contract"></a>
### test-fiches-k16-43-44-contract.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Divergence Kit/consommateur ou geometrie a verifier.

<a id="raison-filter-reset-field-peer-consumer-preservation"></a>
### test-filter-reset-field-peer-consumer-preservation.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Qualification historique/source ou harnais encore ouverte.

<a id="raison-filter-track-focus-consumer-preservation"></a>
### test-filter-track-focus-consumer-preservation.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Qualification historique/source ou harnais encore ouverte.

<a id="raison-french-editor-accents"></a>
### test-french-editor-accents.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: advancedsettings uses Moodle localization — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-french-editor-label-contract"></a>
### test-french-editor-label-contract.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-gmi-initial-checklist"></a>
### test-gmi-initial-checklist.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Baseline reproduces the initial overlap — Qualification historique/source ou harnais encore ouverte.

<a id="raison-group-header-wrap-source"></a>
### test-group-header-wrap-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-active-curriculum-source"></a>
### test-guide-active-curriculum-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-active-curriculum"></a>
### test-guide-active-curriculum.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-activity-context-bridge"></a>
### test-guide-activity-context-bridge.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-activity-dot-layout"></a>
### test-guide-activity-dot-layout.cjs

**FAIL** — Expected values to be strictly equal: + actual - expected + 'inline' - 'flex' — Divergence Kit/consommateur ou geometrie a verifier.

<a id="raison-guide-activity-dot-source"></a>
### test-guide-activity-dot-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Unchanged controller/content amd/src/easyedu_guide.js — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-activity-grouping-authority"></a>
### test-guide-activity-grouping-authority.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-activity-path"></a>
### test-guide-activity-path.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: amd/src/easyedu_guide.js — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-advanced-edit-entry"></a>
### test-guide-advanced-edit-entry.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-chrome-preservation"></a>
### test-guide-chrome-preservation.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Complete behaviour/markup unchanged: amd/src/easyedu_guide.js — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-creation-source"></a>
### test-guide-creation-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-current-curriculum"></a>
### test-guide-current-curriculum.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-demonstration-entry"></a>
### test-guide-demonstration-entry.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-demonstration-source"></a>
### test-guide-demonstration-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-discovery"></a>
### test-guide-discovery.cjs

**FAIL** — TypeError: renderer.render is not a function — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-editor-inspection"></a>
### test-guide-editor-inspection.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: const emitEditorInspectionCompletion = — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-explanation-recomposition-source"></a>
### test-guide-explanation-recomposition-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Retained complete source: manage.php — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-explanation-recomposition"></a>
### test-guide-explanation-recomposition.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: create-structure/en/1280/no-preference — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-filter-path"></a>
### test-guide-filter-path.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: styles.css — Divergence comportement/geometrie a qualifier; pas un bug produit confirme.

<a id="raison-guide-first-introduction"></a>
### test-guide-first-introduction.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-floating-launcher"></a>
### test-guide-floating-launcher.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Existing Guide SCSS unchanged — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-footer-display-native"></a>
### test-guide-footer-display-native.cjs

**bloqué** — Oracle CSS historique e8a1b83a injecte et compte admin/password-file; separer candidat reel et baseline avant adaptation supervisee..

<a id="raison-guide-fullscreen-glyph-source"></a>
### test-guide-fullscreen-glyph-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-g8-lifecycle"></a>
### test-guide-g8-lifecycle.cjs

**FAIL** — TypeError: renderer.render is not a function — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-g9-lifecycle"></a>
### test-guide-g9-lifecycle.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal: — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-g9-presentation"></a>
### test-guide-g9-presentation.cjs

**FAIL** — page.waitForFunction: Timeout 60000ms exceeded. at C:\dev\worktrees\easystud-codex1-fixtures-suite2-20261025\tools\release\test-guide-g9-presentation.cjs:38:20 { log: [], name: 'TimeoutError' } — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-inspection-activation"></a>
### test-guide-inspection-activation.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-inspection-build"></a>
### test-guide-inspection-build.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Curriculum/paths/localization adapter unchanged: classes/local/guide_discovery.php — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-inspection-data"></a>
### test-guide-inspection-data.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: All historical adapters remain unchanged — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-k18-controls"></a>
### test-guide-k18-controls.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Divergence Kit/consommateur ou geometrie a verifier.

<a id="raison-guide-method-source"></a>
### test-guide-method-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-mirror-roundtrip"></a>
### test-guide-mirror-roundtrip.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Divergence Kit/consommateur ou geometrie a verifier.

<a id="raison-guide-mistakes-source"></a>
### test-guide-mistakes-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-mobile-action-identity"></a>
### test-guide-mobile-action-identity.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-modal-header-t049"></a>
### test-guide-modal-header-t049.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: easyedu-guide-kit/templates/easyedu_guide.mustache: shared optional header contract — Divergence Kit/consommateur ou geometrie a verifier.

<a id="raison-guide-modal-layer-s1-consumer"></a>
### test-guide-modal-layer-s1-consumer.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Exactly one shared native drawer yield extension — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-modern-curriculum-layout"></a>
### test-guide-modern-curriculum-layout.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: false == true — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-modern-curriculum-source"></a>
### test-guide-modern-curriculum-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-modern-curriculum"></a>
### test-guide-modern-curriculum.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Native curriculum remains unchanged — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-nav-pointer-focus"></a>
### test-guide-nav-pointer-focus.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Canonical and embedded navigation bindings match — Divergence Kit/consommateur ou geometrie a verifier.

<a id="raison-guide-navigation-tooltip-source"></a>
### test-guide-navigation-tooltip-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: bubble.show(element, text) — Divergence comportement/geometrie a qualifier; pas un bug produit confirme.

<a id="raison-guide-path-context-build"></a>
### test-guide-path-context-build.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Complete unrelated adapted engine preserved — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-practice-path"></a>
### test-guide-practice-path.cjs

**FAIL** — TypeError: Cannot read properties of null (reading '0') — Dependance/borne de fixture obsolete; assertions conservees.

<a id="raison-guide-presentation-follow-up"></a>
### test-guide-presentation-follow-up.cjs

**FAIL** — page.waitForFunction: Timeout 15000ms exceeded. at C:\dev\worktrees\easystud-codex1-fixtures-suite2-20261025\tools\release\test-guide-presentation-follow-up.cjs:29:20 { log: [], name: 'TimeoutError' } — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-progress-palette-source"></a>
### test-guide-progress-palette-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-reading-order"></a>
### test-guide-reading-order.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-ready-native"></a>
### test-guide-ready-native.cjs

**bloqué** — Ancien acces admin/password-file et readiness pre-I10; adapter le pilote lazy et verifier le contrat Ready separement..

<a id="raison-guide-recap-source"></a>
### test-guide-recap-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-review1-compact"></a>
### test-guide-review1-compact.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-review2-preservation"></a>
### test-guide-review2-preservation.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Complete engine outside scene presentation/nav visibility unchanged — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-scene-header"></a>
### test-guide-scene-header.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-selection-copy"></a>
### test-guide-selection-copy.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: All other presentation, targets, commands and progress adapters preserved — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-shortcuts-source"></a>
### test-guide-shortcuts-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-simplecreate"></a>
### test-guide-simplecreate.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Every current invitation is preserved — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-single-root-browser"></a>
### test-guide-single-root-browser.cjs

**FAIL** — Qualification historique/source ou harnais encore ouverte — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-single-root-cascade"></a>
### test-guide-single-root-cascade.cjs

**FAIL** — const a=rows(before,true),b=rows(after,false);if(JSON.stringify(a)!==JSON.stringify(b)){let i=0;while(i<Math.min(a.length,b.length)&&JSON.stringify(a[i])===JSON.stringify(b[i]))i++;throw Error('Rule '+i+' old='+JSON.stringify(a[i]).slice(0,900)+' new='+JSON.stringify(b[i]).slice(0,900));} — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-slide-title-layout"></a>
### test-guide-slide-title-layout.cjs

**FAIL** — {"message":"Every current slide\n\n13 !== 12\n","actual":13,"expected":12,"where":""} — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-slide-title-source"></a>
### test-guide-slide-title-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Complete source preserved: manage.php — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-source-member-path"></a>
### test-guide-source-member-path.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Divergence comportement/geometrie a qualifier; pas un bug produit confirme.

<a id="raison-guide-t037-finished-paint"></a>
### test-guide-t037-finished-paint.cjs

**FAIL** — Qualification historique/source ou harnais encore ouverte — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-t037-finished-preservation"></a>
### test-guide-t037-finished-preservation.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: amd/src/course_manager.js unchanged — Qualification historique/source ou harnais encore ouverte.

<a id="raison-guide-t037-reading-composition"></a>
### test-guide-t037-reading-composition.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Guide SCSS is mirrored exactly from the pinned Kit checkout — Divergence Kit/consommateur ou geometrie a verifier.

<a id="raison-guide-t038-navigation"></a>
### test-guide-t038-navigation.cjs

**FAIL** — Error: T038 contract failed: shared Guide SCSS is identical in Kit and consumer — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-guide-welcome-reset-layout"></a>
### test-guide-welcome-reset-layout.cjs

**FAIL** — ENOENT: no such file or directory, open 'C:\dev\worktrees\easystud-codex1-fixtures-suite2-20261025\amd\build\confirmation.min.js' — Qualification historique/source ou harnais encore ouverte.

<a id="raison-import-file-required-late-ready"></a>
### test-import-file-required-late-ready.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-import-file-required"></a>
### test-import-file-required.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-initial-state-transport-native"></a>
### test-initial-state-transport-native.cjs

**bloqué** — Identite de verrou PERF 20261021 codee en dur; garde conservee, migration vers un contrat de lease a concevoir..

<a id="raison-k16-14-copy-command"></a>
### test-k16-14-copy-command.cjs

**FAIL** — ReferenceError: window is not defined — Dependance/borne de fixture obsolete; assertions conservees.

<a id="raison-k16-kit-measures"></a>
### test-k16-kit-measures.cjs

**FAIL** — {"passed":false,"report":[]} ENOENT: no such file or directory, open 'C:\dev\worktrees\easystud-codex1-fixtures-suite2-20261025\amd\build\card_title_accent.min.js' — Qualification historique/source ou harnais encore ouverte.

<a id="raison-k23-nav-lanes"></a>
### test-k23-nav-lanes.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Desktop and drawer header unchanged — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-k23-style-scope"></a>
### test-k23-style-scope.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: original parent declarations are unchanged — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-kit-native-select-variants"></a>
### test-kit-native-select-variants.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Divergence comportement/geometrie a qualifier; pas un bug produit confirme.

<a id="raison-l1-dead-selector-browser"></a>
### test-l1-dead-selector-browser.cjs

**FAIL** — Qualification historique/source ou harnais encore ouverte — Qualification historique/source ou harnais encore ouverte.

<a id="raison-l1l2-current-cascade"></a>
### test-l1l2-current-cascade.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: scss/easyedu/components/_guide.scss — Divergence Kit/consommateur ou geometrie a verifier.

<a id="raison-loading-late-ready"></a>
### test-loading-late-ready.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: All other bootstrap deadline/fades/guards preserved — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-long-lists-pills-browser"></a>
### test-long-lists-pills-browser.cjs

**FAIL** — The expression evaluated to a falsy value: assert(row.closed.titles) — Divergence comportement/geometrie a qualifier; pas un bug produit confirme.

<a id="raison-mass-import-component-loading-native"></a>
### test-mass-import-component-loading-native.cjs

**bloqué** — Baseline CSS historique et authentification fichier; les phases pending et baseline demandent un pilote supervise propre..

<a id="raison-mi-guide-compass-390-browser"></a>
### test-mi-guide-compass-390-browser.cjs

**bloqué** — Fixture preview et compte admin ancien; brouillons fichier/etats de parcours a provisionner et restaurer explicitement..

<a id="raison-mi-guide-path-browser"></a>
### test-mi-guide-path-browser.cjs

**bloqué** — Scenario fichier reel, preview et reprise apres reload: besoin de fixture de fichier et restauration session, pas seulement identifiants..

<a id="raison-mobile-compact-profile"></a>
### test-mobile-compact-profile.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-mobile-group-header-wrap"></a>
### test-mobile-group-header-wrap.cjs

**FAIL** — Error: New owned external run required — Divergence comportement/geometrie a qualifier; pas un bug produit confirme.

<a id="raison-mobile-participant-title-clearance"></a>
### test-mobile-participant-title-clearance.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Exactly one opt-in rule — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-mobile-selection-first-row-source"></a>
### test-mobile-selection-first-row-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Exact one full-card first-row formula — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-mobile-selection-first-row"></a>
### test-mobile-selection-first-row.cjs

**FAIL** — Error: New owned external run required — Divergence comportement/geometrie a qualifier; pas un bug produit confirme.

<a id="raison-modal-yield-source"></a>
### test-modal-yield-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: One exact shared yield rule — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-old-b-controls-native"></a>
### test-old-b-controls-native.cjs

**bloqué** — Oracles baseline/candidate et selections admin specifiques; mapping de reference necessaire avant adaptation..

<a id="raison-page-css-subsequence-guide"></a>
### test-page-css-subsequence-guide.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: student-management: changed selector/declarations .local-groupimport-easystud — Qualification historique/source ou harnais encore ouverte.

<a id="raison-page-css-subsequence"></a>
### test-page-css-subsequence.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: student-management: changed selector/declarations .local-groupimport-easystud — Qualification historique/source ou harnais encore ouverte.

<a id="raison-participant-density-native"></a>
### test-participant-density-native.cjs

**bloqué** — Contrat admin/password-file et jeux de densite attendus; adapter auth et verifier les donnees de cours avant rejeu strict..

<a id="raison-participant-overflow-scroll"></a>
### test-participant-overflow-scroll.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-participant-panel-title"></a>
### test-participant-panel-title.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Only panel copy mapping changes — Qualification historique/source ou harnais encore ouverte.

<a id="raison-quiet-selection-recovery"></a>
### test-quiet-selection-recovery.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Divergence comportement/geometrie a qualifier; pas un bug produit confirme.

<a id="raison-r10-23-autoscroll"></a>
### test-r10-23-autoscroll.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Production auto-scroll helper required — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-refactor-mechanical"></a>
### test-refactor-mechanical.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Exact state/manage/movestatus JSON parity — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-release-smoke-isolated"></a>
### test-release-smoke-isolated.cjs

**FAIL** — {"passed":false,"checks":14,"failed":["bulk"],"nativePhpunit":"NOT_RUN","nativeBehat":"NOT_RUN"} — Divergence comportement/geometrie a qualifier; pas un bug produit confirme.

<a id="raison-search-field-density"></a>
### test-search-field-density.cjs

**FAIL** — TypeError: Cannot read properties of null (reading '0') — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-section-icon-intrinsic-width"></a>
### test-section-icon-intrinsic-width.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-selection-availability-scope"></a>
### test-selection-availability-scope.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-shared-pill-renderer-framed"></a>
### test-shared-pill-renderer-framed.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Divergence comportement/geometrie a qualifier; pas un bug produit confirme.

<a id="raison-shared-pill-renderer"></a>
### test-shared-pill-renderer.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value: — Divergence comportement/geometrie a qualifier; pas un bug produit confirme.

<a id="raison-sm53-ready"></a>
### test-sm53-ready.cjs

**bloqué** — Port 8053 fixe et fixture 5.3 a reserver/provisionner; hors copie attribuee..

<a id="raison-student-card-selection-anchor-browser"></a>
### test-student-card-selection-anchor-browser.cjs

**FAIL** — Error: New owned external run required. — Divergence comportement/geometrie a qualifier; pas un bug produit confirme.

<a id="raison-tooltip-light-source"></a>
### test-tooltip-light-source.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: Complete canonical and embedded tooltip recipes match — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-tours-off"></a>
### test-tours-off.cjs

**FAIL** — FAIL version 2026101800 — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-tutorial-js-retirement"></a>
### test-tutorial-js-retirement.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: retains data-easyedu-guide-root — Contrat mixte/historique: identite source figee, pas une preuve de bug actuel.

<a id="raison-tutorial-retirement"></a>
### test-tutorial-retirement.cjs

**FAIL** — AssertionError [ERR_ASSERTION]: current server always chooses shared Guide — Divergence comportement/geometrie a qualifier; pas un bug produit confirme.

## Contrats retirés : mémoire conservée

Ces fichiers ne sont plus actifs. Leur retrait ne prouve pas que le comportement correspondant est couvert ou conforme. La justification complète et les blocs Git sont dans [les décisions versionnées](contracts-decisions-2026-10-25.md). Récupération : `git show 1cc0eba5:tools/release/<script>`.

| Script historique | Statut | Pourquoi le contrat ne s’applique plus |
|---|---|---|
| `test-dialog-palette-preservation.cjs` | retiré | Le contrat exige cinq blocs de peinture et la reconstitution du styles.css monolithique. I9 (07350e8a) a intentionnellement remplace ce fichier par un point entree vide et des CSS par page; la recette de cinq blocs dans ce fichier nexiste plus. Les contrats courants de palette restent. Voir [décision et blob](contracts-decisions-2026-10-25.md). |
| `test-guide-header-palette-source.cjs` | retiré | Exige exactement un bloc de peinture dans styles.css et lidentite integrale du markup pre-adoption. I9 (07350e8a) et I3 (c37fa3d0) retirent intentionnellement ces emplacements. Le contrat de palette courant test-guide-header-palette.cjs est conserve. Voir [décision et blob](contracts-decisions-2026-10-25.md). |
| `test-guide-introduction-t014-preservation.cjs` | retiré | Reconstitue les moteurs complets et le CSS integral du snapshot T014 (7332375/cb9edab), avec une seule donnee et une chaine nouvelles. I3 (c37fa3d0), I9 (07350e8a) et la migration du curriculum rendent intentionnellement cette API de source unique caduque; le contrat dintroduction actuel est conserve. Voir [décision et blob](contracts-decisions-2026-10-25.md). |
| `test-guide-recap-t012-preservation.cjs` | retiré | La preuve T012 ne permet quun pont recap ajoute a 78d7dd5/dbaa237 et exige le reste du moteur/CSS/markup identique. Le moteur et le CSS ont ensuite ete distribues via I9 et Motion M3, et les recaps ont ete modifies par K20-17b. Les deux contrats de comportement recap T012 sont conserves (PASS lors du lot precedent). Voir [décision et blob](contracts-decisions-2026-10-25.md). |
| `test-guide-review1-preservation.cjs` | retiré | Preuve ponctuelle de la recette Review1: masque un seul bloc de moteur/CSS puis exige le curriculum entier de 6b3cd59. Les donnees ont ete deplacees par I3 et le curriculum a volontairement evolue. Le test Review1 compact courant reste FAIL, sans suppression ni changement de ses attendus. Voir [décision et blob](contracts-decisions-2026-10-25.md). |
| `test-guide-review2-mobile-complete-lane-preservation.cjs` | retiré | Variante de la preuve ponctuelle Review2 mobile: moteurs figes a 5188f61/9407d02, une seule legende ajoutee et comparaison integrale du styles.css monolithique. I9 (07350e8a) et les evolutions de curriculum rendent volontairement ce protocole caduc. Les contrats de confinement/geometrie mobiles et le contrat Review2 mixte sont conserves. Voir [décision et blob](contracts-decisions-2026-10-25.md). |
| `test-guide-review2-mobile-fit-preservation.cjs` | retiré | Variante de la preuve ponctuelle Review2 mobile: moteurs figes a 5188f61/9407d02, une seule legende ajoutee et comparaison integrale du styles.css monolithique. I9 (07350e8a) et les evolutions de curriculum rendent volontairement ce protocole caduc. Les contrats de confinement/geometrie mobiles et le contrat Review2 mixte sont conserves. Voir [décision et blob](contracts-decisions-2026-10-25.md). |
| `test-guide-review2-mobile-lane-preservation.cjs` | retiré | Variante de la preuve ponctuelle Review2 mobile: moteurs figes a 5188f61/9407d02, une seule legende ajoutee et comparaison integrale du styles.css monolithique. I9 (07350e8a) et les evolutions de curriculum rendent volontairement ce protocole caduc. Les contrats de confinement/geometrie mobiles et le contrat Review2 mixte sont conserves. Voir [décision et blob](contracts-decisions-2026-10-25.md). |
| `test-guide-review2-mobile-preservation.cjs` | retiré | Variante de la preuve ponctuelle Review2 mobile: moteurs figes a 5188f61/9407d02, une seule legende ajoutee et comparaison integrale du styles.css monolithique. I9 (07350e8a) et les evolutions de curriculum rendent volontairement ce protocole caduc. Les contrats de confinement/geometrie mobiles et le contrat Review2 mixte sont conserves. Voir [décision et blob](contracts-decisions-2026-10-25.md). |
| `test-guide-scene-header-preservation.cjs` | retiré | Reconstitue exactement le moteur precedent 261b692f et gele course_manager/motion au commit f71ab2e. Ce protocole dune seule intervention ne sapplique plus apres lextraction T055 phase 2 du manager (4cbc0c03), Motion M3 et les nouvelles recettes de scene. Les contrats scene-header de rendu et les contrats Motion restent. Voir [décision et blob](contracts-decisions-2026-10-25.md). |
| `test-mass-report-palette-preservation.cjs` | retiré | Exige sept blocs de peinture dans styles.css et la reconstitution integrale du fichier avant SM-64. I9 (07350e8a) a intentionnellement remplace cette API par mass-import.css; les classes de rapport sont maintenant definies dans leurs composants. test-mass-report-semantic-palette.cjs est conserve. Voir [décision et blob](contracts-decisions-2026-10-25.md). |
| `test-view-icon-transition-preservation.cjs` | retiré | Exige un seul ajout dans styles.css puis egalite complete avec lancien bundle, et lunique ajout dun modificateur dans un template monolithique. I9 et les templates distribues ont retire ces supports. Les contrats actuels view-toggle et Motion ne sont pas supprimes. Voir [décision et blob](contracts-decisions-2026-10-25.md). |

## Comment ajouter un nouveau test

1. Placer un script autonome `test-<zone>-<contrat>.cjs` dans `tools/release/`. Décrire le comportement vérifié, ses limites, les arguments/dépendances, les références immuables et les effets sur les fixtures. Séparer navigateur isolé et session Moodle réelle.
2. Ajouter une ligne dans la catégorie principale appropriée de ce catalogue : nom exact et lien, objectif, fréquence, dernier statut daté et référence de preuve. Si le test n’a pas encore tourné, écrire « non exécuté » explicitement et le compter séparément; ne jamais inventer PASS ou FAIL.
3. Ajouter toute raison de FAIL ou tout prérequis bloquant dans la section durable correspondante. Distinguer bug produit confirmé, divergence à qualifier et défaut de harnais. Pour un retrait, écrire une décision versionnée avec sa preuve et son Git blob; conserver une ligne « retiré » séparée.
4. Recalculer le total des fichiers actifs et les sous-totaux par catégorie/statut; vérifier qu’aucun nom actif n’est absent ou dupliqué. Dater le rejeu et le commit testé : un résultat ancien ne certifie pas une nouvelle version. Aucune assertion ni garde de sécurité ne doit être affaiblie pour changer un compteur.


## Addition: participant default disclosure (2026-10-25)

This addition does not rewrite the historical inventory totals above.

| Script | Category | Checks | When | Status |
| --- | --- | --- | --- | --- |
| `test-participant-collapse-default.cjs` | Current behaviour contract | Admin default, independent automatic density and explicit session choice (24 cases). | Participant disclosure or density changes; before release. | PASS, 2026-10-25; see [protocol](participant-collapse-default-2026-10-25.md). |
