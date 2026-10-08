<?php
// This file is part of Moodle - https://moodle.org/
// Moodle is distributed under the GNU GPL v3 or later.

namespace local_groupimport\local;

defined('MOODLE_INTERNAL') || die();

/**
 * Server-owned welcome generation. No course data or mass user update.
 *
 * The presentation adapter must mark an actual opening, never an invitation
 * impression. A request carries the generation rendered into that page, so a
 * stale tab cannot acknowledge a newer administrator reset.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class guide_welcome {
    /** Current user's last actually opened welcome generation. */
    public const PREFERENCE = 'local_groupimport_guide_welcome_seen';

    /** Single plugin-wide generation setting; reset is O(1). */
    public const SETTING = 'guidewelcomegeneration';

    /** @return string Current generation, including legacy installations. */
    public static function generation(): string {
        return (string)(get_config('local_groupimport', self::SETTING) ?: 'initial');
    }

    /** @return bool Whether the authenticated nonguest user has not opened this generation. */
    public static function should_offer(): bool {
        return isloggedin() && !isguestuser() &&
            (string)get_user_preferences(self::PREFERENCE, '') !== self::generation();
    }

    /**
     * Record only the current logged-in user's actual opening.
     *
     * The controller must also require sesskey and an explicit POST. False is
     * an obsolete request, not an instruction to overwrite the current token.
     *
     * @param string $generation Generation from the rendered page.
     * @return bool Whether the acknowledgement belongs to the current generation.
     */
    public static function mark_opened(string $generation): bool {
        require_login(null, false);
        if (isguestuser() || $generation !== self::generation()) {
            return false;
        }
        set_user_preference(self::PREFERENCE, $generation);
        return true;
    }

    /**
     * Reset welcome invitations without deleting or rewriting user preferences.
     *
     * The admin controller must require confirmation, POST and sesskey. Keeping
     * the capability check here protects every future caller as well.
     *
     * @return string New generation.
     */
    public static function reset(): string {
        require_login(null, false);
        require_capability('moodle/site:config', \context_system::instance());
        $generation = bin2hex(random_bytes(16));
        set_config(self::SETTING, $generation, 'local_groupimport');
        return $generation;
    }
}
