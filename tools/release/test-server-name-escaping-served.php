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
 * Standalone CLI test fixture and release validation.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Read-only native Moodle renderer check; no records or configuration are written.

define('CLI_SCRIPT', true);

require($argv[1] . '/config.php');
require_once($CFG->dirroot . '/local/groupimport/lib.php');
$course = get_course(5);
$context = context_course::instance($course->id);
$PAGE->set_course($course);
$PAGE->set_context($context);
$PAGE->set_url('/local/groupimport/manage.php', ['id' => $course->id]);
$renderer = $PAGE->get_renderer('core');
$cases = [
    ['QA & < > " ' . "'", 'QA & < > " ' . "'"],
    ['QA &amp; literal', 'QA &amp; literal'],
    ['QA <b>bold</b> & quote', 'QA bold & quote'],
];
$report = [];
$check = static function (string $actual, string $expected, string $where): void {
    if ($actual !== $expected) {
        throw new RuntimeException($where . ': ' . json_encode(['actual' => $actual, 'expected' => $expected]));
    }
};
foreach ($cases as [$raw, $expected]) {
    $state = ['users' => [], 'groups' => [17 => ['id' => 17, 'name' => format_string($raw), 'rawname' => $raw]],
        'groupings' => [23 => ['id' => 23, 'name' => format_string($raw), 'rawname' => $raw]], 'untouched' => ['keep']];
    $plain = local_groupimport_prepare_manage_names($state, $context);
    $check($plain['groups'][17]['name'], $expected, 'group plain context');
    $check($plain['groupings'][23]['name'], $expected, 'grouping plain context');
    if ($plain['untouched'] !== $state['untouched'] || $plain['groups'][17]['rawname'] !== $raw) {
        throw new RuntimeException('Adapter changed unrelated state');
    }
    $html = $renderer->render_from_template('local_groupimport/manage', [
        'groupings' => array_values($plain['groupings']),
        'groupoptions' => [['value' => '17', 'label' => $plain['groups'][17]['name']]],
        'groupingoptions' => [['value' => '23', 'label' => $plain['groupings'][23]['name']]],
    ]);
    $html .= $renderer->render_from_template('local_groupimport/sm/group_card', $plain['groups'][17]);
    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    $dom->loadHTML('<?xml encoding="utf-8" ?>' . $html, LIBXML_NONET);
    libxml_clear_errors();
    $xpath = new DOMXPath($dom);
    foreach (['local-groupimport-easystud-grouping__name', 'local-groupimport-easystud-group__name'] as $class) {
        $nodes = $xpath->query('//*[contains(concat(" ", normalize-space(@class), " "), " ' . $class . ' ")]');
        if ($nodes->length !== 1) {
            throw new RuntimeException('Expected one rendered name: ' . $class);
        }
        $check($nodes->item(0)->textContent, $expected, $class);
    }
    foreach (['17', '23'] as $value) {
        $nodes = $xpath->query('//option[@value="' . $value . '"]');
        if ($nodes->length < 1) {
            throw new RuntimeException('Expected rendered filter option: ' . $value);
        }
        foreach ($nodes as $node) {
            $check($node->textContent, $expected, 'filter option');
        }
    }
    if ($xpath->query('//b')->length || $xpath->query('//script')->length) {
        throw new RuntimeException('Rendered fixture contains an injected element');
    }
    $report[] = ['context' => true, 'groupCard' => true, 'groupingHeader' => true, 'filterOptions' => true];
}
echo json_encode(['passed' => true, 'cases' => $report, 'businessWrites' => 0]) . PHP_EOL;
