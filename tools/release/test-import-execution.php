<?php
// Isolated fatal-failure ordering test; fake DB, no Moodle records/configuration.
define('MOODLE_INTERNAL', true);
class moodle_exception extends Exception {
    public function __construct($code, ...$args) {
        parent::__construct($code);
    }
}
class core_php_time_limit {
    public static $seconds;
    public static function raise($seconds) {
        self::$seconds = $seconds;
    }
}
require(__DIR__ . '/../../classes/local/import_execution.php');
use local_groupimport\local\import_execution;
$events = [];
$DB = new class($events) {
    private $events;
    public function __construct(&$events) {
        $this->events =& $events;
    }
    public function start_delegated_transaction() {
        $this->events[] = 'begin';
        return new class($this->events) {
            private $events;
            public function __construct(&$events) {
                $this->events =& $events;
            }
            public function allow_commit() {
                $this->events[] = 'commit';
            }
            public function rollback($exception) {
                $this->events[] = 'rollback';
                throw $exception;
            }
        };
    }
};
$check = function ($condition) {
    if (!$condition) {
        throw new RuntimeException('Import execution check failed');
    }
};
$id = import_execution::run([[]], function () use (&$events) {
    $events[] = 'memberships';
    $events[] = 'history';
    return 42;
});
$check($id === 42 && $events === ['begin', 'memberships', 'history', 'commit']);
$check(core_php_time_limit::$seconds === 120);
$events = [];
try {
    import_execution::run([[]], function () use (&$events) {
        $events[] = 'memberships';
        throw new RuntimeException('history write failed');
    });
    throw new LogicException('Failure swallowed');
} catch (RuntimeException $exception) {
    $check($exception->getMessage() === 'history write failed');
}
$check($events === ['begin', 'memberships', 'rollback']);
$events = [];
try {
    import_execution::run([[]], fn() => 0);
    throw new LogicException('Missing history committed');
} catch (moodle_exception $exception) {
    $check($events === ['begin', 'rollback']);
}
$events = [];
try {
    import_execution::run(array_fill(0, 1001, []), fn() => 5);
    throw new LogicException('Limit not enforced');
} catch (moodle_exception $exception) {
    $check($events === []);
}
echo json_encode(['passed' => true, 'atomicCommitAndRollback' => true, 'limitBeforeWrites' => 1000]) . PHP_EOL;
