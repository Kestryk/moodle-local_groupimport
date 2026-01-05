<?php
require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/group/lib.php'); // Fonctions groups_*

use local_groupimport\form\import_form;

// On essaie de récupérer l'id de cours soit par GET soit par POST.
$id = optional_param('id', 0, PARAM_INT);

if (!$id) {
    // Erreur plus propre si on arrive sur la page sans contexte de cours.
    print_error('missingparam', 'error', '', 'id');
}

$course = get_course($id);
require_login($course);
$context = context_course::instance($course->id);


// Seuls ceux qui gèrent les groupes peuvent utiliser cet outil.
require_capability('moodle/course:managegroups', $context);

$PAGE->set_url(new moodle_url('/local/groupimport/index.php', ['id' => $course->id]));
$PAGE->set_context($context);
$PAGE->set_title(get_string('groupimport', 'local_groupimport'));
$PAGE->set_heading(format_string($course->fullname));

$mform = new import_form(null, ['courseid' => $course->id]);

$success = [];
$errors  = [];

// Bouton de téléchargement du template CSV.
$templateurl = new moodle_url('/local/groupimport/template.php', ['id' => $course->id]);

/**
 * Détecte automatiquement le séparateur (',' ou ';') à partir d'une ligne.
 *
 * @param string $line
 * @return string
 */
function local_groupimport_detect_delimiter_line(string $line): string {
    $line = trim($line);
    if ($line === '') {
        return ';';
    }
    $semicolons = substr_count($line, ';');
    $commas     = substr_count($line, ',');

    if ($commas > $semicolons) {
        return ',';
    }
    return ';';
}

/**
 * Parse un contenu CSV en structure header/rows.
 * Gère à la fois les séparateurs ';' et ','.
 *
 * @param string $content
 * @param array $errors
 * @return array ['header' => array, 'rows' => array]
 */
function local_groupimport_parse_csv_content(string $content, array &$errors): array {
    $lines = preg_split("/\r\n|\n|\r/", $content);

    // Trouver la première ligne non vide pour détecter le séparateur.
    $headerline = null;
    foreach ($lines as $line) {
        if (trim($line) !== '') {
            $headerline = $line;
            break;
        }
    }

    if ($headerline === null) {
        $errors[] = 'Le fichier CSV est vide.';
        return ['header' => [], 'rows' => []];
    }

    $delimiter = local_groupimport_detect_delimiter_line($headerline);

    // Parse header.
    $header = str_getcsv($headerline, $delimiter);
    $header = array_map('trim', $header);

    // Parse rows.
    $rows = [];
    $started = false;
    foreach ($lines as $line) {
        if (!$started) {
            // On skippe la première occurrence de la ligne d'en-tête.
            if (trim($line) === trim($headerline)) {
                $started = true;
            }
            continue;
        }
        if (trim($line) === '') {
            continue;
        }
        $data = str_getcsv($line, $delimiter);
        $data = array_map('trim', $data);
        $rows[] = $data;
    }

    return ['header' => $header, 'rows' => $rows];
}

