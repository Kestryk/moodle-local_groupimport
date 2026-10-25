# Decisions des contrats historiques â€” 25 octobre 2026

Base: `1cc0eba5`. Douze retraits, dix contrats mixtes conserves en doute. Aucun attendu fonctionnel restant ni garde de securite modifie. Les scripts retires restent consultables avec `git show 1cc0eba5:tools/release/<nom>`; les blobs exacts sont repertories ci-dessous.

Le retrait concerne une API volontairement retiree ou une preuve de delta strictement ponctuel, pas le comportement utilisateur qui avait motive le lot. Une identite integrale de moteur/fichier autour dune seule modification nest pas une invariance de HEAD apres I3/T055/I9, Motion M3 et la migration du curriculum. Les tests mixtes gardent leurs FAIL et requierent un lot de separation explicite.

| Script | Decision | Justification | Blob historique |
|---|---|---|---|
| `test-card-modal-keyboard-preservation.cjs` | KEEP_DOUBT | Conserver: focus/Echap restent requis. Le script melange une ancienne reconstruction monolithique et des assertions de comportement; elles ne doivent pas disparaitre avec le gel source. | `0f092deb8a0ac66f3f50fde565db3bb3c7f91784` |
| `test-card-selection-keyboard-source.cjs` | KEEP_DOUBT | Conserver: acces clavier natif des checkbox reste requis; la couverture actuelle ne suffit pas a justifier le retrait du controle historique des exclusions tabindex. | `0a6774eb2e9db978b60e296f7159dac789249753` |
| `test-dialog-palette-preservation.cjs` | RETIRE | Le contrat exige cinq blocs de peinture et la reconstitution du styles.css monolithique. I9 (07350e8a) a intentionnellement remplace ce fichier par un point entree vide et des CSS par page; la recette de cinq blocs dans ce fichier nexiste plus. Les contrats courants de palette restent. | `af35e17dd78a8d08395b0218836d14c3ff200dd2` |
| `test-filter-choice-shared-motion.cjs` | KEEP_DOUBT | Conserver: quatre familles de filtre et injection de la vraie dependance Motion restent valides; migration de la fixture a separer du gel historique. | `7a5bf04d438b5b04f638f9ef40ae725bac47f0ad` |
| `test-filter-reset-field-peer-consumer-preservation.cjs` | KEEP_DOUBT | Conserver: verification directe montre que filter-reset-field-peer existe toujours et utilise scale M (38px). La premiere hypothese de retrait total de cette recette etait fausse. La garde de geometrie et de cible tactile est valide; seule lidentite de lancien fichier global est perimee. | `1ae73fd3df1ad920d78f3e876d4751e035321e9c` |
| `test-filter-track-focus-consumer-preservation.cjs` | KEEP_DOUBT | Conserver: le modificateur track-focus et ses etats sont toujours exposes par le Kit. Une preuve de focus et une preuve de non-modification geometrique restent necessaires; le gel CSS historique ne suffit pas a justifier leur suppression. | `9428d4087e6d5152ea21de7f79ffe898b2121806` |
| `test-guide-chrome-preservation.cjs` | KEEP_DOUBT | Conserver: Desktop32, piste 4px, cascade ordonnee et parite Kit sont toujours requis; la part historique seule ne justifie pas la suppression du script. | `b28dcf8243899a1768ffc65e8cf6ba890440e2ad` |
| `test-guide-header-palette-source.cjs` | RETIRE | Exige exactement un bloc de peinture dans styles.css et lidentite integrale du markup pre-adoption. I9 (07350e8a) et I3 (c37fa3d0) retirent intentionnellement ces emplacements. Le contrat de palette courant test-guide-header-palette.cjs est conserve. | `2e81c6869a233f3d9904eeb455870ca9fc518cfc` |
| `test-guide-introduction-t014-preservation.cjs` | RETIRE | Reconstitue les moteurs complets et le CSS integral du snapshot T014 (7332375/cb9edab), avec une seule donnee et une chaine nouvelles. I3 (c37fa3d0), I9 (07350e8a) et la migration du curriculum rendent intentionnellement cette API de source unique caduque; le contrat dintroduction actuel est conserve. | `c1cfce836179191e07b33c9b87b4774395703d27` |
| `test-guide-pending-highlight-source.cjs` | KEEP_DOUBT | Conserver: assertion sourcesContent absent protege la confidentialite des sources publiques; ne pas retirer ce garde avec la reconstruction historique AMD. | `d3432d9a959d47cde52673912baa9b5693789d10` |
| `test-guide-recap-t012-preservation.cjs` | RETIRE | La preuve T012 ne permet quun pont recap ajoute a 78d7dd5/dbaa237 et exige le reste du moteur/CSS/markup identique. Le moteur et le CSS ont ensuite ete distribues via I9 et Motion M3, et les recaps ont ete modifies par K20-17b. Les deux contrats de comportement recap T012 sont conserves (PASS lors du lot precedent). | `bea324016659cb7166625a9037f907b71dcc74ab` |
| `test-guide-review1-preservation.cjs` | RETIRE | Preuve ponctuelle de la recette Review1: masque un seul bloc de moteur/CSS puis exige le curriculum entier de 6b3cd59. Les donnees ont ete deplacees par I3 et le curriculum a volontairement evolue. Le test Review1 compact courant reste FAIL, sans suppression ni changement de ses attendus. | `a1d01ee8bac9fb76d7f4c496af06d201aa5d3741` |
| `test-guide-review2-mobile-complete-lane-preservation.cjs` | RETIRE | Variante de la preuve ponctuelle Review2 mobile: moteurs figes a 5188f61/9407d02, une seule legende ajoutee et comparaison integrale du styles.css monolithique. I9 (07350e8a) et les evolutions de curriculum rendent volontairement ce protocole caduc. Les contrats de confinement/geometrie mobiles et le contrat Review2 mixte sont conserves. | `fbb6c017cf4c72d109de81b2fd6bbbbaca6f2aa5` |
| `test-guide-review2-mobile-fit-preservation.cjs` | RETIRE | Variante de la preuve ponctuelle Review2 mobile: moteurs figes a 5188f61/9407d02, une seule legende ajoutee et comparaison integrale du styles.css monolithique. I9 (07350e8a) et les evolutions de curriculum rendent volontairement ce protocole caduc. Les contrats de confinement/geometrie mobiles et le contrat Review2 mixte sont conserves. | `c04e00186ea2693a7ab336260996f915e2fe36ca` |
| `test-guide-review2-mobile-lane-preservation.cjs` | RETIRE | Variante de la preuve ponctuelle Review2 mobile: moteurs figes a 5188f61/9407d02, une seule legende ajoutee et comparaison integrale du styles.css monolithique. I9 (07350e8a) et les evolutions de curriculum rendent volontairement ce protocole caduc. Les contrats de confinement/geometrie mobiles et le contrat Review2 mixte sont conserves. | `1a7aaeeaacf26ed496040363dc3895aded8e5301` |
| `test-guide-review2-mobile-preservation.cjs` | RETIRE | Variante de la preuve ponctuelle Review2 mobile: moteurs figes a 5188f61/9407d02, une seule legende ajoutee et comparaison integrale du styles.css monolithique. I9 (07350e8a) et les evolutions de curriculum rendent volontairement ce protocole caduc. Les contrats de confinement/geometrie mobiles et le contrat Review2 mixte sont conserves. | `d54d2a5e15e605d926bc909c96770db3a9757183` |
| `test-guide-review2-preservation.cjs` | KEEP_DOUBT | Conserver: contient des contraintes de duree, orientationchange, retour a la ligne et version Kit encore valides. La comparaison entiere ne prouve pas leur obsolescence. | `c019c0195007c99eca94dc42cfe30109d3ca1220` |
| `test-guide-scene-header-preservation.cjs` | RETIRE | Reconstitue exactement le moteur precedent 261b692f et gele course_manager/motion au commit f71ab2e. Ce protocole dune seule intervention ne sapplique plus apres lextraction T055 phase 2 du manager (4cbc0c03), Motion M3 et les nouvelles recettes de scene. Les contrats scene-header de rendu et les contrats Motion restent. | `097694b1199678fe0c232106d5d68be670b85fea` |
| `test-guide-t037-finished-preservation.cjs` | KEEP_DOUBT | Conserver: peinture finale accent/graisse encore litigieuse (finished-paint echoue); supprimer ce contrat pourrait masquer un vrai defaut de rendu. | `1ebe1264fe5096d493da7f72b1f42f2bd7b17773` |
| `test-mass-report-palette-preservation.cjs` | RETIRE | Exige sept blocs de peinture dans styles.css et la reconstitution integrale du fichier avant SM-64. I9 (07350e8a) a intentionnellement remplace cette API par mass-import.css; les classes de rapport sont maintenant definies dans leurs composants. test-mass-report-semantic-palette.cjs est conserve. | `6764c1898eeca8665726316fa94d33c20c04bb58` |
| `test-participant-panel-title.cjs` | KEEP_DOUBT | Conserver: libelles FR/EN et navigation compacte restent valides. I3 a deplace leur producteur; le gel complet historique ne doit pas entrainer leur disparition. | `70de8ab4b4046d6d68b5d30fa928852a26828429` |
| `test-view-icon-transition-preservation.cjs` | RETIRE | Exige un seul ajout dans styles.css puis egalite complete avec lancien bundle, et lunique ajout dun modificateur dans un template monolithique. I9 et les templates distribues ont retire ces supports. Les contrats actuels view-toggle et Motion ne sont pas supprimes. | `f7dec43037134b5da3d88fdb858a2b3d64c0d6b6` |

