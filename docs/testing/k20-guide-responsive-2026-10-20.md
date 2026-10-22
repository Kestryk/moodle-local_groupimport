# K20-01 / K20-02 — 20 octobre 2026

Base Claude lue : 0ea1977f. Travail seulement dans les branches dédiées
work/codex1/easystud-k20-guide-20261020 et work/codex1/easyedu-kit-k20-guide-20261020.
Aucune écriture dans la branche Claude, aucun runtime Moodle, aucune publication.

## Résultat mesuré

| Cas | Fermer / Réagrandir avant | Après | Recouvrement avant | Après | Pied |
|---|---|---|---|---|---|
| fr 768 | 44 / 30.390625 px | 44 / 44 px | 47.391 px | 0 px | 64 px |
| fr 390 | 44 / 30.390625 px | 44 / 44 px | 64.000 px | 0 px | 64 px |
| en 768 | 44 / 30.390625 px | 44 / 44 px | 47.391 px | 0 px | 64 px |
| en 390 | 44 / 30.390625 px | 44 / 44 px | 64.000 px | 0 px | 64 px |

Les cibles, fonds, bordures, rayons et couleurs des glyphes sont identiques.
Le rayon calculé est11,52px ; l'écart maximal de centrage est0,008px (<0,5).
Les boutons du bandeau et Précédent/Suivant passent leurs tests elementFromPoint,
avec les deux commandes de navigation réellement activées (diapositive2).
Le bandeau prend sa hauteur naturelle :56,391px à768 et96,781px à390 ; le pied
garde ses64px et le contenu central cède la place. Aucun offset fixé à sa hauteur.
Quatre cas FR/EN ×768/390 hasTouch : PASS,0console/page errors, aucun clavier simulé.

## Source et définition Kit

K20-01 (80bce9e0441d7a8f8dfcecb935f0747046ac5ea8) : les actions Réagrandir/Réduire consomment close-button
avec glyph=false. La variante conserve le glyphe expand/minus et prend le même
Desktop/Touch frame et la même peinture que la croix. La définition Kit impose
currentColor aux glyphes alternatifs pour ne pas hériter d'une ancienne encre
du Guide. Aucun style ad hoc dans un écran produit. Le pendant Kit este949375d7026c5651fb72f716b33ffc7daea0053.

K20-02 : footer-stack est la dernière rangée auto de la grille existante. Un
slot se place au-dessus du pied. placeResume déplace le MÊME élément vivant dans
ce slot à l'ouverture ; à la fermeture il retourne dans la racine, à son ancienne
position flottante. L'invitation est également placée lors de son offre. Aucun
clone, nouveau listener, minuteur ou modification de l'état de parcours.
Les handlers, la pause de l'expiration et les noms accessibles sont conservés.
La recette ouvre, ferme puis rouvre la modale avec l'invitation en attente et
vérifie sa visibilité extérieure, puis utilise le vrai handler Reprendre.

Le moteur partagé, le miroir embarqué, le gabarit runtime et le gabarit canonique
reçoivent les mêmes ajouts. La SCSS Discovery canonique reprend aussi la dérive
K19-03 déjà validée sur la base (ancien bouton de fin supprimé), nécessaire pour
ne pas la réintroduire au prochain sync. Aucun changement K19-03 dans le plugin.

## Contrôles et limites explicites

- Builds Guide AMD/map et styles conservative : PASS, Node22.11.0/Sass1.79.1.
  Deux feuilles actives changent (Guide/Student Management), styles globaux0règle.
- MoodleCS complet PHP :0erreur,27avertissements hérités. Aucun PHP modifié.
- Les SCSS/Mustache contrôlés ne sont pas du PHP :0erreur, avertissement
  Internal.NoCodeFound du scanner. Le parseur Mustache et Sass passent.
- ESLint du moteur Guide :41erreurs /475avertissements AVANT et APRÈS, sans hausse.
  Ce n'est PAS une validation JavaScript globale à0erreur. Les erreurs existantes
  sont20curly,8jsdoc/require-param,10max-len et3no-unused-vars. Pas d'exclusion ni
  d'ignore ajouté ; leur nettoyage hors correctif n'a pas été entrepris.
- Une tentative de PHPCS incluant directement l'ancien AMD JavaScript constate
  5888erreurs héritées de son format (notamment2espaces/CRLF). Journal conservé ;
  aucune revendication que ce fichier passe ce scanner historique à0erreur.
- T037, T038, escaping et filter-engine : PASS.
- Guide roundtrip : ÉCHEC préexistant, reproduit sur la base0ea1977f et le Kit
  d9dd475. L'adaptateur runtime et la source partagée divergeaient déjà ; aucun
  test affaibli et aucune ancienne preuve modifiée pour masquer cet écart.
- La recette est ISOLÉE : vrais gabarit/programme/moteur/CSS, route HTTP en mémoire,
  aucune authentification Moodle, service ou base. Les cibles métier du cours
  sont absentes ; le bouton Réduire caché de l'état responsive est invoqué via
  son handler DOM pour comparer l'autre état, sans injection de classe.
- Les premiers échecs de harnais sont archivés : export ES Mustache, attente
  erronée que Reprendre ferme la modale, test de clic de Précédent désactivé en
  première diapositive, et mélange temporaire CSS K20-01 / markup K20-02 pendant
  l'amendement non poussé. La passe verified utilise les actifs cohérents finaux.
- Compatibilité4.5 : aucune API Moodle nouvelle, même module AMD et contrats
  publics. Aucun test natif4.5 n'est revendiqué. Aucune interaction Penpot/CCB.

Preuves : <workspace>/artifacts/k20-guide-20261020/verified/results.json et4captures,
baseline-05/results.json, gates.json, eslint-final.json, moodlecs-php.json.
Scénario versionné : tools/release/test-k20-guide-responsive-browser.cjs.

## Report Penpot

Checklist responsive : Fermer/Réagrandir/Réduire = Kit Touch44, même cadre,
peinture et encre de glyphe ; croix et expand restent distincts sémantiquement.
Guide responsive : bandeau Reprendre/Annuler dans une rangée à hauteur naturelle
au-dessus du pied64px. Pas de valeur de décalage fixe à reporter.

## Registre intake déjà invalide dans la base

student-feedback-intake-2026-10-10.json contient déjà des marqueurs <<<<<<< HEAD dans0ea1977f (ligne1759). Fichier laissé strictement intact. Les deux entrées sont livrées séparément dans docs/testing/k20-intake-additions-2026-10-20.json pour fusion par Claude après sa réparation. Aucun conflit de ce lot n’a été résolu.

### Parité bornée des gabarits

Les gabarits canonique et embarqué avaient aussi une dérive préexistante (leurs versions HEAD respectives diffèrent déjà). Seule la même insertion footer-stack / resume-slot est ajoutée aux trois gabarits ; après retrait de ces3lignes, chacun est strictement identique à son propre prédécesseur. Aucune prétention de parité intégrale ou de sync global PASS. Le helper placeResume est identique dans les trois moteurs ; la SCSS Discovery et buttons est entièrement identique entre Kit et consommateur.
