<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

namespace core\lock;

/**
 * Isolated background import lock double.
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class background_import_lock_config {
        /** @var array Resources held by this request. */
    public static array $held = [];
        /** @var int Successful acquisitions. */
    public static int $acquired = 0;
        /** @var int Successful releases. */
    public static int $released = 0;

        /**
         * Require the actual plugin factory name.
         * @param string $component Lock factory component.
         * @return self Isolated factory.
         */
    public static function get_lock_factory(string $component): self {
        if ($component !== 'local_groupimport') {
            throw new \RuntimeException('Unexpected lock component');
        }
        return new self();
    }

        /**
         * Model exclusive ownership, never silently fake a pre-held resource.
         * @param string $resource Per-course resource.
         * @param int $timeout Bounded acquisition timeout.
         * @return lock|false Owned lock, or contention.
         */
    public function get_lock(string $resource, int $timeout): lock|false {
        if (!preg_match('/^(importcourse|movecourse)_[0-9]+$/', $resource) || $timeout !== 5) {
            throw new \RuntimeException('Unexpected lock resource or timeout');
        }
        if (isset(self::$held[$resource])) {
            return false;
        }
        self::$held[$resource] = true;
        self::$acquired++;
        return new lock($resource);
    }
}
