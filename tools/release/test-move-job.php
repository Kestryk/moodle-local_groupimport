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
 * Isolated worker atomicity contract; not a native Moodle integration test.
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace {
    define('CLI_SCRIPT', true);
    require_once(__DIR__ . '/fixtures/standalone/config.php');
    define('MUST_EXIST', 2);
    define('FORMAT_PLAIN', 2);
}

namespace local_groupimport\service {
    require_once(__DIR__ . '/fixtures/move-job-mock/membership_transfer.php');
}

namespace core\lock {
    require_once(__DIR__ . '/fixtures/move-job-mock/lock_config.php');
}

namespace core {
    require_once(__DIR__ . '/fixtures/move-job-mock/cron.php');
}

namespace {
    if (PHP_SAPI !== 'cli') {
        die('CLI fixtures only.');
    }
    require_once(__DIR__ . '/../../classes/local/move_job.php');
    require_once(__DIR__ . '/../../classes/local/move_privacy.php');

    require_once(__DIR__ . '/fixtures/move-job-mock/context_course.php');
    require_once(__DIR__ . '/fixtures/move-job-mock/core_user.php');
    require_once(__DIR__ . '/fixtures/move-job-mock/move_job_test_db.php');
    require_once(__DIR__ . '/fixtures/move-job-mock/message.php');
    require_once(__DIR__ . '/fixtures/move-job-mock/moodle_url.php');
    /**
     * Keep translations outside this transaction contract.
     *
     * @param string $key Requested field or string key.
     * @param string $component Language component.
     * @param mixed $data Fixture data to persist.
     */
    function get_string(string $key, string $component, $data = null): string {
        return $key;
    }
    /**
     * Buffer one native notification before its commit hook runs.
     *
     * @param object $message Message data or assertion description.
     */
    function message_send(object $message): int {
        $GLOBALS['movemessages'] = ($GLOBALS['movemessages'] ?? 0) + 1;
        return 1;
    }
    /**
     * Return the job's course.
     *
     * @param int $id Requested fixture record id.
     */
    function get_course(int $id): object {
        return (object)['id' => $id];
    }
    /**
     * Enforce the permission boundary in the test process.
     *
     * @param string $capability Capability name accepted by the double.
     * @param object $context Fixture capability context.
     */
    function require_capability(string $capability, object $context): void {
        global $denied;
        if ($denied) {
            throw new RuntimeException('Permission revoked.');
        }
    }
    /**
     * Strict assertion independent of PHP assertion configuration.
     *
     * @param bool $condition Condition required by the assertion.
     * @param string $message Message data or assertion description.
     */
    function move_job_test_assert(bool $condition, string $message): void {
        if (!$condition) {
            throw new RuntimeException($message);
        }
    }

    $CFG = (object)['dirroot' => __DIR__ . '/fixtures/move-job-mock'];
    $DB = new move_job_test_db();
    $denied = false;
    $pairs = array_map(static fn($id) => ['groupid' => 1, 'userid' => $id], range(1, 800));
    $DB->job = (object)['id' => 1, 'userid' => 9999, 'courseid' => 7, 'destinationid' => 2,
        'payload' => json_encode($pairs), 'status' => 'queued', 'nextitem' => 0, 'total' => 800,
        'added' => 0, 'removed' => 0, 'unchanged' => 0, 'failcount' => 0, 'timenotified' => 1];
    try {
        \local_groupimport\local\move_job::execute(1);
        throw new RuntimeException('Expected the injected batch failure.');
    } catch (RuntimeException $exception) {
        move_job_test_assert($exception->getMessage() === 'Injected native failure.', 'Wrong failure.');
    }
    move_job_test_assert($DB->job->nextitem === 500 && count($DB->moved) === 500, 'Atomic batch/cursor rollback failed.');
    move_job_test_assert($DB->job->status === 'retry' && $DB->job->failcount === 1, 'Retry state missing.');
    \local_groupimport\service\membership_transfer::$failat = null;
    \local_groupimport\local\move_job::execute(1);
    move_job_test_assert($DB->job->nextitem === 800 && count($DB->moved) === 800, 'Resume repeated or lost work.');
    \local_groupimport\local\move_job::execute(1);
    move_job_test_assert($DB->job->removed === 800 && count($DB->moved) === 800, 'Completed task executed twice.');
    $denied = true;
    try {
        \local_groupimport\local\move_job::execute(1);
        throw new RuntimeException('Expected permission enforcement.');
    } catch (RuntimeException $exception) {
        move_job_test_assert($exception->getMessage() === 'Permission revoked.', 'Wrong permission failure.');
    }
    move_job_test_assert(
        count(\local_groupimport\local\move_privacy::userids($DB->job)) === 801,
        'Privacy lost the requester or a subject.'
    );
    $denied = false;
    $DB->job->timenotified = 0;
    $DB->throwcommit = true;
    try {
        \local_groupimport\local\move_job::execute(1);
        throw new RuntimeException('Expected post-commit processor failure.');
    } catch (RuntimeException $exception) {
        move_job_test_assert(
            $exception->getMessage() === 'Injected message processor failure.',
            'Disposed rollback hid the error.'
        );
    }
    move_job_test_assert($DB->job->timenotified > 0 && $DB->job->status === 'completed', 'Committed notification lost.');
    \local_groupimport\local\move_job::execute(1);
    move_job_test_assert($GLOBALS['movemessages'] === 1, 'Post-commit retry duplicated the notification.');
    echo json_encode(['passed' => true, 'scope' => 'isolated worker/transaction doubles', 'cases' => 8]) . PHP_EOL;
}
