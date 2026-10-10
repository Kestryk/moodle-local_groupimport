<?php
// This file is part of Moodle - http://moodle.org/
// Moodle is distributed under the GNU GPL v3 or later.

namespace local_groupimport\local;

defined('MOODLE_INTERNAL') || die();

/** Product-owned discovery content; illustrations never issue Moodle commands. */
final class guide_discovery {
    /** Historical IDs describe content, independently from its reading position. */
    public static function historical_slide_ids(): array {
        $ids = ['discovery-concepts', 'discovery-creation', 'discovery-membership', 'discovery-actions'];
        for ($index = 0; $index < 20; $index++) {
            $ids[] = $index === 2 ? 'use-this-guide' : 'reference-' . $index;
        }
        return $ids;
    }

    /** Explicitly supported reading histories; path IDs and completion stay unchanged. */
    public static function reading_contract(): array {
        $old = self::historical_slide_ids();
        $ids = array_values(array_filter($old, static fn($id) => $id !== 'use-this-guide'));
        array_unshift($ids, 'use-this-guide');
        $map = array_map(static fn($id) => array_search($id, $ids, true), $old);
        return ['presentationKey' => 'introduction-first-20261009', 'slideIds' => $ids,
            'readingIndexMigrations' => ['discovery-20261006' => $map, 'legacy' => array_slice($map, 4)]];
    }

