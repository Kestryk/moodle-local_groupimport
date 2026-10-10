# EasyStud — nouveaux retours du 10 octobre 2026

Programme : EED-UI-2026-0073. Registre additif : **33 demandes distinctes**,
une ligne/un lot par demande. Les répétitions du collage, dont More Filters,
sont regroupées sans supprimer de portée. Les demandes déjà connues renvoient
aux anciens SM/G11 : leur historique et leurs preuves restent intacts, mais
le nouveau signal utilisateur impose une nouvelle vérification. Un ancien
PASS technique ne vaut pas validation du rendu signalé aujourd'hui.

Le détail complet de chaque demande, de sa portée et de ses critères est dans
`testing/student-feedback-intake-2026-10-10.json`. Les statuts initiaux concernent
ce nouveau retour, pas l'effacement d'une implémentation précédente. `approved`
signifie demandé/enregistré, pas développé, servi ou accepté visuellement.
R10-03 est `in_progress` pour un audit source seulement.

## Propriété et limites

- Fenêtre propriétaire : EasyStud/Kit actuelle, worktrees existants uniquement.
  Source : branche `work/port4719pg3/easystud-foundations-student-management-20260928`.
  Kit : branche `work/port4719pg3/eed-ui-2026-0073-kit-phase0-mass-admin`.
- Point de départ vérifié : Source6814f3c, Kit67d4475, runtime83dc8b.
  Le runtime n'est pas modifié par cette inscription.
- Priorité d'exécution utilisateur : **Guide d'abord**. P1 Guide décrit cette
  priorité de travail, pas un nouveau signal de perte de données/sécurité.
- Visuel partagé : Kit -> Foundations -> compositions produit Penpot ->
  classes du consommateur -> preview supervisée. Aucun offset/couleur/taille
  privé dans Mustache. Penpot répertorie recettes/états/layouts/animations,
  pas nécessairement chacune des slides finales.
- Pas de nouvelle branche/worktree ou d'agent parallèle. CCB est une destination
  future de la méthode, pas une autorisation de modifier son code maintenant.
- Promotion/cache/browser via les procédures et leases existants. Les audits
  ne sauvegardent pas de palette, n'importent pas de fichier, ne déplacent pas
  de membre, n'envoient pas de message et ne réinitialisent pas tous les users
  pour fabriquer une preuve.
- Les documents partagés de planification Platform et l'index EED restent à
  leur propriétaire. Ce registre est le backlink produit pour cette coordination.
- La checklist humaine combinée reste ouverte et reportée à la fin.

## Ordre pour les lots Guide

1. R10-01, portion Guide uniquement, puis R10-03 : palette des portails et barre.
2. R10-32 : bulles/tooltip partagé, nécessaire pour les titres de navigation.
3. R10-29 : première slide et représentations analogues, disposition lisible.
4. R10-31 : hiérarchie et mise en valeur cohérente des titres de slides.
5. R10-28 : trois points à diamètre/espacement constant, tous les états.
6. R10-30 : démarrage manuel des démonstrations et état En cours, toutes les
   animations concernées; préserver Pause/Play/Next et les vrais guided paths.
7. Reprendre les portes restantes du Guide : parcours membres FR/reduced,
   scènes entières/mobile, accueil/éligibilité et reset sans mutation globale,
   audit final des12 slides et checklist. Les18 cas d'éditeur déjà vérifiés
   restent acquis à leurs pins, ils ne closent pas ces nouvelles demandes.

La partie non-Guide de R10-01 attend avec les autres lots. R10-33 est alimenté
à chaque tranche; sa documentation ne justifie pas d'interrompre les corrections.

## Liste exhaustive et liens antérieurs

