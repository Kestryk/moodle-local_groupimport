# Prompt complet de passation — rédaction des guides EasyStud

Copier ce document dans la fenêtre responsable du contenu. Cette mission est
la rédaction/spécification, pas la modification du moteur ou du runtime.

## Ta mission

Tu rédiges les prochains guides EasyStud adaptés au nouveau format intégré.
Audite les contenus existants, retire les doublons et conserve les fonctionnalités
importantes, sans guide encyclopédique ni slides de remplissage. Le nombre de
slides n'est pas une cible : chaque slide doit répondre à un besoin utilisateur.
Explique les cartes et leurs actions, le contexte avant chaque démonstration,
les conséquences après, puis propose quelques parcours accompagnés pertinents.
Livre d'abord le guide Student Management ; Mass Import reste un guide distinct.

## Propriété et sécurité

- La fenêtre intégration possède les worktrees EasyStud/Kit, la preview Moodle,
  le moteur, les composants et leur publication Foundations/Guide Penpot.
- Ne modifie ni ces checkouts, ni leurs branches, ni le runtime/DB/caches, ni
  les serveurs/profils/MCP de cette fenêtre. Aucun nouveau moteur, CSS ou token.
- Lis les sources en read-only. Rédige dans ton espace d'artefacts existant,
  avec un sous-dossier de livraison daté, sans écraser ta production historique.
  Racine actuelle : C:\dev\artifacts\easystud-guide-20261005.
- Ne touche pas Penpot/Foundations sans attribution explicite du fichier/page
  et du canal. La rédaction peut progresser sans monopoliser Penpot.
- Les illustrations ne font aucune commande Moodle. Les parcours réels ne
  font que guider : l'utilisateur effectue et confirme lui-même les actions.
- Ne promets pas d'annulation/nettoyage automatique des exercices métier.
- Ne qualifie aucune proposition d'implémentée ou de validée par l'utilisateur.

## Sources et priorité des décisions

Source actuelle, en lecture seule :
C:\dev\worktrees\easystud-foundations-student-management-20260928.
Kit canonique, en lecture seule :
C:\dev\worktrees\easyedu-ui-kit-phase0-mass-admin-20260927.
Points de référence : Source2b22de1, Kit08c9abb/0.4.147. Vérifie les HEADs avant
lecture : l'intégrateur peut avancer après cette passation.

À lire de manière ciblée :
1. AGENTS.md et contrat documentaire du dépôt ; les consignes de ta fenêtre.
2. docs/guide-follow-up-g10-2026-10-08.md : derniers retours prioritaires.
3. classes/local/guide_discovery.php : quatre slides et parcours actuel.
4. manage.php : tutorialsteps, build_easyedu_guide_template_data et
   build_easyedu_guide_js_config (cibles, ouvertures, anciens parcours).
5. lang/en/local_groupimport.php et lang/fr/local_groupimport.php : textes.
6. templates/easyedu_guide.mustache ; Kit guide/templates/easyedu_guide.mustache.
7. docs/guide-follow-up-g9-2026-10-08.md et docs/guide-follow-up-g8-2026-10-07.md.
8. Ton ancienne passation/production et la démo http://127.0.0.1:4415/ si elle
   répond : références, pas autorité supérieure aux retours récents/source native.

Le fichier Penpot est b564c72c-f31f-81ec-8008-ad9958b272bd, page
b564c72c-f31f-81ec-8008-ad9958b272be « Guide easystud ». Tu n'en es pas writer
dans cette mission. Foundations catalogue le Kit ; aucun plugin n'est parent
stylistique d'un autre. Overview et les cartes naturelles actuelles sont à préserver.

## Inventaire réellement assemblé :24 slides

Les quatre nouvelles slides sont PREPENDUES aux vingt références héritées.
Les indices sont ici documentaires, jamais des identifiants stables de migration.

| Position | Nouvelle slide | Fonction |
| --- | --- | --- |
| 1 | Overview | Participant → groupe → groupement ; base à conserver. |
| 2 | Practice | Création, nomenclature #/@/*, exemples isolés et parcours practice-membership. |
| 3 | Organisation | Comparaison Add/Move de membres d'un groupe et conséquences. |
| 4 | Actions | Sélection, action, choix de destination et confirmation. |

