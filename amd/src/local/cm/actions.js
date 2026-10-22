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
 * EasyStud course manager: server actions and the matching page updates.
 *
 * @module     local_groupimport/local/cm/actions
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {countLabel} from '../sm/index';
import {
    postInBatches, progressNotifier, addSummaryMessage, splitIdentifierTokens, bulkMaxItems,
} from './bulk_batches';
import {
    selectedClass, disabledSelectionClass, draggingClass, dropTargetClass, requestGuideHighlightRefresh,
    formatCountMessage, getLabels, showNotification,
} from './shared';
import {
    insertGroupElementSorted, insertGroupingElementSorted, animateElementCreated, animateElementRemoval,
    getGroupElementsById, getTreeGroupElementsById, getGroupsWithGroupingMembership,
    rehydrateParticipantMembershipDetails, updateCatalogGroupingTags, syncGroupingChildrenState, syncUngroupedState,
    collapseGroupingSection, findParticipantCard,
} from './cards';
import {clearSelectionState, releaseConfirmedSelection} from './selection';
import {
    syncGroupingGroupsCollapsible, ensureNestedGroupActionMenus, createMemberItem, updateGroupingBadge,
    syncGroupMembersState, updateStructureSummary, updateStructureEmptyState, createGroupElement,
    createParticipantCatalogGroupElement, createGroupingElement, createIconActionButton, ensureDuplicateButtons,
    ensureAdvancedSettingsButtons, ensureDeleteButtons, writeCountBadge,
} from './group_cards';
import {
    expandGroupingSection, syncCatalogFilters, applyContainerGroupSearch, applyGroupMemberSearch,
    syncStructurePlaceholders, syncPagination, applyFilters, updateSelectionActions, scheduleOnDemandStateRefresh,
    applyMembersAddedToState, applyMembersRemovedFromState, settleOnDemandStateAfterAction,
} from './workspace';

let pendingActionCount = 0;

const setActionBusyState = busy => {
    document.querySelectorAll('.local-groupimport-easystud').forEach(container => {
        const labels = JSON.parse(container.getAttribute('data-easystud-detail-labels') || '{}');
        const label = labels.actioninprogress || '';
        const status = container.querySelector('[data-easystud-action-busy-status]');
        container.setAttribute('data-easystud-action-busy-label', label);
        container.classList.toggle('is-action-busy', busy);
        container.setAttribute('aria-busy', busy ? 'true' : 'false');
        if (status) {
            const text = status.querySelector('[data-easystud-action-busy-text]');
            if (text) {
                text.textContent = label;
            }
            status.hidden = !busy;
        }
    });
};

const trackActionRequest = promise => {
    pendingActionCount += 1;
    setActionBusyState(true);
    return promise.finally(() => {
        pendingActionCount = Math.max(0, pendingActionCount - 1);
        setActionBusyState(pendingActionCount > 0);
    });
};

// Request failures must preserve drafts, selection and the currently open UI.
// The request tracker already restores busy controls in finally.
export const handleActionError = (root, error) => {
    const labels = getLabels(root);
    showNotification(root, error && error.message ? error.message : labels.ajaxerror || '', 'error');
};

// Post an EasyStud action.
export const postAction = data => {
    const root = document.getElementById('local-groupimport-easystud');
    const labels = root ? JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}') : {};
    const body = new URLSearchParams();
    Object.keys(data).forEach(key => {
        const value = data[key];
        if (Array.isArray(value)) {
            value.forEach(item => body.append(key + '[]', item));
            return;
        }
        body.set(key, value);
    });
    body.set('sesskey', M.cfg.sesskey);

    return trackActionRequest(fetch(M.cfg.wwwroot + '/local/groupimport/ajax.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: body.toString(),
    }).then(response => response.json()).then(result => {
        if (!result.success) {
            const refusal = new Error(result.error || labels.ajaxerror || '');
            // PERF-SRV: an answered refusal, unlike a lost answer (network error, timeout page).
            refusal.easystudServerAnswer = true;
            throw refusal;
        }
        settleOnDemandStateAfterAction(root, data.action, result);
        return result;
    }));
};

