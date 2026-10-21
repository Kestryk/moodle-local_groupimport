'use strict';
// Deterministic Moodle boundaries for actual production builders. No bootstrap/network/SQL.
module.exports = String.raw`
namespace local_groupimport\local {
    class state_version { public static function get($course) { return 123; } }
}
namespace core_user {
    class fields {
        public static function get_identity_fields($context, $custom) {
            return $GLOBALS['cansee'] ? ['email', 'profile_field_public'] : ['email'];
        }
    }
}
namespace {
    define('MOODLE_INTERNAL', true); define('SQL_PARAMS_NAMED', 2); define('SITEID', 1);
    define('PARAM_RAW', 0); define('PARAM_INT', 1); define('PARAM_BOOL', 2); define('PARAM_TEXT', 3);
    define('PARAM_ALPHANUMEXT', 4); define('IGNORE_MISSING', 0); define('FORMAT_HTML', 1);
    define('DEBUG_DEVELOPER', 32767); define('URL_MATCH_BASE', 0);
    class moodle_exception extends \Exception { public function __construct($key, ...$args) { parent::__construct($key); } }
    class coding_exception extends \Exception {}
    class core_text {
        public static function strlen($s) { return mb_strlen($s); }
        public static function substr($s, $start, $length) { return mb_substr($s, $start, $length); }
        public static function strtolower($s) { return mb_strtolower($s); }
    }
    class context_course {
        public $id = 105; public $instanceid = 5;
        public static function instance($id) { $c = new self(); $c->instanceid = $id; return $c; }
    }
    class context_user { public static function instance(...$args) { return (object)['id' => 200]; } }
    class moodle_url {
        private $path; private $params;
        public function __construct($path, $params = []) { $this->path = $path; $this->params = $params; }
        public function out($escaped = true) { return $this->path . '?' . http_build_query($this->params); }
        public function compare(...$args) { return false; }
        public function get_param($name) { return ''; }
    }
    class html_writer {
        public static function __callStatic($name, $args) { return $name . ':' . json_encode($args); }
    }
    class core_user { public static function get_initials($user) { return 'TU'; } }
    class moodle_page { const STATE_BEFORE_HEADER = 0; public $state = 1; public function has_set_url() { return false; } }
    class admin_setting_configtext {
        public $arguments; public $callbacks = [];
        public function __construct(...$args) { $this->arguments = $args; }
        public function __call($name, $args) { $this->callbacks[$name] = $args; }
    }
    class admin_setting_configcheckbox extends admin_setting_configtext {}
    class admin_settingpage extends admin_setting_configtext {
        public $children = [];
        public function add($setting) { $this->children[] = $setting; }
    }
    class admin_setting_heading extends admin_setting_configtext {}
    class admin_setting_configselect extends admin_setting_configtext {}
    class admin_setting_configmultiselect extends admin_setting_configtext {}
    class admin_setting_configtextarea extends admin_setting_configtext {}
    class admin_setting_description extends admin_setting_configtext {}
    class admin_setting_configstoredfile extends admin_setting_configtext {}
    function s($value) { return htmlspecialchars((string)$value, ENT_QUOTES); }
    function format_string($value, ...$args) { return $value; }
    function format_text($value, ...$args) { return $value; }
    function fix_utf8($value) { return $value; }
    function fullname($user, ...$args) { return $user->firstname . ' ' . $user->lastname; }
    function has_capability(...$args) { return $GLOBALS['cansee']; }
    function has_all_capabilities(...$args) { return $GLOBALS['cansee']; }
    function sesskey() { return 'fixture-session'; }
    function isloggedin() { return true; }
    function isguestuser() { return false; }
    function get_user_preferences($name, $default = null) { return $default; }
    function current_language() { return $GLOBALS['locale'] ?? 'en'; }
    function optional_param($name, $default, $type) { return $GLOBALS['parameters'][$name] ?? $default; }
    function get_config($component, $name = null) {
        return $name === null ? $GLOBALS['configuration'] : ($GLOBALS['configuration']->$name ?? false);
    }
    function get_string_manager() { return new class { public function string_exists(...$args) { return false; } }; }
    function get_string($key, $component = '', $a = null) {
        $GLOBALS['stringsRead']++;
        $value = $component === 'local_groupimport' ? ($GLOBALS['language'][$key] ?? $key) : $key;
        return preg_replace_callback('/\{\$a(?:->(\w+))?\}/', static function($m) use ($a) {
            return isset($m[1]) ? (string)($a->{$m[1]} ?? '') : (is_scalar($a) ? (string)$a : '');
        }, $value);
    }
    function profile_get_user_field($datatype, $id, $userid, $data) {
        if ($data->signup !== 0) throw new \Exception('Signup visibility must be disabled');
        return new class($data) {
            private $data;
            public function __construct($data) { $this->data = $data; }
            public function is_visible($context) { return $this->data->visible && $GLOBALS['cansee']; }
        };
    }
    function get_enrolled_users(...$args) { return $GLOBALS['users']; }
    function get_enrolled_sql(...$args) { return ['SELECT id FROM fixture_enrolment', []]; }
    function groups_get_all_groups(...$args) { return $GLOBALS['groups']; }
    function groups_get_all_groupings(...$args) { return $GLOBALS['groupings']; }
    function get_group_picture_url(...$args) { return false; }
    function role_get_name($role, $context) { return $role->name; }
    function file_rewrite_pluginfile_urls($text, ...$args) { return $text; }
    $CFG = (object)['messaging' => 1, 'branch' => '501', 'enablegravatar' => false, 'hiddenuserfields' => 'city'];
    $USER = (object)['id' => 2]; $OUTPUT = new \stdClass(); $parameters = []; $cansee = true; $stringsRead = 0;
    $configuration = (object)['alloweduserfields' => 'username,email,profile_field_public,profile_field_private',
        'participantprimarybadgefield' => 'profile_field_private', 'participantdetailfield1' => 'profile_field_public',
        'participantdetailfield2' => 'profile_field_public', 'participantprimarybadgebgcolor' => '#ABCDEF',
        'participantprimarybadgetextcolor' => 'invalid', 'enablesimplifiedview' => 1];
    $users = [2 => (object)['id' => 2, 'firstname' => 'Alpha', 'lastname' => 'User', 'username' => 'alpha',
        'email' => 'alpha@example.test', 'picture' => 0, 'idnumber' => 'A'],
        3 => (object)['id' => 3, 'firstname' => 'Beta', 'lastname' => 'User', 'username' => 'beta',
        'email' => 'beta@example.test', 'picture' => 0, 'idnumber' => 'B']];
    $groups = [10 => (object)['id' => 10, 'courseid' => 5, 'name' => 'Group & one', 'idnumber' => '', 'description' => '']];
    $groupings = [20 => (object)['id' => 20, 'courseid' => 5, 'name' => 'Grouping', 'description' => '', 'idnumber' => '']];
    $customfields = [1 => (object)['id' => 1, 'name' => 'Public field', 'shortname' => 'public',
        'datatype' => 'text', 'signup' => 1, 'visible' => 1],
        2 => (object)['id' => 2, 'name' => 'Private field', 'shortname' => 'private',
        'datatype' => 'text', 'signup' => 1, 'visible' => 0]];
    $DB = new class {
        public $queries = []; public $projected = [];
        public function get_records($table, $conditions = null, ...$rest) {
            $this->queries[] = [$table, $conditions];
            if ($table === 'user_info_field') return $GLOBALS['customfields'];
            if ($table === 'local_groupimport_moves') {
                $rows = array_filter($GLOBALS['jobrows'], static function($row) use ($conditions) {
                    foreach ($conditions as $key => $value) if ($row->$key != $value) return false;
                    return true;
                }); krsort($rows); return $rows;
            }
            throw new \Exception('Unexpected table ' . $table);
        }
        public function get_in_or_equal($values, $type, $prefix = 'param') {
            $params = []; foreach (array_values($values) as $i => $v) $params[$prefix . $i] = $v;
            return ['IN (' . implode(',', array_map(static fn($k) => ':' . $k, array_keys($params))) . ')', $params];
        }
        public function get_records_select($table, $selection, $params, $sort, $fields) {
            if ($table !== 'local_groupimport_moves' || $sort !== 'id DESC') throw new \Exception('Wrong query');
            $where = ['courseid' => $params['courseid'], 'userid' => $params['userid']];
            if (isset($params['id'])) $where['id'] = $params['id'];
            $rows = $this->get_records($table, $where);
            if (!isset($params['id'])) {
                if (!str_contains($selection, ' AND status IN (')) throw new \Exception('Missing SQL status filter');
                $statuses = array_values(array_filter($params, static fn($key) => str_starts_with($key, 'movestatus'), ARRAY_FILTER_USE_KEY));
                $rows = array_filter($rows, static fn($row) => in_array($row->status, $statuses, true));
            }
            $keys = array_map('trim', explode(',', $fields));
            if ($keys !== ['id', 'status', 'nextitem', 'total']) throw new \Exception('Unexpected progress projection');
            $this->projected = $keys;
            return array_map(static fn($row) => (object)array_intersect_key((array)$row, array_flip($keys)), $rows);
        }
        public function get_fieldset_sql(...$args) { return array_keys($GLOBALS['users']); }
        public function recordset($rows) { return new class($rows) extends \ArrayIterator { public function close() {} }; }
        public function get_recordset_select(...$args) {
            return $this->recordset($GLOBALS['groups'] && $GLOBALS['groupings'] ? [(object)['id' => 1, 'groupid' => 10, 'groupingid' => 20]] : []);
        }
        public function get_recordset_sql($sql, $params) {
            $rows = [];
            if (str_contains($sql, '{groups_members}')) foreach ($GLOBALS['users'] as $user) {
                if ($GLOBALS['groups']) $rows[] = (object)['id' => $user->id, 'userid' => $user->id, 'groupid' => 10];
            }
            else if (str_contains($sql, '{role_assignments}')) foreach ($GLOBALS['users'] as $user) {
                $rows[] = (object)['id' => $user->id, 'userid' => $user->id, 'roleid' => 5, 'name' => 'Participant', 'shortname' => 'student'];
            }
            else if (str_contains($sql, '{user_info_data}')) foreach ($params as $key => $value) {
                if (str_starts_with($key, 'user')) foreach ($GLOBALS['customfields'] as $field) {
                    if (in_array($field->shortname, $params, true)) $rows[] = (object)['id' => $value * 10 + $field->id,
                        'userid' => $value, 'shortname' => $field->shortname, 'data' => '<b>Value ' . $field->shortname . '</b>'];
                }
            }
            else throw new \Exception('Unexpected SQL ' . $sql);
            return $this->recordset($rows);
        }
    };
}
`;
