# Suite 2 des contrats de qualite ? 25 octobre 2026

Base: 48b8a927. Aucun changement produit, AMD genere, style, donnee metier,
permission ou schema. Aucun changement du cas tactile natif 24/44 px.

## Trois contrats mixtes reparables

### test-card-modal-keyboard-preservation.cjs

La reconstruction integrale du manager contre 3d9dfe2 est une preuve ponctuelle
T041, caduque apres la distribution T055 phase 2 (4cbc0c03). Le helper est dans
local/cm/modal.js et non plus dans le manager. Retirer uniquement le gel de fichiers
entiers et ses anciennes bornes. Executer les declarations reelles de ce module
avec leurs dependances de focus; conserver tous les attendus Enter/Escape,
fermeture en cours, evenement deja traite, focus preventScroll et bouton disabled.
Le repli actuel du dialogue sans tab-stop recoit deux assertions supplementaires.
La verification du helper dans sourcesContent est conservee sur la vraie map
local/cm/modal.min.js.map, son producteur actuel. Aucune suppression de controle
clavier ou de preuve du module compile. Script conserve, pas compte RETIRED.

### test-filter-choice-shared-motion.cjs

La preuve ponctuelle contre 19ea9f8 ne peut exiger le manager entier identique
apres T055 (4cbc0c03). Retirer ce gel obsolete et son ancienne borne dans le
monolithe. Extraire bindSearchableFilters du vrai filters.js avec le parseur AST
existant, qui exige une declaration unique. Garder a lidentique les quatre familles,
leur injection du meme objet Motion, le libelle Clear, la variante compacte, la
visibilite du filtre role et la memorisation de chaque controleur. Script conserve.

### test-guide-pending-highlight-source.cjs

Le gel contre 49b840d autorisait une seule ligne dans tout le moteur. Les evolutions
legitimes du Guide et de sa facade lazy I10 (1c23b9e9) rendent ce gel caduc.
Garder lexpression de preservation de la cible dans les deux copies et executer
le diagnostic de file reelle existant. Garder toutes les assertions de map:
sources exactes, sourcesContent absent, nom AMD, egalite exacte du build et de la
map. Le wrapping attendu suit le vrai build-guide-amd.cjs courant, avec Motion et
Bubble, au lieu de lancienne fabrique AMD sans dependances. Aucun changement de
reference de comportement ou suppression du garde de confidentialite publique.

## Sept contrats mixtes toujours conserves en doute

- card-selection-keyboard-source: acces clavier toujours requis; un remplacement
  de la preuve de dix anciens checkbox doit executer les vrais producteurs actuels.
- filter-reset-field-peer-consumer-preservation: variante 38px toujours presente;
  il faut separer son contrat de la reconstruction du CSS global historique.
- filter-track-focus-consumer-preservation: etats focus toujours requis; meme
  separation necessaire, sans retirer le controle de non-modification geometrique.
- guide-chrome-preservation: Desktop32, accent et cascade ordonnee restent requis;
  leurs variantes et les checkpoints Kit doivent etre reconcilies.
- guide-review2-preservation: durees/orientation/wrapping encore valides; preuve
  mixte insuffisante pour retirer ces assertions.
- guide-t037-finished-preservation: peinture accent/graisse toujours litigieuse;
  conserver le FAIL et le contrat finished-paint pour qualification native.
- participant-panel-title: le producteur courant utilise get_string('participants')
  du coeur, pas layoutmodeparticipants; ne pas changer les attendus bilingues sans
  retrouver la decision de libelle. La relocation I3 seule ne suffit donc pas.

## Reproduction

Node 22.11.0; NODE_PATH vers les dependances de build existantes. Les scripts
restent des tests isoles, sauf ceux explicitement natifs. Les gels historiques
retires ci-dessus restent recuperables par git show 48b8a927:tools/release/<nom>.
Aucun script supprime. Aucun attendu de geometrie/couleur assoupli. Pas de ligne
CHANGELOG: tests et documentation seulement. Resultats du rejeu dans le rapport
externe RAPPORT-FIXTURES-SUITE2-20261025.md.

## Deux recettes natives debloquees

Les deux scripts acceptent maintenant les identifiants de processus du superviseur,
sans les enregistrer, en conservant le chemin de fichier secret historique comme
repli. Le contrat Assignment attend le renderer pret puis ouvre le Guide avant de
lire sa configuration: I10 charge cette configuration a la demande. Aucune assertion
de texte, geometrie ou couleur nest remplacee. La recette des controles utilise le
fichier avant-more-fr-1600.json historique, copie identique verifiee par SHA-256,
pas une nouvelle reference calculee depuis le candidat. Les deux recettes PASS sur
8052. Le wrapper Playwright exige le verrou exact de cette copie et conserve les
resultats hors depot. Les autres prerequis natifs absents restent documentes.

## Bilan du rejeu

215 scripts actifs: 92 PASS, 112 FAIL, 11 bloques, 0 timeout; aucun PASS
anterieur perdu. Trois des dix contrats mixtes sont repares, sept restent en
doute, aucun script nest retire. Deux scripts natifs auparavant bloques sont
rejoues avec succes; leurs matrices et limites sont distinguees dans le rapport.
Le cas tactile 24/44 px reste intact et non rejoue. Les prerequis des onze
scripts bloques sont listes individuellement dans les preuves externes.
Le rendement diminue: cinq gains sur cette passe; poursuivre par contrats cibles
et decisions produit plutot que par modification massive des oracles.
