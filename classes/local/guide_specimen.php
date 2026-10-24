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

    /**
     * Resolve a specimen label in the plugin language component.
     *
     * @param string $key Label suffix after guidespec_.
     * @return string Translated specimen label.
     */
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
            // K17-38: three label/value rows; the numbers are demonstration values.
            'rows' => [
                ['icon' => 'fa-user-tag', 'label' => self::string('participant_row_roles'), 'value' => 1],
                ['icon' => 'fa-users', 'label' => self::string('participant_row_groups'), 'value' => 3],
                ['icon' => 'fa-layer-group', 'label' => self::string('participant_row_groupings'), 'value' => 2],
            ],
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
     * Slide "Ready": the lessons worth reviewing, each linking back to its slide.
     *
     * Student Management calls it without argument (its four fixed tiles). Another Guide passes its own
     * tiles, each as icon, title, text and the zero based reading position of the slide to review.
     *
     * @param array[]|null $tiles Custom tiles, or null for the Student Management ones.
     * @param string $navprefix Language string prefix of the slide pills (number appended).
     * @return array Template context of guide_specimen.mustache.
     */
    public static function ready(?array $tiles = null, string $navprefix = 'guide_nav_'): array {
        if ($tiles === null) {
            $tiles = [];
            $icons = ['create' => 'fa-plus', 'organise' => 'fa-right-left', 'filter' => 'fa-filter',
                'assignment' => identity::ICON];
            foreach (self::REVIEW_INDEXES as $key => $index) {
                $tiles[] = ['icon' => $icons[$key], 'index' => $index,
                    'title' => self::string('ready_' . $key . '_title'),
                    'text' => self::string('ready_' . $key . '_text')];
            }
        }
        $result = [];
        foreach ($tiles as $tile) {
            $index = (int) $tile['index'];
            $result[] = $tile + [
                'review' => self::string_with_args('ready_review', (object) ['number' => $index + 1,
                    'title' => get_string($navprefix . ($index + 1), 'local_groupimport')]),
            ];
        }
        return ['ready' => true, 'kind' => 'ready', 'label' => self::string('ready_label'), 'tiles' => $result];
    }

    /**
     * Shared head of the Mass Import specimens: the label comes from the slide, not from guidespec_*.
     *
     * @param string $kind Specimen kind (also the template section name).
     * @param string $labelkey Language string key of the specimen label.
     * @return array
     */
    private static function mass_import_base(string $kind, string $labelkey): array {
        return [
            $kind => true,
            'kind' => $kind,
            'caption' => get_string('discovery_simulation', 'local_groupimport'),
            'captionshort' => get_string('discovery_simulation_short', 'local_groupimport'),
            'label' => get_string($labelkey, 'local_groupimport'),
        ];
    }

    /**
     * Mass Import slide "Prepare the file": a six row spreadsheet with three numbered columns.
     *
     * @param array[] $legend Numbered legend (n, label) of the three columns.
     * @return array Template context of guide_specimen.mustache.
     */
    public static function mifile(array $legend): array {
        $unknown = get_string('guideinspection_unknownlabel', 'local_groupimport');
        $rows = [
            [2, 'alice.martin', 'TD 1', 'Année 2026'],
            [3, 'i.garnier@example.test', 'TD 1', 'Année 2026'],
            [4, '10482', 'TD 2', 'Année 2026'],
            [5, 'zoe.dubois', 'TD 2', 'Année 2026'],
            [6, $unknown, 'TD 2', 'Année 2026'],
            [7, 'alex@example.test', 'TD 9', ''],
        ];
        $columns = [];
        foreach (['templatecolumnidentifier', 'templatecolumngroup', 'templatecolumngrouping'] as $index => $key) {
            $columns[] = ['n' => $index + 1, 'label' => get_string($key, 'local_groupimport')];
        }
        return self::mass_import_base('mifile', 'mi_guide_file_label') + [
            'filename' => get_string('mi_guide_example_filename', 'local_groupimport'),
            'columns' => $columns,
            'rows' => array_map(static fn(array $row): array => ['line' => $row[0], 'identifier' => $row[1],
                'group' => $row[2], 'grouping' => $row[3]], $rows),
            'fields' => [get_string('username'), get_string('email'), get_string('idnumber')],
            'legend' => $legend,
            'legendbelow' => true,
        ];
    }

    /**
     * GMI-C3: the rows of the example file "td-2026.xlsx" as the Mass Import preview lists them.
     *
     * @return array[] Rows with line, identifier, group, grouping, status and warning (true when flagged).
     */
    public static function mass_import_preview_rows(): array {
        $component = 'local_groupimport';
        $unknown = get_string('guideinspection_unknownlabel', $component);
        $ready = get_string('importpreviewready', $component);
        $rows = [
            [2, 'alice.martin', 'TD 1', 'Année 2026', $ready, false],
            [3, 'i.garnier@example.test', 'TD 1', 'Année 2026', $ready, false],
            [4, '10482', 'TD 2', 'Année 2026', $ready, false],
            [5, 'zoe.dubois', 'TD 2', 'Année 2026', get_string('previewuseralreadyingroup', $component), true],
            [6, $unknown, 'TD 2', 'Année 2026', get_string('importuserunavailable', $component, $unknown), true],
            [7, 'alex@example.test', 'TD 9', '', $ready, false],
        ];
        return array_map(static fn(array $row): array => ['line' => $row[0], 'identifier' => $row[1],
            'group' => $row[2], 'grouping' => $row[3], 'status' => $row[4], 'warning' => $row[5]], $rows);
    }

    /**
     * GMI-C3: the identifier typed in place of the unknown entry in the preview demonstration.
     *
     * @return string
     */
    public static function mass_import_correction(): string {
        return 'hugo.petit';
    }

    /**
     * Mass Import slide "Reimport strategy": the same group after each of the two strategies.
     *
     * @return array Template context of guide_specimen.mustache.
     */
    public static function mistrategy(): array {
        $added = get_string('mi_guide_strategy_added', 'local_groupimport');
        $removed = get_string('mi_guide_strategy_removed', 'local_groupimport');
        $options = [
            ['key' => 'keep', 'icon' => 'fa-plus', 'title' => get_string('reimportkeeptitle', 'local_groupimport'),
                'description' => get_string('reimportkeepdesc', 'local_groupimport')],
            ['key' => 'replace', 'icon' => 'fa-sync-alt',
                'title' => get_string('reimportreplacetitle', 'local_groupimport'),
                'description' => get_string('reimportreplacedesc', 'local_groupimport')],
        ];
        $strategy = get_string('reimportstrategy', 'local_groupimport');
        $frames = [];
        $members = [
            1 => [['membername' => 'Alice Martin'], ['membername' => 'Ben Leroy'],
                ['membername' => 'Inès Garnier', 'membermark' => $added, 'memberadded' => true]],
            2 => [['membername' => 'Alice Martin'],
                ['membername' => 'Inès Garnier', 'membermark' => $added, 'memberadded' => true],
                ['membername' => 'Ben Leroy', 'membermark' => $removed, 'memberremoved' => true]],
        ];
        foreach ([1, 2] as $number) {
            $frames[] = [
                'number' => $number,
                'step' => get_string('mi_guide_strategy_frame' . $number, 'local_groupimport'),
                'strategy' => $strategy,
                'options' => array_map(static fn(array $option): array => $option + [
                    'checked' => ($option['key'] === 'keep') === ($number === 1)], $options),
                'group' => ['groupname' => 'TD 1', 'groupcount' => count($members[$number]), 'treecard' => true,
                    'members' => $members[$number]],
            ];
        }
        return self::mass_import_base('mistrategy', 'mi_guide_strategy_title') + [
            'start' => ['title' => get_string('mi_guide_strategy_start', 'local_groupimport'),
                'body' => get_string('mi_guide_strategy_startbody', 'local_groupimport')],
            'frames' => $frames,
        ];
    }

    /**
     * Mass Import slide "Run the import": the one click, the background import, the notification.
     *
     * @return array Template context of guide_specimen.mustache.
     */
    public static function mirun(): array {
        $frames = [
            ['number' => 1, 'immediate' => true,
                'warning' => get_string('mi_guide_path_warning', 'local_groupimport'),
                'submit' => get_string('submitimport', 'local_groupimport'),
                'done' => get_string('successheader', 'local_groupimport'), 'donecount' => 4],
            ['number' => 2, 'background' => true,
                'queued' => get_string('importjobqueued', 'local_groupimport'),
                'progress' => get_string('mi_guide_run_progress', 'local_groupimport')],
            ['number' => 3, 'notification' => true,
                'notificationtitle' => get_string('importjobcompleted', 'local_groupimport'),
                'notificationbody' => get_string('mi_guide_run_notification_body', 'local_groupimport')],
        ];
        foreach ($frames as $index => $frame) {
            $frames[$index]['step'] = get_string('mi_guide_run_frame' . $frame['number'], 'local_groupimport');
        }
        return self::mass_import_base('mirun', 'mi_guide_run_title') + ['frames' => $frames];
    }

    /**
     * Mass Import slide "Read the report": the six kept rows, four successes and two errors.
     *
     * @return array Template context of guide_specimen.mustache.
     */
    public static function mireport(): array {
        $component = 'local_groupimport';
        $unknown = get_string('guideinspection_unknownlabel', $component);
        $grouping = 'Année 2026';
        $added = static fn(string $who, string $group, ?string $in = null): string => get_string(
            $in === null ? 'useraddedtogroup' : 'useraddedtogroupwithgrouping',
            $component,
            (object) ['identifier' => $who, 'groupname' => $group, 'groupingname' => $in]
        );
        $success = [
            $added('alice.martin', 'TD 1', $grouping),
            $added('i.garnier@example.test', 'TD 1', $grouping),
            $added('10482', 'TD 2', $grouping),
            $added('alex@example.test', 'TD 9'),
        ];
        $errors = [
            get_string('useralreadyingroup', $component, (object) ['identifier' => 'zoe.dubois',
                'groupname' => 'TD 2']),
            get_string('importuserunavailable', $component, $unknown),
        ];
        return self::mass_import_base('mireport', 'mi_guide_report_label') + [
            'summarylabel' => get_string('importsummary', $component),
            'successcount' => count($success), 'successheader' => get_string('successheader', $component),
            'errorcount' => count($errors), 'errorheader' => get_string('errorheader', $component),
            'success' => $success, 'errors' => $errors,
            'export' => get_string('importexportresults', $component),
        ];
    }

    /**
     * Anatomy of a Mass Import element (page or history row), for guide_anatomy.mustache.
     *
     * @param string $type 'mipage' or 'mihistory'.
     * @param array[] $legend Numbered legend (n, label).
     * @return array Template context of guide_anatomy.mustache.
     */
    public static function mass_import_anatomy(string $type, array $legend): array {
        $component = 'local_groupimport';
        $data = [
            $type => true,
            'type' => $type,
            'title' => get_string(
                $type === 'mipage' ? 'mi_guide_anatomy_page_title' : 'mi_guide_anatomy_history_title',
                $component
            ),
            'caption' => get_string('guideanatomy_caption', $component),
            'legendlabel' => get_string('guideanatomy_legend', $component),
            'legend' => $legend,
        ];
        if ($type === 'mipage') {
            $data += [
                'pagetitle' => get_string('groupimport', $component),
                'navtemplate' => get_string('downloadtemplate', $component),
                'navhistory' => get_string('importhistory', $component),
                'uploadtitle' => get_string('importfile', $component),
                'depositlabel' => get_string('filedeposittitle', $component),
                'detecttitle' => get_string('importautodetecttitle', $component),
                'fields' => [get_string('username'), get_string('email')],
                'resultstitle' => get_string('importresults', $component),
                'emptytext' => get_string('noresults', $component),
            ];
        } else {
            $data += [
                'filename' => get_string('mi_guide_example_filename', $component),
                'meta' => implode(' · ', [
                    get_string('mi_guide_history_sample_date', $component),
                    get_string('importhistoryrowscount', $component, 6),
                    get_string('importhistorysuccesscount', $component, 4),
                    get_string('importhistoryerrorscount', $component, 2),
                ]),
                'state' => get_string('importhistoryapplied', $component),
                'restore' => get_string('importhistoryrollback', $component),
                'export' => get_string('importhistoryexportshort', $component),
            ];
        }
        return $data;
    }

    /**
     * Resolve a specimen label with its placeholder values.
     *
     * @param string $key Label suffix after guidespec_.
     * @param mixed $args Placeholder values passed unchanged to get_string.
     * @return string Translated specimen label.
     */
    private static function string_with_args(string $key, $args): string {
        return get_string('guidespec_' . $key, 'local_groupimport', $args);
    }
}
