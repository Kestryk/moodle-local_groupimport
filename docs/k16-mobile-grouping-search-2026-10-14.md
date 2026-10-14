# K16 — recherche dans un groupement mobile, diagnostic Source pour Claude

Statut : lecture statique du Source3c6c0bd6 pendant le cherry-pick00957c2f arrêté. Aucun correctif produit, aucune preuve native principale nouvelle. Le signalement Perf N2 est dans PASSATION-CODEX2.md et k16-reset-final-successor.spec.js:35.

Le cas exact concerne « Rechercher des groupes » dans une carte groupement. Ce n'est pas la recherche générale des participants : la spec l'utilise avec succès avant le changement de vue.

- templates/manage.mustache:741 propose le bouton data-easystud-container-search-toggle avec l'id du groupement et le panneau data-easystud-container-search-panel correspondant.
- course_manager.js ensureNestedGroupActionMenus clone les actions directes dans le menu de débordement. Les règles responsive masquent les actions directes, tandis que la feuille mobile native utilise bindContextMenu et les contextactions construits dans manage.php.
- manage.php possède group-search-members et grouping-select-groups/grouping-open-advanced-settings, mais aucune action grouping-search-groups. bindContextMenu possède group-search-members, mais aucune délégation vers data-easystud-container-search-toggle du groupement ciblé.
- La recherche interne reste implémentée par bindContainerGroupSearch. Elle est donc prévue, mais son accès par la feuille d'actions mobile manque. Les deux échecs Perf N2 concordent avec cette absence. Défaut d'accès mobile identifié, pas une décision de suppression documentée.

Correctif demandé à Claude : ajouter l'entrée localisée de recherche de groupes pour le contexte grouping et déléguer au bouton natif du groupement ciblé dans bindContextMenu ; ne pas ouvrir la recherche d'un autre groupement ou forcer un contrôle caché dans le test. Garder la fermeture de feuille, le focus preventScroll, l'ouverture Motion du panneau et son Annuler. Le correctif touche course_manager.js réservé à Claude ; une seule retouche template/SCSS ne peut pas relier correctement cette action au contexte courant.

Recette après intégration : FR et EN,390, modes Actuel/À la demande, carte groupement simple et sélection multiple ; depuis ⋯, Rechercher des groupes ouvre le bon panneau, saisie filtre les groupes locaux, Annuler ferme et restaure ; comparaison K16 Reset38px avec Annuler réellement visible. Aucun POST/sesskey ou moteur de filtrage à modifier.

Pour Penpot Claude : composant carte groupement et menu d'actions mobile ; recette recherche interne/panneau existant ; écran Student Management vue Groupements ; états repos, feuille ouverte, recherche ouverte/fermée ;390px, deux modes. Aucun nouveau changement visuel effectué dans ce diagnostic.

Mise à jour après résolution approuvée : quatre lots publiés sur3f22f1b0. Le Course Manager et le gabarit sont inchangés ; le diagnostic demeure. La nouvelle passe principale20261014T095601999Z-42312 s'arrête avant K16 sur une préparation de sélection du test F7, donc ne constitue pas une nouvelle preuve native de l'accès manquant. Les preuves Perf N2 et la lecture Source sont conservées avec leur périmètre.

Preuve principale ultérieure sur955aadbb : run20261014T122306886Z-39300 termine les6cas Reset/Message FR1600/1280/390 dans les deux modes. À390, les deux menus groupement n'ont pas grouping-search-groups et le bouton direct est caché, tandis que la recherche générale participants fonctionne et Reset mesure38px. Le défaut d'accès mobile est donc confirmé nativement, sans comparaison Annuler forcée ni correction Source. Les nouveaux helpers T058 corrigent le focus des panneaux mais n'ajoutent pas cette action ; Claude reste propriétaire du correctif.