if ($mform->is_cancelled()) {
    redirect(course_get_url($course));

} else if ($data = $mform->get_data()) {

    // Récupération du contenu du fichier uploadé.
    $content = $mform->get_file_content('importfile');

     // 🔧 Nettoyage global du BOM au début du fichier (si présent).
    if (substr($content, 0, 3) === "\xEF\xBB\xBF") {
        $content = substr($content, 3);
    }

    // Champ utilisé pour identifier l'utilisateur (username, email, idnumber, profil perso).
    $config = get_config('local_groupimport');
    $userfield = !empty($data->userfield)
        ? $data->userfield
        : (!empty($config->defaultuserfield) ? $config->defaultuserfield : 'username');

    if ($content === false || $content === null || $content === '') {
        $errors[] = get_string('csvloaderror', 'local_groupimport', 'Empty file');

    } else {
        // Parsing CSV maison (compatible ; et ,).
        $parsed  = local_groupimport_parse_csv_content($content, $errors);
        $columns = $parsed['header'];
        $rows    = $parsed['rows'];

        if (empty($columns)) {
            if (empty($errors)) {
                $errors[] = get_string('csvmissingcolumns', 'local_groupimport');
            }


                  } else {
            // Normaliser les noms de colonnes : trim, suppression BOM, minuscule.
            $normalized = [];
            foreach ($columns as $idx => $name) {
                // On enlève un éventuel BOM UTF-8 au début.
                $clean = preg_replace('/^\xEF\xBB\xBF/u', '', $name);
                $clean = trim($clean);
                $normalized[$idx] = strtolower($clean);
            }

            // On attend : useridentifier, groupname, (optionnel) groupingname.
            $identifierindex = array_search('useridentifier', $normalized);
            $groupnameindex  = array_search('groupname', $normalized);
            $groupingindex   = array_search('groupingname', $normalized); // peut être false.

            if ($identifierindex === false || $groupnameindex === false) {
                $errors[] = get_string('csvmissingcolumns', 'local_groupimport');
            } else {

                foreach ($rows as $line) {
                    $identifier   = isset($line[$identifierindex]) ? trim($line[$identifierindex]) : '';
                    $groupname    = isset($line[$groupnameindex]) ? trim($line[$groupnameindex]) : '';
                    $groupingname = ($groupingindex !== false && isset($line[$groupingindex]))
                        ? trim($line[$groupingindex]) : '';


                    if ($identifier === '' && $groupname === '') {
                        continue;
                    }
                    if ($identifier === '' || $groupname === '') {
                        $errors[] = "Ligne invalide : useridentifier ou groupname manquant.";
                        continue;
                    }


                    // 1. Récupérer l'utilisateur selon le champ choisi.
                    $user = null;

                    if ($userfield === 'username') {
                        $user = $DB->get_record('user', ['username' => $identifier, 'deleted' => 0]);

                    } else if ($userfield === 'email') {
                        $user = $DB->get_record('user', ['email' => $identifier, 'deleted' => 0]);

                    } else if ($userfield === 'idnumber') {
                        $user = $DB->get_record('user', ['idnumber' => $identifier, 'deleted' => 0]);

                    } else if (strpos($userfield, 'profile_field_') === 0) {
                        // Champ de profil personnalisé.
                        $shortname = substr($userfield, strlen('profile_field_'));

                        $sql = "SELECT u.*
                                FROM {user} u
                                JOIN {user_info_data} d ON d.userid = u.id
                                JOIN {user_info_field} f ON f.id = d.fieldid
                                WHERE f.shortname = :shortname
                                AND d.data = :data
                                AND u.deleted = 0";

                        $params = ['shortname' => $shortname, 'data' => $identifier];
                        $users = $DB->get_records_sql($sql, $params);

                        if (count($users) === 1) {
                            $user = reset($users);
                        } else if (count($users) > 1) {
                            $errors[] = "Plusieurs utilisateurs correspondent à '$identifier' pour le champ '$shortname'.";
                        }
                    }

                    if (!$user) {
                        $errors[] = "Utilisateur '$identifier' introuvable.";
                        continue;
                    }


                    // 2. Vérifier s'il est inscrit dans le cours.
                    if (!is_enrolled($context, $user->id)) {
                        $errors[] = "Utilisateur '$identifier' non inscrit dans ce cours.";
                        continue; // Pas d'enrolment créé : on skip.
                    }

                    // 3. Récupérer ou créer le groupe.
                    $groupid = groups_get_group_by_name($course->id, $groupname);
                    if (!$groupid) {
                        $groupdata = new stdClass();
                        $groupdata->courseid = $course->id;
                        $groupdata->name     = $groupname;
                        $groupid = groups_create_group($groupdata);
                        if (!$groupid) {
                            $errors[] = "Impossible de créer le groupe '$groupname' pour l'utilisateur '$identifier'.";
                            continue;
                        }
                    }

                    // 4. Récupérer ou créer le groupement (optionnel).
                    $groupingid = null;
                    if (!empty($groupingname)) {
                        $groupingid = $DB->get_field('groupings', 'id', [
                            'courseid' => $course->id,
                            'name'     => $groupingname
                        ]);
                        if (!$groupingid) {
                            $groupingdata = new stdClass();
                            $groupingdata->courseid = $course->id;
                            $groupingdata->name     = $groupingname;
                            $groupingid = groups_create_grouping($groupingdata);
                            if (!$groupingid) {
                                $errors[] = "Impossible de créer le groupement '$groupingname' pour le groupe '$groupname'.";
                            }
                        }

                        if ($groupingid) {
                            // Vérifier manuellement si le groupe est déjà rattaché au groupement.
                            if (!$DB->record_exists('groupings_groups', [
                                'groupingid' => $groupingid,
                                'groupid'    => $groupid
                            ])) {
                                groups_assign_grouping($groupingid, $groupid);
                            }
                        }
                    }

                    // 5. Ajouter l'utilisateur au groupe (sans doublon).
                    if (!groups_is_member($groupid, $user->id)) {
                        groups_add_member($groupid, $user->id);
                        $msg = "Utilisateur '$identifier' ajouté au groupe '$groupname'";
                        if (!empty($groupingname)) {
                            $msg .= " (groupement '$groupingname')";
                        }
                        $success[] = $msg . '.';
                    } else {
                        $errors[] = "Utilisateur '$identifier' déjà membre du groupe '$groupname'.";
                    }
                }
            }
        }
    }
}

