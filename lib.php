<?php
// This file is part of Moodle - http://moodle.org/
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
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Library callbacks for Local Group Import.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Extends the course navigation with the EasyStud entries (course "More" menu).
 *
 * @param navigation_node $coursenode The course navigation node.
 * @param stdClass $course The course record.
 * @param context_course $context The course context.
 * @return void
 */
function local_groupimport_extend_navigation_course(navigation_node $coursenode, stdClass $course,
        context_course $context): void {
    if (!has_capability('moodle/course:managegroups', $context)) {
        return;
    }

    if (local_groupimport_is_simplified_view_enabled()) {
        local_groupimport_require_navigation_js((int)$course->id);
        $participantsnode = $coursenode->get('participants', navigation_node::TYPE_CONTAINER);
        if (!$participantsnode) {
            $participantsnode = $coursenode->get('participants', navigation_node::TYPE_CUSTOM);
        }
        if ($participantsnode) {
            local_groupimport_configure_participants_node($participantsnode, (int)$course->id);
        }

        if (!$participantsnode && !$coursenode->find('local_groupimport_easystud', navigation_node::TYPE_CUSTOM)) {
            $easystudnode = navigation_node::create(
                get_string('easystudmanager', 'local_groupimport'),
                local_groupimport_get_manager_url((int)$course->id),
                navigation_node::TYPE_CUSTOM,
                null,
                'local_groupimport_easystud',
                new pix_icon('i/groups', '')
            );
            $beforekey = $coursenode->get('users') ? 'users' : null;
            $coursenode->add_node($easystudnode, $beforekey);
        }
    }

    if (!$coursenode->find('local_groupimport', navigation_node::TYPE_CUSTOM)) {
        $coursenode->add(
            get_string('groupimport', 'local_groupimport'),
            new moodle_url('/local/groupimport/index.php', ['id' => $course->id]),
            navigation_node::TYPE_CUSTOM,
            null,
            'local_groupimport',
            new pix_icon('i/import', '')
        );
    }
}

/**
 * Extends the settings navigation with the EasyStud participant entry.
 *
 * @param settings_navigation $settingsnav The settings navigation tree.
 * @param context|null $context The page context.
 * @return void
 */
function local_groupimport_extend_settings_navigation(settings_navigation $settingsnav, ?context $context = null): void {
    global $COURSE;

    if (!$context || $context->contextlevel !== CONTEXT_COURSE || empty($COURSE->id) || (int)$COURSE->id === SITEID) {
        return;
    }

    if (!has_capability('moodle/course:managegroups', $context)) {
        return;
    }

    if (!local_groupimport_is_simplified_view_enabled()) {
        return;
    }

    $courseid = (int)$COURSE->id;
    local_groupimport_require_navigation_js($courseid);

    $usersnode = $settingsnav->find('users', navigation_node::TYPE_CONTAINER);
    if (!$usersnode) {
        $usersnode = $settingsnav->find('users', navigation_node::TYPE_SETTING);
    }
    if (!$usersnode) {
        return;
    }

    local_groupimport_configure_participants_node($usersnode, $courseid);
}

/**
 * Whether the optional simplified student management view is enabled.
 *
 * Existing sites are explicitly opted out during upgrade, while fresh
 * installations opt in from the install hook. Treating a missing value as
 * disabled prevents navigation replacement before an upgrade has completed.
 *
 * @return bool
 */
function local_groupimport_is_simplified_view_enabled(): bool {
    $enabled = get_config('local_groupimport', 'enablesimplifiedview');

    return $enabled !== false && (bool)$enabled;
}

/**
 * Return the normalized Student Management workspace preferences.
 *
 * Missing values preserve the historical three-view experience for existing
 * installations. When Complete view is disabled, an obsolete `both` default
 * falls back to Participants & groups rather than selecting a hidden control.
 * The compact workspace keeps its native entity views, so the desktop
 * structure preference maps to Groups and every other preference maps to
 * Participants.
 *
 * @return array{showcompleteview: bool, defaultlayoutmode: string, defaultmobileview: string}
 */