// R6: send a bulk list in batches the server accepts, with a toast per finished batch. A failed batch
// rejects with doneItems / failedItems so the caller applies what was done and keeps the rest selected.
export const postActionInBatches = (root, items, payload) => {
    const labels = getLabels(root);
    return postInBatches({
        post: postAction, items, payload, labels,
        onProgress: progressNotifier(labels, (message, type) => showNotification(root, message, type)),
    });
};

// R6: add participants (elements or {id}) to a group in batches. applyDone(users) updates the cards for the
// users whose batch the server committed, also when a later batch fails; the rest stays selected.
export const postAddUsersInBatches = (root, courseId, groupid, users, applyDone) => {
    const idOf = user => (user.getAttribute ? user.getAttribute('data-user-id') : user.id);
    const seen = new Set();
    const unique = users.filter(user => !seen.has(String(idOf(user))) && seen.add(String(idOf(user))));
    const labels = getLabels(root);
    return postActionInBatches(root, unique, batch => ({
        courseid: courseId,
        action: 'addusers',
        groupid,
        userids: batch.map(idOf),
    })).then(({response, items}) => {
        applyDone(items, response);
        if ((response.batches || 1) > 1) {
            response.message = addSummaryMessage(labels, response);
        }
        return response;
    }, error => {
        if (error.doneItems && error.doneItems.length) {
            applyDone(error.doneItems, error.response);
            // The participants (or the members of the copy) the server confirmed are no longer selected.
            const doneIds = error.doneItems.map(idOf);
            releaseConfirmedSelection(root, 'participant', doneIds, item => item.getAttribute('data-user-id'));
            releaseConfirmedSelection(root, 'member', doneIds, item => item.getAttribute('data-easystud-member-id'));
            updateSelectionActions(root);
        }
        throw error;
    });
};

// R6: add participants to a group from pasted identifiers, in batches of tokens. The pasted text is sent
// unchanged when it fits in one request.
export const postAddEmailsInBatches = (root, courseId, groupid, text) => {
    const labels = getLabels(root);
    const tokens = splitIdentifierTokens(text);
    if (tokens.length <= bulkMaxItems) {
        return postAction({courseid: courseId, action: 'addemails', groupid, emails: text});
    }
    return postActionInBatches(root, tokens, batch => ({
        courseid: courseId,
        action: 'addemails',
        groupid,
        emails: batch.join('\n'),
    })).then(({response}) => {
        response.message = addSummaryMessage(labels, response);
        return response;
    }, error => {
        if (error.response && error.response.users && error.response.users.length) {
            appendUsersToGroupCopies(root, groupid, error.response.users, labels);
        }
        throw error;
    });
};

// R6: delete groups in batches; removeDone(groupids) updates the cards of the groups really deleted.
export const postDeleteGroupsInBatches = (root, courseId, groupids, removeDone) => {
    const labels = getLabels(root);
    const unique = [...new Set(groupids)];
    return postActionInBatches(root, unique, batch => ({
        courseid: courseId,
        action: 'deletegroups',
        groupids: batch,
    })).then(({response, items}) => {
        removeDone(items);
        if ((response.batches || 1) > 1) {
            response.message = formatCountMessage(labels.groupsdeletedcount, response.deleted || 0);
        }
        return response;
    }, error => {
        if (error.doneItems && error.doneItems.length) {
            releaseConfirmedSelection(root, 'group', error.doneItems, item => item.getAttribute('data-selectable-id'));
            removeDone(error.doneItems);
            updateSelectionActions(root);
        }
        throw error;
    });
};

