<?php
defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Group Import (CSV)';
$string['groupimport'] = 'Group Import (CSV)';

// Template & file import
$string['downloadtemplate'] = 'Download CSV template';
$string['importfile'] = 'Import file (CSV)';
$string['importfile_help'] = 'Upload a CSV file with the columns: useridentifier;groupname;groupingname (groupingname is optional). The separator may be ";" or ",". The "useridentifier" column is interpreted according to the user identification field chosen in the import form (username, email, idnumber or a custom profile field).';

// Buttons & sections
$string['submitimport'] = 'Run import';
$string['importresults'] = 'Import results';
$string['importsummary'] = 'Import summary';

// Results messages
$string['successheader'] = 'Successfully processed lines';
$string['errorheader'] = 'Lines with errors';
$string['noresults'] = 'No results to display yet. Upload a CSV file to begin the import.';

// Error messages
$string['csvmissingcolumns'] = 'The CSV is missing one or more required columns: useridentifier, groupname (and optionally groupingname).';
$string['csvloaderror'] = 'Error while reading the CSV file: {$a}';

// Template filename
$string['templatename'] = 'groupimport_template.csv';

// Navigation
$string['backtocourse'] = 'Back to course';

// Privacy
$string['privacy:metadata'] = 'The local groupimport plugin does not store any personal data. It only processes existing enrolment information.';

// -------------------------
// ADMIN SETTINGS
// -------------------------

// Allowed identification fields
$string['alloweduserfields'] = 'User fields allowed for identification';
$string['alloweduserfields_desc'] = 'Select which user fields can be used to identify learners in CSV import files (username, email, idnumber or any custom profile fields).';

// Default identification field
$string['defaultuserfield'] = 'Default user identification field';
$string['defaultuserfield_desc'] = 'This field will be pre-selected in the import form. It must be one of the allowed fields defined above.';

// -------------------------
// FORM: User identification field
// -------------------------

$string['userfield'] = 'User identification field';
$string['userfield_help'] = 'This option specifies how the "useridentifier" column of the CSV file should be interpreted—for example as a username, an email address, an ID number, or as the value of a custom profile field.';

// -------------------------
// GUIDED TOURS
// -------------------------

$string['tour_groupimport_teacher_name'] = 'Guide: Group import (teachers)';
$string['tour_groupimport_teacher_desc'] = 'Guided tour to import groups and enrolments from a CSV file, with checks on user existence and course enrolment.';

$string['tour_groupimport_step1_title'] = 'Import groups from a CSV';
$string['tour_groupimport_step1_content'] = 'This page allows you to create groups and enrol students from a CSV file. Users who do not exist or are not enrolled in the course will not be added, and the import continues even if errors occur.';

$string['tour_groupimport_step2_title'] = 'Download the CSV template';
$string['tour_groupimport_step2_content'] = 'Start by downloading the template to ensure the expected columns are respected (useridentifier, groupname and optionally groupingname).';

$string['tour_groupimport_step3_title'] = 'Upload your CSV file';
$string['tour_groupimport_step3_content'] = 'Then select your CSV file. Both “;” and “,” separators are supported.';

$string['tour_groupimport_step4_title'] = 'Choose the identification field';
$string['tour_groupimport_step4_content'] = 'Choose how users should be identified (username, email, idnumber or a custom profile field).';

$string['tour_groupimport_step5_title'] = 'Start the import';
$string['tour_groupimport_step5_content'] = 'Click the button to start the import. Successful enrolments and errors will be listed in the report.';

$string['tour_groupimport_step6_title'] = 'Review the report';
$string['tour_groupimport_step6_content'] = 'The report details completed enrolments and errors (user not found, not enrolled in the course, already a group member, etc.).';

$string['tour_groupimport_coursehome_name'] = 'Tip: Find Group import in the More menu';
$string['tour_groupimport_coursehome_desc'] = 'On the course home page, shows where to find the group import entry.';
$string['tour_groupimport_coursehome_step1_title'] = 'Where is Group import?';
$string['tour_groupimport_coursehome_step1_content'] = 'In the navigation at the top of the course, open the “More” menu. You will find “Group import” there to access the tool.';

$string['tour_groupimport_coursehome_name'] = 'Astuce : Import de groupes dans le menu Plus';
$string['tour_groupimport_coursehome_desc'] = 'Sur l’accueil du cours, indique où trouver l’entrée d’import de groupes.';
$string['tour_groupimport_coursehome_step1_title'] = 'Où trouver l’import de groupes ?';
$string['tour_groupimport_coursehome_step1_content'] = 'Dans la navigation en haut du cours, ouvrez le menu « Plus ». Vous y trouverez l’entrée « Import de groupes » pour accéder à l’outil.';

