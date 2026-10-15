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
 * EasyStud course manager: selection state (selected items, select, clear, availability).
 *
 * @module     local_groupimport/local/cm/selection
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {
    selectedClass, disabledSelectionClass, draggingClass, dropTargetClass, getSelectionInput,
    areSelectionTypesCompatible,
} from './shared';
import {getOnDemandModel, getOnDemandParticipants} from './state';
import {getSelectedMemberRow} from '../sm/groups';
import {
    syncGroupSelectAll, collapseGroupingSection, collapseAllGroupings, findParticipantCard,
    findCatalogGroupCard,
} from './cards';

export const getSelectedItemsForContext = (root, selector, target) => {
    const type = {'[data-easystud-user]': 'participant', '[data-easystud-group-id]': 'group',
        '[data-easystud-member-id]': 'member'}[selector];
    const selected = type && getOnDemandModel(root) ? getSelectedItems(root, type) :
        Array.from(root.querySelectorAll(selector + '.' + selectedClass));
    if (!selected.length) {
        return target ? [target] : [];
    }
    if (!target) {
        return selected;
    }
    return selected.indexOf(target) === -1 ? [target] : selected;
};

const getSelectedParticipantsForContext = (root, target) => {
    return getSelectedItemsForContext(root, '[data-easystud-user]', target);
};

const getParticipantFromContextItem = (root, item) => {
    if (!item) {
        return null;
    }
    if (item.matches('[data-easystud-user]')) {
        return item;
    }
    const userid = item.getAttribute('data-easystud-member-id') || item.getAttribute('data-user-id') || '';
    return userid ? findParticipantCard(root, userid) : null;
};

export const getParticipantItemsForContext = (root, type, target) => {
    if (type === 'participant') {
        return getSelectedParticipantsForContext(root, target);
    }
    if (type !== 'member') {
        return [];
    }
    return getSelectedItemsForContext(root, '[data-easystud-member-id]', target)
        .map(item => getParticipantFromContextItem(root, item))
        .filter(Boolean);
};

export const getSelectedItems = (root, type) => {
    const model = getOnDemandModel(root);
    if (model) {
        // SM-RENDU: participant and catalog group selections are id sets that may span pages;
        // everything else (tree groups, groupings, members) is still selected on the cards.
        const items = [];
        if (!type || type === 'participant') {
            model.raw.users.filter(user => model.selected.has(user.id))
                .forEach(user => items.push(findParticipantCard(root, user.id)));
        }
        if (!type || type === 'group') {
            model.selectedGroups.forEach((key, groupid) => items.push(findCatalogGroupCard(root, groupid, key)));
        }
        if (!type || type === 'member') {
            model.selectedMembers.forEach((key, memberkey) => {
                const [groupid, userid] = memberkey.split(':');
                const rowselector = '[data-easystud-member-id="' + userid + '"]';
                const card = findCatalogGroupCard(root, Number(groupid), key);
                const row = card ? card.querySelector(rowselector) : null;
                // A lean page card (re-rendered after a page change) lacks the rows past the first two:
                // the detached copy renders them all (R10-05 selects every member of a card).
                const proxy = row ? null : getSelectedMemberRow(model, groupid, userid, key);
                if (proxy) {
                    proxy.classList.add(selectedClass);
                    proxy.querySelector('input[type="checkbox"]').checked = true;
                }
                items.push(row || proxy);
            });
        }
        root.querySelectorAll((type ? '[data-selectable-type="' + type + '"]' : '[data-selectable-type]') + '.' + selectedClass +
            ':not([data-selectable-type="participant"]):not([data-easystud-sm-catalog])').forEach(item => {
            if (item.getAttribute('data-selectable-type') === 'grouping') {
                items.push(item);
            }
        });
        return items.filter(Boolean);
    }
    const selector = type ? '[data-selectable-type="' + type + '"].' + selectedClass : '[data-selectable-type].' + selectedClass;
    return Array.from(root.querySelectorAll(selector));
};

/**
 * On demand, keep the page card and its detached copy (or the reverse) in step.
 *
 * @param {HTMLElement} item Item the user selected.
 * @param {HTMLElement|null} twin Other copy of the same item.
 * @param {Boolean} selected New state.
 */
const syncSelectionTwin = (item, twin, selected) => {
    if (!twin || twin === item) {
        return;
    }
    twin.classList.toggle(selectedClass, selected);
    const input = getSelectionInput(twin);
    if (input) {
        input.checked = selected;
    }
};

