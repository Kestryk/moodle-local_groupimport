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

    /** Modern reading topics reuse the published explanation composition. */
    public static function action_explanation(string $type): array {
        if (!in_array($type, ['filters', 'identifiers', 'destination', 'menu', 'activity', 'ready'], true)) {
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
