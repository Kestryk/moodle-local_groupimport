# K20-03 — notifications compactes

Base `48ed6808`, rendu validé `PENPOT-PASSE/K20-03-NOTIFICATIONS-TASSEES-RENDU-2026-10-20.png`.
Une seule définition Kit : `_v3-banner.scss`, variante notification seulement.
Bienvenue conserve son rythme et ses actions. Police inchangée ; surtitre
10/12, titre 16/20, texte 14/18, padding vertical 8 px, marge avant texte 6 px.
Notification courte 72 px ; texte sur deux lignes 90 px ; aucune hauteur fixe
ni troncature. Fermeture 44 × 44 px aux deux largeurs.

Playwright headless sur le vrai module notification compilé et la feuille
Student Management : FR/EN × 1600/390 × court/long, huit cas PASS, aucune erreur
de page. Les fins d'animations réelles sont attendues avant les mesures ; la
première sonde non stabilisée (43,34 px pendant l'entrée) reste dans les preuves.
Les textes, le bouton et les panneaux restent contenus verticalement et
horizontalement ; le centre du bouton est atteignable. À 1600 le texte long
fourni tient sur une ligne (72 px) ; à 390 il en prend deux (90 px).

Build Node 22.11.0 / Sass 1.79.1 conservatif, trois feuilles de consommateurs.
Aucun PHP ou AMD source modifié, aucune hausse ESLint, aucun comportement ou
timer changé. Report canonique Kit identique ; aucune publication localhost.
Preuves : `<workspace>/artifacts/k20-03-gmir-fix-20261020/notifications/`.
