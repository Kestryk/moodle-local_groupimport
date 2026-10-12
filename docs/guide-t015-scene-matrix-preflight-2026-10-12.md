# T015 — matrice native des scènes, après T014

Programme `EED-UI-2026-0073`, tâche Claude T015 ; plan de recette, pas résultat.
Priorité Guide conservée ; couloirs Student et anciens retours restent en attente.
La preuve R2/12108 couvre membership Add/Move en normal à1600/1280/390,
pas les scènes Inspection ni les768px ou la préférence reduced de cette matrice.

## Autorités et périmètre

- Réutiliser les quatre vraies entrées temporisées du curriculum courant :
  Inspection Groupe, Inspection Groupement, Organiser les appartenances et
  Actions sur les membres. Les aperçus inertes T014 ne sont pas des scènes.
- Les18 cas de la demande historique représentent trois genres de scène.
  Ne pas omettre Inspection Groupement sous prétexte que son genre est le même
  qu'Inspection Groupe : quatre entrées × EN/FR × trois largeurs donnent24 cas.
- Vérifier Add et Move pour Organiser, pas seulement le Move choisi par l'ancien
  `guide-demonstration-entry-native.spec.js` : six cas de plus, soit30 par média.
- Normal et reduced sont deux branches distinctes :60 cas au total. Reduced
  montre l'état final statique ; ne pas attendre une horloge ou un curseur animés.
- Tailles exactes :1280×800,768×1024,390×844. Ne pas conserver1000px de hauteur
  à1280 si le critère Claude demande800px pour le résultat final sans scroll manuel.

## Contrôles à conserver

1. Actual loading-ready, langage et média ; template et AMD réellement servis.
2. Avant Start : mode sélectionné visible quand il existe, Start Small en contour,
   instruction idle, aucune phase spontanée. Les exemples T014 restent inertes.
3. Normal : Start explicite, statut running, Start disabled, Pause puis Resume,
   Next phase disponible ; pas de réécriture de clocks/Motion pour rendre le test vert.
4. Reduced : résumé statique, sans faux running/pause/curseur.
5. Fin : résumé, Replay, Reset et retour à idle. Pour Organiser à1280×800,
   appartenances finales visibles dans le vrai body sans scroll manuel ajouté.
6. Contrôles/texte et cadres réellement contenus ; finite transitions settled,
   zéro erreur et aucune commande métier. Le cycle réel par les boutons existants
   reste différent de la preuve R2 continue250ms déjà conservée.

## Protection et exécution

L'ancien scénario est une référence immuable, pas le nouveau runner : il ouvre
le guide utilisateur sans espace QA, sélectionne seulement Move et utilise une
hauteur1000. Le successeur devra isoler/restaurer la configuration du Guide et
nettoyer son seul préfixe QA, backups inclus. Bloquer toute requête métier ; ne
jamais créer de groupe, transférer un membre ou sauvegarder des réglages.

Les scénarios restent local-supervised. Découverte d'un seul test avant DPAPI,
bail runtime, watchdog borné et progression par cas ; préserver la source pendant
le child et son cleanup. Les10 cas T014/28596 montrent le besoin d'un budget
global calculé pour une matrice, pas d'une hausse des délais individuels.
Le budget se fixe après inventaire des phases/mesures des cas et respecte les
durées réelles ; jamais une longue attente sans progression ou communication.

Statut : préflight enregistré, pas de code produit ou de test natif T015 lancé.
Le successeur T014/49364 est encore le propriétaire de la recette native.
Les preuves Penpot, source, native et humaine restent séparées ; checklist ouverte.
