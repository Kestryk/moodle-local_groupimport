# K23-10 — Largeur universelle et panneaux natifs K23-19

**Patch temporaire à reporter dans le futur thème EasyEdu.** Il remplace les réglages successifs de largeur sur Community et staging ; il ne doit pas devenir une seconde définition permanente à côté du futur thème.

## Décision et périmètre

Kevin a demandé un plafond de 1320 px centré sur toutes les pages, sans sélecteur de page pour la largeur. Le réglage officiel `theme_boost/scss` contient désormais un seul marqueur de cette personnalisation : `/* K23-10-UNIVERSAL-WIDTH */`, commentaire SCSS valide.

La limite s’applique à `#page.drawers .main-inner`, `.header-maxwidth`, `.footer-popover`. À 1920 px : conteneur externe de 1320 px, contenu utile de 1304 px avec les deux paddings natifs de 8 px. À 390 px : conteneur fluide de 390 px, contenu de 374 px. Les marges horizontales sont automatiques. Pas de modification du cœur ni du plugin CCB.

Les quatre anciennes familles K22-22, K22-35, K23-08 et K23-16 ont été retirées de la configuration, y compris une copie K23-08 sans marqueur et sa copie marquée. Leurs sources et sauvegardes historiques sont conservées. Les trois règles antérieures de taille des logos sont préservées.

## Pourquoi le réancrage des tiroirs reste nécessaire

Il ne dépend pas seulement de l’essai pleine largeur : sur le cours 5 déjà limité à 1320 px, retirer temporairement les quatre règles K22-35 dans le CSSOM de la seule page de recette déplace le tiroir gauche de x=0 à x=374,5 px. Le bouton du tiroir droit quitte lui aussi le bord de fenêtre. Le test ne modifie aucune configuration serveur.

K23-19 révèle aussi une portée trop étroite de l’ancien complément : `course/edit.php?id=2` utilise `body.limitedwidth.pagelayout-admin`, et non `pagelayout-course`. Le tiroir y recouvrait les libellés du formulaire. Sur staging, le premier essai avec la seule largeur corrigée laisse le tiroir à x=374,5 px ; le plafond de largeur seul ne répare donc pas le défaut.

Le principe de K22-35 est conservé dans le nouveau bloc, avec une portée `body.limitedwidth` commune aux pages natives concernées et le même seuil bureau de 992 px. Seuls gauche/droite sont réancrés ; dimensions, positions verticales, visibilité, commandes et animations Moodle ne changent pas. La règle de largeur demeure universelle et sans scope de page.

Après correction, le tiroir des réglages est à x=0 et ne recouvre plus le contenu ; recouvrement horizontal avant 285 px, après 0 px dans les deux sites à 1920 px. Les captures avant, intermédiaire et après permettent de distinguer les deux causes.

## Source exacte

```scss
/* K23-10-UNIVERSAL-WIDTH */
/* Temporary Boost configuration: move into the future EasyEdu theme. */
#page.drawers .main-inner,
.header-maxwidth,
.footer-popover {
    max-width: 1320px !important;
    margin-left: auto !important;
    margin-right: auto !important;
}

/* Limited-width native pages share Boost's anchored-drawer formulas, including course editing. */
@media (min-width: 992px) {
    body.limitedwidth .drawer.drawer-left,
    body.limitedwidth .drawer-toggles .drawer-left-toggle {
        left: 0 !important;
        right: auto !important;
    }
    body.limitedwidth .drawer.drawer-right,
    body.limitedwidth .drawer-toggles .drawer-right-toggle {
        left: auto !important;
        right: 0 !important;
    }
}
```

Le script historique `C:\dev\tools\append-boost-scss.php` a été relu : un marqueur ajouté doit toujours être un commentaire SCSS valide. Ce lot n’ajoute pas simplement une cinquième règle : il remplace les blocs historiques après vérification de l’empreinte exacte de la valeur courante, conserve le préfixe des logos et vérifie la valeur relue après écriture. Les caches de thème sont réinitialisés via les API Moodle.

