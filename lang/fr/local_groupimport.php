<?php
// Plugin local : import de groupes par CSV dans le contexte d'un cours.

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Import de groupes (Excel/CSV)';
$string['groupimport'] = 'Import groupes (Excel)';
$string['downloadtemplate'] = 'Télécharger le modèle d’import';
$string['importfile'] = 'Fichier d’import (CSV issu d’Excel)';
$string['importfile_help'] = 'Importez un fichier CSV avec les colonnes : useridentifier;groupname;groupingname (groupingname est optionnel). Le séparateur peut être ";" ou ",". Le champ useridentifier est interprété en fonction du champ choisi (username, email, idnumber ou champ personnalisé).';
$string['submitimport'] = 'Lancer l’import';
$string['importresults'] = 'Résultats de l’import';
$string['successheader'] = 'Lignes traitées avec succès';
$string['errorheader'] = 'Lignes en erreur';
$string['noresults'] = 'Aucun résultat à afficher pour le moment. Téléversez un fichier pour lancer l’import.';
$string['templatename'] = 'modele_import_groupes.csv';
$string['csvmissingcolumns'] = 'Le CSV ne contient pas toutes les colonnes requises : useridentifier, groupname (et éventuellement groupingname).';
$string['csvloaderror'] = 'Erreur lors de la lecture du fichier CSV : {$a}';
$string['importsummary'] = 'Résumé de l’import';
$string['backtocourse'] = 'Retour au cours';
$string['privacy:metadata'] = 'Le plugin local groupimport ne stocke pas de données personnelles en dehors des inscriptions déjà existantes dans les cours.';
$string['alloweduserfields'] = 'Champs utilisables pour identifier les utilisateurs';
$string['alloweduserfields_desc'] = 'Sélectionnez les champs qui pourront être utilisés comme identifiant dans les fichiers d’import (username, email, idnumber ou champs de profil personnalisés).';

$string['defaultuserfield'] = 'Champ identifiant par défaut';
$string['defaultuserfield_desc'] = 'Champ qui sera choisi par défaut dans le formulaire d’import. Il doit faire partie des champs autorisés ci-dessus.';

$string['userfield'] = 'Champ utilisé pour identifier l’utilisateur';
$string['userfield_help'] = 'Ce champ indique comment interpréter la colonne "useridentifier" du fichier CSV : par exemple username, email, idnumber ou un champ de profil personnalisé.';


$string['tour_groupimport_teacher_name'] = 'Guide : Import de groupes (enseignants)';
$string['tour_groupimport_teacher_desc'] = 'Visite guidée pour importer des groupes et inscriptions depuis un CSV, avec contrôle d’existence et d’inscription au cours.';

$string['tour_groupimport_step1_title'] = 'Importer des groupes depuis un CSV';
$string['tour_groupimport_step1_content'] = 'Cette page vous permet de créer des groupes et d’y inscrire des étudiants à partir d’un fichier CSV. Les étudiants inexistants ou non inscrits au cours ne seront pas ajoutés, et l’import continue même en cas d’erreurs.';

$string['tour_groupimport_step2_title'] = 'Télécharger le modèle CSV';
$string['tour_groupimport_step2_content'] = 'Commencez par télécharger le modèle afin de respecter les colonnes attendues (useridentifier, groupname et éventuellement groupingname).';

$string['tour_groupimport_step3_title'] = 'Déposer votre fichier CSV';
$string['tour_groupimport_step3_content'] = 'Sélectionnez ensuite votre fichier CSV. Les séparateurs « ; » et « , » sont acceptés.';

$string['tour_groupimport_step4_title'] = 'Choisir le champ d’identification';
$string['tour_groupimport_step4_content'] = 'Choisissez comment identifier les utilisateurs (username, email, idnumber ou champ de profil personnalisé).';

$string['tour_groupimport_step5_title'] = 'Lancer l’import';
$string['tour_groupimport_step5_content'] = 'Cliquez sur le bouton pour démarrer l’import. Les inscriptions réussies et les erreurs seront listées dans le compte-rendu.';

$string['tour_groupimport_step6_title'] = 'Lire le compte-rendu';
$string['tour_groupimport_step6_content'] = 'Le compte-rendu détaille les inscriptions effectuées et les erreurs (utilisateur introuvable, non inscrit au cours, déjà membre du groupe, etc.).';