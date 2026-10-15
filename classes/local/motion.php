<?php
// This file is part of Moodle - https://moodle.org/
// Moodle is distributed under the GNU GPL v3 or later.

namespace local_groupimport\local;

defined('MOODLE_INTERNAL') || die();

/**
 * Animation level of the EasyEdu interface (EasyEdu rule, contract M1 of 16/10/2026).
 *
 * Three levels: full, reduced (short opacity fades only) and minimal (no animation, no costly
 * effect). The user's own choice wins; the administrator only sets the default. The system
 * "reduce motion" media is not followed by default: only the level chosen in EasyEdu counts.
 * The effective level is computed here, before the first paint, and rendered as the root
 * attribute data-easyedu-motion-level plus body classes read by the Kit CSS and Motion JS.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class motion {
    /** User preference shared by the EasyEdu family; every plugin declares it identically. */
    public const PREFERENCE = 'easyedu_motion_level';

    /** Administrator default (replaces the historical enableanimations checkbox). */
    public const SETTING = 'motionlevel';

    /** Historical checkbox, read only as a fallback until the upgrade step has migrated it. */
    public const LEGACY_SETTING = 'enableanimations';

    /** Preference value meaning "follow the administrator default". */
    public const DEFAULT = 'default';

    /** Levels, from the richest to the lightest. */
    public const LEVELS = ['full', 'reduced', 'minimal'];

    /**
     * Administrator default level.
     *
     * @return string full | reduced | minimal
     */
    public static function default_level(): string {
        $level = get_config('local_groupimport', self::SETTING);
        if (is_string($level) && in_array($level, self::LEVELS, true)) {
            return $level;
        }
        // Not migrated yet: the old checkbox unticked means no animation.
        $legacy = get_config('local_groupimport', self::LEGACY_SETTING);
        return $legacy !== false && !(bool)$legacy ? 'minimal' : 'full';
    }

    /**
     * Effective level: the user's preference when set, else the administrator default.
     *
     * @param int|null $userid User, the current user when null.
     * @return string full | reduced | minimal
     */
    public static function level(?int $userid = null): string {
        $preference = get_user_preferences(self::PREFERENCE, self::DEFAULT, $userid);
        if (is_string($preference) && in_array($preference, self::LEVELS, true)) {
            return $preference;
        }
        return self::default_level();
    }

    /**
     * Attributes of an EasyEdu root (.easyedu-ui) for a level.
     *
     * @param string $level full | reduced | minimal
     * @return array<string, string> data-easyedu-motion-level and the compatibility policy.
     */
    public static function root_attributes(string $level): array {
        return [
            'data-easyedu-motion-level' => $level,
            'data-easyedu-motion-policy' => $level === 'minimal' ? 'disabled' : 'enabled',
        ];
    }

    /**
     * Body classes of a level, for what is mounted outside the root (Moodle modals, menus, Guide).
     *
     * @param string $level full | reduced | minimal
     * @return string[]
     */
    public static function body_classes(string $level): array {
        if ($level === 'reduced') {
            return ['easyedu-motion-reduced'];
        }
        if ($level === 'minimal') {
            return ['easyedu-motion-disabled', 'local-groupimport-motion-disabled'];
        }
        return [];
    }

    /**
     * Add the body classes of the effective level to a page, before its header is printed.
     *
     * @param \moodle_page $page Page.
     * @return string The effective level.
     */
    public static function apply_to_page(\moodle_page $page): string {
        $level = self::level();
        foreach (self::body_classes($level) as $class) {
            $page->add_body_class($class);
        }
        return $level;
    }
}
