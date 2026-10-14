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

import {selectedClass, requestGuideHighlightRefresh, areSelectionTypesCompatible} from './shared';
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

// Bind multi-selection across participant, group, grouping and member items.
export const bindSelection = root => {
    const lastSelectedByType = new Map();

    root.addEventListener('click', event => {
        if (event.target.closest('button, a, input, textarea, select, form, .local-groupimport-easystud-selector')) {
            return;
        }

        const item = event.target.closest('[data-selectable-type]');
        if (!item || !root.contains(item)) {
            return;
        }

        const type = item.getAttribute('data-selectable-type');
        const activetype = getActiveSelectionType(root);
        if (!areSelectionTypesCompatible(activetype, type)) {
            return;
        }
        const items = Array.from(root.querySelectorAll('[data-selectable-type="' + type + '"]:not([hidden])'));
        const lastSelected = lastSelectedByType.get(type);

        if (event.shiftKey && lastSelected) {
            const start = items.indexOf(lastSelected);
            const end = items.indexOf(item);
            if (start !== -1 && end !== -1) {
                const [from, to] = start < end ? [start, end] : [end, start];
                items.slice(from, to + 1).forEach(entry => setItemSelected(entry, true));
            }
        } else if (event.ctrlKey || event.metaKey) {
            setItemSelected(item, !item.classList.contains(selectedClass));
        } else {
            clearSelectionForType(root, type, item);
            setItemSelected(item, true);
        }

        lastSelectedByType.set(type, item);
        if (type === 'grouping' && getSelectedItems(root, 'grouping').length === 0) {
            collapseAllGroupings(root);
        }
        if (type === 'grouping') {
            emitGuidedCompletion(root, 2, 'grouping');
        }
        updateSelectionActions(root);
        requestGuideHighlightRefresh(root);
        if (type === 'participant') {
            emitTryActionsSelection(root);
        }
        if (type === 'group') {
            emitActivityGroupSelection(root);
        }
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
        lastSelectedByType.set(type, item);
        if (type === 'grouping' && getSelectedItems(root, 'grouping').length === 0) {
            collapseAllGroupings(root);
        }
        if (type === 'grouping') {
            emitGuidedCompletion(root, 2, 'grouping');
        }
        updateSelectionActions(root);
        if (type === 'participant') {
            emitTryActionsSelection(root);
        }
        if (type === 'group') {
            emitActivityGroupSelection(root);
        }
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