    /** Move only the introductory lesson, retaining every other lesson and native target. */
    public static function introduction_first(array $slides): array {
        if (array_column($slides, 'id') !== self::historical_slide_ids()) {
            throw new \LogicException('Update the explicit Guide reading contract before changing the curriculum.');
        }
        $byid = array_column($slides, null, 'id');
        return array_map(static function($id, $index) use ($byid): array {
            $slide = $byid[$id];
            $slide['index'] = $index;
            return $slide;
        }, self::reading_contract()['slideIds'], range(0, count($slides) - 1));
    }
    /** Card-reading copy uses the existing shared explanation recipe, not a new scene engine. */
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
        return ['topics' => $topics, 'note' => get_string('guidecard_' . $type . '_note', 'local_groupimport')];
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
            'cardicon' => $type === 'group' ? 'fa-users' : 'fa-sitemap',
            'actionicon' => $type === 'group' ? 'fa-at' : 'fa-plus',
        ];
        foreach (['cardtitle', 'cardmeta', 'actionlabel', 'inputlabel', 'knownlabel', 'note', 'resultlabel'] as $key) {
            $scene[$key] = get_string($prefix . $key, 'local_groupimport');
        }
        foreach (['caption', 'menutitle', 'unknownlabel', 'recaptitle'] as $key) {
            $scene[$key] = get_string('guideinspection_' . $key, 'local_groupimport');
        }
        foreach (['add', 'cancel', 'pause', 'resume', 'nextphase', 'finished'] as $key) {
            $scene[$key . 'label'] = get_string('discovery_' . $key, 'local_groupimport');
        }
        foreach (['replay', 'reset'] as $key) {
            $scene[$key] = get_string('discovery_' . $key, 'local_groupimport');
        }
        $scene['inputvalue'] = ($type === 'group' ? 'alex@example.test' : $scene['knownlabel']) . "\nunknown-entry";
        $scene['phases'] = [];
        foreach (['orient', 'open', 'enter', 'review', 'return'] as $phase) {
            $item = ['name' => $phase, 'label' => get_string($prefix . $phase, 'local_groupimport')];
            if ($phase === 'open') {
                $item['compactlabel'] = get_string($prefix . 'open_compact', 'local_groupimport');
            }
            $scene['phases'][] = $item;
        }
        $scene['initiallabel'] = $scene['phases'][0]['label'];
        return $scene;
    }

    /** Modern reading topics reuse the published explanation composition. */
    public static function action_explanation(string $type): array {
        if (!in_array($type, [
                'filters', 'identifiers', 'destination', 'menu', 'activity', 'ready',
                'method', 'recap', 'mistakes', 'creation',
        ], true)) {
            throw new \InvalidArgumentException('Unknown Guide action explanation.');
        }
        $topics = [];
        foreach (['context' => 'fa-compass', 'review' => 'fa-check-square', 'mobile' => 'fa-eye'] as $key => $icon) {
            $prefix = 'guideaction_' . $type . '_' . $key;
            $topics[] = ['icon' => $icon,
                'title' => get_string($prefix . '_title', 'local_groupimport'),
                'description' => get_string($prefix . '_description', 'local_groupimport')];
        }
        return ['topics' => $topics, 'note' => get_string('guideaction_' . $type . '_note', 'local_groupimport')];
    }

    /** Shared introduction data; no slide insertion or persisted-index migration. */
    public static function common_introduction(bool $specimens = false): array {
        $topics = [];
        foreach (['navigation' => 'fa-compass', 'demonstration' => 'fa-play-circle',
                'interface' => 'fa-eye', 'path' => 'fa-route', 'fullscreen' => 'fa-expand'] as $key => $icon) {
            $topic = ['icon' => $icon,
                'title' => get_string('guideintro_' . $key . '_title', 'local_groupimport'),
                'description' => get_string('guideintro_' . $key . '_description', 'local_groupimport')];
            if ($key === 'fullscreen') {
                $topic['desktopfullscreen'] = true;
            }
            // Opt-in until the shared catalogue and native first-slide gates pass.
            // These examples have no command attributes and cannot modify a course.
            if ($specimens && in_array($key, ['navigation', 'interface', 'path'], true)) {
                $kind = $key === 'interface' ? 'highlight' : $key;
                $topic['specimen'] = ['kind' => $kind, $kind => true,
                    'label' => get_string('guideintro_specimen_' . $kind, 'local_groupimport')];
            }
            $topics[] = $topic;
        }
        if ($specimens) {
            array_splice($topics, 4, 0, [[
                'icon' => 'fa-tasks',
                'title' => get_string('guideintro_checklist_title', 'local_groupimport'),
                'description' => get_string('guideintro_checklist_description', 'local_groupimport'),
                'specimen' => ['kind' => 'checklist', 'checklist' => true, 'steps' => [
                    ['icon' => 'fa-check-circle', 'label' => get_string('guideintro_specimen_done', 'local_groupimport')],
                    ['icon' => 'fa-circle', 'label' => get_string('guideintro_specimen_current', 'local_groupimport')],
                    ['icon' => 'fa-lock', 'label' => get_string('guideintro_specimen_locked', 'local_groupimport')],
                ]],
            ]]);
        }
        return ['topics' => $topics, 'note' => get_string('guideintro_note', 'local_groupimport')];
    }

    /** Prepend the four discovery lessons while retaining the reference curriculum. */
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
                'note' => get_string($prefix . 'note', 'local_groupimport'),
                'replay' => get_string('discovery_replay', 'local_groupimport'),
                'reset' => get_string('discovery_reset', 'local_groupimport'),
            ];
            foreach (['participant', 'group', 'grouping', 'pattern', 'preview', 'letters', 'syntax',
                'invalid', 'add', 'move', 'cancel', 'destination', 'select', 'menu', 'confirm',
                'resultadd', 'resultmove', 'resultactions', 'mobile', 'initial', 'kept', 'removed', 'added',
                'absent', 'validate', 'drag', 'finished', 'pause', 'resume', 'nextphase'] as $label) {
                $scene[$label . 'label'] = get_string('discovery_' . $label, 'local_groupimport');
            }
            foreach (['participanttitle', 'grouptitle', 'groupingtitle', 'patternvalue', 'resulttitle',
                'emptymembers', 'sourceempty', 'destinationcaption', 'menutitle', 'removeaction',
                'membershiptitle', 'recaptitle', 'addselect', 'adddrop', 'compactselect', 'compactmenu',
                'comparemove', 'examplegroup', 'examplegrouping', 'exampletitle', 'examplebody',
                'syntaxnumbers', 'syntaxletters', 'syntaxcount', 'destinationname',
                'mobileparticipants', 'mobileaddaction', 'mobileaddconsequence', 'mobileaddselect',
                'mobileaddmenu', 'mobileaddconfirm', 'mobileaddvalidate'] as $label) {
                $scene[$label] = get_string('discovery_' . $label, 'local_groupimport');
            }
            $scene['selectioncaption'] = get_string('discovery_selection_' . ($kind === 'actions' ? 'many' : 'one'),
                'local_groupimport');
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
        $slides[1]['guidedpathsteps'] = ['items' => array_map(static function(int $step): string {
            return get_string('discovery_path_step' . $step, 'local_groupimport');
        }, [1, 2, 3, 4, 5, 6])];
        foreach ($legacy as $index => $slide) {
            $slide['index'] = $index + count($definitions);
            $slides[] = $slide;
        }
        return $slides;
    }

    /** Inactive curriculum successor; native activation remains an explicit adapter step. */
    public static function modern_reading_contract(): array {
        $groups = [
            'use-this-guide' => ['use-this-guide'],
            'understand-workspace' => ['discovery-concepts', 'reference-0'],
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
        $map = static function(array $origins) use ($positions): array {
            return array_map(static function(string $id) use ($positions): int {
                if (!array_key_exists($id, $positions)) {
                    throw new \LogicException('Missing explicit Guide migration origin: ' . $id);
                }
                return $positions[$id];
            }, $origins);
        };
        $historical = self::historical_slide_ids();
        $current = self::reading_contract();
        return ['presentationKey' => 'curriculum-modern-20261010', 'slideIds' => $ids,
            'readingIndexMigrations' => [
                $current['presentationKey'] => $map($current['slideIds']),
                'discovery-20261006' => $map($historical),
                'legacy' => $map(array_slice($historical, 4)),
            ]];
    }

    /** Build twelve modern payloads while retaining every currently visible path invitation. */
    public static function modern_curriculum(array $slides): array {
        if (array_column($slides, 'id') !== self::reading_contract()['slideIds']) {
            throw new \LogicException('Unexpected source curriculum; refuse lossy selection.');
        }
        $sources = ['use-this-guide', 'discovery-concepts', 'discovery-creation',
            'reference-4', 'reference-5', 'reference-6', 'discovery-membership',
            'reference-3', 'reference-9', 'discovery-actions', 'reference-7', 'reference-19'];
        $byid = array_column($slides, null, 'id');
        $ids = self::modern_reading_contract()['slideIds'];
        $result = [];
        foreach ($sources as $index => $source) {
            $slide = $byid[$source];
            // Merge the unique teaching points, not merely the reading positions.
            // Reuse existing translated topics and the published dt/dd recipe.
            if ($source === 'discovery-creation') {
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
                            'description' => html_entity_decode(strip_tags($keyboard['content']),
                                ENT_QUOTES, 'UTF-8')],
                    ],
                    'note' => $destination['note'],
                ];
            }
            // Keep the optional exercises reachable after their duplicate lessons disappear.
            $invitation = ['discovery-actions' => 'reference-12', 'reference-7' => 'reference-8'][$source] ?? null;
            if ($invitation !== null) {
                foreach (['hasguidedpath', 'guidedpath', 'guidedpathlabel', 'guidedpathtitle',
                        'guidedpathcontent', 'guidedpathsteps'] as $key) {
                    if (array_key_exists($key, $byid[$invitation])) {
                        $slide[$key] = $byid[$invitation][$key];
                    }
                }
            }
            $slide['id'] = $ids[$index];
            $slide['index'] = $index;
            if ($source === 'discovery-membership') {
                $slide['hasguidedpath'] = true;
                $slide['guidedpath'] = 'reorganise-source-members';
                foreach (['label', 'title', 'content'] as $label) {
                    $slide['guidedpath' . $label] = get_string('member_path_' . $label, 'local_groupimport');
                }
                $slide['guidedpathsteps'] = ['items' => array_map(static function(int $step): string {
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
                $slide['guidedpathsteps'] = ['items' => array_map(static function(int $step): string {
                    return get_string('editor_path_step' . $step, 'local_groupimport');
                }, [1, 2, 3, 4])];
            }
            $result[] = $slide;
        }
        return $result;
    }

    /** Inspect actual editor fields and Cancel; this path never requires Save. */
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

    /** Source-member transfer is distinct from assigning global Participants. */
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

    /** Six native milestones; the Guide never creates or transfers participants. */
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
