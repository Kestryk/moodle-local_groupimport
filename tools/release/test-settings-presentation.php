<?php
// This file is part of Moodle - http://moodle.org/
/**
 * Database-free regression test for the actual settings presentation predicates.
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('URL_MATCH_BASE', 0);
class moodle_url {
    public function __construct(public string $path, private string $section = '') {
    }
    public function compare(self $other, int $match): bool {
        return $this->path === $other->path;
    }
    public function get_param(string $name): string {
        return $this->section;
    }
}
class moodle_page {
    public const STATE_BEFORE_HEADER = 0;
    public int $reads = 0;
    public function __construct(public int $state, private ?moodle_url $pageurl) {
    }
    public function has_set_url(): bool {
        return $this->pageurl !== null;
    }
    public function __get(string $name): moodle_url {
        $this->reads++;
        if ($this->pageurl === null) {
            throw new RuntimeException('An unset URL must not be read.');
        }
        return $this->pageurl;
    }
}
$source = file_get_contents(__DIR__ . '/../../settings.php');
$pattern = <<<'REGEX'
/if \((\$PAGE->state.*?get_param\('section'\) === 'local_groupimport')\) \{/s
REGEX;
preg_match_all($pattern, $source, $matches);
if (count($matches[1]) !== 2) {
    throw new RuntimeException('Both presentation predicates must be covered.');
}
$results = [];
foreach ($matches[1] as $index => $predicate) {
    foreach ([
        'unset-url' => [0, null, false, 0],
        'own-settings' => [0, new moodle_url('/admin/settings.php', 'local_groupimport'), true, 2],
        'other-section' => [0, new moodle_url('/admin/settings.php', 'manageauths'), false, 2],
        'other-page' => [0, new moodle_url('/admin/search.php', 'local_groupimport'), false, 1],
        'header-started' => [1, new moodle_url('/admin/settings.php', 'local_groupimport'), false, 0],
    ] as $name => [$state, $url, $expected, $reads]) {
        $PAGE = new moodle_page($state, $url);
        $actual = eval('return ' . $predicate . ';');
        if ($actual !== $expected || $PAGE->reads !== $reads) {
            throw new RuntimeException('Presentation regression: ' . $index . '/' . $name);
        }
        $results[] = ['predicate' => $index, 'case' => $name, 'presentation' => $actual, 'urlReads' => $PAGE->reads];
    }
}
echo json_encode(['pass' => true, 'cases' => $results], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . PHP_EOL;