## Comptage et garde de non-regression

Les 225 scripts initiaux restent repertories dans la preuve externe. Un retrait documente est compte RETIRED, jamais PASS. Le total actif est 213 avant tout nouveau script; les 84 PASS precedents doivent etre conserves et les 12 retraits sont tous issus des anciens FAIL. Le cas natif tactile 24/44 px demeure hors perimetre et inchange.

Les preuves de sources/gels historiques restantes ne sont pas rebasees artificiellement. Aucun changement de produit et aucune publication dans ce lot. Aucun CHANGELOG: tests et documentation seulement.

## Reparation de harnais a contrat constant

`test-guide-move-context.cjs` lit les cibles PHP dans
`classes/output/guide_config.php`, leur producteur depuis I3 (c37fa3d0), au lieu de
`manage.php`. Toutes les assertions restent identiques. Les six cas du vrai opener
et toutes les assertions de contexte, de disponibilite et de sortie sont conserves.

## Decisions et preuves

- Distribution CSS : 07350e8a; `styles.css` est un point entree vide et les
  declarations sont dans les feuilles par page. Les contrats de cascade restent.
- Constructeurs PHP extraits par I3 : c37fa3d0.
- Manager JS distribue en modules T055 phase 2 : 4cbc0c03.
- Les fichiers retires ne sont importes ni appeles par un autre script sous tools/.
- La liste externe decisions-22.json contient les decisions et les blobs exacts.

Aucun cache, changement Motion, droit, metier ou code produit. Aucune modification
du cas natif tactile 24/44 px. Les FAIL mixtes ne sont pas qualifies de bugs produit
confirmes sans preuve native. Le CHANGELOG ne change pas: tests/documentation seuls.


## Qualification complémentaire du 25/10

Les sept décisions restantes sont détaillées dans [seven-contracts-2026-10-25.md](seven-contracts-2026-10-25.md). Quatre contrats sont réparés. Le contrat T037 finished-preservation est retiré après preuve du remplacement explicite accent/700 par K17-33 (`b86b564883ed91f5a19526f464125e8f543dc5f4`), blob `1ebe1264fe5096d493da7f72b1f42f2bd7b17773`. Les deux gels Guide chrome/Review2 restent FAIL, non retirés : six fichiers SCSS et le moteur du Kit divergent encore du miroir consommateur. Les décisions ci-dessus sont le relevé historique initial ; ce paragraphe et le catalogue portent leur statut courant. Total retiré : 13 ; aucun retrait compté PASS.