| Position | Titre hérité EN | Sujet à conserver/fusionner/réécrire après audit |
| --- | --- | --- |
| 5 | Understand the structure | Modèle participant/groupe/groupement, recoupe Overview. |
| 6 | Create a first structure | Créer groupes et groupement, recoupe Practice. |
| 7 | Guided path mode | Fonctionnement de la checklist, à fusionner avec l'introduction commune. |
| 8 | Search, filter, select | Recherche, filtres, sélection des résultats. |
| 9 | Participant card | Identité, rôles, appartenances, détails, sélection et actions réelles. |
| 10 | Group card | Membres, groupements, liste dépliable et actions réelles. |
| 11 | Grouping card | Conteneur de groupes, actions et usage dans les activités Moodle. |
| 12 | Good practice: group assignment | Mise en situation participant → groupe → groupement. |
| 13 | Create a grouping for an activity | Créer/compléter un groupement ; réglage de l'activité séparé. |
| 14 | Add by pasted identifiers | Identifiants permis et reconnaissance des noms ; disponibilité mobile à auditer. |
| 15 | Context menus | Clic droit desktop, bouton d'action mobile équivalent. |
| 16 | Action buttons and selection modals | Sélection, destination/recherche, confirmation. |
| 17 | Move, copy and organise | Actions et ancien parcours try-actions ; recoupe Organisation/Actions. |
| 18 | Keyboard-friendly selection | Gestes réellement disponibles, ne pas inventer de raccourcis. |
| 19 | Choose the right method | Choisir geste/action/saisie selon objectif, souvent fusionnable. |
| 20 | Useful shortcuts | Recoupe méthodes/clavier/menus. |
| 21 | Create faster | Création multiple et formules, recoupe Practice. |
| 22 | Common mistakes to avoid | Confusions de niveaux et conséquences à intégrer au bon endroit. |
| 23 | Key points | Résumé, fusion possible avec conclusion/recaps. |
| 24 | Ready to use EasyStud | Conclusion utile, pas une seconde répétition générale. |

La clé tutorialcardstitle « Read the cards » existe dans la langue, mais n'est
pas une25e slide assemblée. Vérifie l'ordre dans le builder, pas dans un simple
inventaire de chaînes. Le nouveau plan doit couvrir les besoins, pas recopier24
titres ni supprimer arbitrairement une fonction parce qu'elle semble redondante.

## Règles de rédaction et format de slide

- Intro courte : où sommes-nous, quel problème résolvons-nous, quel résultat ?
- Chaque animation est annoncée AVANT son lancement : par exemple comparer
  l'ajout à un second groupe et le déplacement depuis un groupe source précis.
- Nomme le contrôle réel : pas seulement « cliquez ici » ou « utilisez Move ».
- Une consigne par phase, phrases courtes et durée de lecture adaptable.
- Conclusion courte : ce qui a changé, ce qui reste inchangé, éventuelle vigilance.
- Steps to remember utiles, pas répétition intégrale de la narration.
- Cartes : expliquer leurs informations puis leurs actions, leur disponibilité
  et leurs conséquences. Les champs personnalisés/menus dépendent des réglages
  et droits ; ne pas promettre qu'ils sont toujours visibles.
- Ne confonds pas lecture/démonstration/parcours réel. Indiquer clairement quand
  rien n'est modifié dans Moodle et quand la confirmation utilisateur le modifie.
- FR naturel + EN naturel, mêmes intentions/étapes ; pas de texte inutilement
  long pour remplir les composants. Fournir labels courts pour mobile.
- Une fonctionnalité non trouvée dans la source devient une question explicite,
  jamais un fait ajouté au guide.

## Introduction commune obligatoire pour tous les guides

Propose une slide réutilisable « Comment utiliser ce guide » : navigation,
démonstrations sans effet Moodle, commandes d'animation, Show in interface et
Return to guide, parcours/checklist, prérequis verrouillés, reprise/reset/annulation.
Explique que les étapes se valident selon leur vraie condition, pas sur le seul clic.
Texte produit paramétrable : ne duplique pas une mécanique commune par plugin.

