# T012 — récapitulatif déplié par défaut, Motion commune

Programme `EED-UI-2026-0073`, ancienne demande Claude G3/T012, toujours ouverte.
Prérequis T014 et T015 servis/vérifiés ; aucun autre lot/acceptation effacé.

## Constat de source

Le template canonique a deux régions `section[data-guide-recap]` avec un titre
strong et une liste ol. Le récapitulatif devient visible à la fin par le scroll
annulable existant puis un fondu280ms ; il n'a aucun contrôle de repli/dépli.
Les preuves C5/R2/T015 certifient l'affichage final et le viewport, **pas** la
divulgation Motion réclamée. Ne pas déclarer T012 fini sur ces preuves.

## Frontière de la prochaine implémentation

- Réutiliser les contrôles/titres/listes existants et une composition Accordion/
  divulgation dans Foundations, puis le Guide. Garder les cartes et Overview.
- Ajouter uniquement la présentation du recap et son état local, ouvert d'office
  à la fin, fermable/réouvrable par souris/clavier ; Reset/Replay/Exit annulent
  toute transition en cours et restaurent la bonne visibilité.
- Motion canonique disponible : `motion/amd/src/easyedu_motion.js::disclosePanel`,
  primitive documentée dans `docs/components/panel-disclosure-2026-10-04.md`.
  Ne pas dupliquer son calcul de hauteur/padding ou inventer un timing privé.
- Le Guide importe actuellement seulement son module Fullscreen, et son wrapper
  Moodle est AMD sans dépendances. Avant l'ajout, définir explicitement le lien
  Guide→Motion et son adaptation de sync/build, y compris les fixtures qui
  exécutent le véritable AMD. Ne pas activer un template sans ce lien complet.
- Conserver le scroll final, tous les clocks d'illustration/narration, phases,
  labels, memberships, ID/path/storage et commandes. Aucun appel Moodle métier.
- Les anciennes preuves whole-file restent pinned ; ajouter un successeur qui
  reconstruit exactement la baseline hors du recap/disclosure et de son bridge.

## Gates

1. Contrat canonical et Source/Standard/Product liés, label/chevron bien centrés,
   desktop/tablet/phone et texte EN/FR long ; exemples sauvegardés et raster.
2. Source/SCSS/template/AMD atomiques, export Motion réellement callable, tests
   isolés open/close/reversal/cancel, policy/reduced et destruction sans effets.
3. Preview sous bail, fin→open, clic→close→open, Replay/Reset/Exit au milieu de
   Motion, conservation des targets/scroll et accessibilité/focus.
4. Rejouer les domaines T015 et le ciblage continu R2 sur les assets finaux.
5. Checklist humaine indépendante ; aucun contrôle ou police privés dans le plugin.

Statut : audit/préflight enregistré, pas encore de code ou nouveau composant
activé. Source/Kit actuels restent propres après le checkpoint de cette note.
Les couloirs Student approuvés et les autres tâches sont conservés après le Guide.
