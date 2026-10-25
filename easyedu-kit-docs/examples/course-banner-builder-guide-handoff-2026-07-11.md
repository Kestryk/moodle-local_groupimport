# Course Banner Builder Guide Handoff - EasyEdu Kit

Use this prompt in the Course Banner Builder Codex window.

```text
Tu travailles sur le plugin Moodle Course Banner Builder.

Objectif :
Synchroniser l'integration du guide EasyEdu avec la derniere version du kit
`easyedu-ui-kit`, sans casser les principes deja mis en place dans Course
Banner Builder, notamment les slides verrouilles, les unlock paths, les etapes
de checklist bloquees et les etapes qui ne doivent se valider que par une
action reelle.

Repo kit de reference :
`C:\dev\easyedu-ui-kit`

Plugin cible :
`C:\dev\Moodle 51\MoodleWindowsInstaller-latest-501\server\moodle\local\course_banner_builder`

A lire avant toute modification :
- `C:\dev\easyedu-ui-kit\docs\components\guide.md`
- `C:\dev\easyedu-ui-kit\guide\amd\src\easyedu_guide.js`
- `C:\dev\easyedu-ui-kit\guide\templates\easyedu_guide.mustache`
- `C:\dev\easyedu-ui-kit\scss\easyedu\components\_guide.scss`
- `C:\dev\easyedu-ui-kit\CHANGELOG.md`

Changements recents du kit a reprendre :

1. Return to guide panel
- Le panneau `easyedu-guide-interface-return` doit utiliser la structure du
  template du kit :
  - `.easyedu-guide-interface-return__text`
  - `.easyedu-guide-interface-return__actions`
  - `.easyedu-guide-interface-return__button`
  - `.easyedu-guide-interface-return__dismiss`
- Ne pas recreer une flex row locale.
- Le layout desktop est une grille `minmax(0, 1fr) max-content`.
- Le texte ne doit jamais passer sous le bouton.
- Le bouton doit utiliser le libelle `guidereturnbutton`, par exemple
  `Return to guide`.
- Le titre du panneau peut rester brande, mais ne doit pas etre utilise comme
  libelle du bouton.

2. Layering / z-index
- Le highlight `.easyedu-guide-highlight` doit rester sous la navigation Moodle
  fixe.
- Contrat attendu :
  - highlight sous la nav Moodle principale ;
  - return panel au-dessus du contenu ordinaire ;
  - guide modal au-dessus de la page ;
  - guided checklist au-dessus des highlights.
- Ne pas monter le highlight au-dessus de la nav Moodle pour corriger un souci
  local.

3. Smooth checklist focus
- Le focus checklist ne doit plus utiliser de scrolls natifs concurrents.
- Le kit utilise une animation `requestAnimationFrame` via `animateScrollTo`.
- Le guide scrolle d'abord les panneaux internes scrollables, puis aligne la
  page.
- Ne pas ajouter de `scrollIntoView({block: "center"})` local.
- Apres Ajax, transition, ouverture de panneau ou changement d'etat UI,
  declencher :
  `document.dispatchEvent(new CustomEvent('easyedu:guide-refresh-highlight', { detail: { target: '...', dock: true } }))`

4. Guided path cards
- Les blocs `easyedu-guide-guided-card` doivent avoir la meme largeur que les
  blocs explicatifs/visuels.
- Ne pas ajouter d'override local qui reduit `max-width` sous celui du kit.
- La surface verte guidee vient du mixin `guide-guided-path-card-surface`.
- La bordure verte laterale n'est plus le signal principal : preferer le fond
  renforce et l'animation d'apparition fournis par le kit.

5. Minimized checklist
- Quand la checklist est minimisee, le bouton de fermeture doit disparaitre.
- L'etat compact doit montrer l'etape active et le compteur visite.
- Ne pas remettre une croix persistante en mode minimise.

6. Slides verrouilles / unlock paths : a preserver absolument
- Le kit conserve les contrats Course Banner Builder :
  - `requires`
  - `requiresbadge`
  - `requireslabel`
  - `requirestitle`
  - `requirescontent`
  - `unlockpath`
  - `unlocklabel`
  - `.easyedu-guide-slide__locked`
  - `.easyedu-guide-slide__unlock`
  - `unlockPaths`
- Une slide verrouillee doit :
  - recevoir `is-locked` ;
  - etre sautee par Next/Previous et clavier ;
  - rester ouvrable au clic direct sur sa vignette ;
  - afficher le panneau verrouille ;
  - proposer un unlock path si defini.
- Ne pas supprimer ou simplifier ces hooks en important le kit.

7. Checklist locked steps : a preserver absolument
- Les etapes de checklist peuvent utiliser :
  - `requiresStep`
  - `requires`
  - `requiresLabel`
  - `completionMode`
  - `completeOnClick`
  - `waitForCompletion`
- Une etape bloquee doit recevoir :
  - `is-locked`
  - `aria-disabled="true"`
  - `data-easyedu-guide-lock-message`
- Le message de blocage doit expliquer quelle etape precedente doit etre faite.
- Une etape d'action ne doit pas etre completee juste parce que l'utilisateur
  clique sur la checklist.

8. Targets et highlight
- Utiliser `target` pour l'action reelle.
- Utiliser `highlightTarget` ou `showTarget` pour la zone visuelle la plus
  claire.
- Les targets peuvent etre des tableaux de selecteurs ; le kit choisit le
  premier visible.
- Eviter de cibler des tableaux vides, des onglets de navigation ou des titres
  generiques quand un wrapper de controles existe.
- Les sequences `open` peuvent contenir plusieurs actions et doivent ouvrir le
  bon panneau/champ avant d'appliquer le highlight.

9. Template attendu
- Verifier que `templates/easyedu_guide.mustache` cote Course Banner Builder
  correspond au template riche du kit.
- Le template doit contenir :
  - navigation riche ;
  - `data-easyedu-guide-requires` ;
  - bloc `.easyedu-guide-slide__locked` ;
  - bouton `.easyedu-guide-slide__unlock` ;
  - interface return panel complet ;
  - guided checklist complet ;
  - message de checklist complet ;
  - bouton `Return to guide` issu de `guidereturnbutton`.

10. Animations et scenes pedagogiques
- Conserver les scenes animees du kit :
  - clic de menu contextuel ;
  - drag and drop ;
  - apparition de boites ;
  - actions rapides ;
  - formules de creation ;
  - surfaces gradient centrees.
- Ne pas desactiver ces scenes par un override local. Si les animations ne
  s'affichent pas, verifier aussi les preferences systeme `reduced motion`.

11. Validation obligatoire
- Compiler SCSS.
- Verifier AMD source/build.
- Purger caches Moodle.
- Tester visuellement avec Playwright :
  - le panneau Return to guide ne chevauche pas son bouton ;
  - le highlight reste sous la nav Moodle ;
  - les slides verrouillees restent verrouillees ;
  - les unlock paths demarrent la checklist attendue ;
  - les etapes bloquees restent disabled tant que l'etape requise n'est pas
    faite ;
  - les deplacements de focus checklist ne sautent pas trop bas ;
  - la checklist minimisee ne montre pas la croix ;
  - les boutons `Show in the interface`, `Start guided path`, `Previous`,
    `Next` et `Return to guide` gardent les couleurs EasyEdu ;
  - les textes traduits ne sortent pas des cartes ni des checklists.

Ne commit/push rien sans validation explicite.
```