function local_groupimport_get_workspace_layout_preferences(): array {
    $configuredshowcomplete = get_config('local_groupimport', 'showcompleteview');
    $showcompleteview = $configuredshowcomplete === false ? true : (bool)$configuredshowcomplete;
    $defaultlayoutmode = (string)get_config('local_groupimport', 'defaultlayoutmode');
    $availablemodes = $showcompleteview
        ? ['participants', 'both', 'structure']
        : ['participants', 'structure'];

    if (!in_array($defaultlayoutmode, $availablemodes, true)) {
        $defaultlayoutmode = $showcompleteview ? 'both' : 'participants';
    }

    return [
        'showcompleteview' => $showcompleteview,
        'defaultlayoutmode' => $defaultlayoutmode,
        'defaultmobileview' => $defaultlayoutmode === 'structure' ? 'groups' : 'participants',
    ];
}

/**
 * Return the validated EasyStud semantic palette.
 *
 * Direct database edits must not be able to inject arbitrary CSS. Malformed
 * values fall back to the product defaults; valid light colours are retained
 * and adapted for readable foregrounds in local_groupimport_get_theme_style().
 *
 * @return array<string, string> Normalized hexadecimal colours.
 */
function local_groupimport_get_theme_colours(): array {
    $definitions = [
        'primary' => ['setting' => 'themeprimarycolor', 'default' => '#0f6cbf'],
        'accent' => ['setting' => 'themeaccentcolor', 'default' => '#1b7f5a'],
        'participant' => ['setting' => 'themeparticipantcolor', 'default' => '#4873ad'],
        'group' => ['setting' => 'themegroupcolor', 'default' => '#29724d'],
        'grouping' => ['setting' => 'themegroupingcolor', 'default' => '#6a7f98'],
    ];
    $colours = [];

    foreach ($definitions as $role => $definition) {
        $configured = (string)get_config('local_groupimport', $definition['setting']);
        $candidate = preg_match('/^#[0-9a-fA-F]{6}$/', $configured)
            ? strtolower($configured)
            : $definition['default'];
        $colours[$role] = $candidate;
    }

    return $colours;
}

/**
 * Calculate a hexadecimal colour's WCAG contrast ratio against white.
 *
 * @param string $hex Valid six-digit hexadecimal colour.
 * @return float Contrast ratio.
 */
function local_groupimport_colour_contrast_against_white(string $hex): float {
    $channels = [];
    foreach ([1, 3, 5] as $offset) {
        $channel = hexdec(substr($hex, $offset, 2)) / 255;
        $channels[] = $channel <= 0.04045
            ? $channel / 12.92
            : (($channel + 0.055) / 1.055) ** 2.4;
    }
    $luminance = (0.2126 * $channels[0]) + (0.7152 * $channels[1]) + (0.0722 * $channels[2]);

    return 1.05 / ($luminance + 0.05);
}

/**
 * Darken a valid chosen colour only as much as small text on white requires.
 *
 * The admin setting retains the exact chosen Hex; only the shared semantic
 * foreground/action token is adjusted. Binary search keeps the hue direction
 * and avoids hard rejection of pastel palettes.
 *
 * @param string $hex Valid six-digit hexadecimal colour.
 * @param float $minimumcontrast Required contrast ratio against white.
 * @return string Readable six-digit hexadecimal colour.
 */
function local_groupimport_colour_for_white_contrast(string $hex, float $minimumcontrast = 4.5): string {
    if (local_groupimport_colour_contrast_against_white($hex) >= $minimumcontrast) {
        return strtolower($hex);
    }

    $channels = [];
    foreach ([1, 3, 5] as $offset) {
        $channels[] = hexdec(substr($hex, $offset, 2));
    }
    $low = 0.0;
    $high = 1.0;
    $safe = '#000000';
    for ($step = 0; $step < 16; $step++) {
        $fraction = ($low + $high) / 2;
        $candidate = sprintf('#%02x%02x%02x',
            (int)floor($channels[0] * $fraction),
            (int)floor($channels[1] * $fraction),
            (int)floor($channels[2] * $fraction)
        );
        if (local_groupimport_colour_contrast_against_white($candidate) >= $minimumcontrast) {
            $low = $fraction;
            $safe = $candidate;
        } else {
            $high = $fraction;
        }
    }

    return $safe;
}

/**
 * Build the validated custom-property declarations used by EasyStud roots.
 *
 * Derived soft/strong/rail roles stay in CSS so every responsive composition
 * consumes one palette rather than receiving PHP-specific presentation rules.
 *
 * @return string Safe inline custom-property declarations.
 */
