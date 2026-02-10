<?php
namespace local_groupimport\privacy;

defined('MOODLE_INTERNAL') || die();

class provider implements \core_privacy\local\metadata\null_provider {
    /**
     * Return the language string key explaining why this plugin stores no personal data.
     */
    public static function get_reason(): string {
        return 'privacy:metadata';
    }
}
