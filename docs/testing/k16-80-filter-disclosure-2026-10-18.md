# K16-80 — Plus et Moins de filtres

Base `07b1dfe6`. Deux recettes partagées remplacent leurs définitions locales :

- `filter-disclosure-icon` reprend la taille0,68rem, ligne1 et transition de rotation du glyphe.
- `filter-section-label` reprend la typographie de sourcil, l’espacement des lettres0,03em et la couleur atténuée des titres de section.

La rotation selon l’état ARIA et les marges restent dans la composition. La fonction locale `type-more-filters-label`, sans autre utilisateur, est retirée. Aucun JS, template, comportement, timing ou état n’est changé.

F11 :4 →1 déclaration locale, aucune nouvelle. La restante est la hauteur maximale du panneau responsive, règle de disposition non modifiée. Quatre CSS complets strictement identiques après normalisation CRLF/LF, ordre de chaque déclaration compris. Global :0 règle de présentation. Les52 SCSS partagés correspondent au Kit candidat.

Build conservative Node22.11.0/Sass1.79.1, sync,T037,T038,aller-retour PASS ; checker officiel autres fichiers0 erreur/0 avertissement. Aucun JS modifié, aucune hausse ESLint. Recette native PASS :16 échantillons FR/EN1600/390, ouvert/fermé. Cadres12×12px et centres0px identiques. Titres ouverts : hauteur14,125px, police10,88px/700, interlettrage0,3264px, couleur rgb(92,108,125), identiques avant/après. Dimensions, padding, rayons et couleurs conservés,0 erreur console. Mesures brutes dans `C:/dev/artifacts/k16-80-filter-disclosure-20261018/native.json`.

Le socle Kit reprend les trois prérequis déjà acceptés6317256/84087e4 ; hashes dans `baseline.json`. Aucune décision visuelle nouvelle, aucun projet CCB. Candidat injecté en mémoire seulement sur :8051 sous bail ; fixtures restaurées et bail libéré. Aucune publication.

## Report Penpot

Recettes ajoutées : `filter-disclosure-icon`, `filter-section-label`. Composants : chevron de filtre et titre de section ; Student Management, états replié/déplié, FR/EN1600/390. Aucun changement visible : conserver les mesures acceptées. Le comportement de la bascule reste indépendant du style partagé.
