<?php
// Isolated service control-flow proof, NOT Moodle DB/API/event integration proof.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
define('MOODLE_INTERNAL', true);
define('EASYEDU_TEST_MEMBER_TRANSFER', true);
$CFG = (object)['dirroot' => __DIR__ . '/fixtures/membership-transfer-mock'];
require_once(__DIR__ . '/../../classes/service/membership_transfer.php');

use local_groupimport\service\membership_transfer;

function transfer_check(bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
}
function transfer_reject(array $pairs, int $destination = 2, string $error = 'invaliddata'): void {
    global $DB;
    $before = $DB->members;
    try {
        membership_transfer::move_members(20, $destination, $pairs);
        throw new RuntimeException('Expected rejection.');
    } catch (moodle_exception $exception) {
        transfer_check($exception->errorcode === $error, 'Wrong exception.');
    }
    transfer_check($DB->members === $before, 'A rejected batch changed memberships.');
    transfer_check(!$DB->committed, 'Rejected batch committed.');
}

$DB = new transfer_mock_database();
$pair = ['groupid' => 1, 'userid' => 10];
$result = membership_transfer::move_members(20, 2, [$pair, $pair]);
transfer_check($result === ['added' => 1, 'removed' => 1, 'unchanged' => 0], 'Deduplicate responsive pairs.');
transfer_check($DB->members[2] === [10] && $DB->members[1] === [11], 'Move only the selected origin.');
transfer_check($DB->members[3] === [10] && $DB->members[4] === [10], 'Preserve unrelated memberships.');
transfer_check($DB->calls === [['add', 2, 10], ['remove', 1, 10]] && $DB->committed, 'Native call order / commit.');

$DB = new transfer_mock_database();
$DB->members[2] = [10];
$result = membership_transfer::move_members(20, 2, [$pair, ['groupid' => 2, 'userid' => 10]]);
transfer_check($result === ['added' => 0, 'removed' => 1, 'unchanged' => 1], 'Existing destination / same-origin no-op.');
transfer_check($DB->calls === [['remove', 1, 10]] && $DB->members[2] === [10], 'Do not duplicate destination or remove self.');

$DB = new transfer_mock_database();
$result = membership_transfer::move_members(20, 2, [$pair, ['groupid' => 4, 'userid' => 10]]);
transfer_check($result === ['added' => 1, 'removed' => 2, 'unchanged' => 0], 'Two selected origins, one destination.');
transfer_check($DB->members[3] === [10], 'Third unselected origin preserved.');

foreach ([[], [['groupid' => '1garbage', 'userid' => 10]], [['groupid' => 1, 'userid' => 999]],
        [$pair, ['groupid' => 5, 'userid' => 10]]] as $pairs) {
    $DB = new transfer_mock_database();
    $error = $pairs && end($pairs)['groupid'] === 5 ? 'invalidgroupid' : 'invaliddata';
    transfer_reject($pairs, 2, $error);
    transfer_check(!$DB->calls, 'Validate the complete request before mutations.');
}
$DB = new transfer_mock_database();
transfer_reject([$pair], 5, 'invalidgroupid');
$DB = new transfer_mock_database();
$DB->privileged = false;
transfer_reject([$pair], 2, 'nopermissions');
$DB = new transfer_mock_database();
$DB->protected = ['1:10'];
transfer_reject([$pair]);
transfer_check(!$DB->calls, 'Respect component-managed removal restrictions.');
$DB = new transfer_mock_database();
$DB->enrolled = [];
transfer_reject([$pair]);

// Fail the second member after the first has been moved; roll back the whole batch.
foreach (['failadd', 'failremove'] as $failure) {
    $DB = new transfer_mock_database();
    $DB->$failure = 11;
    transfer_reject([$pair, ['groupid' => 1, 'userid' => 11]]);
    transfer_check($DB->rolledback && count($DB->calls) >= 3, 'Late native failure rolls back earlier operations.');
}
echo json_encode(['status' => 'PASS', 'scope' => 'isolated PHP service / simulated native APIs and transaction',
    'moodleDatabaseAccess' => false, 'businessWrite' => false, 'nativeIntegrationVerified' => false]) . PHP_EOL;
