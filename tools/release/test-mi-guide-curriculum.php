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
// Isolated contract harness for the Mass Import Guide curriculum (GMI-C1): no Moodle bootstrap.

/**
 * Standalone local_groupimport test: Mass Import Guide curriculum contract.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

$root = realpath(__DIR__ . '/../..');
$strings = [];
foreach (['en', 'fr'] as $lang) {
    $string = [];
    require($root . '/lang/' . $lang . '/local_groupimport.php');
    $strings[$lang] = $string;
}
$currentlanguage = 'en';

/**
 * Isolated get_string: plugin strings come from the real lang files, core strings echo their key.
 *
 * @param string $key String key.
 * @param string $component Component.
 * @param mixed $a Placeholder value.
 * @return string
 */
function get_string($key, $component = 'moodle', $a = null) {
    global $strings, $currentlanguage;
    if ($component !== 'local_groupimport') {
        return $key;
    }
    if (!isset($strings[$currentlanguage][$key])) {
        throw new RuntimeException('Missing ' . $currentlanguage . ' string: ' . $key);
    }
    $text = $strings[$currentlanguage][$key];
    if (is_object($a)) {
        foreach (get_object_vars($a) as $name => $value) {
            $text = str_replace('{$a->' . $name . '}', (string) $value, $text);
        }
    } else if ($a !== null) {
        $text = str_replace('{$a}', (string) $a, $text);
    }
    return $text;
}

/**
 * Isolated s().
 *
 * @param string $value Text.
 * @return string
 */
