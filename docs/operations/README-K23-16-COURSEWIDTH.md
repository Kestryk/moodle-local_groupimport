> **Remplacé sur Community et staging le 23/10/2026 par K23-10** : voir C:\dev\tools\core-patches-backup-20261023\README-K23-10-UNIVERSAL-WIDTH.md. Document historique conservé ; les éventuelles copies locales 5.3 mentionnées ici ne sont pas modifiées par ce remplacement.

# K23-16 — Page de cours à la largeur de la bannière CCB

**Patch temporaire : à reporter dans le futur thème EasyEdu.** Ce réglage Boost ne remplace pas un chantier de thème. Lors du démarrage du futur thème EasyEdu, reprendre cette règle comme référence, puis retirer son équivalent dans le SCSS additionnel pour éviter deux propriétaires.

## Référence mesurée, 23/10/2026

Sites autorisés : community.easyedu.fr et staging.easyedu.fr. Compte administrateur de test documenté, cours 5, format Topics, largeur de fenêtre 1920 px, tiroir de cours ouvert. Corps réel : `body.path-course-view.pagelayout-course` (pas `format-site`, réservé ici au tableau de bord).

Avant : coque standard `.local-course-banner-builder-native-shell` = 1320 px (max-width calculé 1320 px), contenu `#region-main` = 1523 px et `.main-inner` = 1539 px, sur les deux sites. La bannière standard est bien contenue à 1320 px ; cette valeur a été mesurée sur le cours, pas déduite de la page d’accueil.

Après : `.main-inner` = 1320 px ; coque bannière et `#region-main` = **1304 px**, alignés en position et largeur. Les 16 px de différence avec le conteneur externe sont les deux paddings internes existants de 8 px. Le remplissage propre de la bannière n’est pas supprimé ni élargi. Le tableau de bord garde son patch K23-08 et ses dimensions antérieures. Aucune erreur console/page dans la matrice avant/après.

## Réglage appliqué

SCSS additionnel officiel `theme_boost/scss`, append avec le marqueur **SCSS valide** `/* K23-16-COURSEWIDTH */`. Relire `C:\dev\tools\append-boost-scss.php` avant toute réutilisation : le troisième argument est écrit dans le SCSS ; il doit être un commentaire, jamais un identifiant nu.

```scss
/* K23-16-COURSEWIDTH */
/* Temporary Boost patch: move this rule into the future EasyEdu theme. */
/* The course banner's standard native shell is capped at 1320px. */
body.path-course-view.pagelayout-course #page.drawers .main-inner {
    max-width: 1320px !important;
    margin-left: auto !important;
    margin-right: auto !important;
}
body.path-course-view.pagelayout-course .header-maxwidth,
body.path-course-view.pagelayout-course .footer-popover {
    max-width: 1320px !important;
}
```

La limite reste fluide en dessous du maximum. Le scope ne vise ni les activités, ni les pages du plugin, ni tous les formats-site. Pas de modification du cœur Moodle ni de la définition CCB de la bannière. Si un futur format de bannière adopte une largeur différente, réévaluer cette règle temporaire au lieu d’en supposer la validité.

## Sauvegardes et retour arrière

Dans `C:\dev\tools\core-patches-backup-20261023\` :
- `community-theme_boost_scss.before-k23-16-coursewidth.txt`
- `staging-theme_boost_scss.before-k23-16-coursewidth.txt`

Sur le serveur, configuration avant modification et archives des fichiers CCB dans `/root/easyedu-backups/k23-16-17-20261023/`. Les paramètres non liés à ce lot ne sont pas modifiés.

Retour arrière : retirer seulement le bloc `/* K23-16-COURSEWIDTH */` et ses trois commentaires/règles du SCSS additionnel du site concerné, puis réinitialiser les caches de thème. Restaurer le fichier complet sauvegardé seulement s’il n’y a pas eu d’autre modification de SCSS entre-temps. Le script d’append est idempotent : le marqueur interdit un deuxième ajout.

Preuves natives : `C:\dev\artifacts\k23-16-17-20261023\before.json`, `after-width.json`, `before-*-course.png`, `after-width-*-course.png` ; captures du tableau de bord de contrôle également conservées.

**Rappel de livraison : ce patch doit être repris nativement dans le futur thème EasyEdu, puis retiré du réglage additionnel.**