export const setItemSelected = (item, selected) => {
    item.classList.toggle(selectedClass, selected);
    const input = getSelectionInput(item);
    if (input) {
        input.checked = selected;
    }
    const model = getOnDemandModel();
    if (model && item.getAttribute('data-selectable-type') === 'participant') {
        const userid = Number(item.getAttribute('data-user-id'));
        if (selected) {
            model.selected.add(userid);
        } else {
            model.selected.delete(userid);
        }
        const twin = item.isConnected ? model.detached.get(userid) :
            getOnDemandParticipants().root.querySelector(`[data-easystud-user][data-user-id="${userid}"]`);
        syncSelectionTwin(item, twin, selected);
    }
    const membercard = item.getAttribute('data-selectable-type') === 'member' ?
        item.closest('[data-easystud-group-id]') : null;
    if (model && membercard) {
        const memberkey = item.getAttribute('data-selectable-id');
        const catalogkey = membercard.getAttribute('data-easystud-sm-catalog') || 'structure';
        if (selected) {
            model.selectedMembers.set(memberkey, catalogkey);
        } else {
            model.selectedMembers.delete(memberkey);
        }
        const groupid = Number(membercard.getAttribute('data-easystud-group-id'));
        const catalog = model.catalogs[catalogkey];
        const twincard = membercard.isConnected ? catalog.detached.get(groupid) : catalog.pageCards.get(groupid);
        const twin = twincard ? twincard.querySelector('[data-selectable-id="' + memberkey + '"]') : null;
        syncSelectionTwin(item, twin, selected);
    }
    const key = item.getAttribute('data-easystud-sm-catalog') ||
        (item.getAttribute('data-selectable-type') === 'group' ? 'structure' : null);
    if (model && key && item.getAttribute('data-selectable-type') === 'group') {
        const groupid = Number(item.getAttribute('data-easystud-group-id'));
        if (selected) {
            model.selectedGroups.set(groupid, key);
        } else {
            model.selectedGroups.delete(groupid);
        }
        const catalog = model.catalogs[key];
        const twin = item.isConnected ? catalog.detached.get(groupid) : catalog.pageCards.get(groupid);
        syncSelectionTwin(item, twin, selected);
    }
};

export const clearSelectionForType = (root, type, except) => {
    if ((type === 'participant' || type === 'group' || type === 'member') && getOnDemandModel(root)) {
        const idattribute = {participant: 'data-user-id', group: 'data-easystud-group-id', member: 'data-selectable-id'}[type];
        const exceptid = except ? except.getAttribute(idattribute) : null;
        getSelectedItems(root, type).forEach(entry => {
            if (entry !== except && entry.getAttribute(idattribute) !== exceptid) {
                setItemSelected(entry, false);
            }
        });
        return;
    }
    root.querySelectorAll('[data-selectable-type="' + type + '"].' + selectedClass).forEach(entry => {
        if (entry !== except) {
            setItemSelected(entry, false);
            if (type === 'grouping') {
                collapseGroupingSection(entry);
            }
        }
    });
};

export const clearSelection = (root, type) => {
    const selector = type ? '[data-selectable-type="' + type + '"]' : '[data-selectable-type]';
    root.querySelectorAll(selector).forEach(item => setItemSelected(item, false));
    const model = getOnDemandModel(root);
    const unselectDetached = card => {
        card.classList.remove(selectedClass);
        const input = getSelectionInput(card);
        if (input) {
            input.checked = false;
        }
    };
    if (model && (!type || type === 'participant')) {
        model.selected.clear();
        model.detached.forEach(unselectDetached);
    }
    if (model && (!type || type === 'group')) {
        model.selectedGroups.clear();
        Object.values(model.catalogs).forEach(catalog => catalog.detached.forEach(unselectDetached));
    }
    if (model && (!type || type === 'member')) {
        model.selectedMembers.clear();
        model.memberSelectionItems?.clear();
        Object.values(model.catalogs).forEach(catalog => catalog.detached.forEach(card =>
            card.querySelectorAll('[data-selectable-type="member"]').forEach(unselectDetached)));
    }
    if (type === 'grouping') {
        collapseAllGroupings(root);
    }
};

export const clearSelectionState = root => {
    const hadSelectedGroupings = getSelectedItems(root, 'grouping').length > 0;
    clearSelection(root);
    if (hadSelectedGroupings) {
        collapseAllGroupings(root);
    }
    root.querySelectorAll('[data-selectable-type]').forEach(item => {
        item.classList.remove(disabledSelectionClass, draggingClass, dropTargetClass);
        item.removeAttribute('aria-disabled');
    });
    root.querySelectorAll('[data-easystud-selector-input]').forEach(input => {
        input.checked = false;
        input.disabled = false;
    });
};

export const getActiveSelectionType = root => {
    const types = ['participant', 'grouping', 'group', 'member'];
    return types.find(type => getSelectedItems(root, type).length > 0) || '';
};

export const updateSelectionAvailability = root => {
    const activetype = getActiveSelectionType(root);

    root.querySelectorAll('[data-selectable-type]').forEach(item => {
        const type = item.getAttribute('data-selectable-type');
        const selected = item.classList.contains(selectedClass);
        const disabled = !!activetype && !areSelectionTypesCompatible(activetype, type) && !selected;
        item.classList.toggle(disabledSelectionClass, disabled);
        // Only selection is unavailable: the card's nested actions stay usable.
        // Native input.disabled below expresses the checkbox's actual state.
        item.removeAttribute('aria-disabled');

        const input = getSelectionInput(item);
        if (input) {
            input.disabled = disabled;
        }
    });
    root.querySelectorAll('[data-easystud-group-select-all]').forEach(button => {
        const group = button.closest('[data-easystud-group-id]');
        if (group) {
            syncGroupSelectAll(group, activetype);
        }
    });
};