function local_groupimport_get_theme_style(): string {
    $colours = local_groupimport_get_theme_colours();
    $readable = [];
    foreach ($colours as $role => $colour) {
        $readable[$role] = local_groupimport_colour_for_white_contrast($colour);
    }
    $properties = [
        '--easyedu-primary-chosen' => $colours['primary'],
        '--easyedu-primary' => $readable['primary'],
        '--easyedu-primary-strong' => 'color-mix(in srgb, ' . $readable['primary'] . ' 82%, #000 18%)',
        '--easyedu-primary-soft' => 'color-mix(in srgb, ' . $colours['primary'] . ' 10%, #fff 90%)',
        '--easyedu-info' => $readable['primary'],
        '--easyedu-info-soft' => 'color-mix(in srgb, ' . $colours['primary'] . ' 10%, #fff 90%)',
        '--easyedu-accent-chosen' => $colours['accent'],
        '--easyedu-accent' => $readable['accent'],
        '--easyedu-accent-soft' => 'color-mix(in srgb, ' . $colours['accent'] . ' 9%, #fff 91%)',
        '--easyedu-success' => $readable['accent'],
        '--easyedu-success-soft' => 'color-mix(in srgb, ' . $colours['accent'] . ' 9%, #fff 91%)',
    ];

    foreach (['participant', 'group', 'grouping'] as $role) {
        $properties['--easyedu-' . $role . '-chosen'] = $colours[$role];
        $properties['--easyedu-' . $role] = $readable[$role];
        $properties['--easyedu-' . $role . '-soft'] =
            'color-mix(in srgb, ' . $colours[$role] . ' 11%, #fff 89%)';
        $properties['--easyedu-' . $role . '-rail'] =
            'color-mix(in srgb, ' . $readable[$role] . ' 68%, #fff 32%)';
    }

    $declarations = [];
    foreach ($properties as $property => $value) {
        $declarations[] = $property . ': ' . $value;
    }

    return implode('; ', $declarations) . ';';
}

/**
 * Returns the EasyStud manager URL for a course.
 *
 * @param int $courseid The course id.
 * @return moodle_url
 */
function local_groupimport_get_manager_url(int $courseid): moodle_url {
    return new moodle_url('/local/groupimport/manage.php', ['id' => $courseid]);
}

/**
 * Build the shared-navigation context for the Mass Import workspace.
 *
 * The participant selector and Guide remain Simplified Student Management
 * controls. Mass Import contributes only the product destinations while its
 * workflow actions remain in the existing page header action rail.
 *
 * @param stdClass $course Course record.
 * @return array
 */
function local_groupimport_build_mass_import_navigation_context(stdClass $course): array {
    $items = [];

    if (local_groupimport_is_simplified_view_enabled()) {
        $items[] = [
            'id' => 'easystud-manager',
            'kind' => 'destination',
            'label' => get_string('easystudmanager', 'local_groupimport'),
            'accessiblelabel' => get_string('easystudmanager', 'local_groupimport'),
            'url' => local_groupimport_get_manager_url((int)$course->id)->out(false),
            'icon' => 'fa fa-users',
            'islink' => true,
            'isbutton' => false,
            'isdisclosure' => false,
            'current' => false,
            'disabled' => false,
            'destructive' => false,
            'badge' => '',
            'haschildren' => false,
        ];
    }

    $items[] = [
            'id' => 'easystud-import',
            'kind' => 'destination',
            'label' => get_string('csvimportlink', 'local_groupimport'),
            'accessiblelabel' => get_string('csvimportlink', 'local_groupimport'),
            'url' => (new moodle_url('/local/groupimport/index.php', ['id' => $course->id]))->out(false),
            'icon' => 'fa fa-file-import',
            'islink' => true,
            'isbutton' => false,
            'isdisclosure' => false,
            'current' => true,
            'disabled' => false,
            'destructive' => false,
            'badge' => '',
            'haschildren' => false,
    ];

    $items[] = [
        'id' => 'mass-import-download-template',
        'kind' => 'utility',
        'label' => get_string('downloadtemplate', 'local_groupimport'),
        'accessiblelabel' => get_string('downloadtemplate', 'local_groupimport'),
        'url' => (new moodle_url('/local/groupimport/template.php', ['id' => $course->id]))->out(false),
        'icon' => 'fa fa-file-excel',
        'islink' => true,
        'isbutton' => false,
        'isdisclosure' => false,
        'current' => false,
        'disabled' => false,
        'destructive' => false,
        'badge' => '',
        'haschildren' => false,
    ];

    $items[] = [
        'id' => 'mass-import-history',
        'kind' => 'utility',
        'label' => get_string('importhistory', 'local_groupimport'),
        'accessiblelabel' => get_string('importhistory', 'local_groupimport'),
        'action' => 'mass-import-history',
        'icon' => 'fa fa-history',
        'islink' => false,
        'isbutton' => true,
        'isdisclosure' => false,
        'current' => false,
        'disabled' => false,
        'destructive' => false,
        'badge' => '',
        'haschildren' => false,
    ];

    return [
        'rootid' => 'local-groupimport-import-navigation',
        'panelid' => 'local-groupimport-import-navigation-panel',
        'anchorselector' => '',
        'navigationlabel' => get_string('mobilenavigation', 'local_groupimport'),
        'triggerlabel' => get_string('mobilemenu', 'local_groupimport'),
        'closelabel' => get_string('mobilenavigationclose', 'local_groupimport'),
        'triggericon' => 'fa fa-bars',
        'closeicon' => 'fa fa-times',
        'emptylabel' => get_string('navigationempty', 'local_groupimport'),
        'hasitems' => true,
        'hasparticipantdropdown' => false,
        'sections' => [[
            'id' => 'easystud-tools',
            'label' => get_string('easystudlabel', 'local_groupimport'),
            'items' => $items,
        ]],
    ];
}