## Application, sauvegardes et retour arrière

Sites : `https://community.easyedu.fr` et `https://staging.easyedu.fr`. Aucune modification du Moodle 5.3 local ou des copies de test par ce lot. Aucun fichier `config.php` modifié ; seul le réglage SCSS additionnel Boost change.

Sauvegardes AVANT dans ce même dossier :

- `community-theme_boost_scss.before-k23-10-universal.txt`
- `staging-theme_boost_scss.before-k23-10-universal.txt`

Empreinte SHA-256 initiale, identique sur les deux sites : `50970f0d1a215e0b4ace76463730569cabdcaec213ff7f96cf2904909c0d08c2`.
Empreinte finale, identique : `4883ac8c4e2b0f5bbc4f37b7cd01b794a6b1ba8da3481f521a372c0f470736d4`.
Sauvegarde serveur indépendante : `/root/easyedu-backups/k23-10-19-20261023/community-before.json` et `staging-before.json`.

Pour annuler : comparer le réglage courant à l’empreinte finale avant de restaurer la valeur « before » du site concerné, puis réinitialiser les caches du thème. Si d’autres réglages SCSS ont été ajoutés depuis, ne pas restaurer aveuglément tout le fichier : fusionner ces ajouts avec la sauvegarde ou retirer le seul bloc K23-10 après revue. Restaurer l’ancienne configuration réintroduit aussi les défauts connus de l’essai pleine largeur ; les sauvegardes sont des moyens de retour arrière, pas une recommandation d’usage.

## Vérifications

Recette Playwright Node autonome headless sur les deux sites : tableau de bord, cours 5, réglages du cours 2, Participants Moodle natif, Mes cours et recherche d’administration, à 1920 et 390 px. Les formulaires ne sont pas soumis ; aucun cours, participant ou réglage fonctionnel n’est modifié. Les menus natifs sont ouverts uniquement pour vérifier leur peinture et leur placement.

L’URL Participants simple redirige vers EasyStud ; le lien de recette natif doit inclure `local_groupimport_native=1`. Les premières captures redirigées restent conservées comme contrôle de la vue EasyStud et ne sont pas présentées comme preuve de Participants natif. La recette finale native vérifie le chemin réellement atteint.

La matrice finale comprend 24 cas des six pages natives (deux sites, deux largeurs), plus quatre contrôles EasyStud issus des redirections initiales. Aucun débordement global, erreur de page, erreur console ou réponse HTTP en erreur dans les mesures finales. Un premier rejeu séquentiel de Participants natif avait enregistré « Page unloaded / Failed to fetch » ; le successeur isolé par cas ne reproduit aucune erreur, avec la file Moodle pending vide et aucun échec de requête, y compris à la fermeture du navigateur. Ces deux résultats sont conservés séparément, sans correction du produit pour obtenir le dernier résultat.

L’alignement bannière/contenu du tableau de bord et du cours est préservé. Le masquage de titre K23-17 garde sa valeur antérieure : activé sur Community, désactivé sur staging. Aucun changement de ces options ni du code CCB. Les anciennes règles de largeur et leurs sélecteurs spécifiques sont absents de la configuration relue.

Source versionnée recommandée : branche `work/codex1/k23-10-19-20261023`, `docs/operations/k23-10-universal-width.scss` et ce README. Compilation isolée Node 22.11.0 / Sass 1.79.1 ; aucun build AMD ou de feuille produit nécessaire puisque c’est un réglage de thème, pas une modification du code plugin.

Preuves complètes : `C:\dev\artifacts\k23-10-19-20261023\`. Rapport détaillé : `C:\dev\artifacts\easystud-claude-interface-review-20261011\revue-2026-10-11\RAPPORT-K23-10-19-20261023.md`.

**À la création du thème EasyEdu : intégrer la largeur et la politique d’ancrage dans le thème, puis retirer ce bloc du SCSS additionnel.**
