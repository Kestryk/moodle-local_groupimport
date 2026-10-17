<?php
// This file is part of Moodle - http://moodle.org/
// Moodle is free software under the GNU GPL v3 or later.

/**
 * Exact source-byte attribution without saving rendered HTML or session values.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
defined('MOODLE_INTERNAL') || die();

/** Measure source spans; browser DOM is independently measured by Playwright. */
function easystud_perf_decompose(string $html): array {
    $regions = [];
    foreach (
        ['participant-cards', 'group-member-lists', 'group-cards', 'groupings',
            'data-attributes-json', 'profile-photo-description-markup', 'guide', 'other-page-shell'] as $name
    ) {
        $regions[$name] = ['region' => $name, 'bytes' => 0, 'sourceElements' => 0];
    }
    $stack = [];
    $offset = 0;
    $length = strlen($html);
    $attributes = [];
    $detailfields = [];
    $instances = ['participant-cards' => 0, 'group-cards' => 0, 'groupings' => 0, 'member-rows' => 0];
    $void = array_flip(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
        'param', 'source', 'track', 'wbr']);
    $pattern = '~<!--.*?-->|<![^>]*>|</?[a-zA-Z][a-zA-Z0-9:_-]*(?:[^>"\']|"[^"]*"|\'[^\']*\')*>~s';
    while ($offset < $length && preg_match($pattern, $html, $match, PREG_OFFSET_CAPTURE, $offset)) {
        [$tag, $position] = $match[0];
        $parent = $stack ? $stack[count($stack) - 1]['region'] : 'other-page-shell';
        $regions[$parent]['bytes'] += $position - $offset;
        $tagbytes = strlen($tag);
        $offset = $position + $tagbytes;
        if (!preg_match('~^<(\/?)([a-zA-Z][a-zA-Z0-9:_-]*)~', $tag, $identity)) {
            $regions[$parent]['bytes'] += $tagbytes;
            continue;
        }
        $name = strtolower($identity[2]);
        if ($identity[1] === '/') {
            $regions[$parent]['bytes'] += $tagbytes;
            for ($i = count($stack) - 1; $i >= 0; $i--) {
                if ($stack[$i]['tag'] === $name) {
                    $stack = array_slice($stack, 0, $i);
                    break;
                }
            }
            continue;
        }
        preg_match_all(
            '~\s([^\s=<>/]+)(?:\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+))?~s',
            $tag,
            $parts,
            PREG_SET_ORDER
        );
        $attrs = [];
        foreach ($parts as $part) {
            $attrs[strtolower($part[1])] = isset($part[2]) ? trim($part[2], "\"'") : '';
        }
        $class = $attrs['class'] ?? '';
        $region = $parent;
        // Guide remains one source region; its fictional cards are not native participants.
        if (
            $parent === 'guide' || isset($attrs['data-easyedu-guide-root']) ||
                str_contains($class, 'easyedu-guide__') || str_contains($class, 'easyedu-guide ')
        ) {
            $region = 'guide';
        } else if (isset($attrs['data-easystud-user'])) {
            $region = 'participant-cards';
            $instances[$region]++;
        } else if (isset($attrs['data-easystud-group-members'])) {
            $region = 'group-member-lists';
        } else if (isset($attrs['data-easystud-group-id'])) {
            $region = 'group-cards';
            $instances[$region]++;
        } else if (isset($attrs['data-easystud-grouping-id'])) {
            $region = 'groupings';
            $instances[$region]++;
        } else if (
            str_contains($class, 'local-groupimport-easystud-user__avatar') ||
                ($name === 'img' && $parent === 'participant-cards')
        ) {
            $region = 'profile-photo-description-markup';
        }
        if (isset($attrs['data-easystud-member-id'])) {
            $instances['member-rows']++;
        }
        $databytes = 0;
        foreach ($parts as $part) {
            $attrname = strtolower($part[1]);
            if (!str_starts_with($attrname, 'data-')) {
                continue;
            }
            $bytes = strlen($part[0]);
            $databytes += $bytes;
            $attributes[$attrname] = $attributes[$attrname] ?? ['name' => $attrname, 'bytes' => 0, 'occurrences' => 0];
            $attributes[$attrname]['bytes'] += $bytes;
            $attributes[$attrname]['occurrences']++;
            if ($attrname === 'data-user-detail') {
                $detail = json_decode(html_entity_decode($attrs[$attrname], ENT_QUOTES | ENT_HTML5, 'UTF-8'), true);
                if (is_array($detail)) {
                    foreach ($detail as $field => $value) {
                        $detailfields[$field] = ($detailfields[$field] ?? 0) + strlen(json_encode($value));
                    }
                }
            }
        }
        // No overlaps: data attribute source spans are removed from their containing region.
        $regions[$region]['bytes'] += $tagbytes - $databytes;
        $regions['data-attributes-json']['bytes'] += $databytes;
        $regions[$region]['sourceElements']++;
        if (!isset($void[$name]) && !str_ends_with($tag, '/>')) {
            $stack[] = ['tag' => $name, 'region' => $region];
        }
        if (
            ($name === 'script' || $name === 'style') && preg_match(
                '~</' . $name . '\s*>~i',
                $html,
                $end,
                PREG_OFFSET_CAPTURE,
                $offset
            )
        ) {
            // HTML-looking strings inside JS/CSS do not create DOM elements.
            $regions[$region]['bytes'] += $end[0][1] - $offset;
            $offset = $end[0][1];
        }
    }
    $parent = $stack ? $stack[count($stack) - 1]['region'] : 'other-page-shell';
    $regions[$parent]['bytes'] += $length - $offset;
    usort($regions, static fn(array $a, array $b): int => $b['bytes'] <=> $a['bytes']);
    usort($attributes, static fn(array $a, array $b): int => $b['bytes'] <=> $a['bytes']);
    arsort($detailfields);
    $accounted = array_sum(array_column($regions, 'bytes'));
    return [
        'htmlBytes' => $length, 'accountedBytes' => $accounted, 'exactByteSum' => $accounted === $length,
        'sourceElements' => array_sum(array_column($regions, 'sourceElements')),
        'regions' => $regions, 'topFive' => array_slice($regions, 0, 5), 'instances' => $instances,
        'dataAttributes' => array_values($attributes), 'detailJsonFieldBytesBeforeHtmlEscaping' => $detailfields,
        'method' => 'Exclusive spans in original UTF-8 source; each byte belongs to one region. ' .
            'Source tag counts precede JS and are not claimed as the live browser DOM. ' .
            'Data attributes are byte-only spans; their containing element stays in its markup region.',
    ];
}
