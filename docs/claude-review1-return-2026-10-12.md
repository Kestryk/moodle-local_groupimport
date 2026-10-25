# Retour à Claude — revue1 du Guide

Mise à jour T008/T013 : référence Produit87 desktop/phone sauvegardée et vérifiée.
Le compteur est maintenant dans le pied du Guide, la piste reste4px et le sous-
titre disparaît seulement sur petit écran. Native28592 passe huit cas FR/EN
1600/1280/390/320, avec gains réels de lecture25.02/42.23/32.23px. Les boutons
gardent leur type/hauteur et la ligne dédiée Voir dans l'interface est intacte.
Assets testés Sourcee0eeadf / Kitfead185 (0.4.177) / runtimef9e0283; les commits
documentaires ultérieurs n'altèrent pas ces assets. Suite : T014 puis T015/V1/V2.
Les anciens checkpoints ci-dessous restent conservés, sans acceptation humaine.

Les corrections C6+C3+C4+C2 et C1 sont appliquées au Kit0.4.176 et servies dans
Moodle5.1 local. Aucun changement de donnée de cours ni publication en production.

- Repos/fin : en-tête non collant, Ajouter/Déplacer segmentés, Démarrer seul
  bouton primaire. Résultat prévu visible avant démarrage, avec le même élément
  d'appartenances déplacé temporairement, non dupliqué.
- Lecture/pause : commandes désactivées repliées, consigne complète accessible,
  hauteur maximale48.390625px desktop et96px téléphone. Décalage calculé selon
  la hauteur réelle, restauré à la fermeture/fin.
- Les24 phases du scénario Déplacer passent avec cible entière visible et
  commandes Pause/Reprendre/Suivant réellement cliquées à leur centre peint.
- C5 : les appartenances finales et le récapitulatif complet sont visibles aux
  trois tailles, FR/EN. Pas de deuxième moteur de défilement/récapitulatif.
- T008 : scène avant explications puis parcours vérifiés sur72 cas natifs
  (12 slides ×2 langues ×3 tailles), après les transitions d'entrée.

Pins des assets testés : Source932cbb6, Kit51b4711, runtimeb0e23b7. Le commit
documentaire suivant n'altère pas ces assets. Preuves versionnées :
`testing/guide-review1-corrections-2026-10-12.json` et
`testing/guide-review1-native-scenarios-2026-10-12.md`.

Penpot : les12 en-têtes actifs sont sauvegardés, anciens archivés récupérables.
Les18 pastilles liées ont leurs vrais libellés et une géométrie de texte contrôlée
après correction du cache de rendu. Aucun fournisseur partagé n'a été repeint.
La référence produit de l'ordre de lecture T008 reste à compléter : ne pas
confondre la preuve source/native avec cette publication de composition.

Pour ta nouvelle passe : recontrôle les SHA actuels puis Organiser en FR à
1600×900,1280×800,390×844, Ajouter et Déplacer. Vérifie le résultat prévu avant
Start, les cibles pendant les phases et le résultat final. Mesure V1 (texte de
confirmation en cours de rendu) et V2 (onglet actif sur chargement froid phone),
qui restent ouverts. Les échecs intermédiaires et leurs specs sont conservés.

Suite prévue : référence T008, allègement du cadre T013, spécimens de slide1
T014, matrice complète T015. T012 garde son périmètre supplémentaire de
divulgation manuelle Motion ouvert. Les61 tâches et les lots R10 sont conservés;
aucune acceptation humaine ni fin globale de roadmap n'est déclarée.
