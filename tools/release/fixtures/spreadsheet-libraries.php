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
// Standalone third-party libraries only; never load Moodle config/bootstrap.

/**
 * Standalone local_groupimport test fixture or release helper.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
$libraryroot = $argv[1] ?? '';
if (!is_dir($libraryroot . '/phpspreadsheet/phpspreadsheet/src/PhpSpreadsheet')) {
    throw new RuntimeException('Pass the path of the Moodle lib directory (read-only libraries).');
}
spl_autoload_register(static function (string $class) use ($libraryroot): void {
    $map = [
        'PhpOffice\\PhpSpreadsheet\\' => '/phpspreadsheet/phpspreadsheet/src/PhpSpreadsheet/',
        'Composer\\Pcre\\' => '/composer/pcre/src/',
        'Psr\\SimpleCache\\' => '/psr/simple-cache/src/',
        'Psr\\Http\\Message\\' => '/psr/http-message/src/',
        'ZipStream\\' => '/zipstream/src/',
        'Matrix\\' => '/phpspreadsheet/markbaker/matrix/classes/src/',
        'Complex\\' => '/phpspreadsheet/markbaker/complex/classes/src/',
    ];
    foreach ($map as $prefix => $relative) {
        if (str_starts_with($class, $prefix)) {
            $file = $libraryroot . $relative . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
            if (is_file($file)) {
                require $file;
            }
            return;
        }
    }
});
