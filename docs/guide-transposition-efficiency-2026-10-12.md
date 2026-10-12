# Guide T014/T015 — retours de méthode et coût observable

Complément au crosswalk et à la méthode de transposition, pour la future CCB.
Ce bilan ne donne pas de nombre de tokens : aucune mesure de consommation
fournisseur par action/modèle n'est disponible ici. Ne pas inventer un quota.

## Ce qui a coûté du temps dans T014

- Contrôles hérités : le test ancien comptait la liste au lieu des lignes, puis
  attendait un titre pré-R10-31. Deux diagnostics conservés, un successeur avec
  même containment et preuve CSS complète pour ne pas corriger un faux défaut.
- Cache texte Penpot : label déclaré correct mais glyphes/largeur génériques.
  Rasters, `textBounds` et contenu Transit sauvegardé étaient nécessaires ;
  la simple lecture de `characters` n'aurait pas certifié le rendu.
- Publication/mise à jour expirées : les écritures avaient parfois abouti.
  Réconcilier les IDs créés avant tout rejeu a évité les doublons. Un reflow
  asynchrone a laissé temporairement12.58 ; restaurer la police source12.48,
  vérifier les quatre sauvegardes et ne pas conserver cette taille parasite.
- Bibliothèque en cache : un rechargement exact après checkpoint sauvegardé a
  reçu la bonne définition ; l'iframe locale a eu besoin de finir son chargement
  avant reconnexion. Ne jamais reconnecter un autre canal pour aller plus vite.
- Mise à jour native : deux anciennes lanes de label162→97 ont été réinitialisées.
  Restaurer uniquement ces copies, puis reprendre le fingerprint strict complet.
- Matrice native :16 vrais chargements initiaux coûtent jusque41.057s par cas.
 360s a permis10 cas, pas16. Le successeur900s a conservé chaque oracle et délai
  individuel, avec progrès/timing par cas ; durée de run49364 : environ7m33s.
- Paramètres/outils : des noms de paramètres et une citation shell incorrects
  ont produit des erreurs de harness sans writes. Lire les paramètres réels et
  préférer un petit script de validation versionné aux longues chaînes Node/PS.

## Règles à réutiliser

1. Prendre les primitives existantes, puis enrichir la composition source ;
   captions et contrôles gardent leurs rôles et les vrais exemples sont inertes.
2. Garder des écritures de design courtes, page qualifiée, et des checkpoints
   avant/IDs après chaque action risquée. Séparer sauvegarde, cache paint et raster.
3. Tester d'abord un vrai exemplaire localisé avant la grande matrice. Distinguer
   les oracles anciens des invariants actuels par la baseline complète du CSS.
4. Dans les matrices, journaliser les cas avant la fin. Dimensionner le budget
   global à partir des coûts observés, jamais dilater la deadline d'un widget.
5. Recharger lorsque la preuve concerne l'initialisation ; réutiliser le document
   et le vrai resize pour les seuls cycles de scène. T015 utilise quatre GETs
   initiaux, sans remplacer la preuve des16 chargements de T014.
6. Sérialiser les auteurs/baux. Continuer dans les worktrees existants, imports
   SCSS canoniques et fichiers de preuve ; aucun nouveau fork de composant/moteur.
7. Éviter les gros dumps : artefacts externes complets, résumé borné dans l'outil.
   Réutiliser la lecture complète des contrats inchangés et les IDs exacts.
8. Source/Penpot/native ne ferment jamais automatiquement l'acceptation humaine.
   CCB reste hors périmètre ; cette note prépare sa méthode, pas son intégration.

## À faire après la tranche

Le bilan global demandé par Kevin et l'audit Claude restent des lots distincts.
Relire les données de timings/échecs, contrôler les allocations disponibles
si l'outil les expose, et comparer les matrices sans réduire leur couverture.
Ne pas confondre une baisse de navigations natives avec une mesure de tokens.
