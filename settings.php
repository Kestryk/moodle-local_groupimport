<?php
defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    // Page de réglages du plugin local_groupimport.
    $settings = new admin_settingpage('local_groupimport',
        get_string('pluginname', 'local_groupimport'));

    $ADMIN->add('localplugins', $settings);

    global $DB;

    // Tous les champs possibles pour identifier un utilisateur.
    $fieldoptions = [
        'username' => get_string('username'),
        'email'    => get_string('email'),
        'idnumber' => get_string('idnumber'),
    ];

    // Ajout des champs de profil personnalisés.
    if ($customfields = $DB->get_records('user_info_field', null, 'name ASC')) {
        foreach ($customfields as $field) {
            $key = 'profile_field_' . $field->shortname;
            // On affiche juste le nom du champ perso.
            $fieldoptions[$key] = format_string($field->name);
        }
    }

    // 1) Multisélection : quels champs sont autorisés pour l'enseignant ?
    $settings->add(new admin_setting_configmultiselect(
        'local_groupimport/alloweduserfields',
        get_string('alloweduserfields', 'local_groupimport'),
        get_string('alloweduserfields_desc', 'local_groupimport'),
        ['username', 'email'],      // valeur par défaut.
        $fieldoptions
    ));

    // 2) Sélection du champ par défaut.
    $settings->add(new admin_setting_configselect(
        'local_groupimport/defaultuserfield',
        get_string('defaultuserfield', 'local_groupimport'),
        get_string('defaultuserfield_desc', 'local_groupimport'),
        'username',
        $fieldoptions
    ));
}
