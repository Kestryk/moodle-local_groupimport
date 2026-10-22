# Inventaire de compatibilité Bootstrap et API internes

Source analysée : 8f7a5f1ffb72c22545666daf34675d55a12447c0. Plancher vérifié en lecture seule : Moodle 4.5.11 (Build: 20260420), branch 405. Aucun runtime 4.5 lancé, aucun fichier 4.5 modifié.

Périmètre : sources SCSS et templates actifs, puis les chaînes HTML/liaisons Moodle des modules AMD. Les assets générés et miroirs ne sont pas recomptés comme de nouveaux usages. Les propriétés CSS physiques border-left/right ne sont pas des classes Bootstrap et sont exclues. Aucun appel à un mixin Bootstrap spécifique BS4 (sr-only, media-breakpoint, theme-color) trouvé : le mixin visually-hidden recensé appartient au Kit.

## Classes et adaptateurs BS4

« Équivalent 4.5 » désigne le remplacement proposé, pas la présence de la classe historique : tous les usages historiques ci-dessous existent sous 4.5. Une réponse Non signifie qu’un remplacement direct casserait le rendu de ce plancher sans couche de compatibilité.

| Fichier : ligne | Usage | Remplacement envisagé | Équivalent 4.5 | Limite |
| --- | --- | --- | --- | --- |
| amd/src/easyedu_guide.js:4106 | sr-only | visually-hidden | Non | Absent du Boost 4.5 vérifié ; le Kit a un mixin visually-hidden, mais pas une classe hôte universelle. Retirer sr-only seul rendrait le contenu visible. |
| amd/src/local/cm/long_lists.js:28 | sr-only | visually-hidden | Non | Absent du Boost 4.5 vérifié ; le Kit a un mixin visually-hidden, mais pas une classe hôte universelle. Retirer sr-only seul rendrait le contenu visible. |
| amd/src/local/cm/messaging.js:72 | form-group | mb-3 (espacement seulement) | Oui | mb-3 existe en 4.5, mais ne remplace pas toute la structure Moodle form-group. Le sélecteur du dialogue accepte déjà les deux. |
| scss/components/_layout.scss:767 | custom-select | form-select | Non | form-select absent du Boost 4.5 vérifié ; les six champs portent déjà les deux classes. Conserver le repli custom-select. |
| scss/easyedu/adapters/_moodle-file-deposit.scss:287 | form-inline | d-flex + align-items-center + flex-wrap | Oui | Ces utilitaires existent en Bootstrap 4.5 ; le DOM du file picker reste fourni par le cœur et ne doit pas être renommé par le plugin. |
| scss/easyedu/adapters/_moodle-message-dialog.scss:67 | form-group | mb-3 (espacement seulement) | Oui | mb-3 existe en 4.5, mais ne remplace pas toute la structure Moodle form-group. Le sélecteur du dialogue accepte déjà les deux. |
| scss/responsive/_mobile.scss:193 | custom-select | form-select | Non | form-select absent du Boost 4.5 vérifié ; les six champs portent déjà les deux classes. Conserver le repli custom-select. |
| scss/responsive/_mobile.scss:669 | custom-select | form-select | Non | form-select absent du Boost 4.5 vérifié ; les six champs portent déjà les deux classes. Conserver le repli custom-select. |
| templates/easyedu_guide.mustache:54 | sr-only | visually-hidden | Non | Absent du Boost 4.5 vérifié ; le Kit a un mixin visually-hidden, mais pas une classe hôte universelle. Retirer sr-only seul rendrait le contenu visible. |
| templates/easyedu_guide.mustache:92 | sr-only | visually-hidden | Non | Absent du Boost 4.5 vérifié ; le Kit a un mixin visually-hidden, mais pas une classe hôte universelle. Retirer sr-only seul rendrait le contenu visible. |
| templates/easyedu_guide.mustache:203 | sr-only | visually-hidden | Non | Absent du Boost 4.5 vérifié ; le Kit a un mixin visually-hidden, mais pas une classe hôte universelle. Retirer sr-only seul rendrait le contenu visible. |
| templates/easyedu_guide.mustache:662 | sr-only | visually-hidden | Non | Absent du Boost 4.5 vérifié ; le Kit a un mixin visually-hidden, mais pas une classe hôte universelle. Retirer sr-only seul rendrait le contenu visible. |
| templates/easyedu_guide.mustache:739 | sr-only | visually-hidden | Non | Absent du Boost 4.5 vérifié ; le Kit a un mixin visually-hidden, mais pas une classe hôte universelle. Retirer sr-only seul rendrait le contenu visible. |
| templates/easyedu_guide.mustache:764 | sr-only | visually-hidden | Non | Absent du Boost 4.5 vérifié ; le Kit a un mixin visually-hidden, mais pas une classe hôte universelle. Retirer sr-only seul rendrait le contenu visible. |
| templates/manage.mustache:175 | custom-select | form-select | Non | form-select absent du Boost 4.5 vérifié ; les six champs portent déjà les deux classes. Conserver le repli custom-select. |
| templates/manage.mustache:192 | custom-select | form-select | Non | form-select absent du Boost 4.5 vérifié ; les six champs portent déjà les deux classes. Conserver le repli custom-select. |
| templates/manage.mustache:207 | custom-select | form-select | Non | form-select absent du Boost 4.5 vérifié ; les six champs portent déjà les deux classes. Conserver le repli custom-select. |
| templates/manage.mustache:313 | custom-select | form-select | Non | form-select absent du Boost 4.5 vérifié ; les six champs portent déjà les deux classes. Conserver le repli custom-select. |
| templates/manage.mustache:434 | custom-select | form-select | Non | form-select absent du Boost 4.5 vérifié ; les six champs portent déjà les deux classes. Conserver le repli custom-select. |
| templates/manage.mustache:873 | custom-select | form-select | Non | form-select absent du Boost 4.5 vérifié ; les six champs portent déjà les deux classes. Conserver le repli custom-select. |
| scss/easyedu/adapters/_moodle-message-dialog.scss:38 | close | btn-close | Oui | Le bridge Boost 4.5 définit btn-close par extension de close ; garder le sélecteur des modales natives 4.5 tant que le cœur génère close. |

