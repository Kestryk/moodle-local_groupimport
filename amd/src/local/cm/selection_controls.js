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
 * EasyStud course manager: selection bindings (cards, members "Select all").
 *
 * @module     local_groupimport/local/cm/selection_controls
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {selectedClass, requestGuideHighlightRefresh, areSelectionTypesCompatible, getSelectionInput} from './shared';
import {getGroupMemberRows, getGroupMemberSearchQuery, isGroupFullySelected, collapseAllGroupings} from './cards';
import {
    getSelectedItems, setItemSelected, clearSelectionForType, clearSelectionState, getActiveSelectionType,
} from './selection';
import {emitGuidedCompletion, emitTryActionsSelection, emitActivityGroupSelection} from './guide_hooks';
import {ensureFullGroupMembers, syncGroupMembersCollapsible} from './group_cards';
import {setGroupMembersExpanded} from './group_card_controls';
import {emitFilterPathCompletion} from './filters';
import {getMobileActionButton, updateSelectionActions} from './workspace';

/**
 * R10-05: member "Select all" of a group card. It adds the card's members to the member
 * selection as their checkboxes would (members selected in other groups stay selected), or
 * removes them when they are all selected. A lean card first renders its other rows; under a
 * member search only the matching rows are added. Selecting unfolds a folded card; deselecting
 * leaves it as it is.
 *
 * @param {HTMLElement} root EasyStud root.
 */
export const bindGroupSelectAll = root => {
    root.addEventListener('click', event => {
        const button = event.target.closest('[data-easystud-group-select-all]');
        const group = button && root.contains(button) ? button.closest('[data-easystud-group-id]') : null;
        if (!group || button.disabled || !areSelectionTypesCompatible(getActiveSelectionType(root), 'member')) {
            return;
        }
        const searching = getGroupMemberSearchQuery(group) !== '';
        const deselect = !searching && isGroupFullySelected(group);
        ensureFullGroupMembers(group);
        syncGroupMembersCollapsible(group);
        getGroupMemberRows(group).filter(row => !searching || !row.hidden)
            .forEach(row => setItemSelected(row, !deselect));
        // A folded card unfolds, as with its members toggle, to show what was selected.
        const membersToggle = group.querySelector('[data-easystud-group-members-toggle]');
        if (!deselect && membersToggle && !membersToggle.hidden) {
            setGroupMembersExpanded(root, group, true);
        }
        updateSelectionActions(root);
        requestGuideHighlightRefresh(root);
        if (document.activeElement !== button) {
            button.focus({preventScroll: true});
        }
    });
};

/**
 * Modifier that selects a range from the anchor (Shift + click, Shift + Space). Shift is the
 * platform convention; set it to 'altKey' to use Alt instead (Alt is often taken by the system).
 */
const RANGE_SELECTION_MODIFIER = 'shiftKey';

// Card parts that keep their own click behaviour (the checkbox is handled apart).
const ownClickSelector = 'button, a, input, textarea, select, form, summary, [contenteditable="true"], ' +
    '[role="menu"], [role="menuitem"]';
const selectorSelector = '.local-groupimport-easystud-selector';

const isRangeEvent = event => !!event[RANGE_SELECTION_MODIFIER];
const isToggleEvent = event => !!(event.ctrlKey || event.metaKey);

/**
 * Items of the clicked item's list, in their visible order: same type, same parent list (current
 * page, filters and sort applied), without the hidden, filtered out or folded away entries.
 *
 * @param {HTMLElement} item Selectable item.
 * @returns {HTMLElement[]} Items of its list.
 */
const getVisibleSelectionList = item => {
    const list = item.parentElement;
    if (!list) {
        return [];
    }
    const type = item.getAttribute('data-selectable-type');
    return Array.from(list.querySelectorAll(':scope > [data-selectable-type="' + type + '"]'))
        .filter(entry => entry === item || (!entry.hidden && !entry.inert && !entry.classList.contains('is-collapsed') &&
            !entry.closest('[hidden]') && entry.getClientRects().length > 0));
};

/**
 * Selects every item between the anchor and the item, both included, in its visible list. Without
 * an anchor in that list (other page, other card, other grouping), only the item is added.
 *
 * @param {HTMLElement} item Item clicked last.
 * @param {String|undefined} anchorid Selectable id of the anchor.
 */
const selectRange = (item, anchorid) => {
    const items = getVisibleSelectionList(item);
    const start = anchorid ? items.findIndex(entry => entry.getAttribute('data-selectable-id') === anchorid) : -1;
    const end = items.indexOf(item);
    if (start === -1 || end === -1) {
        setItemSelected(item, true);
        return;
    }
    items.slice(Math.min(start, end), Math.max(start, end) + 1).forEach(entry => setItemSelected(entry, true));
};

/**
 * Refresh path shared by every selection gesture.
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {String} type Selection type that changed.
 * @param {Boolean} refreshGuide Also re-measure the Guide highlight.
 */
const afterSelectionChange = (root, type, refreshGuide) => {
    if (type === 'grouping' && getSelectedItems(root, 'grouping').length === 0) {
        collapseAllGroupings(root);
    }
    if (type === 'grouping') {
        emitGuidedCompletion(root, 2, 'grouping');
    }
    updateSelectionActions(root);
    if (refreshGuide) {
        requestGuideHighlightRefresh(root);
    }
    if (type === 'participant') {
        emitTryActionsSelection(root);
    }
    if (type === 'group') {
        emitActivityGroupSelection(root);
    }
};

