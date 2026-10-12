# T037 — lecture et aération, après le recap T012

Programme `EED-UI-2026-0073`, complément Guide/US4 de la revue Claude. Préflight
seulement ; pas de styles ou de nouveaux textes activés. T012 reste propriétaire
des assets pendant ses tests continus finaux. Les couloirs Student approuvés
ne doivent pas effacer ces demandes Guide prioritaires.

## Cinq demandes conservées

| Claude | Portée | Limite |
| --- | --- | --- |
| GS1 | Paragraphes de lecture plafonnés à42rem, démo pleine largeur | Pas de max-width sur le wrapper de scène, cartes, contrôles ou tableau |
| GS2 | Teinte encre du titre de slide, kicker conservé | Ne pas annuler le rôle16px déjà publié R10-31 ni copier l'ancien1.08rem ; lire le vrai provider et la palette |
| GS5 | Marque discrète Démo/sans effet sur le cours | Réutiliser caption/pastille existantes, texte réellement localisé ; pas une nouvelle alerte |
| GS8 | Légendes Source/Destination des scènes | Garder noms et gestes illustrés, aucun nouveau target ou effet métier |
| GS9 | Points à retenir en3 colonnes desktop,1 mobile, sans filets horizontaux | Seulement les leçons compatibles ; conserver dt/dd, typo/copy et les six aperçus T014 distincts |

## Audit préparatoire

- Retenir également le contrôle de l'ancien retour sur « Demonstration complete »
  en gras/accent : le raster natif final26880 montre un texte ordinaire dans le
  header teinté. La règle de l'enfant `[data-guide-live-copy]` y applique type-body
  et peut remplacer la graisse/couleur finished héritée du parent live. Cela
  n'invalide pas les60 assertions lifecycle/disclosure de T012 (elles ne mesurent
  pas ce paint). Mesurer le style réel et corriger la recette partagée/les exemples
  concernés dans un successeur borné, sans repeindre les instructions actives.
- Les propositions étaient mesurées avant les correctifs R10/T013/R2/T014 :
  recontrôler les propriétés calculées actuelles avant tout patch.
- `.easyedu-guide-introduction__topics` est une liste mono-colonne ; chaque topic
  est une grille. Ne pas reproduire le faux diagnostic list-versus-row de T014.
- La première slide contient des aperçus, pas des points à retenir : ne pas
  transformer ses six explications en petites colonnes qui tassent le contenu.
  Les leçons carte Read/Actions/Mobile sont de meilleures candidates GS9.
- Le récapitulatif ol de démonstration T012 et les explications dl sont deux
  régions différentes. Leur rôle/list numbering/Motion ne doit pas être mélangé.
- Pour GS1, mesurer le vrai paragraphe de description et sa lane native dans
  le guide fullscreen/ordinaire, pas une taille arbitraire de planche Penpot.
- Vérifier les sources titre/caption exactes et les copies liées du Guide. La
  couleur d'identité de carte déjà publiée n'est pas une décision sur le titre
  du Guide. Ne pas remplacer silencieusement une palette configurée par un hex.

## Chaîne et tests

Kit opt-in → source/Standard Foundations → exemples produits liés → plugin
class/data adaptation si nécessaire → compilation → preview contrôlée → natif.
Une recomposition n'autorise pas les IDs/reading migration/controller forks.
Préserver la ligne dédiée Voir dans l'interface validée par Kevin : GS10 ne
fusionne pas le pied. GS3/libellés courts restent un arbitrage distinct de T038.

Baseline native localized avant/après1600/1280/390, avec longs textes FR/EN,
paragraphes réellement contenus, largeur des démos/cartes inchangée, source
typographique/font correcte, aucun target/button/tooltip cassé. Conserver les
matrices T014/T015/T012 et ne pas annoncer leur ancienne preuve comme celle du
nouveau style. Tableau de suivi source/design/served/native/human séparé.

Statut : préflight de la prochaine tranche Guide, pas un accomplissement T037.
Les61 descriptions reçues et tous les anciens retours restent conservés.
