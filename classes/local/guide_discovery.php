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
 * Product-owned discovery content; illustrations never issue Moodle commands.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class guide_discovery {
    /**
     * Opt-in timed illustration entry; not a native course or guided-path command.
     */
    public static function demonstration_entry(): array {
        return [
            'manualstart' => true,
            'startlabel' => get_string('discovery_demo_start', 'local_groupimport'),
            'runninglabel' => get_string('discovery_demo_running', 'local_groupimport'),
            'replaylabel' => get_string('discovery_demo_replay', 'local_groupimport'),
            'steplabel' => get_string('discovery_demo_step', 'local_groupimport'),
            'readylabel' => get_string('discovery_demo_ready', 'local_groupimport'),
            'pausedlabel' => get_string('discovery_demo_paused', 'local_groupimport'),
            'addmodelabel' => get_string('discovery_demo_add', 'local_groupimport'),
            'movemodelabel' => get_string('discovery_demo_move', 'local_groupimport'),
            'addmodehint' => get_string('discovery_demo_add_hint', 'local_groupimport'),
            'movemodehint' => get_string('discovery_demo_move_hint', 'local_groupimport'),
            'expectedlabel' => get_string('discovery_demo_expected', 'local_groupimport'),
            'expectedcompactlabel' => get_string('discovery_demo_expected_compact', 'local_groupimport'),
            'unchangedlabel' => get_string('discovery_demo_unchanged', 'local_groupimport'),
            'comparelabel' => get_string('discovery_demo_compare', 'local_groupimport'),
        ];
    }

    /**
     * Historical IDs describe content, independently from its reading position.
     */
    public static function historical_slide_ids(): array {
        $ids = ['discovery-concepts', 'discovery-creation', 'discovery-membership', 'discovery-actions'];
        for ($index = 0; $index < 20; $index++) {
            $ids[] = $index === 2 ? 'use-this-guide' : 'reference-' . $index;
        }
        return $ids;
    }

    /**
     * Explicitly supported reading histories; path IDs and completion stay unchanged.
     */
    public static function reading_contract(): array {
        $old = self::historical_slide_ids();
        $ids = array_values(array_filter($old, static fn($id) => $id !== 'use-this-guide'));
        array_unshift($ids, 'use-this-guide');
        $map = array_map(static fn($id) => array_search($id, $ids, true), $old);
        return ['presentationKey' => 'introduction-first-20261009', 'slideIds' => $ids,
            'readingIndexMigrations' => ['discovery-20261006' => $map, 'legacy' => array_slice($map, 4)]];
    }

    /**
     * Move only the introductory lesson, retaining every other lesson and native target.
     */
    public static function introduction_first(array $slides): array {
        if (array_column($slides, 'id') !== self::historical_slide_ids()) {
            throw new \LogicException('Update the explicit Guide reading contract before changing the curriculum.');
        }
        $byid = array_column($slides, null, 'id');
        return array_map(static function ($id, $index) use ($byid): array {
            $slide = $byid[$id];
            $slide['index'] = $index;
            return $slide;
        }, self::reading_contract()['slideIds'], range(0, count($slides) - 1));
    }
    /**
     * Card-reading copy uses the existing shared explanation recipe, not a new scene engine.
     */
    public static function card_explanation(string $type): array {
        if (!in_array($type, ['participant', 'group', 'grouping'], true)) {
            throw new \InvalidArgumentException('Unknown Guide card type.');
        }
        $topics = [];
        foreach (['read' => 'fa-compass', 'actions' => 'fa-play-circle', 'mobile' => 'fa-eye'] as $key => $icon) {
            $prefix = 'guidecard_' . $type . '_' . $key;
            $topics[] = ['icon' => $icon,
                'title' => get_string($prefix . '_title', 'local_groupimport'),
                'description' => get_string($prefix . '_description', 'local_groupimport')];
        }
        return [
            'topics' => $topics,
            'note' => get_string('guidecard_' . $type . '_note', 'local_groupimport'),
            // The template keeps the first introduction's teaching specimens
            // distinct; only short card lessons use the three-column reading
            // composition when their actual dialog lane can support it.
            'lessonreading' => true,
        ];
    }

    /**
     * E4 (K5): numbered anatomy of a card and, for a group, the mini demonstration of the search loupe.
     *
     * Illustration only: fictional values, no command attribute, no Moodle call. The legend is the
     * ordered list of lang strings guideanatomy_<type>_<n>, which match the numbered markers
     * of templates/guide_anatomy.mustache.
     *
     * @param string $type Card type: participant, group or grouping.
     * @return array Context for the guide_anatomy partial.
     */
    public static function card_anatomy(string $type): array {
        $counts = ['participant' => 7, 'group' => 10, 'grouping' => 10];
        if (!isset($counts[$type])) {
            throw new \InvalidArgumentException('Unknown Guide card type.');
        }
        $legend = [];
        for ($n = 1; $n <= $counts[$type]; $n++) {
            $legend[] = ['n' => $n, 'label' => get_string('guideanatomy_' . $type . '_' . $n, 'local_groupimport')];
        }
        $data = [
            $type => true,
            'type' => $type,
            'title' => get_string('guideanatomy_title', 'local_groupimport'),
            'caption' => get_string('guideanatomy_caption', 'local_groupimport'),
            'hovernote' => get_string('guideanatomy_hover', 'local_groupimport'),
            'legendlabel' => get_string('guideanatomy_legend', 'local_groupimport'),
            'legend' => $legend,
            'rolelabel' => get_string('tutorialvisualrolebadge', 'local_groupimport'),
            'grouptag' => get_string('tutorialvisualgroupbadge', 'local_groupimport'),
            'groupingname' => get_string('guideanatomy_sample_grouping', 'local_groupimport'),
        ];
        if ($type === 'group') {
            $data['loupe'] = [
                'title' => get_string('guideanatomy_loupe_title', 'local_groupimport'),
                'startlabel' => get_string('guideanatomy_loupe_start', 'local_groupimport'),
                'runninglabel' => get_string('guideanatomy_loupe_running', 'local_groupimport'),
                'replaylabel' => get_string('guideanatomy_loupe_replay', 'local_groupimport'),
                'idlelabel' => get_string('guideanatomy_loupe_idle', 'local_groupimport'),
                'phase1' => get_string('guideanatomy_loupe_phase1', 'local_groupimport'),
                'phase2' => get_string('guideanatomy_loupe_phase2', 'local_groupimport'),
                'phase3' => get_string('guideanatomy_loupe_phase3', 'local_groupimport'),
                'donelabel' => get_string('guideanatomy_loupe_done', 'local_groupimport'),
                'query' => get_string('guideanatomy_loupe_query', 'local_groupimport'),
                'cancellabel' => get_string('discovery_cancel', 'local_groupimport'),
                'searchlabel' => get_string('guideanatomy_group_3', 'local_groupimport'),
            ];
        }
        return $data;
    }

    /**
     * Prepare illustration-only destination-card data for the shared inspection recipe.
     *
     * Not wired into the curriculum until the matching Kit template, engine and
     * stylesheet are synchronized together. Identifiers are fictional examples;
     * this method never resolves users/groups or issues membership commands.
     *
     * @param string $type Destination identity: group or grouping.
     * @return array Localized scene context, not a complete slide or guided path.
     */
    public static function card_inspection(string $type): array {
        if (!in_array($type, ['group', 'grouping'], true)) {
            throw new \InvalidArgumentException('Unknown Guide inspection destination.');
        }
        $prefix = 'guideinspection_' . $type . '_';
        $scene = [
            'kind' => 'inspection',
            'inspection' => true,
            'grouping' => $type === 'grouping',
            'cardicon' => $type === 'group' ? 'fa-users' : 'fa-layer-group',
            'actionicon' => $type === 'group' ? 'fa-at' : 'fa-layer-group',
        ];
        foreach (['cardtitle', 'cardmeta', 'actionlabel', 'inputlabel', 'knownlabel', 'note', 'resultlabel'] as $key) {
            $scene[$key] = get_string($prefix . $key, 'local_groupimport');
        }
        foreach (['caption', 'menutitle', 'unknownlabel', 'recaptitle'] as $key) {
            $scene[$key] = get_string('guideinspection_' . $key, 'local_groupimport');
        }
        $scene['captionshort'] = get_string('discovery_simulation_short', 'local_groupimport');
        foreach (['add', 'cancel', 'pause', 'resume', 'nextphase', 'finished'] as $key) {
            $scene[$key . 'label'] = get_string('discovery_' . $key, 'local_groupimport');
        }
        // The illustrated inspection submit is the real "Add" action, not the Add/Move comparison mode.
        $scene['addlabel'] = get_string('discovery_demo_add', 'local_groupimport');
        foreach (['replay', 'reset'] as $key) {
            $scene[$key] = get_string('discovery_' . $key, 'local_groupimport');
        }
        $scene['inputvalue'] = ($type === 'group' ? 'alex@example.test' : $scene['knownlabel']) . "\n" . $scene['unknownlabel'];
        $scene['phases'] = [];
        foreach (['orient', 'open', 'enter', 'review', 'return'] as $phase) {
            $item = ['name' => $phase, 'label' => get_string($prefix . $phase, 'local_groupimport')];
            if ($phase === 'open') {
                $item['compactlabel'] = get_string($prefix . 'open_compact', 'local_groupimport');
            }
            $scene['phases'][] = $item;
        }
        $scene['initiallabel'] = $scene['phases'][0]['label'];
        $scene += self::demonstration_entry();
        return $scene;
    }

    /**
     * Modern reading topics reuse the published explanation composition.
     */
    public static function action_explanation(string $type): array {
        if (
            !in_array($type, [
                'filters', 'identifiers', 'destination', 'menu', 'activity', 'ready',
                'method', 'recap', 'mistakes', 'creation',
            ], true)
        ) {
            throw new \InvalidArgumentException('Unknown Guide action explanation.');
        }
        $topics = [];
        foreach (['context' => 'fa-compass', 'review' => 'fa-check-square', 'mobile' => 'fa-eye'] as $key => $icon) {
            $prefix = 'guideaction_' . $type . '_' . $key;
            $topics[] = ['icon' => $icon,
                'title' => get_string($prefix . '_title', 'local_groupimport'),
                'description' => get_string($prefix . '_description', 'local_groupimport')];
        }
        return [
            'topics' => $topics,
            'note' => get_string('guideaction_' . $type . '_note', 'local_groupimport'),
            'lessonreading' => true,
        ];
    }

    /**
     * Shared introduction data; no slide insertion or persisted-index migration.
     */
    public static function common_introduction(bool $specimens = false): array {
        $topics = [];
        foreach (
            ['navigation' => 'fa-compass', 'demonstration' => 'fa-play-circle',
                'interface' => 'fa-eye', 'path' => 'fa-route', 'fullscreen' => 'fa-expand'] as $key => $icon
        ) {
            $topic = ['icon' => $icon,
                'title' => get_string('guideintro_' . $key . '_title', 'local_groupimport'),
                'description' => get_string('guideintro_' . $key . '_description', 'local_groupimport')];
            if ($key === 'fullscreen') {
                $topic['desktopfullscreen'] = true;
            }
            // Opt-in until the shared catalogue and native first-slide gates pass.
            // These examples have no command attributes and cannot modify a course.
            if ($specimens) {
                $kind = ['interface' => 'highlight', 'demonstration' => 'playback'][$key] ?? $key;
                $topic['specimen'] = ['kind' => $kind, $kind => true,
                    'previewlabel' => get_string('guideintro_specimen_preview', 'local_groupimport')];
                if ($kind === 'playback') {
                    $topic['specimen'] += [
                        'pauselabel' => get_string('discovery_pause', 'local_groupimport'),
                        'nextphaselabel' => get_string('discovery_nextphase', 'local_groupimport'),
                    ];
                } else {
                    $labelkey = $kind === 'fullscreen' ? 'guidefullscreenenter' : 'guideintro_specimen_' . $kind;
                    $topic['specimen']['label'] = get_string($labelkey, 'local_groupimport');
                }
            }
            $topics[] = $topic;
        }
        if ($specimens) {
            array_splice($topics, 4, 0, [[
                'icon' => 'fa-tasks',
                'title' => get_string('guideintro_checklist_title', 'local_groupimport'),
                'description' => get_string('guideintro_checklist_description', 'local_groupimport'),
                'specimen' => ['kind' => 'checklist', 'checklist' => true,
                    'previewlabel' => get_string('guideintro_specimen_preview', 'local_groupimport'), 'steps' => [
                    ['icon' => 'fa-check-circle', 'label' => get_string('guideintro_specimen_done', 'local_groupimport')],
                    ['icon' => 'fa-circle', 'label' => get_string('guideintro_specimen_current', 'local_groupimport')],
                    ['icon' => 'fa-lock', 'label' => get_string('guideintro_specimen_locked', 'local_groupimport')],
                ]],
            ]]);
        }
        return ['topics' => $topics, 'note' => get_string('guideintro_note', 'local_groupimport')];
    }

    /**
     * Prepend the four discovery lessons while retaining the reference curriculum.
     */
    public static function prepend(array $legacy): array {
        $definitions = [
            ['concepts', 'fa-sitemap', '[data-easystud-participants-panel]', 'viewParticipants'],
            ['creation', 'fa-route', '.local-groupimport-easystud-create-row', 'viewGroups'],
            ['membership', 'fa-users', '[data-easystud-structure-panel]', 'viewGroups'],
            ['actions', 'fa-tasks', '[data-easystud-participants-panel]', 'viewParticipants'],
        ];
        $slides = [];
        foreach ($definitions as $index => [$kind, $icon, $target, $open]) {
            $prefix = 'discovery_' . $kind . '_';
            $scene = [
                $kind => true,
                'kind' => $kind,
                'caption' => get_string('discovery_simulation', 'local_groupimport'),
                'captionshort' => get_string('discovery_simulation_short', 'local_groupimport'),
                'note' => get_string($prefix . 'note', 'local_groupimport'),
                'replay' => get_string('discovery_replay', 'local_groupimport'),
                'reset' => get_string('discovery_reset', 'local_groupimport'),
            ];
            if (in_array($kind, ['membership', 'actions'], true)) {
                $scene += self::demonstration_entry();
            }
            // K17-36: the plain preview is the legacy form; the modern curriculum adds its animated demonstration.
            if ($kind === 'creation') {
                $scene['creationstatic'] = true;
            }
            // The preceding membership paragraph already names Add/Move,
            // source/destination and preserved memberships. Keep one explanation.
            if ($kind === 'membership') {
                $scene['introalreadyexplained'] = true;
            }
            foreach (
                ['participant', 'group', 'grouping', 'pattern', 'preview', 'letters', 'syntax',
                'invalid', 'add', 'move', 'cancel', 'destination', 'select', 'menu', 'confirm',
                'resultadd', 'resultmove', 'resultactions', 'mobile', 'initial', 'kept', 'removed', 'added',
                'absent', 'validate', 'drag', 'finished', 'pause', 'resume', 'nextphase'] as $label
            ) {
                $scene[$label . 'label'] = get_string('discovery_' . $label, 'local_groupimport');
            }
            foreach (
                ['participanttitle', 'grouptitle', 'groupingtitle', 'patternvalue', 'resulttitle',
                'emptymembers', 'sourceempty', 'sourcecaption', 'destinationcaption', 'menutitle', 'removeaction',
                'membershiptitle', 'recaptitle', 'addselect', 'adddrop', 'compactselect', 'compactmenu', 'compactvalidate',
                'comparemove', 'examplegroup', 'examplegrouping', 'exampletitle', 'examplebody',
                'syntaxnumbers', 'syntaxletters', 'syntaxcount', 'destinationname',
                'mobileparticipants', 'mobileaddaction', 'mobileaddconsequence', 'mobileaddselect',
                'mobileaddmenu', 'mobileaddconfirm', 'mobileaddvalidate'] as $label
            ) {
                $scene[$label] = get_string('discovery_' . $label, 'local_groupimport');
            }
            $scene['selectioncaption'] = get_string(
                'discovery_selection_' . ($kind === 'actions' ? 'many' : 'one'),
                'local_groupimport'
            );
            if ($kind === 'actions') {
                $scene['note'] = '';
            }
            $scene['mobileaddsubmit'] = get_string('discovery_demo_add', 'local_groupimport');
            $scene['consequence'] = get_string('discovery_consequence', 'local_groupimport');
            $slides[] = [
                'id' => 'discovery-' . $kind,
                'index' => $index,
                'navicon' => $icon,
                'icon' => $icon,
                'category' => get_string($prefix . 'category', 'local_groupimport'),
                'kicker' => get_string($prefix . 'kicker', 'local_groupimport'),
                'title' => get_string($prefix . 'title', 'local_groupimport'),
                'navtitle' => get_string($prefix . 'navtitle', 'local_groupimport'),
                'content' => \html_writer::tag('p', s(get_string($prefix . 'body', 'local_groupimport'))),
                'discoveryscene' => $scene,
                'target' => $target,
                'targetselector' => $target,
                'showopen' => $open,
                'showopendelay' => 360,
            ];
        }
        // A distinct path preserves the existing reference curriculum/storage.
        $slides[1]['guidedpath'] = 'practice-membership';
        $slides[1]['hasguidedpath'] = true;
        foreach (['label', 'title', 'content'] as $label) {
            $slides[1]['guidedpath' . $label] = get_string('discovery_path_' . $label, 'local_groupimport');
        }
        $slides[1]['guidedpathsteps'] = ['items' => array_map(static function (int $step): string {
            return get_string('discovery_path_step' . $step, 'local_groupimport');
        }, [1, 2, 3, 4, 5, 6])];
        foreach ($legacy as $index => $slide) {
            $slide['index'] = $index + count($definitions);
            $slides[] = $slide;
        }
        return $slides;
    }

    /**
     * Inactive curriculum successor; native activation remains an explicit adapter step.
     */
    public static function modern_reading_contract(): array {
        $groups = [
            'use-this-guide' => ['use-this-guide'],
            'understand-workspace' => ['discovery-concepts', 'reference-0'],
            'create-one' => [],
            'create-structure' => ['discovery-creation', 'reference-1', 'reference-16'],
            'read-participant-card' => ['reference-4'],
            'read-group-card' => ['reference-5'],
            'read-grouping-card' => ['reference-6'],
            'add-or-move-members' => ['discovery-membership', 'reference-12'],
            'search-filter-select' => ['reference-3'],
            'pasted-identifiers' => ['reference-9'],
            'choose-right-action' => ['discovery-actions', 'reference-10', 'reference-11',
                'reference-13', 'reference-14', 'reference-15'],
            'use-groupings-in-activities' => ['reference-7', 'reference-8', 'reference-17'],
            'ready-to-work' => ['reference-18', 'reference-19'],
        ];
        $ids = array_keys($groups);
        $positions = [];
        foreach ($groups as $index => $origins) {
            foreach ($origins as $origin) {
                $positions[$origin] = array_search($index, $ids, true);
            }
        }
        $map = static function (array $origins) use ($positions): array {
            return array_map(static function (string $id) use ($positions): int {
                if (!array_key_exists($id, $positions)) {
                    throw new \LogicException('Missing explicit Guide migration origin: ' . $id);
                }
                return $positions[$id];
            }, $origins);
        };
        $historical = self::historical_slide_ids();
        $current = self::reading_contract();
        $previousids = array_values(array_filter($ids, static fn($id) => $id !== 'create-one'));
        return ['presentationKey' => 'curriculum-simplecreate-20261016', 'slideIds' => $ids,
            'readingIndexMigrations' => [
                'curriculum-modern-20261010' => array_map(
                    static fn($id) => array_search($id, $ids, true),
                    $previousids
                ),
                $current['presentationKey'] => $map($current['slideIds']),
                'discovery-20261006' => $map($historical),
                'legacy' => $map(array_slice($historical, 4)),
            ]];
    }

    /**
     * Build thirteen payloads, retaining stable IDs and every visible path invitation.
     */
    public static function modern_curriculum(array $slides): array {
        if (array_column($slides, 'id') !== self::reading_contract()['slideIds']) {
            throw new \LogicException('Unexpected source curriculum; refuse lossy selection.');
        }
        $sources = ['use-this-guide', 'discovery-concepts', 'create-one', 'discovery-creation',
            'reference-4', 'reference-5', 'reference-6', 'discovery-membership',
            'reference-3', 'reference-9', 'discovery-actions', 'reference-7', 'reference-19'];
        $byid = array_column($slides, null, 'id');
        $ids = self::modern_reading_contract()['slideIds'];
        $result = [];
        // K1 (14/10): two distinct subject glyphs where the Guide repeated one.
        $navicons = ['discovery-creation' => 'fa-plus', 'discovery-membership' => 'fa-right-left'];
        foreach ($sources as $index => $source) {
            $slide = $byid[$source === 'create-one' ? 'discovery-creation' : $source];
            // E1 (K2): slides 4, 8, 9, 11 and 12 show a current-product specimen, not the former mini-cards.
            $specimen = guide_specimen::for_source($source);
            if ($specimen !== null) {
                foreach (guide_specimen::replaced_visual_keys() as $legacykey) {
                    unset($slide[$legacykey]);
                }
                $slide['guidespecimen'] = $specimen;
            }
            // Merge the unique teaching points, not merely the reading positions.
            // Reuse existing translated topics and the published dt/dd recipe.
            if ($source === 'create-one') {
                foreach (['title', 'body', 'category'] as $label) {
                    $slide[$label === 'body' ? 'content' : $label] =
                        get_string('discovery_simplecreate_' . $label, 'local_groupimport');
                }
                $scene = $slide['discoveryscene'];
                unset($scene['creation'], $scene['creationstatic']);
                $scene['kind'] = 'simplecreate';
                $scene['simplecreate'] = true;
                $scene += self::demonstration_entry();
                foreach (
                    ['note', 'groupname', 'groupingname', 'renamed', 'grouplabel', 'groupinglabel',
                    'groupplaceholder', 'groupingplaceholder', 'addlabel', 'renamelabel', 'emptymembers',
                    'emptygroups', 'phase1', 'phase2', 'phase3', 'phase4'] as $label
                ) {
                    $scene[$label] = get_string('discovery_simplecreate_' . $label, 'local_groupimport');
                }
                $slide['discoveryscene'] = $scene;
                $slide['navicon'] = 'fa-plus';
                $slide['commonintroduction'] = ['topics' => array_map(static function (string $topic): array {
                    return ['icon' => 'fa-info-circle',
                        'title' => get_string('discovery_simplecreate_' . $topic . '_title', 'local_groupimport'),
                        'description' => get_string('discovery_simplecreate_' . $topic . '_body', 'local_groupimport')];
                }, ['group', 'grouping', 'edit']),
                    'note' => get_string('discovery_simplecreate_note', 'local_groupimport'),
                    'lessonreading' => true];
            } else if ($source === 'discovery-creation') {
                $slide['discoveryscene'] = self::creation_demonstration($slide['discoveryscene']);
                foreach (
                    ['hasguidedpath', 'guidedpath', 'guidedpathlabel', 'guidedpathtitle',
                    'guidedpathcontent', 'guidedpathsteps'] as $key
                ) {
                    unset($slide[$key]);
                }
                $slide['commonintroduction'] = $byid['reference-16']['commonintroduction'];
            } else if ($source === 'discovery-actions') {
                $method = $byid['reference-14']['commonintroduction'];
                $destination = $byid['reference-11']['commonintroduction'];
                $menu = $byid['reference-10']['commonintroduction'];
                $keyboard = $byid['reference-13'];
                $slide['commonintroduction'] = [
                    'topics' => [
                        $method['topics'][1],
                        $method['topics'][2],
                        $destination['topics'][1],
                        $menu['topics'][1],
                        ['icon' => 'fa-keyboard', 'title' => $keyboard['title'],
                            'description' => html_entity_decode(
                                strip_tags($keyboard['content']),
                                ENT_QUOTES,
                                'UTF-8'
                            )],
                    ],
                    'note' => $destination['note'],
                    'lessonreading' => true,
                ];
            }
            if ($source === 'reference-3' && $specimen !== null) {
                // K17-44: the four renderings become an animated demonstration; they are its recap.
                $slide['filtersdemo'] = true;
                $slide['discoveryscene'] = self::filters_demonstration();
            }
            // Keep the optional exercises reachable after their duplicate lessons disappear.
            $invitation = ['discovery-actions' => 'reference-12', 'reference-7' => 'reference-8'][$source] ?? null;
            if ($invitation !== null) {
                foreach (
                    ['hasguidedpath', 'guidedpath', 'guidedpathlabel', 'guidedpathtitle',
                        'guidedpathcontent', 'guidedpathsteps'] as $key
                ) {
                    if (array_key_exists($key, $byid[$invitation])) {
                        $slide[$key] = $byid[$invitation][$key];
                    }
                }
            }
            $slide['id'] = $ids[$index];
            $slide['index'] = $index;
            $slide['navtitle'] = get_string('guide_nav_' . ($index + 1), 'local_groupimport');
            $slide['navnumber'] = $index + 1;
            $slide['navcategorymanaged'] = true;
            if ($source === 'reference-19') {
                $slide['category'] = get_string('guide_category_recap', 'local_groupimport');
            }
            if (isset($navicons[$source])) {
                $slide['navicon'] = $navicons[$source];
            }
            // K1: every pill names its chapter, and its slide repeats it as overline.
            $category = $slide['category'] ?? '';
            $slide['navcategorylabel'] = $category;
            $slide['kicker'] = $category;
            if ($source === 'reference-7') {
                $slide['hasguidedpath'] = true;
                $slide['guidedpath'] = 'prepare-activity-grouping';
                $slide['guidedpathlabel'] = get_string('member_path_label', 'local_groupimport');
                $slide['guidedpathtitle'] = get_string('activity_path_title', 'local_groupimport');
                $slide['guidedpathcontent'] = get_string('activity_path_content', 'local_groupimport');
                $slide['guidedpathsteps'] = ['items' => array_column(self::activity_grouping_path(), 'title')];
            }
            if ($source === 'reference-3') {
                $slide['hasguidedpath'] = true;
                $slide['guidedpath'] = 'verify-with-filters';
                $slide['guidedpathlabel'] = get_string('member_path_label', 'local_groupimport');
                $slide['guidedpathtitle'] = get_string('filter_path_title', 'local_groupimport');
                $slide['guidedpathcontent'] = get_string('filter_path_content', 'local_groupimport');
                $slide['guidedpathsteps'] = ['items' => array_map(static function (int $step): string {
                    return get_string('filter_path_step' . $step, 'local_groupimport');
                }, [1, 2, 3, 4])];
            }
            if ($source === 'discovery-membership') {
                $slide['hasguidedpath'] = true;
                $slide['guidedpath'] = 'reorganise-source-members';
                foreach (['label', 'title', 'content'] as $label) {
                    $slide['guidedpath' . $label] = get_string('member_path_' . $label, 'local_groupimport');
                }
                $slide['guidedpathsteps'] = ['items' => array_map(static function (int $step): string {
                    return get_string('member_path_step' . $step, 'local_groupimport');
                }, [1, 2, 3, 4])];
            }
            if ($source === 'reference-5' || $source === 'reference-6') {
                $type = $source === 'reference-5' ? 'group' : 'grouping';
                $slide['hasguidedpath'] = true;
                $slide['guidedpath'] = 'inspect-' . $type . '-settings';
                $slide['guidedpathlabel'] = get_string('member_path_label', 'local_groupimport');
                $slide['guidedpathtitle'] = get_string('editor_' . $type . '_title', 'local_groupimport');
                $slide['guidedpathcontent'] = get_string('editor_' . $type . '_content', 'local_groupimport');
                $slide['guidedpathsteps'] = ['items' => array_map(static function (int $step): string {
                    return get_string('editor_path_step' . $step, 'local_groupimport');
                }, [1, 2, 3, 4])];
            }
            if (!empty($slide['guidedpath'])) {
                $slide['guidedpathlabel'] = get_string('member_path_label', 'local_groupimport');
            }
            $slide['navtooltip'] = get_string(
                empty($slide['hasguidedpath']) ? 'guide_nav_tooltip' : 'guide_nav_tooltip_guided',
                'local_groupimport',
                (object) ['category' => $category, 'number' => $index + 1,
                'title' => $slide['navtitle']]
            );
            $result[] = $slide;
        }
        return $result;
    }

    /**
     * K17-36, K17-17 no. 41: the "create several groups" scene gets its animated demonstration.
     *
     * Typed names separated by a comma or a semicolon, then a formula, then the same for groupings.
     * Illustration only: nothing is created in the course.
     *
     * @param array $scene Scene context of the legacy plain preview.
     * @return array Scene context with the demonstration entry and its narration strings.
     */
    public static function creation_demonstration(array $scene): array {
        unset($scene['creationstatic']);
        $scene += self::demonstration_entry();
        foreach (
            ['phase1', 'phase2', 'phase3', 'list', 'formula', 'groupings', 'groupinglabel', 'groupingresult'] as $key
        ) {
            $scene['creation' . $key] = get_string('discovery_creation_' . $key, 'local_groupimport');
        }
        $scene['emptygroups'] = get_string('discovery_simplecreate_emptygroups', 'local_groupimport');
        return $scene;
    }

    /**
     * K17-44: scene context of the animated "search, filter, select" demonstration (slide 9).
     *
     * The four renderings of the former static specimen stay on the slide as the recap.
     *
     * @return array Scene context.
     */
    public static function filters_demonstration(): array {
        $scene = [
            'kind' => 'filters',
            'filtersdemo' => true,
            'caption' => get_string('discovery_simulation', 'local_groupimport'),
            'captionshort' => get_string('discovery_simulation_short', 'local_groupimport'),
            'replay' => get_string('discovery_replay', 'local_groupimport'),
            'reset' => get_string('discovery_reset', 'local_groupimport'),
            'initiallabel' => get_string('discovery_filters_initial', 'local_groupimport'),
            'filtersrole' => get_string('roleslabel', 'local_groupimport'),
            'filtersrolevalue' => get_string('tutorialvisualrolebadge', 'local_groupimport'),
            'filterscountall' => get_string('listeditemscount', 'local_groupimport', 5),
            'filterscountfiltered' => get_string('listeditemscount', 'local_groupimport', 3),
            'filtersselect' => get_string('selectresults', 'local_groupimport'),
            'filtersdeselect' => get_string('deselectresults', 'local_groupimport'),
            'filtersselection' => get_string('selectioncount', 'local_groupimport', 3),
            'filtersclear' => get_string('contextclearselection', 'local_groupimport'),
        ];
        foreach (['pause', 'resume', 'nextphase', 'finished'] as $key) {
            $scene[$key . 'label'] = get_string('discovery_' . $key, 'local_groupimport');
        }
        foreach ([1, 2, 3, 4] as $number) {
            $scene['filtersstep' . $number] = get_string('guidespec_filters_step' . $number, 'local_groupimport');
        }
        return $scene + self::demonstration_entry();
    }

    /**
     * New ID: retain legacy grouping progress without treating it as new evidence.
     */
    public static function activity_grouping_path(): array {
        $definitions = [['open-grouping', 'activityGroupingEntry', 'tutorial:activity-grouping-workspace'],
            ['select-groups', 'activityGroupSelection', 'tutorial:activity-group-workspace'],
            ['choose-grouping', 'activityGroupDestination', 'tutorial:activity-group-dialog'],
            ['confirm-groups', 'activityGroupConfirm', 'tutorial:activity-group-dialog'],
            ['verify-grouping', 'activityGroupingResult', 'tutorial:activity-grouping-result']];
        $steps = [];
        foreach ($definitions as $index => [$id, $target, $open]) {
            $step = ['id' => $id,
                'title' => get_string('activity_path_step' . ($index + 1), 'local_groupimport'),
                'description' => get_string('activity_path_desc' . ($index + 1), 'local_groupimport'),
                'target' => $target, 'open' => $open, 'openDelay' => 360,
                'completionMode' => 'event', 'autoHighlightNext' => true];
            if ($index > 0) {
                $step['requiresStep'] = $definitions[$index - 1][0];
            }
            $steps[] = $step;
        }
        return $steps;
    }

    /**
     * Verify native filtered selection without changing course memberships.
     */
    public static function filter_verification_path(): array {
        $definitions = [['open-filters', 'participantFilterToggle'],
            ['apply-filter', 'participantFilterSearch'],
            ['select-results', 'participantFilteredResults'],
            ['clear-selection', 'participantClearSelection']];
        $steps = [];
        foreach ($definitions as $index => [$id, $target]) {
            $step = ['id' => $id,
                'title' => get_string('filter_path_step' . ($index + 1), 'local_groupimport'),
                'description' => get_string('filter_path_desc' . ($index + 1), 'local_groupimport'),
                'target' => $target, 'completionMode' => 'event', 'autoHighlightNext' => true,
                'open' => $index === 1 ? 'tutorial:participant-filter-controls' :
                    'tutorial:participant-filter-workspace', 'openDelay' => 360];
            if ($index > 0) {
                $step['requiresStep'] = $definitions[$index - 1][0];
            }
            $steps[] = $step;
        }
        return $steps;
    }

    /**
     * Inspect actual fields and close; Save is allowed but never required.
     */
    public static function editor_inspection_path(string $type): array {
        if (!in_array($type, ['group', 'grouping'], true)) {
            throw new \InvalidArgumentException('Unknown editor inspection context');
        }
        $definitions = [['open-editor', 'Action'], ['inspect-name', 'Name'],
            ['inspect-description', 'Description'], ['cancel-editor', 'Cancel']];
        $steps = [];
        foreach ($definitions as $index => [$id, $suffix]) {
            $step = ['id' => $id,
                'title' => get_string('editor_path_step' . ($index + 1), 'local_groupimport'),
                'description' => get_string('editor_path_desc' . ($index + 1), 'local_groupimport'),
                'target' => $type . 'Editor' . $suffix,
                'completionMode' => 'event', 'autoHighlightNext' => true,
                'open' => 'tutorial:' . $type . '-editor-' . ($index === 0 ? 'entry' : 'dialog'),
                'openDelay' => 360];
            if ($index > 0) {
                $step['requiresStep'] = $definitions[$index - 1][0];
            } else {
                $step['beforeHighlight'] = 'tutorial:close-' . $type . '-editor';
            }
            $steps[] = $step;
        }
        return $steps;
    }

    /**
     * Source-member transfer is distinct from assigning global Participants.
     */
    public static function source_member_path(): array {
        $definitions = [
            ['select-source-member', 'groupMemberSelection'],
            ['open-member-move', 'memberMoveAction'],
            ['choose-member-destination', 'memberMoveDestination'],
            ['confirm-member-move', 'memberMoveConfirm'],
        ];
        $steps = [];
        foreach ($definitions as $index => [$id, $target]) {
            $step = [
                'id' => $id,
                'title' => get_string('member_path_step' . ($index + 1), 'local_groupimport'),
                'description' => get_string('member_path_desc' . ($index + 1), 'local_groupimport'),
                'target' => $target,
                'completionMode' => 'event',
                'autoHighlightNext' => true,
            ];
            if ($index > 0) {
                $step['requiresStep'] = $definitions[$index - 1][0];
            }
            if ($index === 0) {
                $step['open'] = 'tutorial:source-group-members';
                $step['openDelay'] = 360;
            }
            if ($index < 2) {
                $step['beforeHighlight'] = 'tutorial:close-member-move-dialog';
            } else {
                $step['open'] = 'tutorial:member-move-dialog';
                $step['openDelay'] = 360;
            }
            $steps[] = $step;
        }
        return $steps;
    }

    /**
     * Six native milestones; the Guide never creates or transfers participants.
     */
    public static function practice_path(): array {
        $definitions = [
            ['create-group', 'groupCreateInput', 'viewGroups'],
            ['open-participants', 'viewParticipants', null],
            ['select-participant', 'participantSelectionInput', null],
            ['open-move', 'participantMoveAction', null],
            ['choose-destination', 'participantMoveDestination', null],
            ['confirm-move', 'participantMoveConfirm', null],
        ];
        $steps = [];
        foreach ($definitions as $index => [$id, $target, $open]) {
            $step = [
                'id' => $id,
                'title' => get_string('discovery_path_step' . ($index + 1), 'local_groupimport'),
                'description' => get_string('discovery_path_desc' . ($index + 1), 'local_groupimport'),
                'target' => $target,
                'completionMode' => 'event',
                'autoHighlightNext' => true,
            ];
            if ($index > 0) {
                $step['requiresStep'] = $definitions[$index - 1][0];
            }
            if ($open !== null) {
                $step['open'] = $open;
                $step['openDelay'] = 360;
            }
            if ($index >= 4) {
                $step['open'] = 'tutorial:participant-move-dialog';
                $step['openDelay'] = 360;
            }
            if ($index < 4) {
                $step['beforeHighlight'] = 'tutorial:close-participant-move-dialog';
            }
            $steps[] = $step;
        }
        return $steps;
    }
}
