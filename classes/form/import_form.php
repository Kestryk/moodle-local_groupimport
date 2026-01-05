<?php
namespace local_groupimport\form;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/formslib.php');

class import_form extends \moodleform {

    public function definition() {
        global $DB;

        $mform = $this->_form;

    // Récupérer l'id de cours passé en customdata.
    $courseid = $this->_customdata['courseid'] ?? 0;

    // Champ caché pour renvoyer l'id du cours au submit.
    $mform->addElement('hidden', 'id', $courseid);
    $mform->setType('id', PARAM_INT);

    // --- Fichier CSV ---
    $mform->addElement(
        'filepicker',
        'importfile',
        get_string('importfile', 'local_groupimport'),
        null,
        ['accepted_types' => ['.csv']]
    );
    $mform->addRule('importfile', null, 'required', null, 'client');

        // --- Choix du champ identifiant ---
        $config = get_config('local_groupimport');

        // Tous les champs possibles.
        $alloptions = [
            'username' => get_string('username'),
            'email'    => get_string('email'),
            'idnumber' => get_string('idnumber'),
        ];

        if ($customfields = $DB->get_records('user_info_field', null, 'name ASC')) {
            foreach ($customfields as $field) {
                $key = 'profile_field_' . $field->shortname;
                $alloptions[$key] = format_string($field->name);
            }
        }

        // Champs autorisés en admin.
        if (!empty($config->alloweduserfields)) {
            $allowed = explode(',', $config->alloweduserfields);
        } else {
            // fallback : username seulement.
            $allowed = ['username'];
        }

        // Ne garder que ceux qui existent encore.
        $options = array_intersect_key($alloptions, array_flip($allowed));

        // Champ par défaut.
        $defaultuserfield = !empty($config->defaultuserfield) && isset($options[$config->defaultuserfield])
            ? $config->defaultuserfield
            : reset($allowed);

        $mform->addElement('select', 'userfield',
            get_string('userfield', 'local_groupimport'), $options);
        $mform->setDefault('userfield', $defaultuserfield);
        $mform->addHelpButton('userfield', 'userfield', 'local_groupimport');

        // Bouton d'envoi.
        $this->add_action_buttons(false, get_string('submitimport', 'local_groupimport'));
    }
}