/**
 * Returns the native participants URL for a course.
 *
 * @param int $courseid The course id.
 * @return moodle_url
 */
function local_groupimport_get_native_participants_url(int $courseid): moodle_url {
    return new moodle_url('/user/index.php', [
        'id' => $courseid,
        'local_groupimport_native' => 1,
    ]);
}

/**
 * Loads the EasyStud navigation AMD module for the current page.
 *
 * @param int $courseid The course id.
 * @return void
 */
function local_groupimport_require_navigation_js(int $courseid): void {
    global $PAGE;

    $PAGE->requires->js_call_amd('local_groupimport/navigation', 'init', [
        $courseid,
        local_groupimport_get_manager_url($courseid)->out(false),
        local_groupimport_get_native_participants_url($courseid)->out(false),
        get_string('easystudmanager', 'local_groupimport'),
        get_string('nativeparticipantsmenu', 'local_groupimport'),
    ]);
}

/**
 * Configures a participants-style navigation node to point at EasyStud.
 *
 * @param navigation_node $participantsnode The participants navigation node.
 * @param int $courseid The course id.
 * @return void
 */
function local_groupimport_configure_participants_node(navigation_node $participantsnode, int $courseid): void {
    $participantsnode->action = local_groupimport_get_manager_url($courseid);
}

/**
 * Convert a custom profile field value into a compact participant-card label.
 *
 * The participant label is plain text even when a profile field stores editor
 * HTML. Block-level elements are separated before extracting their text so
 * adjacent paragraphs do not run together. Inline elements keep their text
 * without adding presentation markers.
 *
 * @param string|null $value Stored custom profile field value.
 * @return string Normalised plain-text label.
 */
