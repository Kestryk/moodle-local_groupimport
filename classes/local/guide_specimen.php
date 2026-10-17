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
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

namespace local_groupimport\local;

defined('MOODLE_INTERNAL') || die();

/**
 * Static, current-product specimens for the Guide slides that used the former mini-cards.
 *
 * Every context is illustration data: fictitious names, no course lookup, no command.
 * The template draws them with the product's own card classes (see guide_specimen.mustache).
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class guide_specimen {
    /** Reading position (zero based) of the slides that the ready recap links to. */
    private const REVIEW_INDEXES = ['create' => 2, 'organise' => 7, 'filter' => 8, 'assignment' => 11];

    /**
     * Specimen for one source slide of the modern curriculum, or null when it has none.
     *
     * @param string $source Source slide id (reference-N) before the curriculum renumbering.
     * @return array|null Template context of guide_specimen.mustache.
     */
    public static function for_source(string $source): ?array {
        switch ($source) {
            case 'reference-4':
                return self::participant();
            case 'reference-3':
                return self::filters();
            case 'reference-9':
                return self::identifiers();
            case 'reference-7':
                return self::assignment();
            case 'reference-19':
                return self::ready();
        }
        return null;
    }

    /**
     * Source slides that carried a former illustration, so the caller can drop its payload.
     *
     * @return string[] Legacy visual keys replaced by a specimen.
     */
    public static function replaced_visual_keys(): array {
        return ['visualcarddetail', 'visualfiltersdemo', 'visualpaste', 'visualassignment', 'visualsteps'];
    }

    /**
     * Strings shared by the illustrated specimens.
     */
    private static function base(string $kind): array {
        return [
            $kind => true,
            'kind' => $kind,
            'caption' => get_string('discovery_simulation', 'local_groupimport'),
            'captionshort' => get_string('discovery_simulation_short', 'local_groupimport'),
            'label' => get_string('guidespec_' . $kind . '_label', 'local_groupimport'),
        ];
    }

    private static function string(string $key): string {
        return get_string('guidespec_' . $key, 'local_groupimport');
    }

    /**
     * Slide "Read a participant card": tick, eye, details.
     */
    public static function participant(): array {
        $card = ['name' => 'Inès Garnier', 'badge' => 'EMLV', 'email' => 'i.garnier@example.test', 'selected' => true];
        $details = [
            'eyebrow' => self::string('participant_details_eyebrow'),
            'title' => self::string('participant_details_title'),
            'chiproles' => self::string('participant_chip_roles'),
            'chipgroups' => self::string('participant_chip_groups'),
            'chipgroupings' => self::string('participant_chip_groupings'),
        ];
        $frames = [];
        foreach ([1, 2, 3] as $number) {
            $frame = ['number' => $number, 'step' => self::string('participant_step' . $number),
                'card' => $card + ['pointer' => $number > 1]];
            if ($number === 3) {
                $frame['details'] = $details;
            }
            $frames[] = $frame;
        }
        return self::base('participant') + ['frames' => $frames];
    }

    /**
     * Slide "Search, filter, select": type, role filter, select the results, clear.
     */
    public static function filters(): array {
        $people = [['Alice Martin', 'TD 1'], ['Ben Leroy', 'TD 1'], ['Zoé Dubois', 'TD 2']];
        $cards = static function (bool $selected) use ($people): array {
            return array_map(static fn(array $person): array => ['name' => $person[0], 'badge' => $person[1],
                'selected' => $selected], $people);
        };
        $count = get_string('listeditemscount', 'local_groupimport', count($people));
        $select = get_string('selectresults', 'local_groupimport');
        $deselect = get_string('deselectresults', 'local_groupimport');
        // The role filter chosen in step 2 stays applied in steps 3 and 4; step 1 keeps its (hidden)
        // row so that the four lists start at the same height.
        $role = ['rolelabel' => get_string('roleslabel', 'local_groupimport'),
            'rolevalue' => get_string('tutorialvisualrolebadge', 'local_groupimport')];
        $frames = [
            ['number' => 1, 'searchvalue' => 'TD', 'selectlabel' => $select, 'countlabel' => $count,
                'cards' => $cards(false)] + $role,
            ['number' => 2, 'searchvalue' => 'TD', 'selectlabel' => $select, 'countlabel' => $count,
                'rolefilter' => true, 'cards' => $cards(false)] + $role,
            ['number' => 3, 'searchvalue' => 'TD', 'selectlabel' => $deselect, 'countlabel' => $count,
                'rolefilter' => true, 'pointselect' => true, 'cards' => $cards(true),
                'selectionbar' => ['summary' => get_string('selectioncount', 'local_groupimport', count($people)),
                    'clear' => get_string('contextclearselection', 'local_groupimport')]] + $role,
            ['number' => 4, 'searchvalue' => 'TD', 'selectlabel' => $select, 'countlabel' => $count,
                'rolefilter' => true, 'cards' => $cards(false)] + $role,
        ];
        foreach ($frames as $index => $frame) {
            $frames[$index]['step'] = self::string('filters_step' . $frame['number']);
        }
        return self::base('filters') + ['frames' => $frames];
    }

    /**
     * Slide "Add by pasted identifiers": two independent destination cards with their open field.
     */
    public static function identifiers(): array {
        $cancel = get_string('cancel', 'local_groupimport');
        $group = [
            'groupname' => self::string('identifiers_groupname'), 'groupcount' => 0, 'groupcountempty' => true,
            'groupactions' => true, 'grouppointer' => true, 'groupempty' => true,
            'groupemptytext' => get_string('nogroupmembers', 'local_groupimport'),
            'groupemptyhelp' => get_string('emptygrouphelp', 'local_groupimport'),
            'treecard' => false,
            'panel' => [
                'panelvalue' => 'alice.martin, 10482, b.leroy',
                'panelchips' => [['chiplabel' => 'alice.martin'], ['chiplabel' => '10482'],
                    ['chiplabel' => 'b.leroy', 'unresolved' => true]],
                'panelsubmit' => get_string('addemails', 'local_groupimport'), 'panelcancel' => $cancel,
            ],
        ];
        $grouping = [
            'groupingname' => self::string('identifiers_groupingname'), 'groupingcount' => 0,
            'groupingcountempty' => true, 'groupingexpanded' => true, 'groupingactions' => true,
            'groupingpointer' => true, 'groupingempty' => true,
            'groupingemptytext' => get_string('nogroupsingrouping', 'local_groupimport'),
            'groupingemptyhelp' => get_string('emptygroupinghelp', 'local_groupimport'),
            'groupingpanel' => [
                'panelvalue' => 'TD 1, TD 2, TD 9',
                'panelchips' => [['chiplabel' => 'TD 1'], ['chiplabel' => 'TD 2'],
                    ['chiplabel' => 'TD 9', 'unresolved' => true]],
                'panelsubmit' => get_string('addgroups', 'local_groupimport'), 'panelcancel' => $cancel,
            ],
        ];
        return self::base('identifiers') + ['group' => $group, 'grouping' => $grouping,
            'stepgroup' => self::string('identifiers_step_group'),
            'stepgrouping' => self::string('identifiers_step_grouping')];
    }

    /**
     * Slide "Group assignment": one grouping, its groups, and the activity that uses it.
     */
    public static function assignment(): array {
        $groupa = get_string('tutorialvisualassignmentgroupa', 'local_groupimport');
        $groupb = get_string('tutorialvisualassignmentgroupb', 'local_groupimport');
        $groupingname = get_string('tutorialvisualassignmentgrouping', 'local_groupimport');
        $group = static fn(string $name, array $members, bool $path): array => [
            'groupname' => $name, 'groupcount' => count($members), 'treecard' => true, 'grouppath' => $path,
            'members' => array_map(static fn(string $member, int $index): array => ['membername' => $member,
                'memberpath' => $path && $index === 0], $members, array_keys($members)),
        ];
        $grouping = [
            'groupingname' => $groupingname, 'groupingcount' => 2, 'groupingexpanded' => true,
            'groupingpath' => true,
            'groups' => [$group($groupa, ['Alice Martin', 'Bastien Leroy'], true),
                $group($groupb, ['Camille Dubois', 'David Moreau'], false)],
        ];
        $activity = [
            'eyebrow' => self::string('assignment_activity_eyebrow'),
            'type' => self::string('assignment_activity_type'),
            'groupmode' => self::string('assignment_groupmode'),
            'groupinglabel' => self::string('assignment_grouping'),
            'groupingname' => $groupingname,
            'note' => self::string('assignment_note'),
        ];
        return self::base('assignment') + ['grouping' => $grouping, 'activity' => $activity];
    }

    /**
     * Slide "Ready": the four lessons worth reviewing, each linking back to its slide.
     */
    public static function ready(): array {
        $tiles = [];
        $icons = ['create' => 'fa-plus', 'organise' => 'fa-right-left', 'filter' => 'fa-filter',
            'assignment' => 'fa-graduation-cap'];
        foreach (self::REVIEW_INDEXES as $key => $index) {
            $tiles[] = [
                'icon' => $icons[$key],
                'title' => self::string('ready_' . $key . '_title'),
                'text' => self::string('ready_' . $key . '_text'),
                'index' => $index,
                'review' => self::string_with_args('ready_review', (object) ['number' => $index + 1,
                    'title' => get_string('guide_nav_' . ($index + 1), 'local_groupimport')]),
            ];
        }
        return ['ready' => true, 'kind' => 'ready', 'label' => self::string('ready_label'), 'tiles' => $tiles];
    }

    private static function string_with_args(string $key, $args): string {
        return get_string('guidespec_' . $key, 'local_groupimport', $args);
    }
}