// Move an existing group element into a grouping section.
export const moveGroupElementToGrouping = (root, groupid, groupingid) => {
    const groups = getTreeGroupElementsById(root, groupid);
    const group = groups[0] || null;
    const target = root.querySelector('[data-easystud-grouping-drop="' + groupingid + '"]');
    const children = target ? target.querySelector('.local-groupimport-easystud-tree__children') : null;
    if (!group || !children) {
        return;
    }
    const sourceSections = groups.map(entry => entry.closest('[data-easystud-grouping-drop]')).filter(Boolean);
    children.hidden = false;
    groups.slice(1).forEach(entry => entry.remove());
    if (group.parentElement !== children) {
        group.remove();
        insertGroupElementSorted(children, group);
    }
    ensureGroupUnlinkButton(root, group, groupingid);
    if (groupingid !== '0') {
        expandGroupingSection(target);
    }
    sourceSections.concat([target]).forEach(section => {
        const badge = section ? section.querySelector(':scope > .local-groupimport-easystud-grouping__header > .badge') : null;
        const groupcount = section ? section.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length : 0;
        if (badge) {
            writeCountBadge(badge, countLabel(badge.getAttribute('data-count-template') || '__count__', groupcount),
                groupcount, 'fa-layer-group');
        }
    });
    syncUngroupedState(root, getLabels(root));
    root.querySelectorAll('[data-easystud-grouping-id]').forEach(section => syncGroupingChildrenState(section, getLabels(root)));
    applyContainerGroupSearch(root);
    updateCatalogGroupingTags(root, groupid);
    syncCatalogFilters(root);
    updateStructureSummary(root);
    updateStructureEmptyState(root);
    requestGuideHighlightRefresh(root);
};

export const copyGroupElementToGrouping = (root, sourceGroup, groupingid) => {
    const groupid = sourceGroup ? sourceGroup.getAttribute('data-easystud-group-id') : '';
    const target = root.querySelector('[data-easystud-grouping-drop="' + groupingid + '"]');
    const children = target ? target.querySelector('.local-groupimport-easystud-tree__children') : null;
    if (!groupid || !sourceGroup || !children) {
        return;
    }
    if (children.querySelector(':scope > [data-easystud-group-id="' + groupid + '"]')) {
        return;
    }

    const copy = sourceGroup.cloneNode(true);
    copy.classList.remove(selectedClass, draggingClass, dropTargetClass, 'local-groupimport-easystud-group--catalog');
    copy.querySelectorAll('.' + selectedClass).forEach(item => item.classList.remove(selectedClass));
    copy.querySelectorAll('[data-easystud-selector-input]').forEach(input => {
        input.checked = false;
        input.disabled = false;
    });
    children.hidden = false;
    insertGroupElementSorted(children, copy);
    ensureGroupUnlinkButton(root, copy, groupingid);
    ensureNestedGroupActionMenus(root);
    expandGroupingSection(target);
    updateGroupingBadge(target);
    syncGroupingChildrenState(target, getLabels(root));
    applyContainerGroupSearch(root);
    updateCatalogGroupingTags(root, groupid);
    syncCatalogFilters(root);
    updateStructureSummary(root);
    updateStructureEmptyState(root);
    requestGuideHighlightRefresh(root);
};

export const removeGroupsFromGroupings = (root, courseId, groups) => {
    const labels = getLabels(root);
    const groupsToRemove = getGroupsWithGroupingMembership(root, groups);
    if (!groupsToRemove.length) {
        return Promise.resolve(null);
    }

    return Promise.all(groupsToRemove.map(group => {
        const groupid = group.getAttribute('data-easystud-group-id');
        return postAction({
            courseid: courseId,
            action: 'movegroup',
            groupid,
            groupingid: 0,
        }).then(response => {
            moveGroupElementToGrouping(root, groupid, 0);
            return response;
        });
    })).then(() => {
        clearSelectionState(root);
        updateSelectionActions(root);
        requestGuideHighlightRefresh(root);
        showNotification(root, formatCountMessage(labels.groupsremovedfromgroupingscount, groupsToRemove.length), 'success');
        return groupsToRemove;
    });
};

export const postFormAction = formData => {
    const root = document.getElementById('local-groupimport-easystud');
    const labels = root ? JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}') : {};
    formData.set('sesskey', M.cfg.sesskey);

    return trackActionRequest(fetch(M.cfg.wwwroot + '/local/groupimport/ajax.php', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
    }).then(response => response.json()).then(result => {
        if (!result.success) {
            throw new Error(result.error || labels.ajaxerror || '');
        }
        scheduleOnDemandStateRefresh(root);
        return result;
    }));
};

