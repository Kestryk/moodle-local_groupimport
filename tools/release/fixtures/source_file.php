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
 * Temporary, caller-scope inclusion of token-extracted source in isolated tests.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Materialise the unchanged extracted PHP in a private temporary include file.
 *
 * Require at the call site retains its variable scope and return/exception semantics.
 * Magic source locations retain the original calling script location.
 *
 * @param string $source Extracted PHP without an opening tag.
 * @return string Private include filename, removed on process shutdown.
 */
function local_groupimport_fixture_source_file(string $source): string {
    $caller = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 1)[0]['file'];
    $rewritten = '';
    foreach (token_get_all('<?php ' . $source) as $token) {
        if (is_array($token) && $token[0] === T_OPEN_TAG) {
            continue;
        }
        if (is_array($token) && $token[0] === T_DIR) {
            $rewritten .= var_export(dirname($caller), true);
        } else if (is_array($token) && $token[0] === T_FILE) {
            $rewritten .= var_export($caller, true);
        } else {
            $rewritten .= is_array($token) ? $token[1] : $token;
        }
    }
    $path = tempnam(sys_get_temp_dir(), 'easystud-source-');
    if ($path === false) {
        throw new RuntimeException('Cannot allocate isolated PHP source.');
    }
    chmod($path, 0600);
    register_shutdown_function(static function () use ($path): void {
        if (is_file($path)) {
            unlink($path);
        }
    });
    if (file_put_contents($path, '<?php ' . $rewritten) === false) {
        throw new RuntimeException('Cannot write isolated PHP source.');
    }
    return $path;
}
