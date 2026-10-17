<?php
/** Isolated AJAX surface verification: actual dispatch, no Moodle bootstrap or database. */
define('MOODLE_INTERNAL', true);
define('PARAM_INT', 'int');
define('MUST_EXIST', true);
define('SQL_PARAMS_NAMED', true);

$root = dirname(__DIR__, 2);
require_once($root . '/classes/local/batch_reader.php');
$source = file_get_contents($root . '/ajax.php');
$start = strpos($source, "\ntry {");
$end = strpos($source, "\nheader('Content-Type:", $start);
if ($start === false || $end === false) {
    throw new RuntimeException('AJAX dispatch boundary changed.');
}
$dispatch = substr($source, $start, $end - $start);
$checks = [];
$injected = null;
$created = null;
class moodle_exception extends RuntimeException {
}
class dml_exception extends moodle_exception { public $debuginfo = 'synthetic SQL detail'; 
}
class moodle_url {
    public function __construct($path, $params) {
    }
    public function out($escape) {
        return '/synthetic'; 
    }
}
class core_text { public static function strtolower($value) {
        return strtolower($value); 
} 
}
class fixture_database {
    public function get_records($table, $conditions, $sort, $fields) {
        return []; 
    }
    public function get_record($table, $conditions, $fields, $strict = false) {
        return (object)['id' => 11, 'courseid' => 123, 'name' => 'Synthetic grouping'];
    }
}
class identifier_database {
    public $fields = [];
    public $users;
    public function __construct() {
        $this->users = [(object)['id' => 42, 'deleted' => 0, 'firstname' => 'SyntheticFirst',
            'lastname' => 'SyntheticLast', 'username' => 'synthetic-user', 'email' => 'synthetic@example.test',
            'idnumber' => 'SYN-42']];
    }
    public function get_record($table, $conditions, $fields) {
        $this->fields[] = array_keys($conditions)[0];
        foreach ($this->users as $user) {
            if (
                count(array_filter($conditions, static fn($value, $field) =>
                    !isset($user->$field) || $user->$field != $value, ARRAY_FILTER_USE_BOTH)) === 0
            ) {
                return $user;
            }
        }
        return null;
    }
    public function get_in_or_equal($fields, $style, $prefix) {
        return ['IN (:field0)', ['field0' => $fields[0]]]; 
    }
    public function get_records_sql($sql, $params, $start, $limit) {
        $this->fields[] = 'profile_field_' . $params['field0'];
        return $params['data'] === 'SyntheticSchool' && $params['field0'] === 'School' ? $this->users : [];
    }
}
function get_config($component) {
    global $allowedfields;
    return (object)['alloweduserfields' => $allowedfields]; 
}
function required_param($name, $type) {
    return 11; 
}
function groups_get_group($id) {
    global $injected;
    if ($injected) { throw $injected; 
    }
    return (object)['id' => $id, 'courseid' => 123, 'name' => 'Synthetic group'];
}
function groups_create_group($record) {
    global $created;
    $created = $record;
    return 12; 
}
function groups_create_grouping($record) {
    global $created;
    $created = $record;
    return 12; 
}
function groups_get_members($id, $fields) {
    return []; 
}
function format_string($value) {
    return $value; 
}
function get_string($key, $component, $a = null) {
    global $string;
    if (!isset($string[$key])) { throw new RuntimeException('Missing string: ' . $key); 
    }
    return is_scalar($a) ? str_replace('{$a}', (string)$a, $string[$key]) : $string[$key];
}
function check($name, $condition) {
    global $checks;
    $checks[$name] = (bool)$condition;
    if (!$condition) { throw new RuntimeException('Failed: ' . $name); 
    }
}
require $root . '/classes/local/guide_discovery.php';
$DB = new fixture_database();
$course = (object)['id' => 123];
check(
    'AJAX_SCRIPT precedes config',
    strpos($source, "define('AJAX_SCRIPT', true);") < strpos($source, "require_once(__DIR__ . '/../../config.php')")
);
foreach (['en', 'fr'] as $language) {
    $string = [];
    $langsource = file_get_contents($root . '/lang/' . $language . '/local_groupimport.php');
    preg_match_all('/^\$string\[\x27([^\x27]+)\x27\]\s*=/m', $langsource, $keys);
    check($language . ' unique language keys', count($keys[1]) === count(array_unique($keys[1])));
    require $root . '/lang/' . $language . '/local_groupimport.php';
    foreach (['discovery_addselect', 'discovery_adddrop', 'discovery_mobileaddselect', 'discovery_mobileaddmenu', 'discovery_mobileaddvalidate', 'guideinspection_group_open', 'guideinspection_group_enter', 'guideinspection_group_review', 'guideinspection_grouping_open', 'guideinspection_grouping_enter', 'guideinspection_grouping_review', 'guideinspection_grouping_return'] as $key) {
        check($language . ' concise phase ' . $key, mb_strlen($string[$key]) <= 110);
    }
    check($language . ' participant action says Add', $string['moveselectedparticipants'] ===
        ($language === 'fr' ? 'Ajouter à un groupe' : 'Add to group'));
    check($language . ' core Add caption retained', $string['discovery_demo_add'] ===
        ($language === 'fr' ? 'Ajouter' : 'Add'));
    check($language . ' group members named correctly', $string['guideinspection_group_cardmeta'] ===
        ($language === 'fr' ? '2 membres' : '2 members'));
    for ($index = 1; $index <= 12; $index++) {
        check($language . ' short navigation ' . $index, isset($string['guide_nav_' . $index]) &&
            mb_strlen($string['guide_nav_' . $index]) <= 16);
    }
    if ($language === 'fr') {
        check(
            'French Guide glossary has no old borrowed terms',
            !preg_match('/\\b(?:checklist|desktop|slides?|Practice)\\b/i', implode("\\n", $string))
        );
        check('French lock uses angle quotes', $string['guidesteplocked'] === 'Terminer « {$a} » d’abord');
    }
    $keysets[$language] = array_keys($string);
    foreach (['duplicategroup' => 'group', 'duplicategrouping' => 'grouping'] as $action => $kind) {
        $response = ['success' => false];
        $created = null;
        eval($dispatch);
        $suffix = $language === 'fr' ? ' (copie)' : ' (copy)';
        check($language . ' ' . $action, $response['success'] &&
            $created->name === 'Synthetic ' . $kind . $suffix &&
            $response[$kind]['rawname'] === $created->name);
    }
    foreach (
        [new dml_exception('synthetic database failure'), new RuntimeException('synthetic PHP failure'),
            new moodle_exception('Synthetic human-readable error')] as $injected
    ) {
        $action = 'duplicategroup';
        $response = ['success' => false];
        eval($dispatch);
        $human = $injected instanceof moodle_exception && !($injected instanceof dml_exception);
        check($language . ' safe ' . get_class($injected), !$response['success'] &&
            $response['error'] === ($human ? $injected->getMessage() : $string['ajaxunexpectederror']));
    }
    $injected = null;
    check(
        $language . ' path and demo resume distinct',
        $string['guideresumepath'] !== $string['discovery_resume']
    );
    foreach (['group', 'grouping'] as $kind) {
        $scene = \local_groupimport\local\guide_discovery::card_inspection($kind);
        check($language . ' inspection ' . $kind . ' Add', $scene['addlabel'] === $string['discovery_demo_add']);
        check($language . ' inspection ' . $kind . ' resume', $scene['resumelabel'] === $string['discovery_resume']);
    }
}
sort($keysets['en']);
sort($keysets['fr']);
check('EN FR key parity', $keysets['en'] === $keysets['fr']);
$manage = file_get_contents($root . '/manage.php');
check('Path adapter uses distinct resume', strpos(
    $manage,
    "'guideresumelabel' => get_string('guideresumepath', 'local_groupimport')"
) !== false);
$index = file_get_contents($root . '/index.php');
// Execute the actual three guard expressions, not a copied policy predicate.
foreach (['rollbackhistoryid' => $index, 'confirmimport' => $index, 'action' => $manage] as $variable => $text) {
    $pattern = '/if \((\$' . $variable . ' && data_submitted\(\))\) \{\s*(?:global [^;]+;\s*)?require_sesskey\(\);/';
    check($variable . ' POST guard and explicit sesskey', preg_match($pattern, $text, $match) === 1);
    foreach ([false, true] as $submitted) {
        foreach ([false, true] as $validkey) {
            $guardcalls = 0;
            $$variable = 1;
            try {
                eval('if (' . $match[1] . ') { require_sesskey(); }');
                check(
                    $variable . ' ' . ($submitted ? 'POST' : 'GET') . ' key' . (int)$validkey,
                    $guardcalls === (int)$submitted && (!$submitted || $validkey)
                );
            } catch (moodle_exception $error) {
                check($variable . ' invalid POST rejected', $submitted && !$validkey && $guardcalls === 1);
            }
        }
    }
}
$resolverstart = strpos($source, 'function local_groupimport_find_user_by_identifier(');
$resolverend = strpos($source, "\n/**", $resolverstart);
check('Bounded actual identifier resolver', $resolverstart !== false && $resolverend > $resolverstart);
eval(substr($source, $resolverstart, $resolverend - $resolverstart));
$DB = new identifier_database();
foreach (['email', 'username', 'idnumber', 'profile_field_School', ''] as $allowedfields) {
    $DB->fields = [];
    check(
        'Moodle ID retained under ' . ($allowedfields ?: 'defaults'),
        local_groupimport_find_user_by_identifier('42')->id === 42
    );
    check(
        'Bare first name rejected under ' . ($allowedfields ?: 'defaults'),
        local_groupimport_find_user_by_identifier('SyntheticFirst') === null
    );
    check(
        'Bare last name rejected under ' . ($allowedfields ?: 'defaults'),
        local_groupimport_find_user_by_identifier('SyntheticLast') === null
    );
    check(
        'Name fields never queried under ' . ($allowedfields ?: 'defaults'),
        !array_intersect(['firstname', 'lastname'], $DB->fields)
    );
    foreach (
        ['email' => 'synthetic@example.test', 'username' => 'synthetic-user', 'idnumber' => 'SYN-42',
            'profile_field_School' => 'SyntheticSchool'] as $field => $token
    ) {
        $enabled = $allowedfields === $field || ($allowedfields === '' && in_array($field, ['email', 'username']));
        check(
            $field . ' respects setting ' . ($allowedfields ?: 'defaults'),
            (local_groupimport_find_user_by_identifier($token) !== null) === $enabled
        );
    }
}
check('Empty identifier rejected', local_groupimport_find_user_by_identifier('  ') === null);
$report = json_encode(
    ['surface' => 'ajax-and-language', 'level' => 0, 'passed' => count($checks), 'failed' => 0,
    'checks' => $checks, 'scope' => 'Actual dispatch with isolated service doubles; no native course writes'],
    JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR
) . PHP_EOL;
if (!empty($argv[1])) { file_put_contents($argv[1], $report); 
}
echo $report;

function data_submitted() {
    global $submitted;
    return $submitted; 
}
function require_sesskey() {
    global $validkey, $guardcalls;
    $guardcalls++;
    if (!$validkey) { throw new moodle_exception('Invalid session key'); 
    }
}
