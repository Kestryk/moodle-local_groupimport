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
 * Extract one named literal array from a producer without bootstrapping its page.
 *
 * @param string $source PHP producer source.
 * @param string $key Array key whose literal value is required.
 * @return string Complete array expression, including its brackets.
 * @throws RuntimeException If the definition is absent, duplicated or unbounded.
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
function local_groupimport_fixture_source_array(string $source, string $key): string {
    $tokens = token_get_all($source);
    $matches = [];
    $count = count($tokens);
    for ($index = 0; $index < $count; $index++) {
        $token = $tokens[$index];
        if (
            !is_array($token) || $token[0] !== T_CONSTANT_ENCAPSED_STRING ||
                !in_array($token[1], ["'" . $key . "'", '"' . $key . '"'], true)
        ) {
            continue;
        }
        $next = $index + 1;
        while (
            $next < $count && is_array($tokens[$next]) &&
                in_array($tokens[$next][0], [T_WHITESPACE, T_COMMENT, T_DOC_COMMENT], true)
        ) {
            $next++;
        }
        if ($next >= $count || !is_array($tokens[$next]) || $tokens[$next][0] !== T_DOUBLE_ARROW) {
            continue;
        }
        $next++;
        while (
            $next < $count && is_array($tokens[$next]) &&
                in_array($tokens[$next][0], [T_WHITESPACE, T_COMMENT, T_DOC_COMMENT], true)
        ) {
            $next++;
        }
        if ($next >= $count || $tokens[$next] !== '[') {
            throw new RuntimeException('Expected literal array: ' . $key);
        }
        $depth = 0;
        $expression = '';
        for (; $next < $count; $next++) {
            $part = $tokens[$next];
            $expression .= is_array($part) ? $part[1] : $part;
            if ($part === '[') {
                $depth++;
            } else if ($part === ']' && --$depth === 0) {
                $matches[] = $expression;
                break;
            }
        }
        if ($depth !== 0) {
            throw new RuntimeException('Unbounded literal array: ' . $key);
        }
    }
    if (count($matches) !== 1) {
        throw new RuntimeException('Expected exactly one literal array: ' . $key);
    }
    return $matches[0];
}
