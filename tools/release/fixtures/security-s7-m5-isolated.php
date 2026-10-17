<?php
namespace core\event {
    class base {
        const LEVEL_TEACHING = 1;
        protected array $data = [];
        public function __get($key) {
            return $this->data[$key] ?? null;
        }
        public static function create(array $data): static {
            $e = new static();
            $e->data = $data + ['userid' => 77, 'courseid' => $data['context']->instanceid];
            $e->init();
            return $e;
        }
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
    class moodle_exception extends RuntimeException {public function __construct($key, $component = '', ...$rest) {
            parent::__construct($key);
    }
    }
    class core_text {public static function substr($s, $start, $length) {
            return mb_substr($s, $start, $length);
    }
    }
    class context_course {public int $id;
        public function __construct(public int $instanceid) {
            $this->id = 1000 + $instanceid;

        }public static function instance($id) {
            return new self($id);
        }
    }
    function required_param($key, $type) {
        return $key === 'id' ? 5 : 7;
    }
    function get_course($id) {
        return (object)['id' => $id];
    }
    function require_login($course) {
        $GLOBALS['auth'][] = 'login';
    }
    function require_capability($capability, $context) {
        $GLOBALS['auth'][] = $capability;
        if($GLOBALS['denied'])throw new RuntimeException('Denied');
    }
    function get_string($key, $component) {
        return $GLOBALS['translations'][$GLOBALS['language']][$key] ?? $key;
    }
    function clean_filename($name) {
        return $name;
    }
    function make_request_directory() {
        return $GLOBALS['requestdir'];
    }
    function local_groupimport_history_desired_state($changes, $course) {
        return $changes['desiredstate'] ?? [];
    }
    function send_file($content, $filename, $cache, $filter, $forcedownload, $dontdie, $mime) {
        $GLOBALS['download'] = compact('content', 'filename', 'mime');
    }
    class memory_db {
        public object $record;
        public function get_record($table, $conditions, $fields, $strict) {
            if($GLOBALS['auth'] !== ['login', 'moodle/course:managegroups'])throw new RuntimeException('Lookup before auth');
            if($table !== 'local_groupimport_history' || $conditions !== ['id' => 7, 'courseid' => 5])throw new RuntimeException('Unscoped history read');
            return clone $this->record;
        }
    }
    function run_export(string $file): void {
        global $DB;
        $tokens = token_get_all(file_get_contents($file));
        $source = '';
        $skip = false;
        $requires = 0;
        foreach($tokens as $token){
            if(is_array($token) && $token[0] === T_OPEN_TAG)continue;
            if(is_array($token) && $token[0] === T_REQUIRE_ONCE){$skip = true;
                $requires++;
                continue;
            }
            if($skip){if($token === ';')$skip = false;
                continue;
            }
            $source .= is_array($token) ? $token[1] : $token;
        }
        if($requires !== 2)throw new RuntimeException('Review changed bootstrap boundary');
        eval($source);
    }
    $checks = 0;
    function check($ok, $label) {
        $GLOBALS['checks']++;
        if(!$ok)throw new RuntimeException($label);
    }
    $root = dirname(__DIR__, 3);
    require $root . '/classes/local/report_export.php';
    require $root . '/classes/event/report_exported.php';
    use local_groupimport\local\report_export as policy;
    $translations = [];
    foreach(['en', 'fr'] as $language){$string = [];
        require $root . '/lang/' . $language . '/local_groupimport.php';
        $translations[$language] = $string;
    }
    $unsafe = ['=1+1', '+SUM(1,2)', '-1', '@SUM(A1:A2)', "\tvalue", "\rvalue", "\nvalue", '  =1+1', '＝1+1', '＋1', '－1', '＠name', "\u{FEFF}=1+1"];
    $safe = ['00123', '1E20', '12345678901234567890', '2026-10-17', 'a@example.test', 'Équipe été', '', "'already literal", 'safe = value'];
    foreach($unsafe as $value)check(policy::text($value) === "'" . $value, 'Executable prefix neutralized');
    foreach($safe as $value)check(policy::text($value) === $value, 'Safe text unchanged');
    $probe = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
    $probesheet = $probe->getActiveSheet();
    policy::write_row($probesheet, 1, ['', '=1+1', '00123']);
    foreach(['A1', 'B1', 'C1'] as $coordinate)check($probesheet->getCell($coordinate)->getDataType() === 's', 'Explicit type before serialization, including empty');
    $probe->disconnectWorksheets();
    $values = array_merge($unsafe, $safe);
    $rows = [];
    foreach($values as $i => $value)$rows[] = ['identifier' => '00123', 'groupname' => $value, 'groupingname' => '00007', 'status' => ['success', 'warning', 'error'][$i % 3], 'messages' => [$value]];
    $DB = new memory_db();
    $DB->record = (object)['id' => 7, 'courseid' => 5, 'filename' => 'original.csv', 'changesjson' => json_encode(['reportrows' => $rows])];
    $requestdir = sys_get_temp_dir() . '/easystud-s7-' . bin2hex(random_bytes(8));
    mkdir($requestdir);
    $files = [];
    try{
        foreach(['en', 'fr'] as $language){
            $auth = [];
            $events = [];
            $download = null;
            $denied = false;
            $translations[$language]['templatecolumnidentifier'] = '=HEADER';
            run_export($root . '/export.php');
            check($auth === ['login', 'moodle/course:managegroups'], 'Original authorization order');
            check($download['mime'] === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && $download['filename'] === 'original_report.xlsx', 'Original download contract');
            check(count($events) === 1 && $events[0]['data']['objectid'] === 7 && $events[0]['data']['crud'] === 'r', 'Native read event');
            check(!str_contains(json_encode($events), 'a@example.test') && !str_contains(json_encode($events), 'original.csv'), 'No report identity/filename in event');
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
            check($sheet->getCell('A1')->getValue() === "'=HEADER" && $sheet->getCell('A1')->getDataType() === 's', 'Header explicitly neutralized text');
            foreach($values as $i => $value){$r = $i + 2;
                check((string)$sheet->getCell('B' . $r)->getValue() === str_replace(["\r\n", "\r"], "\n", policy::text($value)), 'Group literal XLSX roundtrip index ' . $i . ' actual=' . bin2hex((string)$sheet->getCell('B' . $r)->getValue()) . ' expected=' . bin2hex(policy::text($value)));
                check($sheet->getCell('A' . $r)->getValue() === '00123' && $sheet->getCell('C' . $r)->getValue() === '00007', 'Leading zero ids preserved');
                foreach(['A', 'B', 'C', 'D', 'E'] as $c){
                    $cell = $sheet->getCell($c . $r);
                    check($cell->getDataType() === 's' || ($cell->getValue() === null && in_array($c, ['B', 'E'], true) && $value === ''), 'Every populated report cell is text (native blank reload may be null)');
                }
            }
            $book->disconnectWorksheets();
        }
        $language = 'en';
        $auth = [];
        $events = [];
        $download = null;
        $denied = true;
        try{run_export($root . '/export.php');
            throw new RuntimeException('Expected denial');
        }catch(RuntimeException$e){check($e->getMessage() === 'Denied' && $download === null && $events === [], 'Denied requests create no report/event');
        }
        $denied = false;
        $auth = [];
        $DB->record->changesjson = 'broken';
        try{run_export($root . '/export.php');
            throw new RuntimeException('Expected invalid history');
        }catch(moodle_exception$e){check($download === null && $events === [] && glob($requestdir . '/report_*') === [], 'Invalid history no output/event');
        }
        $auth = [];
        $DB->record->changesjson = json_encode(['desiredstate' => [['identifier' => '00042', 'groupname' => '=1+1', 'groupingname' => 'G']]]);
        run_export($root . '/export.php');
        check($download !== null && count($events) === 1, 'Legacy report fallback uses same writer');
        $source = file_get_contents($root . '/export.php');
        check(!str_contains($source, '->fromArray(') && substr_count($source, 'report_export::write_row(') === 2, 'All header/body paths explicit');
        echo json_encode(['suite' => 'S7-M5-real-export-isolated', 'passed' => true, 'checks' => $checks, 'locales' => ['en', 'fr'], 'formulaNodes' => 0, 'databaseConnections' => 0, 'runtimeAccess' => false]) . PHP_EOL;
    }finally{foreach($files as $p)if(is_file($p))unlink($p);
        foreach(glob($requestdir . '/report_*') as $p)if(is_file($p))unlink($p);
        rmdir($requestdir);
    }
}
