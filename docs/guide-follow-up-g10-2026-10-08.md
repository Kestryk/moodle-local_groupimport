# Guide G10 — retours de checklist et nouveaux lots

Programme EED-UI-2026-0073. Demande du 8 octobre 2026, après K1/K2.
Tous les anciens lots et la validation humaine restent ouverts. Ne pas reprendre
les lots Student Management avant cette tranche Guide. Worktrees Source/Kit
existants uniquement ; pas de nouveau writer parallèle dans ces checkouts.

## Ordre et exigences exhaustives

| Lot | Travail demandé | Statut / preuve attendue |
| --- | --- | --- |
| G10-A | Passation au rédacteur : inventaire4 nouvelles +20 héritées, retrait des doublons, format déclaratif, cartes/actions et parcours utiles ; introduction commune au fonctionnement du guide. | Priorité AVANT les autres lots. Prompt rédigé dans PROMPT-PASSATION-GUIDES-CONTENU-2026-10-08.md ; contenu retourné et intégration encore ouverts. |
| G10-B | En-tête Guide strictement conforme au template partagé des autres modales du plugin, en conservant l'icône. Fin « Demonstration complete · summary below. » en gras et vert sémantique avec icône de validation. Cadre d'étape plus visible, bordure sur tous les côtés. | À faire dans Kit, Foundations/Guide Penpot et preview ; lecture du vrai template natif, états desktop/mobile, titres longs et couleurs configurées. |
| G10-C | Trois points après la consigne active, animés successivement ; action >> pour passer à la phase d'animation suivante ; Pause || remplacée par Play en pause. Comportement partagé pour toutes les scènes présentes/futures. | Nouveau contrat moteur + commandes accessibles + états Penpot. Pause conserve le temps/la scène, Skip avance une seule phase sans répéter des effets ; aucun effet métier. Pause/skip/reprise/fin/changement de slide/fermeture/reduced-motion à tester. |
| G10-D | Organisation : après clic Move, avant déplacement des cartes, faire défiler le corps du guide vers l'action visible. Introduction Compare Add/Move déborde encore : corriger son containment. | Rouvrir malgré les preuves précédentes. Règle partagée de révélation avant les événements illustrés, scroll cancellable respectant pause/reduced-motion, sans défiler Moodle derrière. Longs textes EN/FR, desktop/tablette/mobile. |
| G10-E | Checklist réduite : message Everything is set… intégralement lisible, pas tronqué. Reset this path avec bordure visible, petite densité du Kit, pas de nouvelle exception privée. Surbrillance parfois absente entre Select participant et Move ; aucune sur Destination group / Search and choose… | Reproduire avec vraie modale/contrôles natifs avant de corriger ; conserver preuves et Motion. Révéler/surligner le champ de destination réel, annuler les anciennes requêtes sans perdre la suivante. Aucun Move/Create confirmé pour les tests de présentation. |
| G10-F | Bloc parcours mobile : numéro à gauche, texte centré dans chaque étiquette, y compris libellé multiligne Search and choose… ; icône du bloc toujours en haut à gauche. | Publication des variantes liées et contrôle du texte peint, pas seulement du cadre ; préserver le desktop. |
| G10-G | Accueil de première visite DESKTOP : petite popup expliquant le guide et surlignant son bouton avec animation. Mémoire légère côté serveur de l'ouverture réelle. Admin : bouton réinitialisant cet accueil pour tous les utilisateurs. | À concevoir/développer/documenter. Proposition technique à auditer : préférence par utilisateur et identifiant/version d'accueil, epoch global de reset plutôt que mise à jour de tous les comptes. Enregistrer quand le guide est vraiment ouvert, pas quand la popup apparaît. Pas de SQL massif, confirmation admin/capability/sesskey et feedback ; état après reload/autre navigateur, fermeture/refus/reduced-motion. Penpot admin et accueil. |
| G10-H | Plein écran du guide, uniquement desktop, rendu complet Penpot et preview. Slide commune à tous les guides expliquant navigation, démonstration, Show in interface et parcours, avec futures commandes. | Désormais explicitement demandé : remplace le statut « faisabilité seulement » de G7-00. Fullscreen natif sur geste utilisateur, fallback, événements/Escape, sortie avant Show in interface, conservation slide/progression/focus ; aucune action proposée en responsive. Introduction : contenu par rédacteur, moteur/Kit par intégrateur. |

## Répartition

La fenêtre contenu produit un plan dédupliqué, des textes EN/FR, des scripts de
scènes et des parcours déclaratifs, sans toucher au Kit, au plugin, au runtime,
à Foundations ou au serveur de l'intégrateur. La fenêtre intégration reste
propriétaire des composants, interactions, préférences serveur, admin et preview.
Tout besoin de nouveau contrôleur/signal est signalé, pas inventé comme existant.
Le statut « rédigé » n'est ni « implémenté », ni « publié », ni « validé ».

## Portes de validation

1. Passation et mémoire documentaire ; pas encore de modification visuelle.
2. Reproduction des problèmes signalés, contrôle de la source et baseline.
3. Contrat/implémentation canonique Kit, publication Foundations puis Guide
   Penpot, contrôles source/saved/painted indépendants.
4. Synchronisation ciblée EasyStud, build, commits privés poussés, preview gérée.
5. Tests ciblés desktop/tablette/mobile, EN/FR, mouvement normal/réduit,
   lifecycle/focus/pause/skip/reset. Pas de données réelles créées/déplacées/envoyées.
6. Nouvelle checklist humaine. Aucune validation globale déduite de cette intake.

## État initial

Source2b22de1, Kit08c9abb/0.4.147, runtimef6ce474, propres au dernier checkpoint.
K1/K2 passent leurs six routes clavier ; le retour utilisateur rouvre les
problèmes de présentation/surbrillance ci-dessus. Aucun nouveau contrôle,
accueil serveur, reset global ou plein écran n'est encore implémenté dans G10.
Les anciens SM/G5 et le guide Mass Import distinct restent enregistrés.