function local_groupimport_normalise_participant_label_value(?string $value): string {
    $value = trim(fix_utf8((string)$value));
    if ($value === '') {
        return '';
    }

    $previouserrors = libxml_use_internal_errors(true);
    $document = new DOMDocument('1.0', 'UTF-8');
    $value = preg_replace('/<\/?(?:body|html)\b[^>]*>/iu', ' ', $value) ?? $value;
    $html = '<?xml encoding="UTF-8"><html><body>' . $value . '</body></html>';
    $loaded = $document->loadHTML(
        $html,
        LIBXML_HTML_NODEFDTD | LIBXML_NONET
    );

    $plaintext = '';
    if ($loaded) {
        $xpath = new DOMXPath($document);
        $root = $document->getElementsByTagName('body')->item(0);

        if ($root !== null) {
            $excludednodes = $xpath->query('.//head | .//noscript | .//script | .//style | .//template', $root);
            if ($excludednodes !== false) {
                $nodestoremove = iterator_to_array($excludednodes);
                foreach ($nodestoremove as $node) {
                    $node->parentNode?->removeChild($node);
                }
            }

            $blocktags = [
                'address', 'article', 'aside', 'blockquote', 'br', 'caption', 'dd', 'details',
                'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main', 'nav',
                'ol', 'p', 'pre', 'section', 'summary', 'table', 'tbody', 'td', 'tfoot',
                'th', 'thead', 'tr', 'ul',
            ];
            $separatorquery = implode(' | ', array_map(static function(string $tag): string {
                return './/' . $tag;
            }, $blocktags));
            $separatornodes = $xpath->query($separatorquery, $root);
            if ($separatornodes !== false) {
                $nodestoseparate = iterator_to_array($separatornodes);
                foreach ($nodestoseparate as $node) {
                    $parent = $node->parentNode;
                    if ($parent === null) {
                        continue;
                    }

                    $parent->insertBefore($document->createTextNode(' '), $node);
                    if (core_text::strtolower($node->nodeName) === 'br') {
                        $parent->replaceChild($document->createTextNode(' '), $node);
                    } else if ($node->nextSibling !== null) {
                        $parent->insertBefore($document->createTextNode(' '), $node->nextSibling);
                    } else {
                        $parent->appendChild($document->createTextNode(' '));
                    }
                }
            }

            $plaintext = (string)$root->textContent;
        }
    }

    libxml_clear_errors();
    libxml_use_internal_errors($previouserrors);

    if ($plaintext === '') {
        return '';
    }

    $normalised = preg_replace('/[\p{Z}\s]+/u', ' ', $plaintext);
    return trim($normalised ?? '');
}

/**
 * Build the target rows represented by an import history operation log.
 *
 * Recent imports store a complete desired state. The fallback keeps histories
 * created by the first reversible-history implementation useful when the
 * imported containers can still be identified from their operation log.
 *
 * @param array $changes Decoded history operation log.
 * @param int $courseid Course id.
 * @return array Target import rows.
 */
function local_groupimport_history_desired_state(array $changes, int $courseid): array {
    global $DB;

    if (!empty($changes['desiredstate']) && is_array($changes['desiredstate'])) {
        return array_values(array_filter($changes['desiredstate'], static function($row): bool {
            return is_array($row) && !empty($row['userid']) && !empty($row['groupname']);
        }));
    }

    $groupnames = [];
    foreach ($changes['createdgroups'] ?? [] as $group) {
        if (!empty($group['id']) && isset($group['name'])) {
            $groupnames[(int)$group['id']] = (string)$group['name'];
        }
    }
    $groupingnames = [];
    foreach ($changes['createdgroupings'] ?? [] as $grouping) {
        if (!empty($grouping['id']) && isset($grouping['name'])) {
            $groupingnames[(int)$grouping['id']] = (string)$grouping['name'];
        }
    }

    $groupids = array_unique(array_map(static function(array $membership): int {
        return (int)($membership['groupid'] ?? 0);
    }, $changes['addedmembers'] ?? []));
    foreach (array_filter($groupids) as $groupid) {
        if (!isset($groupnames[$groupid])) {
            $name = $DB->get_field('groups', 'name', ['id' => $groupid, 'courseid' => $courseid]);
            if ($name !== false) {
                $groupnames[$groupid] = (string)$name;
            }
        }
    }

    $groupgroupings = [];
    foreach ($changes['assignedgroupings'] ?? [] as $assignment) {
        $groupid = (int)($assignment['groupid'] ?? 0);
        $groupingid = (int)($assignment['groupingid'] ?? 0);
        if (!$groupid || !$groupingid) {
            continue;
        }
        if (!isset($groupingnames[$groupingid])) {
            $name = $DB->get_field('groupings', 'name', ['id' => $groupingid, 'courseid' => $courseid]);
            if ($name !== false) {
                $groupingnames[$groupingid] = (string)$name;
            }
        }
        if (isset($groupingnames[$groupingid])) {
            $groupgroupings[$groupid][] = $groupingnames[$groupingid];
        }
    }

    $rows = [];
    foreach ($changes['addedmembers'] ?? [] as $membership) {
        $groupid = (int)($membership['groupid'] ?? 0);
        $userid = (int)($membership['userid'] ?? 0);
        if (!$userid || empty($groupnames[$groupid])) {
            continue;
        }
        $names = $groupgroupings[$groupid] ?? [''];
        foreach ($names as $groupingname) {
            $rows[] = [
                'userid' => $userid,
                'identifier' => '',
                'groupname' => $groupnames[$groupid],
                'groupingname' => $groupingname,
            ];
        }
    }

    return $rows;
}
