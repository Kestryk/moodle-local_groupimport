# F06 — centrage peint des déclencheurs ⋯, 20/10/2026

Famille F06 (K16-80, déclencheurs de menu ⋯/≡). Le ≡ (`fa-bars`) n'est plus injecté : `normaliseCardMenuButton` réduit tout déclencheur à un unique `fa-ellipsis`, dont le glyphe est la recette Kit `overflow-ellipsis-glyph`.

## Cause

La géométrie était déjà exacte (boîte du pseudo-élément au centre à 0,00006 px près). Le défaut était à la peinture : le glyphe 15 × 3 px (impair) était centré dans des boîtes paires (cible tactile 44 px, bureau 32 px, disque 24 px), donc sur un demi-pixel (14,5 / 20,5 px). Chrome arrondit cette petite boîte à la grille avant de la peindre : l'encre tombait systématiquement à ±0,5 px du disque, sur les deux axes, quel que soit l'écran.

## Correctif (Kit, une seule définition)

- `overflow-ellipsis-glyph` dessine les trois points dans la boîte du déclencheur (`::before` en `inset: 0`), à `50 %` et `50 % ± 6 px`, exactement comme le disque (radial à 50 % 50 % de la même boîte). Mêmes points : 3 px, pas de 6 px, `currentColor`, bord 0,6 px ; K17-77 tenu (aucun point rogné).
- `card-overflow-trigger` et `mobile-card-menu-trigger` portent `position: relative` ; les consommateurs qui forçaient `position: static` (en-tête de groupe à résumé masqué, groupes imbriqués mobiles) passent à `relative` + `inset: auto`, donc sans aucun décalage.
- `pointer-events: none` sur les points : la cible du clic reste le bouton.

## Recette native :8054, cours 71, headless, DSF 4

25 instances : 1600 px (⋯ de colonne, 6 en-têtes de groupe, vue Groupes & groupements) ; 390 px (6 cartes participant, 6 groupes, 6 groupements). Mesure : centroïde d'encre des points comparé au centroïde du disque Kit peint sur la même cible.

| | Avant | Après |
|---|---|---|
| Points vs disque, max | 0,5003 px | 0,0005 px |
| Boîte géométrique | 0,00006 px | 0 px |
| Déplacement des déclencheurs | — | 0 px (25/25) |

Chevron des items de menu (correctif 9a86675f, `line-height: normal`) : boîte centrée à 0 px sur 6 mesures ; l'encre du glyphe Font Awesome reste à −0,77/+0,82 px selon la ligne (approche latérale du glyphe et arrondi de la ligne de base), à traiter par une recette de glyphe dessiné, non incluse ici.

À reporter dans Penpot : rien de visuel (mêmes points, même disque) ; noter que le glyphe ⋯ est dessiné dans la boîte de la cible.