const ensureGroupUnlinkButton = (root, group, groupingid) => {
    if (!group || !groupingid || groupingid === '0') {
        return;
    }
    const header = group.querySelector(':scope > .local-groupimport-easystud-group__header');
    const rename = header ? header.querySelector(':scope > .local-groupimport-easystud-rename') : null;
    if (!header || !rename || header.querySelector('[data-easystud-remove-from-grouping]')) {
        return;
    }
    const labels = getLabels(root);
    const label = labels.removefromgroupinglabel || labels.removegroupfromgrouping || '';
    const button = createIconActionButton(
        'local-groupimport-easystud-group__unlink-button',
        'data-easystud-remove-from-grouping',
        group.getAttribute('data-easystud-group-id') || '',
        label,
        'fa-unlink'
    );
    header.insertBefore(button, rename.nextSibling);
};

export const deleteGroupElement = (root, groupid) => {
    const groups = getGroupElementsById(root, groupid);
    const sections = new Set(groups.map(group => group.closest('[data-easystud-grouping-drop]')).filter(Boolean));

    const syncAfterRemoval = () => {
        sections.forEach(section => {
            updateGroupingBadge(section);
            syncGroupingChildrenState(section, getLabels(root));
            syncGroupingGroupsCollapsible(section);
        });

        syncStructurePlaceholders(root);
        applyContainerGroupSearch(root);
        updateCatalogGroupingTags(root, groupid);
        syncCatalogFilters(root);
        updateStructureSummary(root);
        updateStructureEmptyState(root);
        syncPagination(root);
        updateSelectionActions(root);
        requestGuideHighlightRefresh(root);
    };

    if (!groups.length) {
        syncAfterRemoval();
        return;
    }

    let pending = groups.length;
    groups.forEach(group => {
        animateElementRemoval(group, () => {
            group.remove();
            pending--;
            if (pending === 0) {
                syncAfterRemoval();
            }
        });
    });
};

export const deleteGroupingElement = (root, groupingid) => {
    const grouping = root.querySelector('[data-easystud-grouping-id="' + groupingid + '"]');
    const removeGrouping = () => {
        const ungroupedchildren = root.querySelector('.local-groupimport-easystud-tree__section--ungrouped .local-groupimport-easystud-tree__children');
        if (ungroupedchildren) {
            grouping.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').forEach(group => {
                ungroupedchildren.appendChild(group);
                updateCatalogGroupingTags(root, group.getAttribute('data-easystud-group-id'));
            });
        }
        grouping.remove();
        syncStructurePlaceholders(root);
        applyContainerGroupSearch(root);
        updateSelectionActions(root);
        rehydrateParticipantMembershipDetails(root);
        requestGuideHighlightRefresh(root);
    };
    if (grouping) {
        animateElementRemoval(grouping, removeGrouping);
        return;
    }
    syncStructurePlaceholders(root);
    applyContainerGroupSearch(root);
    updateSelectionActions(root);
    rehydrateParticipantMembershipDetails(root);
};

