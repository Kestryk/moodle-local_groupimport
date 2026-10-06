<?php
// This file is part of Moodle - http://moodle.org/
// Moodle is distributed under the GNU GPL v3 or later.

namespace local_groupimport\local;

defined('MOODLE_INTERNAL') || die();

/** Product-owned discovery content; illustrations never issue Moodle commands. */
final class guide_discovery {
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
                'resultadd', 'resultmove', 'resultactions', 'mobile', 'initial', 'kept', 'removed', 'added'] as $label) {
                $scene[$label . 'label'] = get_string('discovery_' . $label, 'local_groupimport');
            }
            $slides[] = [
                'index' => $index,
                'navicon' => $icon,
                'icon' => $icon,
                'category' => get_string($prefix . 'category', 'local_groupimport'),
                'title' => get_string($prefix . 'title', 'local_groupimport'),
                'content' => \html_writer::tag('p', s(get_string($prefix . 'body', 'local_groupimport'))),
                'discoveryscene' => $scene,
                'target' => $target,
                'targetselector' => $target,
                'showopen' => $open,
                'showopendelay' => 360,
            ];
        }
        // Reuse the existing native accompanied path, including completion events.
        $slides[1]['guidedpath'] = 'first-structure';
        $slides[1]['hasguidedpath'] = true;
        foreach ($legacy as $index => $slide) {
            $slide['index'] = $index + count($definitions);
            $slides[] = $slide;
        }
        return $slides;
    }
}
