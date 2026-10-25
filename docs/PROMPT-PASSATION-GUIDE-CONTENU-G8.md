# Prompt de passation — conception des parcours Guide EasyStud

Tu prends en charge la conception du contenu et des parcours, pas le moteur
Guide ni son intégration Moodle. La fenêtre d’intégration gère Kit, composants,
animations, progression, accessibilité et preview. Ne modifie pas ses worktrees
ni son runtime. Toute écriture Penpot partagée exige un canal et une propriété
confirmés ; une autre fenêtre ouverte ne garantit pas l’isolation MCP.

Problème identifié : certaines slides démarrent une animation sans annoncer ce
qu’elle démontre. Pour Organisation, expliquer AVANT de démarrer la différence
entre Ajouter et Déplacer, leur contexte et leurs conséquences. Une commande
qui affecte des membres déjà dans un groupe n’est pas équivalente au bouton
Move participants de la liste principale, qui ajoute une appartenance sans
effacer les autres groupes. Vérifier les commandes réelles avant toute promesse.

Livre des propositions structurées en Markdown + JSON UTF-8, sans code produit,
CSS, HTML brut, faux succès AJAX ni nouvelle animation imposée. Une slide doit
avoir un objectif explicite, une phrase introductive compréhensible, une scène
avec acteurs/état initial/actions/résultat, un récapitulatif et les limites de
la démonstration. Distinguer simulation, exercices réels facultatifs et lecture.

Contrat suggéré (clés stables, textes français et anglais séparés) :

```json
{
  "schemaVersion": 1,
  "pathId": "proposal-stable-id",
  "status": "proposal-not-integrated",
  "audience": "teacher",
  "prerequisites": [],
  "slides": [{
    "slideId": "compare-membership",
    "title": {"fr": "Ajouter ou déplacer ?", "en": "Add or move?"},
    "intro": {"fr": "Comparez les conséquences sur les appartenances.", "en": "Compare the membership consequences."},
    "learningGoal": "Know which existing memberships are preserved",
    "sceneKind": "membership",
    "initialState": {"sourceGroup": "Projet Orion", "destinationGroup": "Projet Horizon", "participants": ["Alex", "Léa"]},
    "comparisons": [{"commandContext": "members-within-group", "action": "move", "consequence": "remove source membership, retain unrelated memberships"}],
    "stepsToRemember": [],
    "mobileAlternative": "Select members and use card actions, no right-click or drag",
    "simulationNotice": "Illustration only; no Moodle data changes",
    "nativeTargetKey": "viewGroups"
  }],
  "checklist": [{
    "stepId": "choose-destination",
    "requiresStepId": "open-move",
    "targetKey": "participantMoveDestination",
    "completionSignal": "explicit-valid-native-destination-change",
    "businessWrite": false,
    "description": {"fr": "Recherchez et choisissez le groupe.", "en": "Search and choose the group."}
  }]
}
```

Utilise les clés sémantiques connues (viewParticipants, viewGroups,
participantSelectionInput, participantMoveAction, participantMoveDestination,
participantMoveConfirm, groupCreateInput). Si une cible manque, marque-la
`needsAdapter`, ne devine pas de sélecteur ni de signal de succès. Précise si
un élément disparaît quand on revient sur une étape antérieure et comment
l’enseignant peut le réouvrir, sans commande automatique d’écriture.

Fournis aussi : parcours court conseillé, chemins facultatifs, prérequis et
verrouillages, différences téléphone/tablette/ordinateur, autorisations Moodle,
risques et annulation. Les exercices réels changent des données UNIQUEMENT sur
confirmation utilisateur ; Reset du Guide ne supprime aucun groupe/participant.
Le guide Mass Import est un curriculum distinct. Le prototype à quatre slides
n’est pas l’intégralité du programme. Conserve les propositions non intégrées.

Pour la passation finale, liste fichiers/revision, IDs stables et éventuelles
planches Penpot, points ouverts et correspondance avec les capacités existantes.
Ne qualifie ni une proposition ni une maquette de parcours installé/validé.