export const removeMembers = (root, courseId, members) => {
    const validmembers = (members || []).filter(Boolean);
    if (!validmembers.length) {
        return Promise.resolve(null);
    }

    const groupids = [];
    const userids = [];
    validmembers.forEach(member => {
        const group = member.closest('[data-easystud-group-id]');
        const groupid = group ? group.getAttribute('data-easystud-group-id') : '';
        const userid = member.getAttribute('data-easystud-member-id');
        if (groupid && userid) {
            groupids.push(groupid);
            userids.push(userid);
        }
    });

    const payload = {
        courseid: courseId,
        action: 'removeuser',
        groupid: groupids[0],
        userid: userids[0],
    };

    // R6: the DOM follows the server batch by batch: only members really removed leave the cards.
    const applyRemoved = (doneMembers, donepairs) => {
        applyMembersRemovedFromState(root, donepairs);
        doneMembers.forEach(member => {
            const group = member.closest('[data-easystud-group-id]');
            const groupid = group ? group.getAttribute('data-easystud-group-id') : '';
            const userid = member.getAttribute('data-easystud-member-id');
            const user = findParticipantCard(root, userid);
            if (user) {
                const current = (user.getAttribute('data-group-ids') || '').split(',').filter(Boolean);
                user.setAttribute('data-group-ids', current.filter(id => id !== groupid).join(','));
            }
            getGroupElementsById(root, groupid).forEach(groupcopy => {
                const copyMember = groupcopy.querySelector('[data-member-key="' + groupid + '-' + userid + '"], [data-member-key="' + groupid + ':' + userid + '"]');
                if (copyMember) {
                    copyMember.remove();
                }
                syncGroupMembersState(groupcopy, getLabels(root));
            });
        });
        rehydrateParticipantMembershipDetails(root);
        applyFilters(root);
        updateSelectionActions(root);
    };

    if (validmembers.length === 1) {
        return postAction(payload).then(response => {
            applyRemoved(validmembers, groupids.map((groupid, index) => ({groupid, userid: userids[index]})));
            return response;
        });
    }

    const entries = validmembers.map(member => {
        const group = member.closest('[data-easystud-group-id]');
        return {
            member,
            groupid: group ? group.getAttribute('data-easystud-group-id') : '',
            userid: member.getAttribute('data-easystud-member-id'),
        };
    }).filter(entry => entry.groupid && entry.userid);
    const labels = getLabels(root);
    const applyEntries = done => applyRemoved(
        done.map(entry => entry.member),
        done.map(({groupid, userid}) => ({groupid, userid}))
    );
    return postActionInBatches(root, entries, batch => ({
        courseid: courseId,
        action: 'removemembers',
        groupids: batch.map(entry => entry.groupid),
        userids: batch.map(entry => entry.userid),
    })).then(({response, items}) => {
        applyEntries(items);
        if (items.length === entries.length && (response.batches || 1) > 1) {
            response.message = formatCountMessage(labels.removeuserscount, response.removed || 0);
        }
        return response;
    }, error => {
        if (error.doneItems && error.doneItems.length) {
            const pairOf = (groupid, userid) => groupid + ':' + userid;
            // Release before applyEntries() removes the rows.
            const doneKeys = error.doneItems.map(entry => pairOf(entry.groupid, entry.userid));
            const rowKey = item => {
                const group = item.closest('[data-easystud-group-id]');
                const groupid = group ? group.getAttribute('data-easystud-group-id') : '';
                return pairOf(groupid, item.getAttribute('data-easystud-member-id'));
            };
            releaseConfirmedSelection(root, 'member', doneKeys, rowKey);
            applyEntries(error.doneItems);
            updateSelectionActions(root);
        }
        throw error;
    });
};

export const appendUsersToGroupCopies = (root, groupid, users, labels, removed = []) => {
    applyMembersAddedToState(root, groupid,
        users.map(user => (user.getAttribute ? user.getAttribute('data-user-id') : user.id)), removed);
    getGroupElementsById(root, groupid).forEach(group => {
        const list = group.querySelector('[data-easystud-group-members]');
        if (!list) {
            return;
        }
        list.querySelectorAll('.text-muted, .local-groupimport-easystud-tree__empty').forEach(empty => empty.remove());
        users.forEach(user => {
            const userid = user.getAttribute ? user.getAttribute('data-user-id') : String(user.id);
            const fullname = user.querySelector ? (
                user.querySelector('strong') ? user.querySelector('strong').textContent : ''
            ) : user.fullname;
            if (!userid || list.querySelector('[data-easystud-member-id="' + userid + '"]')) {
                return;
            }
            const removelabel = (labels.removeuser || '').replace('{name}', fullname);
            list.appendChild(createMemberItem(groupid, userid, fullname, removelabel, labels.selectionmode || ''));
        });
        syncGroupMembersState(group, labels);
    });
    rehydrateParticipantMembershipDetails(root);
    applyGroupMemberSearch(root);
};

