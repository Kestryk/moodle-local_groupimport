# T015 — matrice native des scènes, après T014

## Résultat de la matrice lifecycle

Run42628 passe les60 cas, EN/FR ×1280/768/390 ×normal/reduced : les deux
Inspection, Organiser Add/Move et Actions. Les huit résultats Organiser à1280×800
sont dans le viewport du body sans défilement manuel supplémentaire.
Zéro erreur/commande métier ; credential/lease/child cleanup complet, environ5m46s,
cas le plus long7.93s. Aucun asset/clock/Motion modifié pour cette recette.

**T015 n'est pas encore clos** : le plan reçu demande aussi Tab, Escape et focus
de retour. L'ancien `guide-keyboard.spec.js` conserve un index Practice1 antérieur
au curriculum actuel. Préparer un successeur QA-isolé qui découvre le vrai index
du champ illustratif, conserve ces oracles et couvre EN/FR et trois tailles/médias.
Lifecycle/endpoint proof n'est pas une preuve continue de toutes les phases ;
les captures250ms R2 restent leurs preuves distinctes.

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

Successeur préparé : `tools/playwright/guide-t015-scene-matrix-native.spec.js`,
scénario `T015 current four scenes across locale viewport media and Add Move`.
Budget global1800s, watchdog borné ; progression/timings après chaque cas.
Quatre navigations initiales (une par langue/média), puis vrais changements de
viewport et de scène ; T014 conserve la preuve distincte des16 chargements initiaux.
Le test reproduit les controles/densités/lifecycle de la référence et ajoute les
deux modes, la vraie hauteur800 et la visibilité finale des appartenances.

Statut : syntaxe/préflight passés, aucun code produit modifié ; exécution T015
à lancer après checkpoint poussé. T014/49364 est terminé avec cleanup complet.
Les preuves Penpot, source, native et humaine restent séparées ; checklist ouverte.