| Lot | Demande | Historique / dépendance | Priorité |
| --- | --- | --- | --- |
| R10-01 | Palette des pop-ups | SM-59 | P1 Guide / P1 autres |
| R10-02 | Fond des icônes du sélecteur de vue | SM-60 | P1 après Guide |
| R10-03 | Couleur de progression du Guide | SM-61 | P1 Guide |
| R10-04 | Désélection au repli d'un groupe | SM-62 | P1 après Guide |
| R10-05 | Tout sélectionner dans une carte groupe | SM-63 | P2 après Guide |
| R10-06 | Palette de Mass Import | SM-64 | P1 après Guide |
| R10-07 | Focus Groups without grouping | SM-65 | P1 après Guide |
| R10-08 | Hauteur du Reset de filtre | SM-66 | P2 après Guide |
| R10-09 | Étiquettes de résultats | SM-67 | P2 après Guide |
| R10-10 | Étiquettes des en-têtes de cartes | SM-68 | P2 après Guide |
| R10-11 | Fluidité More Filters | SM-69 | P1 après Guide |
| R10-12 | Clear selection dans le sticky | SM-70 | P2 après Guide |
| R10-13 | Disposition toggle et Reset | SM-71 | P2 après Guide |
| R10-14 | Bleu participant après restauration | SM-72 | P1 après Guide |
| R10-15 | Hover Cancel des ajouts par texte | SM-73 | P2 après Guide |
| R10-16 | Skeletons locaux intelligents | Nouveau / système Loading | P2 après Guide |
| R10-17 | Preview sans fichier | Nouveau / validation Mass Import | P1 après Guide |
| R10-18 | Œil mobile sur la première ligne | Réouverture / SM-48 | P1 après Guide |
| R10-19 | Contenu compact participant mobile | Réouverture / SM-50 | P1 après Guide |
| R10-20 | Contrôle compact/full plus discret | Réouverture / SM-50 | P2 après Guide |
| R10-21 | Titre Participants & groups | Nouveau / titre de colonne | P2 après Guide |
| R10-22 | Boutons de pagination | Réouverture / SM-09 | P2 après Guide |
| R10-23 | Auto-scroll déclenché plus tôt | Nouveau / auto-scroll drag | P2 après Guide |
| R10-24 | Alignement de l'en-tête Student Management | Réouverture / SM-08 | P2 après Guide |
| R10-25 | Flash bleu du changement de vue | Nouveau / timing du toggle | P1 après Guide |
| R10-26 | Largeur minimale du dropdown | Réouverture / dropdowns admin | P2 après Guide |
| R10-27 | Saut de scroll du + groupements | Nouveau / divulgation participant | P1 après Guide |
| R10-28 | Espacement des trois points | Réouverture / G11-C | P1 Guide |
| R10-29 | Recomposition de la première slide | Réouverture / G11-G | P1 Guide |
| R10-30 | Démarrer la démonstration | Nouveau / lecture des démonstrations | P1 Guide |
| R10-31 | Mise en valeur des titres de slide | Nouveau / hiérarchie des slides | P1 Guide |
| R10-32 | Bulles du Kit pour titres tronqués | Réouverture / tooltips | P1 Kit pour Guide / P2 autres usages |
| R10-33 | Capitaliser la méthode Kit/Penpot/consommateur | Nouveau / méthode de transposition | Continu pendant tous les lots / CCB différé |

Après le Guide, traiter d'abord les comportements cassés : R10-17 sans fichier,
R10-27 saut de scroll, R10-04 sélection au repli, R10-18/19 rendu compact,
R10-25 flash du toggle et R10-11 fluidité. Puis palettes et harmonisation
par famille de composants, tout en gardant un lot distinct et ses preuves
pour chaque demande. R10-16 démarre par son inventaire avant généralisation.

## Skeleton ciblé : réponse technique et étapes

Oui, les états de chargement locaux peuvent s'appuyer sur les véritables phases
de disponibilité des composants, pas sur un écran entier figé. Le chantier est
transversal et son estimation reste à établir après l'inventaire. Il n'exige
pas de dessiner une illustration différente à la main pour chaque zone.

R10-16 reste un seul lot, réalisé en phases :
1. Inventorier les promesses, initialisations AMD, ajouts de DOM et états ready
   réellement différés; identifier quelles actions deviennent utilisables quand.
2. Définir les primitives et le cycle loading/ready/error/fail-open partagé;
   décorations non focusables, aria-busy, place réservée, pas de commande dupliquée.
3. Piloter les boutons d'action Student Management dans la page déjà affichée,
   en gardant le skeleton global et les actions immédiatement prêtes visibles.
4. Vérifier retard réel/rapide/échec, fondu/sweep léger, reduced/disabled, focus,
   redimensionnement et destruction/réinitialisation sans skeleton bloqué.
5. Publier les états Fondations/produit et étendre les ensembles prioritaires.
   Documenter le contrat pour Mass Import, admin et CCB futur, sans modifier CCB.

## Premier audit R10-03 — source seulement

Le Guide actif Discovery ne garde pas la peinture historique verte en dur :
`_guide-discovery.scss` branche la barre sur `var(--easyedu-accent)` et ce rôle
est bien présent dans la CSS compilée. Le Guide legacy conserve sa recette
historique. Le SCSS Guide canonique et embarqué correspond après normalisation
CRLF/LF; leurs hashes bruts diffèrent à cause des fins de ligne.

`lib.php` expose distinctement accent choisi et accent lisible.
`preserveGuidePortalTheme` copie les tokens résolus avant le déplacement du
Guide. Cela justifie de vérifier la configuration/l'héritage/la peinture au
moment du portail plutôt que d'ajouter immédiatement une couleur privée.
Ce constat **ne prouve pas** que la palette administrée fonctionne en Moodle;
la preuve native avec deux palettes transitoires, sans sauvegarde, reste à faire.

R10-01/02/06 et les autres demandes ne sont pas déclarés corrigés par cet audit.

## Capitalisation continue et coût

R10-33 doit conserver des exemples reproductibles de mapping source/design,
familles communes, état métier versus paint, Motion et limites de preuve.
À chaque lot : recette réutilisée/créée, classes publiques, usages synchronisés,
tests, impacts sur packaging et artefacts, problème rencontré et règle préventive.
Pour CCB, prévoir son propre inventaire DOM et ses compositions Penpot; ne pas
copier aveuglément les comportements métier d'EasyStud.

Le bilan coût/quota doit décrire les duplications, sorties excessives,
sondes évitables et réutilisations de fixtures/outils. Aucun chiffre précis
de tokens/coût fournisseur n'est disponible ici; ne pas inventer d'économie.
