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
 * EasyStud course manager: meaningful accessible names for cards, selection checkboxes,
 * icon-only card actions and count badges.
 *
 * One definition for every renderer (server template, on-demand lists, JS-built cards): the
 * names are derived from the card's own visible title, so renames and re-renders stay in step
 * and the visible text never changes. Only attributes are written, never markup.
 *
 * @module     local_groupimport/local/cm/accessible_names
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getLabels} from './shared';
import {compactRenderScopes, onAfterRender} from './after_render';

const CARD_TYPES = {
    participant: {
        name: ':scope .local-groupimport-easystud-user__name',
        checkbox: 'selectparticipantnamed',
        group: true,
    },
    group: {
        name: ':scope > .local-groupimport-easystud-group__header .local-groupimport-easystud-group__name',
        checkbox: 'selectgroupnamed',
        group: true,
    },
    grouping: {
        name: ':scope > .local-groupimport-easystud-grouping__header .local-groupimport-easystud-grouping__name',
        checkbox: 'selectgroupingnamed',
        group: true,
    },
    member: {
        name: ':scope > .local-groupimport-easystud-member__name',
        checkbox: 'selectmembernamed',
        group: false,
    },
};
const CARD_SELECTOR = Object.keys(CARD_TYPES).map(type => '[data-selectable-type="' + type + '"]').join(', ');
const NAME_ID_PREFIX = 'local-groupimport-easystud-an-';
let idCounter = 0;

const ensureId = (element, suffix) => {
    if (!element.id) {
        idCounter += 1;
        element.id = NAME_ID_PREFIX + suffix + idCounter;
    }
    return element.id;
};

const hasVisibleText = button => Array.from(button.childNodes).some(node =>
    (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') ||
    (node.nodeType === Node.ELEMENT_NODE && node.getAttribute('aria-hidden') !== 'true' &&
        !node.classList.contains('fa') && node.textContent.trim() !== ''));

/**
 * Name one card and the controls it owns.
 *
 * @param {HTMLElement} card Element carrying data-selectable-type.
 * @param {Object} labels Detail labels (see manage.php).
 */
export const nameCard = (card, labels) => {
    const type = CARD_TYPES[card.getAttribute('data-selectable-type')];
    if (!type) {
        return;
    }
    const nameElement = card.querySelector(type.name);
    const title = nameElement ? nameElement.textContent.trim() : '';
    if (!title) {
        return;
    }

    if (type.group) {
        card.setAttribute('role', 'group');
        card.setAttribute('aria-label', title);
    }

    const checkbox = card.querySelector(':scope > .local-groupimport-easystud-selector [data-easystud-selector-input]');
    const template = labels[type.checkbox] || '';
    if (checkbox && template) {
        checkbox.setAttribute('aria-label', template.split('{name}').join(title));
    }

    // Icon-only actions keep their action label and are completed with the card title, in the
    // language of the page, without a new string: "<action> <title>".
    const nameId = ensureId(nameElement, 'name-');
    card.querySelectorAll('button[aria-label]').forEach(button => {
        if (button.closest(CARD_SELECTOR) !== card || hasVisibleText(button) ||
                button.classList.contains('local-groupimport-easystud-tree__toggle')) {
            return;
        }
        const own = button.getAttribute('aria-label') || '';
        if (!own || own.indexOf(title) !== -1) {
            return;
        }
        const ids = ensureId(button, 'action-') + ' ' + nameId;
        if (button.getAttribute('aria-labelledby') !== ids) {
            button.setAttribute('aria-labelledby', ids);
        }
    });
};

const LIST_WORDS = {participant: 'paginationparticipants', group: 'paginationgroups', grouping: 'paginationgroupings'};

/**
 * Make the pagination landmarks of the page distinct: "<position> (<what the list holds>)".
 *
 * @param {HTMLElement} nav Pagination landmark.
 * @param {Object} labels Detail labels.
 */
const namePagination = (nav, labels) => {
    if (!nav.hasAttribute('data-easystud-an-base')) {
        nav.setAttribute('data-easystud-an-base', nav.getAttribute('aria-label') || '');
    }
    const base = nav.getAttribute('data-easystud-an-base');
    const first = nav.parentElement ? nav.parentElement.querySelector('[data-selectable-type]') : null;
    const word = first ? labels[LIST_WORDS[first.getAttribute('data-selectable-type')]] : '';
    if (base && word) {
        nav.setAttribute('aria-label', base + ' (' + word + ')');
    }
};

/**
 * Give a visible count badge ("23 members") its label as an image name.
 *
 * @param {HTMLElement} badge Count badge.
 */
const nameCountBadge = badge => {
    if (badge.getAttribute('aria-label') && !badge.hasAttribute('role')) {
        badge.setAttribute('role', 'img');
    }
};

/**
 * Apply the names to a subtree, and to the card that contains it.
 *
 * @param {HTMLElement} root Course manager root.
 * @param {Node} scope Added or changed node.
 * @param {Object} labels Detail labels.
 */
const nameWithin = (root, scope, labels) => {
    const element = scope.nodeType === Node.ELEMENT_NODE ? scope : scope.parentElement;
    if (!element || !root.contains(element)) {
        return;
    }
    const cards = new Set(Array.from(element.querySelectorAll(CARD_SELECTOR)));
    const owner = element.closest(CARD_SELECTOR);
    if (owner) {
        cards.add(owner);
    }
    cards.forEach(card => {
        nameCard(card, labels);
        // The list's own pagination names itself from the cards it holds.
        if (card.parentElement) {
            card.parentElement.querySelectorAll(':scope > [data-easystud-pagination]')
                .forEach(nav => namePagination(nav, labels));
        }
    });
    element.querySelectorAll('[data-easystud-pagination]').forEach(nav => namePagination(nav, labels));
    element.querySelectorAll('.badge[aria-label]').forEach(nameCountBadge);
    if (element.matches('.badge[aria-label]')) {
        nameCountBadge(element);
    }
};

/**
 * Keep every card, checkbox, icon action and count badge of the manager named.
 *
 * @param {HTMLElement} root Course manager root.
 */
export const bindAccessibleNames = root => {
    const labels = getLabels(root);
    nameWithin(root, root, labels);
    onAfterRender(root, detail => {
        const scopes = detail.subtrees.map(node => node.closest(CARD_SELECTOR) || node);
        compactRenderScopes(root, scopes).forEach(node => nameWithin(root, node, labels));
    });
};