export const insertGroupData = (root, groupdata) => {
    const tree = root.querySelector('[data-easystud-tree]');
    const participantgrouplist = root.querySelector('.local-groupimport-easystud-participant-groups__list');
    const structuregrouplist = root.querySelector('.local-groupimport-easystud-structure-groups__list');
    const groupingids = Array.isArray(groupdata.groupingids) ?
        groupdata.groupingids.map(id => String(id)) :
        (groupdata.groupingidscsv || '').split(',').filter(Boolean);

    if (tree) {
        if (groupingids.length) {
            groupingids.forEach(groupingid => {
                const target = tree.querySelector('[data-easystud-grouping-drop="' + groupingid + '"]');
                const children = target ? target.querySelector('.local-groupimport-easystud-tree__children') : null;
                if (!children) {
                    return;
                }
                children.hidden = false;
                const group = createGroupElement(root, groupdata);
                insertGroupElementSorted(children, group);
                animateElementCreated(group);
                syncGroupingChildrenState(target, getLabels(root));
                updateGroupingBadge(target);
            });
        } else {
            const ungroupedsection = tree.querySelector('.local-groupimport-easystud-tree__section--ungrouped');
            const children = ungroupedsection ? ungroupedsection.querySelector('.local-groupimport-easystud-tree__children') : null;
            if (children) {
                children.hidden = false;
                const group = createGroupElement(root, groupdata);
                insertGroupElementSorted(children, group);
                animateElementCreated(group);
                syncUngroupedState(root, getLabels(root));
            }
        }
    }

    if (participantgrouplist) {
        const group = createParticipantCatalogGroupElement(root, groupdata);
        insertGroupElementSorted(participantgrouplist, group);
        animateElementCreated(group);
    }
    if (structuregrouplist) {
        const group = createParticipantCatalogGroupElement(root, groupdata);
        insertGroupElementSorted(structuregrouplist, group);
        animateElementCreated(group);
    }
    ensureDuplicateButtons(root);
    ensureAdvancedSettingsButtons(root);
    ensureDeleteButtons(root);
    updateCatalogGroupingTags(root, groupdata.id);
    syncCatalogFilters(root);
    applyContainerGroupSearch(root);
    updateStructureSummary(root);
    updateStructureEmptyState(root);
    requestGuideHighlightRefresh(root);
};

export const insertGroupingData = (root, groupingdata) => {
    const tree = root.querySelector('[data-easystud-tree]');
    const groupingswrap = tree ? tree.querySelector('.local-groupimport-easystud-tree__groupings') : null;
    if (!groupingswrap) {
        return null;
    }
    const grouping = createGroupingElement(root, groupingdata);
    grouping.classList.remove(selectedClass, disabledSelectionClass, draggingClass, dropTargetClass, 'is-expanded');
    insertGroupingElementSorted(groupingswrap, grouping);
    animateElementCreated(grouping);
    (groupingdata.groupids || []).forEach(groupid => {
        const source = getTreeGroupElementsById(root, String(groupid))[0] ||
            root.querySelector('.local-groupimport-easystud-structure-groups__list [data-easystud-group-id="' + groupid + '"]');
        if (source) {
            copyGroupElementToGrouping(root, source, groupingdata.id);
        }
    });
    const children = grouping.querySelector(':scope > .local-groupimport-easystud-tree__children');
    if (children) {
        children.hidden = true;
    }
    const toggle = grouping.querySelector('[data-easystud-collapse-toggle]');
    if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
        const icon = toggle.querySelector('.fa');
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-right');
        }
    }
    collapseGroupingSection(grouping);
    ensureDuplicateButtons(root);
    ensureAdvancedSettingsButtons(root);
    ensureDeleteButtons(root);
    syncCatalogFilters(root);
    applyContainerGroupSearch(root);
    updateStructureSummary(root);
    updateStructureEmptyState(root);
    requestGuideHighlightRefresh(root);
    return grouping;
};