Les six champs custom-select portent déjà form-select : c’est un double marquage de compatibilité, pas un oubli de migration. Le commentaire « data-target fallback » du Guide décrit sa propre résolution de cible, pas un attribut Bootstrap ; aucun data-toggle/data-target/data-dismiss Bootstrap n’est émis par les templates actuels. Aucun autre ancien utilitaire BS4 de la liste de migration officielle n’a été trouvé (badge-pill, btn-block, input-group-append/prepend, form-row, ml/mr/pl/pr, font-weight-*…).

## Dépendances non publiques ou internes touchées par une migration

Les modules core/local/* et core_user/local/* sont traités comme dépendances d’implémentation. core/mustache est présent en 4.5 mais sa présence ne garantit pas un contrat public de rendu Moodle ; la façade documentée est core/templates. On ne confond pas absence de contrat public et déclaration formelle @private.

| Fichier : lignes | Appel / dépendance | Présent en 4.5 | Équivalent public 4.5 | Risque / conclusion |
| --- | --- | --- | --- | --- |
| amd/src/local/sm/groups.js:28, 29, 48, 49, 262, 301, 322, 455 | core/local/templates/loader.getTemplate + core/mustache.parse/render | Oui | Oui : core/templates.renderForPromise, disponible en 4.5 ; aucune API publique équivalente au cache brut de source + rendu synchrone. Migration asynchrone à préparer. | Dépendance interne/non contractuelle ; conserver les overrides de thème, partials et chaînes. |
| amd/src/local/sm/participants.js:33, 34, 87, 106, 237 | core/local/templates/loader.getTemplate + core/mustache.parse/render | Oui | Oui : core/templates.renderForPromise en 4.5 ; pas de remplacement synchrone transparent. | Même couplage au moteur interne ; ne pas remplacer à l’aveugle. |
| amd/src/local/sm/specimen.js:36, 200 | core/mustache.render | Oui | Oui : core/templates.renderForPromise en 4.5 ; adaptation Promise et neutralisation des spécimens à préserver. | Wrapper de bibliothèque tiers présent, mais pas API publique de rendu Moodle recommandée. |
| amd/src/local/cm/messaging.js:243, 249 | core_user/local/participants/bulkactions.showSendMessage(ids) | Oui | Non : pas de façade publique 4.5 identique ouvrant cette fenêtre ; core_user/repository.sendMessagesToUsers et core/modal_save_cancel existent, mais ne remplacent pas seuls l’UI. | Module local interne ; retour modal et décoration DOM aussi couplés au cœur. |
| amd/src/local/cm/messaging.js:41-74, 175 | Structure native .modal-header/.modal-title/#bulk-message/.form-group ; observation des conteneurs | Oui | Non : pas de contrat public stable des descendants ; core/modal et core/modal_events existent en 4.5. | Dépendance DOM concernée par la migration BS4/BS5 ; à tester sans changement ici. |
| amd/src/csv_import.js:41-72 | M.core_filepicker.instances, instance.options.elementid/itemid/clientId et DOM filepicker-wrapper-/file_info_ | Oui | Non : pas de registre AMD public 4.5 à substitution directe ; champ mform filepicker public présent. | Inspection interne de l’implémentation YUI du sélecteur. |
| amd/src/csv_import.js:206-219 | M.form_filepicker.callback + repository/repository_ajax.php?action=upload | Oui | Non : pas de fonction publique de remplacement à signature identique pour ce flux ; Files API côté PHP existe en 4.5. | Callback et protocole du widget natif ; capacités/sesskey/limites à préserver lors d’une future migration. |
| amd/src/csv_import.js:281-293 | M.form_filepicker.instances[elementId].fileadded ; M.form_filepicker.Y.one(...).simulate(change) | Oui | Partiel : Event(change) natif existe en 4.5 et le code le prévoit déjà ; pas de propriété publique remplaçant fileadded. | Champs d’état privés/non contractuels du widget, pas une API applicative. |
| amd/src/csv_import.js:330-350 | repository/draftfiles_ajax.php action=delete + picker.options.itemid | Oui | Non : pas de façade JS publique identique ; File API PHP existe en 4.5. | Endpoint AJAX utilisé par le cœur ; ne pas qualifier de service externe public stable. |

PHP : aucun appel externe à une méthode PHP privée identifié dans les surfaces concernées. classes/form/import_form.php utilise les propriétés protégées _form et _customdata de moodleform : extension prévue du Form API 4.5, pas accès illégal à du privé. Les API groupes, File API, render_from_template, core_external, core_user/fields et DML utilisées par le plugin restent des API publiques et ne justifient pas une migration X7. core/reactive est documenté en 4.5 ; son import de modules local internes appartient au cœur, pas au consommateur.

## Sources et décision

- [Migration Bootstrap 5 officielle](https://moodledev.io/docs/4.5/guides/bs5migration) ; les présences et absences ci-dessus ont aussi été contrôlées dans le SCSS Boost 4.5.
- [Templates Moodle 4.5](https://moodledev.io/docs/4.5/guides/templates) et lib/amd/src/templates.js pour renderForPromise.
- [API reactive 4.5](https://moodledev.io/docs/4.5/guides/javascript/reactive) : import public à conserver.
- Empreintes des fichiers cœur consultés et tous les usages : compatibility-inventory.json dans les preuves externes du lot.

Aucune migration X6/X7 appliquée. Recommandation : conserver les replis BS4 jusqu’à une recette 4.5 dédiée ; préparer un chantier asynchrone séparé pour core/templates et un adaptateur explicite de file picker/messagerie, sans remplacer ces derniers par des signatures supposées.
