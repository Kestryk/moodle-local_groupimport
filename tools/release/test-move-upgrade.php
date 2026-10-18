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
 * Upgrade/install parity using real Moodle XMLDB classes, without a runtime.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('CLI_SCRIPT', true);
require_once(__DIR__ . '/fixtures/standalone/config.php');
if (PHP_SAPI !== 'cli' || empty($argv[1])) {
    die("Usage: php test-move-upgrade.php <Moodle lib directory>\n");
}
$libdir = realpath($argv[1]);
if (!$libdir || !is_file($libdir . '/xmldb/xmldb_constants.php')) {
    throw new RuntimeException('A Moodle lib directory is required');
}
foreach (['constants', 'object', 'table', 'field', 'key', 'index'] as $name) {
    require_once($libdir . '/xmldb/xmldb_' . $name . '.php');
}
require_once(__DIR__ . '/fixtures/move-job-mock/upgrade_manager.php');
require_once(__DIR__ . '/../../db/upgrade.php');

/**
 * Record exactly the core savepoint API used by upgrade_noncore in 4.5/5.1.
 * @param bool $result Successful upgrade step.
 * @param int $version Step version.
 * @param string $type Plugin type.
 * @param string $name Plugin component name.
 */
function upgrade_plugin_savepoint(bool $result, int $version, string $type, string $name): void {
    $GLOBALS['movesavepoints'][] = [$result, $version, $type, $name];
}

/**
 * Fail even when PHP assertions are disabled.
 * @param bool $condition Required condition.
 * @param string $label Evidence label.
 */
function move_upgrade_expect(bool $condition, string $label): void {
    if (!$condition) {
        throw new RuntimeException($label);
    }
    $GLOBALS['moveupgradechecks'][] = $label;
}

/**
 * Compare all field/key/index attributes, excluding documentation comments.
 * @param SimpleXMLElement $table Table definition.
 * @return array
 */
function move_upgrade_schema(SimpleXMLElement $table): array {
    $schema = [];
    foreach (['FIELDS' => 'FIELD', 'KEYS' => 'KEY', 'INDEXES' => 'INDEX'] as $section => $child) {
        foreach ($table->{$section}->{$child} as $element) {
            $attributes = [];
            foreach ($element->attributes() as $key => $value) {
                if (!in_array($key, ['COMMENT', 'PREVIOUS', 'NEXT'], true)) {
                    $attributes[$key] = $key === 'FIELDS' ? implode(',', array_map('trim', explode(',', (string)$value))) :
                        (string)$value;
                }
            }
            ksort($attributes);
            $schema[$section][(string)$element['NAME']] = $attributes;
        }
    }
    return $schema;
}

$GLOBALS['movesavepoints'] = [];
$GLOBALS['moveupgradechecks'] = [];
$DB = new upgrade_manager();
move_upgrade_expect(xmldb_local_groupimport_upgrade(2026101800), 'upgrade hook succeeds');
move_upgrade_expect($DB->creates === 1, 'missing table created exactly once');
move_upgrade_expect($DB->table->getName() === 'local_groupimport_moves', 'expected table created');
$installed = simplexml_load_file(__DIR__ . '/../../db/install.xml');
$tables = $installed->xpath('/XMLDB/TABLES/TABLE[@NAME="local_groupimport_moves"]');
move_upgrade_expect(count($tables) === 1, 'one install table definition');
$upgraded = simplexml_load_string($DB->table->xmlOutput());
move_upgrade_expect(move_upgrade_schema($tables[0]) === move_upgrade_schema($upgraded), 'all install/upgrade attributes match');
move_upgrade_expect($GLOBALS['movesavepoints'] === [[true, 2026101801, 'local', 'groupimport']], 'correct plugin savepoint');
xmldb_local_groupimport_upgrade(2026101800);
move_upgrade_expect($DB->creates === 1, 'resuming with an existing table does not recreate it');
$GLOBALS['movesavepoints'] = [];
xmldb_local_groupimport_upgrade(2026101801);
move_upgrade_expect(!$GLOBALS['movesavepoints'] && $DB->creates === 1, 'up-to-date installation is untouched');
$DB = new upgrade_manager();
$DB->failcreate = true;
$failed = false;
try {
    xmldb_local_groupimport_upgrade(2026101800);
} catch (RuntimeException $error) {
    $failed = $error->getMessage() === 'Simulated DDL failure';
}
move_upgrade_expect($failed && !$GLOBALS['movesavepoints'], 'failed DDL does not write the savepoint');
$DB->failcreate = false;
xmldb_local_groupimport_upgrade(2026101800);
move_upgrade_expect($DB->creates === 1 && count($GLOBALS['movesavepoints']) === 1, 'failed step can be retried');
echo json_encode(['passed' => true, 'checks' => $GLOBALS['moveupgradechecks']], JSON_PRETTY_PRINT) . "\n";
