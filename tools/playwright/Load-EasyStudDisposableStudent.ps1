# Credential loader for the K15-28 disposable student only, under the standard supervised wrapper.
$ErrorActionPreference = 'Stop'
$studentUrl = [uri]$env:EASYEDU_EASYSTUD_MANAGER_URL
if ($studentUrl.Host -ne 'localhost' -or $studentUrl.Port -ne 8051 -or $studentUrl.AbsolutePath -ne '/local/groupimport/manage.php') {
    throw 'Manifested8051 fixture URL required'
}
$courseMatch = [regex]::Match($studentUrl.Query, '(?:\?|&)id=(\d+)(?:&|$)')
if (!$courseMatch.Success -or [int]$courseMatch.Groups[1].Value -le 5 -or $env:EASYEDU_QA_STUDENT_PASSWORD.Length -lt 24) {
    throw 'Dedicated course and process-local random student secret required'
}
$env:EASYEDU_MOODLE_USERNAME = 'eed-guide-write-student-' + $courseMatch.Groups[1].Value
$env:EASYEDU_MOODLE_PASSWORD = $env:EASYEDU_QA_STUDENT_PASSWORD
