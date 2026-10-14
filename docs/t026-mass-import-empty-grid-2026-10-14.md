# T026 — proportions de l'état vide

Seule la grille de base Mass Import passe de0,88fr/1,12fr à1,12fr/0,88fr, conformément à M1. Les règles `has-preview`, CSV ouvert/replié et la grille du squelette restent strictement identiques. La pile mobile conserve sa règle existante.

Les préalables T023/T024 sont présents dans la base Source ; T025 précède ce commit. La preuve finale du candidat incluant K22/T025, run `easystud-authenticated-20261014T140503492Z-26216`, mesure775,594/609,406px à1600 et598,375/470,156px à1280, soit1,272705 et1,272716 pour le ratio cible1,12/0,88. À390 la grille a une seule colonne342,781px ; aucun débordement aux trois largeurs. Les espacements du dépôt restent4/12/8px. Aucun fichier ni import, et aucune nouvelle assertion native des états preview.

La reconstruction statique vérifie que le diff T026 est exactement cette unique déclaration de la grille de base. La compilation Sass est PASS ; les règles de preview inchangées ne sont pas relabellées comme une preuve native T027.

Pour Claude/Penpot : composition vide des deux colonnes Upload/Résultats ; recette1,12fr/0,88fr et pile mobile ; Mass Import état prêt vide, FR1600/1280/390. Propager les standards et toutes les planches Foundations/EasyStud concernées, ainsi que le composant de composition s'il existe dans Library. La grille produit privée ne nécessite pas une modification de contrôles partagés.