Fonctionnalités demandées dans G10, ENCORE NON IMPLÉMENTÉES à cette passation :
points animés de narration, Pause/Reprendre, >> phase suivante, plein écran
desktop seulement, invitation première visite mémorisée serveur et reset admin.
Prépare leurs microcopies/description et une adaptation si la capacité est absente.
Ne présente pas ces contrôles comme déjà disponibles. Le plein écran n'est pas
une instruction mobile ; Show in interface nécessite de revenir à l'interface.

## Vérités métier à respecter

- Un participant est un utilisateur déjà inscrit au cours. EasyStud organise
  ces utilisateurs ; ne décrire aucune inscription automatique inexistante.
- Un groupe contient des participants ; un groupement contient des groupes,
  jamais directement des participants. Plusieurs appartenances sont possibles.
- Ajouter des membres à un autre groupe peut préserver le groupe source.
  Déplacer des MEMBRES DEPUIS UN GROUPE source retire cette appartenance source
  après confirmation, pas toutes leurs appartenances.
- Important : le bouton Move de la liste Participants mobile utilise actuellement
  addusers ; il n'équivaut pas au Move de membres d'un groupe (movemembers).
  Écris les conséquences par contexte/contrôleur vérifié, pas à partir du seul label.
- Retirer un membre d'un groupe n'est pas supprimer son compte ni le désinscrire.
  Distinguer aussi suppression du groupe et retrait d'un groupe d'un groupement.
- Desktop : drag/drop et clic droit si disponibles. Mobile : sélection puis
  actions natives ; jamais enseigner un drag/clic droit desktop comme geste mobile.
- La saisie d'identifiants se fait dans le conteneur concerné, pas dans une
  nouvelle zone indépendante. Vérifier sa disponibilité sur chaque taille.
- Choisir un groupement dans une activité Moodle est une action distincte :
  créer un groupement ne configure pas automatiquement une activité.
- La sélection filtrée, le compact/full et les actions dépendent des règles
  réellement implémentées ; vérifier Source, pas une ancienne illustration.

## Parcours accompagnés

Évite un parcours pour chaque slide. Propose peu de parcours orientés objectif,
avec prérequis réalistes, conditions explicites et alternative sans données.

Parcours actuel practice-membership, six étapes (à conserver ou faire migrer
explicitement, pas remplacer silencieusement les identifiants/progressions) :
1. Créer un groupe : target groupCreateInput, id create-group.
2. Ouvrir Participants : target viewParticipants, id open-participants.
3. Sélectionner un participant : target participantSelectionInput, id select-participant.
4. Ouvrir Move : target participantMoveAction, id open-move.
5. Chercher/choisir le groupe destination : participantMoveDestination, id choose-destination.
6. Vérifier/confirmer : participantMoveConfirm, id confirm-move.

Étapes5/6 ouvrent la vraie modale, étapes précédentes la ferment si nécessaire.
requiresStep relie les étapes ; autoHighlightNext existe. Un défaut signalé
de surbrillance entre3/4 et sur5 est à corriger PAR L'INTÉGRATEUR : ne supprimer
ni la modale ni ces étapes pour masquer le problème.

Anciens parcours toujours présents : first-structure, create-grouping, try-actions.
Audite leurs conditions actuelles : une zone visitée n'est pas une création ou
un transfert réellement réussi. Fournis une table keep/merge/replace/archive
et les conséquences pour les états enregistrés. Aucune migration de progression
ni reset général ne doit être faite par la fenêtre contenu.

Candidats à étudier, pas des fonctionnalités implémentées : préparer des groupes
et leur groupement ; vérifier les membres par recherche/filtres ; réorganiser
des membres depuis un groupe source. Éviter les exercices destructifs obligatoires.
Pour Mass Import, séparer une découverte sans import réel d'un éventuel parcours
d'application explicite. Identifier le dernier clic qui change les données.

## Livraison attendue — directement interprétable par l'intégrateur

1. PLAN.md : objectifs, ordre proposé, justification des fusions/suppressions,
   durée indicative, sujets laissés de côté et questions bloquantes.
