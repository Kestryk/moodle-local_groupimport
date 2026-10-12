# EasyStud — nouveaux retours du 10 octobre 2026

Mise à jour d'ordre Kevin12Oct : `execution-priority-2026-10-12.md` remplace
seulement la priorité historique Guide-first ci-dessous. Toutes les33 demandes,
anciennes preuves et portes humaines restent intactes ; pas de suppression.

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

11 octobre, reprise des modifications R10 : R10-17 dispose d'un correctif source
et de huit cas isolés réussis, sans style privé ni modification du picker natif.
La preview et le scénario navigateur sont distincts ; voir
mass-import-file-required-2026-10-11.md. Les autres lots ci-dessus restent ouverts.

R10-17 est maintenant servi et vérifié : six cas natifs FR/EN à390/768/1280,
clic et Entrée sans navigation ni POST, avertissement du Kit et focus picker.
Le démarrage tardif reprend l'état prêt via l'option existante ; pas de délai
artificiel ni nouveau skeleton. Import réel et acceptation humaine séparés.

R10-27 est servi et vérifié en desktop FR/EN sur une carte basse : première
ouverture/fermeture conserve chaque frame du conteneur défilant, compteur exact,
Motion inchangée. Voir participant-overflow-scroll-2026-10-11.md. Le correctif
évite la repagination d'un simple dépliage ; diagnostics conservés. Mobile et
acceptation humaine restent distincts, aucun lot antérieur n'est supprimé.

R10-21 reprend le nom Participants & groups dans l'entête du bloc en réutilisant
la traduction déjà existante du toggle ; navigation mobile inchangée. Copie
Penpot corrélée et vérification native restent séparées dans
participant-panel-title-2026-10-11.md. Aucun nouveau style ni changement de typo.

R10-21 est servi et vérifié en FR/EN à390/768/1280 : titre complet contenu,
navigation compacte conservée, zéro erreur/commande métier. Quatre copies
Penpot sont sauvegardées avec texte SVG réel et géométrie d'origine.

R10-19 : nouveau correctif de visibilité des champs optionnels et badge dans
les cartes mobiles compactes. Il remplace explicitement l'ancienne règle SM-50
qui les gardait toujours visibles; rôles et identité restent présents. Source
et douze usages Penpot avancent, tests/build/preview séparés dans
mobile-compact-profile-successor-2026-10-11.md; R10-18/20 restent ouverts.

R10-19 est maintenant servi et vérifié :42 relevés FR/EN à390/768/1024, sept
états de sélection/dépliage et retour desktop1280, zéro commande/erreur. Deux
cartes gardent l'œil sur la première ligne dans ces relevés; R10-18 reste un
lot distinct à couvrir plus largement. R10-25 commence par les couleurs réelles
frame par frame du sélecteur avant toute modification de Motion ou de SCSS.

R10-25 est maintenant servi avec l'option commune Kit0.4.167 : six changements
réels EN/FR,94 frames et un contraste minimal de4.2626:1, contre1.4298:1 dans
le diagnostic précédent. Les géométries et Motion de vues/cartes restent
identiques. Foundations8 états/24 tuiles et trois compositions produit gardent
le contrat enregistré. Preuve native ciblée, pas validation humaine globale.
R10-11 reprend par une mesure des frames de filtres sans modifier leurs valeurs.

R10-11 : les scans de cartes inutiles pendant le dépliage sont maintenant
retirés. La preview conserve le Motion original et passe28 ouvertures/fermetures
EN/FR à trois tailles avec images intermédiaires et aucune réinsertion de liste.
La régression indépendante passe39 cas EN de recherche/sélection/effacement,
fermeture imbriquée et reduced-motion. Le premier échec mobile et ses profils
CPU sont conservés; ce progrès ne clôt ni les inversions rapides/pointeur tenu,
ni l'appréciation humaine de la fluidité, ni les autres demandes de style.

R10-04 : l'implémentation existante passe huit cas sur les groupes réellement
présents à1600/768/390/320, demandes de mouvement normal/réduit. Le groupe
replié perd ses sélections, l'autre les conserve et la réouverture ne restaure
rien. Aucun ajout d'inscription ni changement de style; échecs de prérequis et
de ciblage du nettoyage compact conservés. Voir le successor du11 octobre.

Oui, les états de chargement locaux peuvent s'appuyer sur les véritables phases
de disponibilité des composants, pas sur un écran entier figé. Le chantier est
transversal et son estimation reste à établir après l'inventaire. Il n'exige
pas de dessiner une illustration différente à la main pour chaque zone.

R10-16 reste un seul lot, réalisé en phases :

Complément Claude12Oct conservé dans
`claude-guide-paths-skeleton-intake-2026-10-12.md` : baseline mesurée T052,
grille I1–I13 avant/après, recettes Kit/Foundations et déploiement local AJAX →
modales → Mass Import → régions initiales, puis T055. T054 est en dernier,
désactivé par défaut, depuis les données en mémoire ; aucun réseau au clic.
L'inventaire ci-dessous reste requis ; ce complément ne le marque pas terminé.

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

R10-07 avance par l'option commune déjà publiée dans le Kit : seul le clavier
peint un contour autour de l'interrupteur, sans encadrer tout le texte. Les
cibles44px et les animations restent identiques. Les trois exemples enregistrés
Foundations Library/Standard et EasyStud sont liés,48 cas publics et la totalité
du CSS non concerné passent. Preview et preuve native passent maintenant64
états FR/EN à1600/768/390 dans le successor du11 octobre; aucune validation
humaine n'est déduite de ces tests.

R10-01, sous-lot en-tête Guide : la recette commune est servie et quatre
lectures natives desktop/tablette/mobile/desktop passent, avec ouverture et
fermeture. Les24 cas isolés personnalisés/rétablis restent une preuve distincte.
Les autres pop-ups, la persistance des réglages et la validation humaine restent
ouverts. Voir `testing/guide-header-palette-native-2026-10-10.json`.

R10-33 doit conserver des exemples reproductibles de mapping source/design,
familles communes, état métier versus paint, Motion et limites de preuve.
À chaque lot : recette réutilisée/créée, classes publiques, usages synchronisés,
tests, impacts sur packaging et artefacts, problème rencontré et règle préventive.
Pour CCB, prévoir son propre inventaire DOM et ses compositions Penpot; ne pas
copier aveuglément les comportements métier d'EasyStud.

Le bilan coût/quota doit décrire les duplications, sorties excessives,
sondes évitables et réutilisations de fixtures/outils. Aucun chiffre précis
de tokens/coût fournisseur n'est disponible ici; ne pas inventer d'économie.