// Bind multi-selection across participant, group, grouping and member items.
export const bindSelection = root => {
    // Anchor of the range selection, per type: selectable id of the item clicked last. An id, not
    // a node, so that it survives the on-demand re-rendering of a page or a card.
    const anchors = new Map();

    const getSelectableItem = target => {
        const item = target && target.closest ? target.closest('[data-selectable-type]') : null;
        return item && root.contains(item) ? item : null;
    };

    // Ctrl/Cmd and range presses on a card never start a drag nor a text selection.
    root.addEventListener('mousedown', event => {
        if (event.button !== 0 || !(isRangeEvent(event) || isToggleEvent(event)) ||
                event.target.closest(ownClickSelector) || !getSelectableItem(event.target)) {
            return;
        }
        event.preventDefault();
    });
    root.addEventListener('dragstart', event => {
        if ((isRangeEvent(event) || isToggleEvent(event)) && getSelectableItem(event.target)) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);

    root.addEventListener('click', event => {
        const inSelector = !!event.target.closest(selectorSelector);
        // The checkbox keeps its own toggle; only a range click on it is handled here.
        if ((inSelector && !isRangeEvent(event)) || (!inSelector && event.target.closest(ownClickSelector))) {
            return;
        }

        const item = getSelectableItem(event.target);
        if (!item) {
            return;
        }

        const type = item.getAttribute('data-selectable-type');
        const activetype = getActiveSelectionType(root);
        if (!areSelectionTypesCompatible(activetype, type)) {
            if (inSelector && !event.target.matches('input')) {
                event.preventDefault();
            }
            return;
        }

        if (isRangeEvent(event)) {
            if (inSelector && !event.target.matches('input')) {
                // A label click would toggle the checkbox back after the range.
                event.preventDefault();
            }
            selectRange(item, anchors.get(type));
            const textSelection = window.getSelection ? window.getSelection() : null;
            if (textSelection && !textSelection.isCollapsed && root.contains(textSelection.anchorNode)) {
                textSelection.removeAllRanges();
            }
        } else if (isToggleEvent(event)) {
            setItemSelected(item, !item.classList.contains(selectedClass));
        } else {
            clearSelectionForType(root, type, item);
            setItemSelected(item, true);
        }

        anchors.set(type, item.getAttribute('data-selectable-id'));
        afterSelectionChange(root, type, true);
    });

    // Keyboard: Space toggles the focused card, the range modifier + Space extends from the anchor
    // (also from the card's checkbox, whose plain Space stays native).
    root.addEventListener('keydown', event => {
        if (event.key !== ' ' || isToggleEvent(event) || (event.altKey && RANGE_SELECTION_MODIFIER !== 'altKey')) {
            return;
        }
        const item = getSelectableItem(event.target);
        if (!item) {
            return;
        }
        const range = isRangeEvent(event);
        const onCard = event.target === item;
        const onCheckbox = event.target === getSelectionInput(item);
        if (!onCard && !(onCheckbox && range)) {
            return;
        }
        event.preventDefault();
        const type = item.getAttribute('data-selectable-type');
        if (!areSelectionTypesCompatible(getActiveSelectionType(root), type)) {
            return;
        }
        if (range) {
            selectRange(item, anchors.get(type));
        } else {
            setItemSelected(item, !item.classList.contains(selectedClass));
        }
        anchors.set(type, item.getAttribute('data-selectable-id'));
        afterSelectionChange(root, type, true);
    });

    root.addEventListener('change', event => {
        const input = event.target.closest('[data-easystud-selector-input]');
        if (!input || !root.contains(input)) {
            return;
        }

        const item = input.closest('[data-selectable-type]');
        if (!item) {
            return;
        }

        const type = item.getAttribute('data-selectable-type');
        const activetype = getActiveSelectionType(root);
        if (!areSelectionTypesCompatible(activetype, type) && !item.classList.contains(selectedClass)) {
            input.checked = false;
            return;
        }
        setItemSelected(item, input.checked);
        anchors.set(type, item.getAttribute('data-selectable-id'));
        afterSelectionChange(root, type, false);
    });

    root.addEventListener('click', event => {
        const clearButton = event.target.closest('[data-easystud-clear-all-selection]');
        if (!clearButton || !root.contains(clearButton)) {
            return;
        }
        clearSelectionState(root);
        updateSelectionActions(root);
        requestGuideHighlightRefresh(root);
        emitFilterPathCompletion(root, 'clear-selection');
    });

    root.addEventListener('click', event => {
        const mobileAction = event.target.closest('[data-easystud-mobile-action-trigger]');
        if (!mobileAction || !root.contains(mobileAction)) {
            return;
        }
        const selector = mobileAction.getAttribute('data-easystud-mobile-action-trigger');
        const target = selector ? getMobileActionButton(root, selector) : null;
        if (!target) {
            return;
        }
        event.preventDefault();
        target.click();
    });

    root.addEventListener('keydown', event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
            const selected = getSelectedItems(root, 'participant');
            if (!selected.length || !navigator.clipboard) {
                return;
            }
            event.preventDefault();
            const emails = selected.map(user => user.getAttribute('data-user-email')).filter(Boolean).join('\n');
            navigator.clipboard.writeText(emails);
        }
    });

    updateSelectionActions(root);
};