2. CROSSWALK.md :24 entrées existantes → keep/merge/rewrite/archive + futur ID
   et justification. Aucun sujet utile disparu sans explication.
3. student-guide.json : format proposé CI-DESSOUS, JSON valide, EN/FR complets.
4. mass-import-guide.json : guide distinct, marqué proposal tant que les cibles
   et comportements n'ont pas été vérifiés. Pas de promesse de rollback universel.
5. guided-paths.json : identifiants, dépendances, ouvertures, conditions réelles,
   risques et annulation. Ne créer aucun nouveau signal moteur fictif.
6. QUESTIONS.md et HANDOFF.md : faits vérifiés/fichiers consultés, inconnues,
   nouveaux besoins moteur, fichiers produits et limites de validation.

Ce schéma est un FORMAT DE PASSATION PROPOSÉ, pas un importeur déjà existant :

```json
{
  "schema": "easyedu-guide-content-proposal-v1",
  "status": "proposal",
  "guideId": "student-management",
  "slides": [{
    "id": "read-participant-card",
    "legacySources": ["tutorialparticipantcardtitle"],
    "goal": {"fr": "Lire une carte avant d'agir", "en": "Read a card before acting"},
    "copy": {
      "fr": {"category": "Cartes", "navTitle": "Participant", "title": "Lire une carte participant", "intro": "…", "recap": ["…"]},
      "en": {"category": "Cards", "navTitle": "Participant", "title": "Read a participant card", "intro": "…", "recap": ["…"]}
    },
    "scene": {
      "recipe": "participant-card-inspection",
      "availability": "requires-integrator-confirmation",
      "actors": [{"id": "example-participant", "kind": "participant", "synthetic": true}],
      "initialState": "Example participant card, collapsed",
      "phases": [{
        "id": "inspect-details",
        "instruction": {"fr": "…", "en": "…"},
        "action": "Illustrate opening the card details",
        "desktop": "Use the real card action",
        "mobile": "Use its visible native compact equivalent",
        "revealTarget": "example-participant",
        "consequence": "No Moodle data changes",
        "pausePolicy": "freeze-current-phase",
        "skipPolicy": "finish-current-illustration-once",
        "readingDuration": "integrator-word-count-policy"
      }]
    },
    "interfaceTarget": {"semanticKey": "participantFirstCard", "ifAbsent": "Explain that the course has no visible participant"},
    "guidedPathId": null,
    "capabilitiesRequired": [],
    "businessMutation": false,
    "questions": []
  }]
}
```

Pour chaque étape de guided-paths.json : id, title/description FR/EN,
requiresStep, semanticTarget, desktop/mobile opener, completionMode,
EXISTING verified signal ou missingSignalRequirement, successCondition,
availableWhen, missingTargetFallback, mutationRisk, confirmationControl,
reviewEarlierPolicy et resetScope. Séparer observed/opened/selected/succeeded.
N'utilise pas d'indices de slides ou de sélecteurs CSS fragiles comme identité.

Toutes les scènes doivent prévoir : état initial/final, entrée/sortie, reveal
avant l'action visible, changement de slide/fermeture annulant le travail,
Pause/Play et phase suivante (nouveau besoin moteur), résultat statique accessible
en mouvement réduit et gestes mobiles adaptés. Aucun timing absolu qui impose
de lire vite ; garde un minimum et laisse le moteur calculer selon les mots.

## Critères de réception

- Chaque slide a un objectif utile, une intro contextualisée et un résultat clair.
- Doublons retirés sans oublier cartes/actions importantes ou conséquences.
- Parcours pertinents, dépendances explicites, données et droits requis déclarés.
- Les deux langues et tous les gestes mobiles sont cohérents avec la source.
- Pas de remplacement du moteur, nouveau CSS, mutation Moodle ou publication
  Penpot cachée. Les nouveaux contrôles G10 restent identifiés comme à développer.
- JSON valide ; aucune ellipse/exemple de ce prompt conservé dans la livraison.
- Donne le chemin exact de HANDOFF.md. La fenêtre intégration décidera de la
  conversion source, des composants/scènes manquants et de l'ordre de preview.
