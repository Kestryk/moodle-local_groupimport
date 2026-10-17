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
// Real Mustache, no Moodle bootstrap; prove current shared-Guide rendering unchanged.

/**
 * Standalone local_groupimport test fixture or release helper.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
$lib = $argv[1] ?? '';
require $lib . '/mustache/src/Mustache/Autoloader.php';
Mustache_Autoloader::register();
$root = dirname(__DIR__, 3);
$proc = proc_open(
    ['git',
         '-C',
         $root,
         'show',
         '4110785e:templates/manage.mustache'],
    [1 =>
         ['pipe',
         'w'],
         2 =>
         ['pipe',
         'w']],
    $pipes
);
$before = stream_get_contents($pipes[1]);
$error = stream_get_contents($pipes[2]);
fclose($pipes[1]);
fclose($pipes[2]);
if (proc_close($proc) !== 0)throw new RuntimeException($error);
$before = str_replace("\r\n", "\n", $before);
$after = str_replace("\r\n", "\n", file_get_contents($root . '/templates/manage.mustache'));
$loader = new
/**
 * Isolated fixture double for __construct.
 */
class ($root) implements Mustache_Loader {
    /**
     * Perform isolated fixture operation __construct.
     * @param private $root Fixture argument.
     * @return mixed Fixture result.
     */
    public function __construct(
        /**
         * @var mixed Standalone fixture state.
         */
        private $root
    ) {
    }
    /**
     * Perform isolated fixture operation load.
     * @param mixed $name Fixture argument.
     * @return mixed Fixture result.
     */
    public function load($name) {
        $name = preg_replace('~^local_groupimport/~', '', $name);
        if (!preg_match('~^[a-zA-Z0-9_/-]+$~', $name) || str_contains($name, '..'))throw new RuntimeException('Invalid partial');
        $p = $this->root . '/templates/' . $name . '.mustache';
        if (!is_file($p))throw new RuntimeException('Missing partial ' . $name);
        return file_get_contents($p);
    }
};
$mustache = new Mustache_Engine(['partials_loader' => $loader]);
$checks = 0;
/**
 * Perform isolated fixture operation check.
 * @param mixed $ok Fixture argument.
 * @param mixed $label Fixture argument.
 * @return mixed Fixture result.
 */
function check($ok, $label) {
    $GLOBALS['checks']++;
    if (!$ok)throw new RuntimeException($label);
}
$normalize = static fn($html)=>preg_replace('/>\s+</', '><', trim($html));
foreach (['fr', 'en'] as $lang)foreach ([true, false] as $compact) {
    $context = ['useeasyeduguide' =>
         true,
         'compactparticipantsdefault' =>
         $compact,
         'defaultfocusclass' =>
         'local-groupimport-easystud--participant-focus',
         'courseid' =>
         5,
         'userkey' =>
         7,
         'motionlevel' =>
         'full',

        'navigation' =>
         ['hasguide' =>
         true,
         'guidehtml' =>
         '<div data-easyedu-guide-root="1">' . ($lang === 'fr' ? 'Guide actuel' : 'Current guide') . '</div>'],

        'participants' => [['id' => 11, 'fullname' => 'Alex Example', 'email' => 'alex@example.test']],
        'groupings' => [], 'groups' => [], 'str' => static fn($text)=>'[' . $text . ']'];
    $a = $normalize($mustache->render($before, $context));
    $b = $normalize($mustache->render($after, $context));
    if ($a !== $b) {
        $i = 0;
        while ($i < min(strlen($a), strlen($b)) && $a[$i] === $b[$i])$i++;
        throw new RuntimeException('Render diff at ' . $i . ' before=' . json_encode(substr(
            $a,
            max(
                0,
                $i - 60
            ),
            200
        )) . ' after=' . json_encode(substr(
            $b,
            max(
                0,
                $i - 60
            ),
            200
        )));
    }
    check($a === $b, 'current rendered markup unchanged ' . $lang . '/' . ($compact ? 'compact' : 'full'));
    check(substr_count($b, 'data-easyedu-guide-root=') === 1, 'one current Guide root');
    check(!str_contains($b, 'data-easystud-tutorial-modal='), 'no legacy modal rendered');
}
echo json_encode(['surface' =>
         'P2-current-template-parity',
         'passed' =>
         true,
         'checks' =>
         $checks,
         'locales' =>
         ['fr',
         'en'],
         'densities' =>
         2,
         'runtimeAccess' =>
         false]),
         "\n";
