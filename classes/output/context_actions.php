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

namespace local_groupimport\output;

defined('MOODLE_INTERNAL') || die();

/**
 * Builds the Student Management context menu entries.
 *
 * Extracted from manage.php (I3, 2026-10-21): same body as
 * local_groupimport_build_context_actions_template_data, moved verbatim.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class context_actions {

    /**
     * Build context menu entry data for Mustache.
     *
     * Entries are rendered top to bottom. Each entry is exactly one of an action
     * item, a section separator or a submenu group holding its own action items.
     *
     * @param array $alloweduserfields Allowed configured fields.
     * @param bool $canmessageparticipants Whether current user can send bulk messages.
     * @return array
     */
    public static function build_template_data(
        array $alloweduserfields = [],
        bool $canmessageparticipants = false
    ): array {
        $actions = [
            'participant-open-details' => [
                'contexts' => 'participant',
                'icon' => 'fa-eye',
                'label' => get_string('viewparticipantdetails', 'local_groupimport'),
            ],
            'clear-selection' => [
                'contexts' => 'participant group grouping member',
                'icon' => 'fa-times-circle',
                'label' => get_string('contextclearselection', 'local_groupimport'),
                'multilabel' => get_string('contextclearselection', 'local_groupimport'),
            ],
            'participant-move-selected' => [
                'contexts' => 'participant',
                'icon' => 'fa-arrow-right',
                'label' => get_string('contextmoveparticipant', 'local_groupimport'),
                'multilabel' => get_string('contextmoveparticipants', 'local_groupimport'),
            ],
            'participant-message-selected' => [
                'contexts' => 'participant member',
                'icon' => 'fa-comment-dots',
                'label' => get_string('sendmessage', 'core_message'),
                'multilabel' => get_string('messageselectadd'),
                'enabled' => $canmessageparticipants,
            ],
            'copy-participant-name' => [
                'contexts' => 'participant member',
                'icon' => 'fa-id-card',
                'label' => get_string('contextcopyshortfullname', 'local_groupimport'),
            ],
            'copy-participant-id' => [
                'contexts' => 'participant member',
                'icon' => 'fa-hashtag',
                'label' => get_string('contextcopyshortuserid', 'local_groupimport'),
            ],
            'group-search-members' => [
                'contexts' => 'group',
                'icon' => 'fa-search',
                'label' => get_string('searchparticipantslabel', 'local_groupimport'),
            ],
            'group-paste-emails' => [
                'contexts' => 'group',
                'icon' => 'fa-envelope-open-text',
                'label' => get_string('contextaddbyidentifiers', 'local_groupimport'),
            ],
            'group-add-copied-users' => [
                'contexts' => 'group',
                'icon' => 'fa-clipboard-check',
                'label' => get_string('contextaddcopiedparticipants', 'local_groupimport'),
            ],
            'group-move-selected' => [
                'contexts' => 'group',
                'icon' => 'fa-arrow-right',
                'label' => get_string('movegroupsselection', 'local_groupimport'),
                'multilabel' => get_string('movegroupsselection', 'local_groupimport'),
            ],
            'group-remove-from-grouping' => [
                'contexts' => 'group',
                'icon' => 'fa-unlink',
                'label' => get_string('removegroupfromgrouping', 'local_groupimport'),
                'multilabel' => get_string('removegroupsfromgroupings', 'local_groupimport'),
            ],
            'group-delete-selected' => [
                'contexts' => 'group',
                'icon' => 'fa-trash',
                'label' => get_string('deletegroupsselection', 'local_groupimport'),
                'multilabel' => get_string('deletegroupsselection', 'local_groupimport'),
            ],
            'group-focus-rename' => [
                'contexts' => 'group',
                'icon' => 'fa-pen',
                'label' => get_string('contextfocusrename', 'local_groupimport'),
            ],
            'group-open-advanced-settings' => [
                'contexts' => 'group',
                'icon' => 'fa-cog',
                'label' => get_string('advancedsettings', 'local_groupimport'),
            ],
            'copy-group-name' => [
                'contexts' => 'group',
                'icon' => 'fa-copy',
                'label' => get_string('contextcopyshortgroupname', 'local_groupimport'),
                'multilabel' => get_string('contextcopyshortgroupnames', 'local_groupimport'),
            ],
            'copy-group-id' => [
                'contexts' => 'group',
                'icon' => 'fa-hashtag',
                'label' => get_string('contextcopyshortgroupid', 'local_groupimport'),
                'multilabel' => get_string('contextcopyshortgroupids', 'local_groupimport'),
            ],
            'grouping-paste-groups' => [
                'contexts' => 'grouping',
                'icon' => 'fa-layer-group',
                'label' => get_string('contextaddbygroupnames', 'local_groupimport'),
            ],
            'grouping-add-copied-groups' => [
                'contexts' => 'grouping',
                'icon' => 'fa-clipboard-check',
                'label' => get_string('contextaddcopiedgroupsshort', 'local_groupimport'),
            ],
            'grouping-search-groups' => [
                'contexts' => 'grouping',
                'icon' => 'fa-search',
                'label' => get_string('searchgroupslabel', 'local_groupimport'),
            ],
            'grouping-select-groups' => [
                'contexts' => 'grouping',
                'icon' => 'fa-check-square',
                'label' => get_string('contextselectgroupinggroups', 'local_groupimport'),
                'multilabel' => get_string('contextselectgroupingsgroups', 'local_groupimport'),
            ],
            'grouping-focus-rename' => [
                'contexts' => 'grouping',
                'icon' => 'fa-pen',
                'label' => get_string('contextfocusrenamegrouping', 'local_groupimport'),
            ],
            'grouping-open-advanced-settings' => [
                'contexts' => 'grouping',
                'icon' => 'fa-cog',
                'label' => get_string('advancedsettings', 'local_groupimport'),
            ],
            'copy-grouping-name' => [
                'contexts' => 'grouping',
                'icon' => 'fa-copy',
                'label' => get_string('contextcopyshortgroupingname', 'local_groupimport'),
            ],
            'copy-grouping-id' => [
                'contexts' => 'grouping',
                'icon' => 'fa-hashtag',
                'label' => get_string('contextcopyshortgroupingid', 'local_groupimport'),
            ],
            'member-move-selected' => [
                'contexts' => 'member',
                'icon' => 'fa-arrow-right',
                'label' => get_string('contextmovemember', 'local_groupimport'),
                'multilabel' => get_string('contextmoveselectedmembers', 'local_groupimport'),
            ],
            'remove-member' => [
                'contexts' => 'member',
                'icon' => 'fa-user-minus',
                'label' => get_string('contextremovemember', 'local_groupimport'),
                'multilabel' => get_string('contextremoveselectedmembers', 'local_groupimport'),
            ],
            'paste-field' => [
                'contexts' => 'paste-field',
                'icon' => 'fa-paste',
                'label' => get_string('contextpaste', 'local_groupimport'),
            ],
        ];

        // Every key is always present so Mustache never resolves one from a parent context.
        $entry = static function (array $values = []): array {
            return array_merge(['isitem' => false, 'isseparator' => false, 'isgroup' => false], $values);
        };
        $item = static function (string $action, array $definition, string $fieldkey = ''): array {
            return [
                'action' => $action,
                'contexts' => $definition['contexts'],
                'icon' => $definition['icon'],
                'label' => $definition['label'],
                'multilabel' => $definition['multilabel'] ?? '',
                'fieldkey' => $fieldkey,
            ];
        };
        $items = static function (array $keys) use ($actions, $item): array {
            $result = [];
            foreach ($keys as $action) {
                $definition = $actions[$action];
                if (array_key_exists('enabled', $definition) && !$definition['enabled']) {
                    continue;
                }
                $result[] = $item($action, $definition);
            }
            return $result;
        };
        $group = static function (
            string $key,
            string $contexts,
            string $icon,
            string $label,
            string $multilabel,
            array $children
        ) use ($entry): array {
            return $entry(['isgroup' => true, 'group' => [
                'key' => $key,
                'contexts' => $contexts,
                'icon' => $icon,
                'label' => $label,
                'multilabel' => $multilabel,
                'actions' => $children,
            ]]);
        };

        $copychildren = $items(['copy-participant-name']);
        foreach ($alloweduserfields as $fieldkey => $fieldlabel) {
            $shortlabel = $fieldkey === 'email'
                ? get_string('contextcopyshortemail', 'local_groupimport')
                : (string)$fieldlabel;
            $copychildren[] = $item('copy-participant-field', [
                'contexts' => 'participant member',
                'icon' => $fieldkey === 'email' ? 'fa-at' : 'fa-copy',
                'label' => $shortlabel,
                'multilabel' => $shortlabel,
            ], (string)$fieldkey);
        }
        $copychildren = array_merge($copychildren, $items([
            'copy-participant-id',
            'copy-group-name',
            'copy-group-id',
            'copy-grouping-name',
            'copy-grouping-id',
        ]));

        $sections = [
            $items([
                'participant-open-details',
                'group-search-members',
                'grouping-search-groups',
                'grouping-select-groups',
            ]),
            $items([
                'participant-move-selected',
                'member-move-selected',
                'group-move-selected',
                'participant-message-selected',
                'group-focus-rename',
                'grouping-focus-rename',
                'group-open-advanced-settings',
                'grouping-open-advanced-settings',
            ]),
            [
                $group(
                    'add-participants',
                    'group',
                    'fa-user-plus',
                    get_string('contextsubmenuaddparticipants', 'local_groupimport'),
                    '',
                    $items(['group-paste-emails', 'group-add-copied-users'])
                ),
                $group(
                    'add-groups',
                    'grouping',
                    'fa-layer-group',
                    get_string('contextsubmenuaddgroups', 'local_groupimport'),
                    '',
                    $items(['grouping-paste-groups', 'grouping-add-copied-groups'])
                ),
            ],
            [
                $group(
                    'copy',
                    'participant member group grouping',
                    'fa-copy',
                    get_string('contextsubmenucopy', 'local_groupimport'),
                    get_string('contextsubmenucopyselection', 'local_groupimport'),
                    $copychildren
                ),
                ...$items(['paste-field']),
            ],
            $items([
                'group-remove-from-grouping',
                'remove-member',
                'group-delete-selected',
            ]),
            $items(['clear-selection']),
        ];

        $result = [];
        foreach ($sections as $section) {
            if (!$section) {
                continue;
            }
            if ($result) {
                $result[] = $entry(['isseparator' => true]);
            }
            foreach ($section as $sectionentry) {
                $result[] = isset($sectionentry['action'])
                    ? $entry(['isitem' => true, 'item' => $sectionentry])
                    : $sectionentry;
            }
        }

        return $result;
    }
}
