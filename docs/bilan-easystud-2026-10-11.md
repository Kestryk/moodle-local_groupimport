# Bilan EasyStud — dernières tranches du 11 octobre 2026

Ce bilan accompagne les registres existants ; il ne les remplace pas. Une
preuve automatique, un fichier Penpot enregistré et la validation humaine sont
des états différents. La checklist humaine demandée reste ouverte.

## Changements réalisés depuis le dernier point d'avancement

- **Modales de cartes** : à l'ouverture, le clavier entre dans la modale ;
  Échap ferme et rend le focus au véritable bouton d'origine. Dix-huit cas
  Participant/Groupe/Groupement, français/anglais et trois largeurs sont vérifiés.
- **Guide au-dessus de Moodle** : les commandes natives du tiroir Moodle ne
  recouvrent plus le Guide ; elles retrouvent leur état après sa fermeture.
- **Mass Import** : correction du centrage de l'action de prévisualisation et
  de la note associée, en tenant compte des vraies lignes de formulaire Moodle.
  Six cas de mise en page sont vérifiés, sans modifier les pieds de modale.
- **Libellés français** : cinq corrections d'accents, dont les paramètres
  avancés et les messages de fichiers ; six ouvertures de modales sont vérifiées.
- **Titres de cartes** : adoption de la graisse600 choisie par Kevin, sans
  changer leur taille14px, couleur#264861 ni la police héritée. Trente sources
  Foundations et104 titres liés EasyStud sont enregistrés ;72 états natifs
  sont vérifiés. La suite de l'harmonisation des cartes n'est pas close.
- **Espacement des introductions du Guide** : restauration des24px prévus
  dans Foundations entre la note de sécurité et le contenu suivant. Dix-huit
  cas français/anglais, mouvement normal/réduit et trois largeurs sont vérifiés.
- **Bandeau des démonstrations** : mode Ajouter/Déplacer, Démarrer, instruction
  et commandes de lecture sont réunis. Le résultat prévu est annoncé avant
  Démarrer ; le compteur suit les étapes réelles. Pause/Suivant sont cachés au
  repos, les choix sont bloqués pendant la lecture, Réinitialiser revient à
  l'état prêt. Les cartes et animations existantes restent intactes.
- **Libellés étroits du bandeau** : l'inspection visuelle a révélé le rognage
  des deux modes français malgré le premier test de cadre réussi. Un test plus
  strict reproduit le défaut ; le correctif partagé conserve les tailles et
  passe les boutons sur plusieurs lignes si leur texte l'exige. Deux exemples
  liés sont enregistrés dans Penpot. Le correctif est servi et les six cas
  natifs français/anglais, desktop/tablette/mobile passent, avec captures
  inspectées. Preuve : `testing/guide-scene-header-2026-10-11.json`.

Ces modifications sont portées par les recettes du Kit et les classes/templates
consommateurs. Aucun style inline Mustache ou correctif SCSS privé n'a été
ajouté pour cette tranche. Ce constat ne prétend pas achever l'audit de tout le
code historique. Les changements sont servis uniquement en preview locale.

## Suite prioritaire : finir le Guide

1. **T008** : placer chaque explication dans un ordre lisible — titre/intention,
   démonstration, points à retenir, puis parcours — et supprimer les répétitions.
2. **T012** : ouvrir proprement le récapitulatif en fin de démonstration avec
   Motion et faire défiler au bon endroit pour montrer les appartenances finales.
3. **T013** : alléger le cadre du Guide, déplacer le compteur de slides dans
   le pied et adapter le sous-titre aux petites largeurs, sans perdre la progression.
4. **T014** : compléter les illustrations de la première slide avec Pause,
   lecture et plein écran ; elles expliquent les commandes, sans faux exercice.
5. **T015** : repasser toutes les scènes, tailles, langues et modes de mouvement,
   dont résultat visible à1280×800, clavier, Échap et retour du focus.
6. Conserver séparément les vérifications encore ouvertes : première visite
   réellement éligible, reset global confirmé, longs tooltips, progression après
   de vraies actions métier et validation humaine. Ne pas modifier les données
   du cours ou réinitialiser les utilisateurs pour fabriquer une preuve visuelle.

## Après le Guide : lots toujours conservés

- **Student Management** : composition des trois vues desktop, marge commune,
  gouttière, proportions des colonnes, alignement en vue complète et lecture des
  membres. Choix conteneur/viewport A2 encore à trancher avant les nouveaux ratios.
- **Contrôles/cartes** : compteurs et étiquettes, pagination plus discrète,
  compact/full, œil mobile, hover Cancel, sticky Clear selection, palette des
  pop-ups/toggles et identité bleue des participants après restauration.
- **Filtres** : dernier contrôle de fluidité More Filters, hauteur Reset,
  disposition toggle/Reset et largeur minimale des dropdowns. Des sous-correctifs
  sont déjà servis : ne pas les confondre avec une validation de l'ensemble.
- **Groupes** : proposition discrète Tout sélectionner pour les membres,
  auto-scroll drag plus précoce. La désélection au repli possède déjà sa preuve
  native, mais la validation humaine reste ouverte.
- **Mass Import** : publier la petite tuile28px choisie, revoir densité et
  proportions, formats acceptés, palette, historique et prévisualisation ouverte/
  repliée à partir d'un fichier existant. Le garde-fou sans fichier est déjà
  servi/vérifié ; le centrage ne signifie pas que toute la vue est terminée.
- **Administration/Kit** : harmonisation restante des modales, dropdowns,
  color picker/palette persistée, typographie et skeletons locaux intelligents.
- **Qualité/livraison** : performance, accessibilité, refactorisation documentée,
  séparation distribution SCSS/interne, stratégie de renommage compatible et
  méthode réutilisable pour Course Banner Builder. Aucun changement CCB autorisé
  implicitement par ces travaux EasyStud.
- **Audit Claude global** : revue interface reçue et intégrée en61 tâches ;
  audit complet du code et de tous les fichiers agent toujours distinct et ouvert.

## Registres détaillés

- `testing/claude-interface-review-intake-2026-10-11.json` : état des61 tâches
  Claude, décisions, preuves natives et validation humaine séparées.
- `testing/student-feedback-intake-2026-10-10.json` : les33 retours additionnels,
  avec leurs liens aux lots antérieurs et leurs sous-portées déjà vérifiées.
- `student-management-completion-queue-2026-10-03.md` et ses successeurs : anciennes
  demandes SM, Administration, Mass Import, Kit et historique de récupération.
- `guide-engineering-projection-2026-10-11.md` : projection actuelle du Guide,
  sans effacer les preuves anciennes ou clôturer la checklist humaine.

L'ordre reste Guide d'abord, puis Student Management/Mass Import et les lots
transverses. La checklist de validation finale sera consolidée au moment demandé.
