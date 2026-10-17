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
 * Standalone local_groupimport test fixture or release helper.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace core\event {
    /**
     * Isolated fixture double for base.
     */
    class base {
        const LEVEL_TEACHING = 1;
        /**
         * @var mixed Standalone fixture state.
         */
        protected array $data = [];
        /**
         * Perform isolated fixture operation __get.
         * @param mixed $key Fixture argument.
         * @return mixed Fixture result.
         */
        public function __get($key) {
            return $this->data[$key] ?? null;
        }
        /**
         * Perform isolated fixture operation create.
         * @param array $data Fixture argument.
         * @return static Fixture result.
         */
        public static function create(array $data): static {
            $e = new static();
            $e->data = $data + ['userid' => 77, 'courseid' => $data['context']->instanceid];
            $e->init();
            return $e;
        }
        /**
         * Perform isolated fixture operation trigger.
         * @return void Fixture result.
         */
        public function trigger(): void {
            $GLOBALS['events'][] = ['data' => $this->data, 'description' => $this->get_description(), 'name' => $this->get_name()];
        }
    }
}
namespace {
    // Execute the real export page with in-memory auth/history and real XLSX libraries.
    // Its two bootstrap requires are deliberately omitted; no Moodle config or DB.
    require __DIR__ . '/spreadsheet-libraries.php';
    define('MOODLE_INTERNAL', true);
    define('PARAM_INT', 1);
    define('MUST_EXIST', 1);
    /**
     * Isolated fixture double for moodle_exception.
     */
    class moodle_exception extends RuntimeException {
        /**
         * Perform isolated fixture operation __construct.
         * @param mixed $key Fixture argument.
         * @param mixed $component Fixture argument.
         * @param mixed $rest Fixture argument.
         * @return mixed Fixture result.
         */
        public function __construct($key, $component = '', ...$rest) {
            parent::__construct($key);
        }
    }
    /**
     * Isolated fixture double for core_text.
     */
    class core_text {
        /**
         * Perform isolated fixture operation substr.
         * @param mixed $s Fixture argument.
         * @param mixed $start Fixture argument.
         * @param mixed $length Fixture argument.
         * @return mixed Fixture result.
         */
        public static function substr($s, $start, $length) {
            return mb_substr($s, $start, $length);
        }
    }
    /**
     * Isolated fixture double for context_course.
     */
    class context_course {
        /**
         * @var mixed Standalone fixture state.
         */
        public int $id;
        /**
         * Perform isolated fixture operation __construct.
         * @param int $instanceid Fixture argument.
         * @return mixed Fixture result.
         */
        public function __construct(
            /**
             * @var mixed Standalone fixture state.
             */
            public int $instanceid
        ) {
            $this->id = 1000 + $instanceid;
        }
        /**
         * Perform isolated fixture operation instance.
         * @param mixed $id Fixture argument.
         * @return mixed Fixture result.
         */
        public static function instance($id) {
            return new self($id);
        }
    }
    /**
     * Perform isolated fixture operation required_param.
     * @param mixed $key Fixture argument.
     * @param mixed $type Fixture argument.
     * @return mixed Fixture result.
     */
    function required_param($key, $type) {
        return $key === 'id' ? 5 : 7;
    }
    /**
     * Perform isolated fixture operation get_course.
     * @param mixed $id Fixture argument.
     * @return mixed Fixture result.
     */
    function get_course($id) {
        return (object)['id' => $id];
    }
    /**
     * Perform isolated fixture operation require_login.
     * @param mixed $course Fixture argument.
     * @return mixed Fixture result.
     */
    function require_login($course) {
        $GLOBALS['auth'][] = 'login';
    }
    /**
     * Perform isolated fixture operation require_capability.
     * @param mixed $capability Fixture argument.
     * @param mixed $context Fixture argument.
     * @return mixed Fixture result.
     */
    function require_capability($capability, $context) {
        $GLOBALS['auth'][] = $capability;
        if ($GLOBALS['denied'])throw new RuntimeException('Denied');
    }
    /**
     * Perform isolated fixture operation get_string.
     * @param mixed $key Fixture argument.
     * @param mixed $component Fixture argument.
     * @return mixed Fixture result.
     */
    function get_string($key, $component) {
        return $GLOBALS['translations'][$GLOBALS['language']][$key] ?? $key;
    }
    /**
     * Perform isolated fixture operation clean_filename.
     * @param mixed $name Fixture argument.
     * @return mixed Fixture result.
     */
    function clean_filename($name) {
        return $name;
    }
    /**
     * Perform isolated fixture operation make_request_directory.
     * @return mixed Fixture result.
     */
    function make_request_directory() {
        return $GLOBALS['requestdir'];
    }
    /**
     * Perform isolated fixture operation local_groupimport_history_desired_state.
     * @param mixed $changes Fixture argument.
     * @param mixed $course Fixture argument.
     * @return mixed Fixture result.
     */
    function local_groupimport_history_desired_state($changes, $course) {
        return $changes['desiredstate'] ?? [];
    }
    /**
     * Perform isolated fixture operation send_file.
     * @param mixed $content Fixture argument.
     * @param mixed $filename Fixture argument.
     * @param mixed $cache Fixture argument.
     * @param mixed $filter Fixture argument.
     * @param mixed $forcedownload Fixture argument.
     * @param mixed $dontdie Fixture argument.
     * @param mixed $mime Fixture argument.
     * @return mixed Fixture result.
     */
    function send_file($content, $filename, $cache, $filter, $forcedownload, $dontdie, $mime) {
        $GLOBALS['download'] = compact('content', 'filename', 'mime');
    }
    /**
     * Isolated fixture double for memory_db.
     */
    class memory_db {
        /**
         * @var mixed Standalone fixture state.
         */
        public object $record;
        /**
         * Perform isolated fixture operation get_record.
         * @param mixed $table Fixture argument.
         * @param mixed $conditions Fixture argument.
         * @param mixed $fields Fixture argument.
         * @param mixed $strict Fixture argument.
         * @return mixed Fixture result.
         */
        public function get_record($table, $conditions, $fields, $strict) {
            if ($GLOBALS['auth'] !== ['login', 'moodle/course:managegroups'])throw new RuntimeException('Lookup before auth');
            if ($table !== 'local_groupimport_history' ||
            $conditions !== ['id' =>
            7,
            'courseid' =>
            5])throw new RuntimeException('Unscoped history read');
            return clone $this->record;
        }
    }
    /**
     * Perform isolated fixture operation run_export.
     * @param string $file Fixture argument.
     * @return void Fixture result.
     */
    function run_export(string $file): void {
        global $DB;
        $tokens = token_get_all(file_get_contents($file));
        $source = '';
        $skip = false;
        $requires = 0;
        foreach ($tokens as $token) {
            if (is_array($token) && $token[0] === T_OPEN_TAG)continue;
            if (is_array($token) && $token[0] === T_REQUIRE_ONCE) {
                $skip = true;
                $requires++;
                continue;
            }
            if ($skip) {
                if ($token === ';')$skip = false;
                continue;
            }
            $source .= is_array($token) ? $token[1] : $token;
        }
        if ($requires !== 2)throw new RuntimeException('Review changed bootstrap boundary');
        eval($source);
    }
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
    $root = dirname(__DIR__, 3);
    require $root . '/classes/local/report_export.php';
    require $root . '/classes/event/report_exported.php';
    use local_groupimport\local\report_export as policy;
    $translations = [];
    foreach (['en', 'fr'] as $language) {
        $string = [];
        require $root . '/lang/' . $language . '/local_groupimport.php';
        $translations[$language] = $string;
    }
    $unsafe = ['=1+1',
         '+SUM(1,2)',
         '-1',
         '@SUM(A1:A2)',
         "\tvalue",
         "\rvalue",
         "\nvalue",
         '  =1+1',
         '＝1+1',
         '＋1',
         '－1',
         '＠name',
         "\u{FEFF}=1+1"];
    $safe = ['00123',
         '1E20',
         '12345678901234567890',
         '2026-10-17',
         'a@example.test',
         'Équipe été',
         '',
         "'already literal",
         'safe = value'];
    foreach ($unsafe as $value)check(policy::text($value) === "'" . $value, 'Executable prefix neutralized');
    foreach ($safe as $value)check(policy::text($value) === $value, 'Safe text unchanged');
    $probe = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
    $probesheet = $probe->getActiveSheet();
    policy::write_row($probesheet, 1, ['', '=1+1', '00123']);
    foreach (['A1',
         'B1',
         'C1'] as $coordinate)check(
             $probesheet->getCell($coordinate)->getDataType() === 's',
             'Explicit type before serialization, including empty'
         );
    $probe->disconnectWorksheets();
    $values = array_merge($unsafe, $safe);
    $rows = [];
    foreach ($values as $i =>
         $value)$rows[] = ['identifier' =>
         '00123',
         'groupname' =>
         $value,
         'groupingname' =>
         '00007',
         'status' =>
         ['success',
         'warning',
         'error'][$i % 3],
         'messages' =>
         [$value]];
    $DB = new memory_db();
    $DB->record = (object)['id' =>
         7,
         'courseid' =>
         5,
         'filename' =>
         'original.csv',
         'changesjson' =>
         json_encode(['reportrows' =>
         $rows])];
    $requestdir = sys_get_temp_dir() . '/easystud-s7-' . bin2hex(random_bytes(8));
    mkdir($requestdir);
    $files = [];
    try {
        foreach (['en', 'fr'] as $language) {
            $auth = [];
            $events = [];
            $download = null;
            $denied = false;
            $translations[$language]['templatecolumnidentifier'] = '=HEADER';
            run_export($root . '/export.php');
            check($auth === ['login', 'moodle/course:managegroups'], 'Original authorization order');
            check(
                $download['mime'] === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
                $download['filename'] === 'original_report.xlsx',
                'Original download contract'
            );
            check(
                count($events) === 1 &&
                $events[0]['data']['objectid'] === 7 &&
                $events[0]['data']['crud'] === 'r',
                'Native read event'
            );
            check(
                !str_contains(
                    json_encode($events),
                    'a@example.test'
                ) &&
                !str_contains(
                    json_encode($events),
                    'original.csv'
                ),
                'No report identity/filename in event'
            );
            check(glob($requestdir . '/report_*') === [], 'Output temporary cleaned before send');
            $path = $requestdir . '/verify-' . $language . '.xlsx';
            $files[] = $path;
            file_put_contents($path, $download['content']);
            $zip = new ZipArchive();
            check($zip->open($path) === true, 'Valid XLSX package');
            $xml = $zip->getFromName('xl/worksheets/sheet1.xml');
            check(!preg_match('/<f(?:\s|>)/', $xml), 'No worksheet formula nodes');
            check(str_contains($xml, 'state="frozen"') && str_contains($xml, 'autoFilter'), 'Original freeze/filter retained');
            $zip->close();
            $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReader('Xlsx');
            $book = $reader->load($path);
            $sheet = $book->getActiveSheet();
            check(
                $sheet->getCell('A1')->getValue() === "'=HEADER" &&
                $sheet->getCell('A1')->getDataType() === 's',
                'Header explicitly neutralized text'
            );
            foreach ($values as $i => $value) {
                $r = $i + 2;
                check(
                    (string)$sheet->getCell('B' . $r)->getValue() === str_replace(
                        ["\r\n",
                        "\r"],
                        "\n",
                        policy::text($value)
                    ),
                    'Group literal XLSX roundtrip index ' . $i . ' actual=' . bin2hex((string)$sheet->getCell('B' . $r)->getValue()) . ' expected=' . bin2hex(policy::text($value))
                );
                check(
                    $sheet->getCell('A' . $r)->getValue() === '00123' &&
                    $sheet->getCell('C' . $r)->getValue() === '00007',
                    'Leading zero ids preserved'
                );
                foreach (['A', 'B', 'C', 'D', 'E'] as $c) {
                    $cell = $sheet->getCell($c . $r);
                    check(
                        $cell->getDataType() === 's' ||
                        ($cell->getValue() === null &&
                        in_array(
                            $c,
                            ['B',
                            'E'],
                            true
                        ) &&
                        $value === ''),
                        'Every populated report cell is text (native blank reload may be null)'
                    );
                }
            }
            $book->disconnectWorksheets();
        }
        $language = 'en';
        $auth = [];
        $events = [];
        $download = null;
        $denied = true;
        try {
            run_export($root . '/export.php');
            throw new RuntimeException('Expected denial');
        } catch (RuntimeException$e) {
            check($e->getMessage() === 'Denied' && $download === null && $events === [], 'Denied requests create no report/event');
        }
        $denied = false;
        $auth = [];
        $DB->record->changesjson = 'broken';
        try {
            run_export($root . '/export.php');
            throw new RuntimeException('Expected invalid history');
        } catch (moodle_exception$e) {
            check(
                $download === null &&
                $events === [] &&
                glob($requestdir . '/report_*') === [],
                'Invalid history no output/event'
            );
        }
        $auth = [];
        $DB->record->changesjson = json_encode(['desiredstate' =>
         [['identifier' =>
         '00042',
         'groupname' =>
         '=1+1',
         'groupingname' =>
         'G']]]);
        run_export($root . '/export.php');
        check($download !== null && count($events) === 1, 'Legacy report fallback uses same writer');
        $source = file_get_contents($root . '/export.php');
        check(
            !str_contains(
                $source,
                '->fromArray('
            ) &&
            substr_count(
                $source,
                'report_export::write_row('
            ) === 2,
            'All header/body paths explicit'
        );
        echo json_encode(['suite' =>
         'S7-M5-real-export-isolated',
         'passed' =>
         true,
         'checks' =>
         $checks,
         'locales' =>
         ['en',
         'fr'],
         'formulaNodes' =>
         0,
         'databaseConnections' =>
         0,
         'runtimeAccess' =>
         false]) . PHP_EOL;
    } finally {
        foreach ($files as $p)if (is_file($p))unlink($p);
        foreach (glob($requestdir . '/report_*') as $p)if (is_file($p))unlink($p);
        rmdir($requestdir);
    }
}
