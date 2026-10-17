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

/**
 * Isolated CLI fixture definitions for the existing test contracts.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace core_privacy\local\request;

/**
 * Isolated fixture double for writer.
 */
class fixture_s2_privacy_isolated_writer {
    /**
     * @var mixed Standalone fixture state.
     */
    public static array $writers = [];
    /**
     * @var mixed Standalone fixture state.
     */
    public array $data = [];
    /**
     * Perform isolated fixture operation with_context.
     * @param \context $context Fixture argument.
     * @return self Fixture result.
     */
    public static function with_context(\context $context): self {
        return self::$writers[$context->id] ??= new self();
    }
    /**
     * Perform isolated fixture operation export_data.
     * @param array $path Fixture argument.
     * @param object $data Fixture argument.
     * @return void Fixture result.
     */
    public function export_data(array $path, object $data): void {
        $this->data = $data->imports;
    }
}