// Affichage.
echo $OUTPUT->header();

// Conteneur principal.
echo html_writer::start_div('container mt-4', ['id' => 'local_groupimport-page']);

// Carte pour le formulaire.
echo html_writer::start_div('card shadow-sm mb-4');
echo html_writer::div(get_string('groupimport', 'local_groupimport'), 'card-header h5 mb-0');

echo html_writer::start_div('card-body');

// Bouton template + description.
echo html_writer::div(
    $OUTPUT->single_button($templateurl, get_string('downloadtemplate', 'local_groupimport')),
    'mb-3',
    ['id' => 'local_groupimport-templatebtn']
);


echo html_writer::tag(
    'p',
    get_string('importfile_help', 'local_groupimport'),
    ['class' => 'text-muted']
);

// Formulaire Moodle (avec filepicker).
echo html_writer::start_div('', ['id' => 'local_groupimport-form']);
$mform->display();
echo html_writer::end_div();

echo html_writer::end_div(); // card-body
echo html_writer::end_div(); // card

// Carte pour les résultats.
echo html_writer::start_div('card shadow-sm', ['id' => 'local_groupimport-results']);
echo html_writer::div(get_string('importresults', 'local_groupimport'), 'card-header h5 mb-0');
echo html_writer::start_div('card-body');

if (empty($success) && empty($errors)) {
    echo html_writer::div(get_string('noresults', 'local_groupimport'), 'text-muted');
} else {
    echo html_writer::tag('h6', get_string('importsummary', 'local_groupimport'), ['class' => 'mb-3']);

    if (!empty($success)) {
        echo html_writer::tag('h6', get_string('successheader', 'local_groupimport'), ['class' => 'text-success']);
        echo html_writer::start_tag('ul', ['class' => 'mb-3']);
        foreach ($success as $msg) {
            echo html_writer::tag('li', s($msg));
        }
        echo html_writer::end_tag('ul');
    }

    if (!empty($errors)) {
        echo html_writer::tag('h6', get_string('errorheader', 'local_groupimport'), ['class' => 'text-danger']);
        echo html_writer::start_tag('ul', ['class' => 'mb-0']);
        foreach ($errors as $msg) {
            echo html_writer::tag('li', s($msg));
        }
        echo html_writer::end_tag('ul');
    }
}

echo html_writer::end_div(); // card-body
echo html_writer::end_div(); // card

// Bouton retour au cours.
$courseurl = course_get_url($course);
echo html_writer::div(
    $OUTPUT->single_button($courseurl, get_string('backtocourse', 'local_groupimport')),
    'mt-3'
);

echo html_writer::end_div(); // container

echo $OUTPUT->footer();