function s($value) {
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

/**
 * Minimal html_writer double.
 */
class html_writer {
    /**
     * Wrap content in a tag.
     *
     * @param string $name Tag name.
     * @param string $content Content.
     * @param array $attributes Ignored.
     * @return string
     */
    public static function tag($name, $content, $attributes = []) {
        return '<' . $name . '>' . $content . '</' . $name . '>';
    }
}

require_once($root . '/classes/local/guide_discovery.php');
require_once($root . '/classes/local/guide_specimen.php');
require_once($root . '/classes/local/mass_import_guide.php');

use local_groupimport\local\mass_import_guide;
use local_groupimport\local\guide_specimen;

$failures = [];
$check = static function (bool $condition, string $message) use (&$failures): void {
    if (!$condition) {
        $failures[] = $message;
    }
};

$expectedids = ['use-this-guide', 'mi-overview', 'mi-prepare-file', 'mi-drop-preview', 'mi-review-preview',
    'mi-reimport-strategy', 'mi-run-import', 'mi-read-report', 'mi-history-restore', 'mi-ready'];
$check(mass_import_guide::slide_ids() === $expectedids, 'The ten stable slide identifiers, in order');

foreach (['en', 'fr'] as $lang) {
    $currentlanguage = $lang;
    try {
        $data = mass_import_guide::template_data(['allowedfields' => ['Username', 'Email address']]);
    } catch (Throwable $exception) {
        $failures[] = $lang . ': ' . $exception->getMessage();
        continue;
    }
    $check(array_column($data['slides'], 'id') === $expectedids, $lang . ': template slide identifiers');
    $check($data['slidecount'] === 10, $lang . ': slide count');
    foreach ($data['slides'] as $index => $slide) {
        $label = $lang . ' slide ' . ($index + 1) . ' (' . $slide['id'] . ')';
        $check($slide['index'] === $index && $slide['navnumber'] === $index + 1, $label . ': index and navnumber');
        foreach (['title', 'navtitle', 'category', 'navcategorylabel', 'navtooltip', 'content', 'icon', 'navicon'] as $field) {
            $check(isset($slide[$field]) && trim(strip_tags($slide[$field])) !== '', $label . ': ' . $field . ' not empty');
        }
        $check(strpos($slide['navtooltip'], '{$a') === false, $label . ': tooltip placeholders replaced');
        if ($slide['id'] !== 'use-this-guide') {
            $check(count($slide['commonintroduction']['topics']) === 3, $label . ': three explanations');
        }
    }
    $note = $data['slides'][2]['commonintroduction']['note'];
    $check(strpos($note, 'Username, Email address') !== false, $lang . ': dynamic compared-fields note');
    $check(count(array_filter(array_column($data['slides'], 'targetselector'))) === 8, $lang . ': eight interface targets');
    // GMI-C2: every specimen and anatomy is wired to its slide, with the numbers of the Penpot boards.
    $byid = array_column($data['slides'], null, 'id');
    $check($byid['mi-prepare-file']['guidespecimen']['kind'] === 'mifile'
        && count($byid['mi-prepare-file']['guidespecimen']['rows']) === 6
        && count($byid['mi-prepare-file']['guidespecimen']['columns']) === 3
        && count($byid['mi-prepare-file']['guidespecimen']['legend']) === 3, $lang . ': mifile specimen');
    $check($byid['mi-reimport-strategy']['guidespecimen']['kind'] === 'mistrategy'
        && count($byid['mi-reimport-strategy']['guidespecimen']['frames']) === 2, $lang . ': mistrategy specimen');
    $check($byid['mi-run-import']['guidespecimen']['kind'] === 'mirun'
        && count($byid['mi-run-import']['guidespecimen']['frames']) === 3, $lang . ': mirun specimen');
    $report = $byid['mi-read-report']['guidespecimen'];
    $check(
        $report['kind'] === 'mireport' && count($report['success']) === 4 && count($report['errors']) === 2,
        $lang . ': mireport specimen'
    );
    $check($byid['mi-overview']['anatomy']['type'] === 'mipage' && count($byid['mi-overview']['anatomy']['legend']) === 5
        && !empty($byid['mi-overview']['example']['body']), $lang . ': page anatomy and example notice');
    $check($byid['mi-history-restore']['anatomy']['type'] === 'mihistory'
        && count($byid['mi-history-restore']['anatomy']['legend']) === 5, $lang . ': history anatomy');
    $ready = $byid['mi-ready']['guidespecimen'];
    $check($ready['kind'] === 'ready' && array_column($ready['tiles'], 'index') === [2, 4, 6, 8], $lang . ': ready tiles');
    foreach ($ready['tiles'] as $tile) {
        $check(trim($tile['review']) !== '' && strpos($tile['review'], '{$a') === false, $lang . ': ready review label');
    }
    $check(array_column(guide_specimen::ready()['tiles'], 'index') === [2, 7, 8, 11],
        $lang . ': Student Management ready tiles unchanged');
    foreach (['mifile', 'mistrategy', 'mirun', 'mireport'] as $kind) {
        $check(trim($byid[['mifile' => 'mi-prepare-file', 'mistrategy' => 'mi-reimport-strategy', 'mirun' => 'mi-run-import',
            'mireport' => 'mi-read-report'][$kind]]['guidespecimen']['label']) !== '', $lang . ': ' . $kind . ' label');
    }
    json_encode($data, JSON_THROW_ON_ERROR);
    $config = mass_import_guide::js_config(71, 5);
    json_encode($config, JSON_THROW_ON_ERROR);
    foreach (array_keys(mass_import_guide::js_config(71, 5)['labels']) as $labelkey) {
        $check(trim($config['labels'][$labelkey]) !== '', $lang . ': engine label ' . $labelkey);
    }
}

// EN/FR parity for the Mass Import Guide strings.
$keys = [];
foreach (['en', 'fr'] as $lang) {
    $keys[$lang] = array_values(array_filter(array_keys($strings[$lang]), static fn($key) => strpos($key, 'mi_guide_') === 0));
    sort($keys[$lang]);
}
$check($keys['en'] === $keys['fr'], 'EN/FR mi_guide_* key parity');
$check(count($keys['en']) > 100, 'mi_guide_* strings exist');
foreach ($keys['en'] as $key) {
    $en = $strings['en'][$key];
    $fr = $strings['fr'][$key] ?? '';
    $check(trim($en) !== '' && trim($fr) !== '', $key . ': not empty');
    preg_match_all('/\{\$a[^}]*\}/', $en, $enplaceholders);
    preg_match_all('/\{\$a[^}]*\}/', $fr, $frplaceholders);
    $check($enplaceholders[0] === $frplaceholders[0], $key . ': same placeholders');
    $check(strpos($fr, "'") === false, $key . ': FR uses the typographic apostrophe');
    $check(preg_match('/ [:;?!»]|« /u', $fr) === 0, $key . ': FR uses no-break spaces before :;?! and inside guillemets');
}

// Every literal mi_guide_* key used by the PHP class exists.
$source = file_get_contents($root . '/classes/local/mass_import_guide.php');
preg_match_all("/'(mi_guide_[a-z0-9_]+)'/", $source, $literals);
foreach (array_unique($literals[1]) as $key) {
    if (substr($key, -1) === '_') {
        continue; // Dynamic prefix, covered by running template_data in both languages.
    }
    $check(isset($strings['en'][$key]) && isset($strings['fr'][$key]), 'Used string exists: ' . $key);
}

// Example names live in the lang files only, never as PHP literals.
foreach (
    ['Alice', 'Martin', 'Garnier', 'Zoé', 'Zoe ', 'Dubois', 'Leroy', 'Hugo', 'Petit', 'Alex ', 'Dupont', 'TD 1', 'TD 2',
    'TD 9', 'Année 2026', 'td-2026', '10482', 'alice.martin', 'example.test', 'entree-inconnue'] as $name
) {
    $check(stripos($source, $name) === false, 'Example name is not a PHP literal: ' . trim($name));
}

// Stable presentation key and storage.
$config = mass_import_guide::js_config(71, 5);
$check($config['presentationKey'] === 'mass-import-20261018', 'presentationKey is stable');
$check($config['presentationKey'] === mass_import_guide::PRESENTATION_KEY, 'presentationKey constant');
$check($config['slideIds'] === $expectedids, 'slideIds match the curriculum');
$check($config['storageKey'] === 'local_groupimport.mi_guide.u5.c71', 'storageKey is distinct from Student Management');
$check($config['welcomeOffer'] === false && $config['firstVisit'] === false, 'no welcome bubble, no automatic opening');

// GMI-C4: guided path "check a file without importing anything" (cahier section 1.15).
$path = $config['paths'][mass_import_guide::PATH_ID] ?? [];
$check(array_column($path, 'id') === ['download-example', 'add-file', 'preview-file', 'exclude-row', 'read-strategy',
    'cancel-preview'], 'guided path: six steps in order');
foreach ($path as $index => $step) {
    $check(isset($config['targets'][$step['target']]), 'guided path target exists: ' . $step['target']);
    $check($step['target'] !== 'miRunImport', 'guided path never targets Run import: ' . $step['id']);
    $check(strpos($step['open'] ?? 'mi:', 'mi:') === 0, 'guided path opener is a Mass Import opener: ' . $step['id']);
    $check($index === 0 || $step['requiresStep'] === $path[$index - 1]['id'], 'guided path order is locked: ' . $step['id']);
}
$check(strpos(json_encode($config['targets']['miRunImport']), 'preview-submit') !== false, 'Run import target is data-*');
$check(isset($config['pathLabels'][mass_import_guide::PATH_ID]), 'guided path label');
foreach (['en', 'fr'] as $lang) {
    $currentlanguage = $lang;
    $slide = mass_import_guide::template_data(['allowedfields' => ['Username']])['slides'][4];
    $check($slide['guidedpath'] === mass_import_guide::PATH_ID && trim($slide['guidedpathwarning']) !== '',
        $lang . ': lesson 5 carries the path card and its K18-07 warning');
}

if ($failures) {
    fwrite(STDERR, "FAIL\n - " . implode("\n - ", $failures) . "\n");
    exit(1);
}
echo json_encode(['test' => 'mi-guide-curriculum', 'passed' => true, 'slides' => count($expectedids),
    'strings' => count($keys['en'])]) . "\n";
