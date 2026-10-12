<?php
// Local-supervised T052-bis attribution oracle; no Moodle or database bootstrap.
define('MOODLE_INTERNAL', true);
require_once(__DIR__ . '/decompose.php');
$member = '<ul data-easystud-group-members="1"><li data-easystud-member-id="2">Élève</li></ul>';
$card = '<div data-easystud-user="1" data-user-detail="{&quot;description&quot;:&quot;&lt;p&gt;Texte&lt;/p&gt;&quot;}">' .
    '<div class="local-groupimport-easystud-user__avatar"><img src="/x.png"></div></div>';
$html = '<html><body>' . $card . $member . '<script>const s = "<div data-fake=1></div>";</script></body></html>';
$result = easystud_perf_decompose($html);
$checks = [
    'exact-original-utf8-byte-sum' => $result['accountedBytes'] === strlen($html) && $result['exactByteSum'],
    'raw-script-tags-excluded' => $result['sourceElements'] === 8,
    'real-card-and-member-count' => $result['instances']['participant-cards'] === 1 &&
        $result['instances']['member-rows'] === 1,
    'escaped-description-json-decoded' => isset($result['detailJsonFieldBytesBeforeHtmlEscaping']['description']),
    'data-spans-not-dom-elements' => array_values(array_filter($result['regions'],
        static fn(array $region): bool => $region['region'] === 'data-attributes-json'))[0]['sourceElements'] === 0,
];
echo json_encode(['passed' => !in_array(false, $checks, true), 'checks' => $checks], JSON_PRETTY_PRINT) . "\n";
exit(in_array(false, $checks, true) ? 1 : 0);
