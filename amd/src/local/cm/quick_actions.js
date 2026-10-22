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
 * EasyStud course manager: quick create, rename, member, grouping, bulk and duplicate actions.
 *
 * @module     local_groupimport/local/cm/quick_actions
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Guide from '../../guide_api';
import {selectedClass, normalise, getLabels, showNotification} from './shared';
import {openConfirmModal} from './modal';
import {
    lazyKnownUserIdentifiers, renderIdentifierPreview, renderSmartIdentifierPreview, getKnownGroupIdentifiers,
} from './identifiers';
import {
    getGroupElementsById, rehydrateParticipantMembershipDetails, syncGroupingChildrenState, syncUngroupedState,
    setRenameEditing, setInlinePanelOpen,
} from './cards';
import {getSelectedItems, clearSelectionState} from './selection';
import {
    emitGuidedCompletion, emitPracticeCompletion, getActivityGuideRoot, emitActivityGroupingEntry,
} from './guide_hooks';
import {ensureGroupEmailPanel, ensureInlinePanelCancelButtons} from './group_cards';
import {updateSelectionActions} from './workspace';
import {
    handleActionError, postAction, postAddEmailsInBatches, postDeleteGroupsInBatches,
    moveGroupElementToGrouping, removeGroupsFromGroupings, deleteGroupElement,
    deleteGroupingElement, removeMembers, appendUsersToGroupCopies, insertGroupData, insertGroupingData,
} from './actions';
import {getSelectedMessageUserIds, openParticipantMessageModal} from './messaging';

/**
 * PERF-SRV: random token of one creation request (kept for its retries).
 *
 * @returns {String}
 */
const createRequestToken = () => {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const bindQuickCreate = (root, courseId) => {
    root.querySelectorAll('.local-groupimport-easystud-create').forEach(form => {
        form.addEventListener('submit', event => {
            event.preventDefault();

            const action = form.querySelector('input[name="action"]');
            const textinput = form.querySelector('input[type="text"]');
            if (!action || !textinput || !textinput.value.trim()) {
                return;
            }

            const payload = {
                courseid: courseId,
                action: action.value,
            };

            if (action.value === 'creategroup') {
                payload.groupname = textinput.value.trim();
                // PERF-SRV: resending the same name after a lost answer reuses its token, so the server
                // returns the groups the first request created instead of creating or refusing them.
                const pending = form.easystudCreateRequest;
                payload.requesttoken = pending && pending.name === payload.groupname ? pending.token : createRequestToken();
                form.easystudCreateRequest = {name: payload.groupname, token: payload.requesttoken};
            } else if (action.value === 'creategrouping') {
                payload.groupingname = textinput.value.trim();
            } else {
                return;
            }

            const activityCreationToken = Guide.getPathContextToken(getActivityGuideRoot(root), 'prepare-activity-grouping');
            postAction(payload).then(response => {
                form.easystudCreateRequest = null;
                const createdGroups = response.groups || (response.group ? [response.group] : []);
                const createdGroupings = response.groupings || (response.grouping ? [response.grouping] : []);

                createdGroups.forEach(group => insertGroupData(root, group));
                createdGroupings.forEach(groupingdata => insertGroupingData(root, groupingdata));

                textinput.value = '';
                updateSelectionActions(root);
                ensureInlinePanelCancelButtons(root);
                syncUngroupedState(root, getLabels(root));
                root.querySelectorAll('[data-easystud-grouping-id]').forEach(section => {
                    syncGroupingChildrenState(section, getLabels(root));
                });
                showNotification(root, response.message || '', 'success');
                emitGuidedCompletion(root, 0, 'main');
                if (createdGroups.length) {
                    emitPracticeCompletion(root, 'create-group');
                }
                if (action.value === 'creategrouping') {
                    emitGuidedCompletion(root, 0, 'grouping');
                    createdGroupings.forEach(grouping => {
                        emitActivityGroupingEntry(root, String(grouping.id), activityCreationToken);
                    });
                }
            }).catch(error => {
                if (error && error.easystudServerAnswer) {
                    // The server answered (refusal): a new attempt is a new request.
                    form.easystudCreateRequest = null;
                }
                showNotification(root, error.message || '', 'error');
            });
        });
    });
};


export const bindRenameForms = (root, courseId) => {
    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-rename-toggle]');
        if (toggle && root.contains(toggle)) {
            const form = toggle.closest('.local-groupimport-easystud-rename');
            const input = form ? form.querySelector('input[name="name"]') : null;
            setRenameEditing(form, true);
            if (input) {
                input.focus();
                input.select();
            }
            return;
        }

        const cancel = event.target.closest('[data-easystud-rename-cancel]');
        if (cancel && root.contains(cancel)) {
            const form = cancel.closest('.local-groupimport-easystud-rename');
            setRenameEditing(form, false);
        }
    });

    root.addEventListener('submit', event => {
        const form = event.target.closest('.local-groupimport-easystud-rename');
        if (!form || !root.contains(form)) {
            return;
        }

        event.preventDefault();
        const action = form.querySelector('input[name="action"]');
        const nameinput = form.querySelector('input[name="name"]');
        if (!action || !nameinput || !nameinput.value.trim()) {
            return;
        }

        const payload = {
            courseid: courseId,
            action: action.value,
            name: nameinput.value.trim(),
        };

        const groupid = form.querySelector('input[name="groupid"]');
        const groupingid = form.querySelector('input[name="groupingid"]');
        if (groupid) {
            payload.groupid = groupid.value;
        }
        if (groupingid) {
            payload.groupingid = groupingid.value;
        }

        postAction(payload).then(response => {
            if (response.group) {
                getGroupElementsById(root, response.group.id).forEach(group => {
                    const name = group.querySelector('.local-groupimport-easystud-group__name');
                    if (name) {
                        name.textContent = response.group.name || '';
                    }
                    group.setAttribute('data-search-text', normalise(response.group.name || ''));
                    group.setAttribute('data-easystud-advanced-name', response.group.name || '');
                    const copyinput = group.querySelector('input[name="name"]');
                    if (copyinput) {
                        copyinput.value = response.group.rawname || response.group.name || '';
                    }
                });
                if (form) {
                    nameinput.value = response.group.rawname || response.group.name || '';
                }
            }

            if (response.grouping) {
                const grouping = root.querySelector('[data-easystud-grouping-id="' + response.grouping.id + '"]');
                if (grouping) {
                    const name = grouping.querySelector('.local-groupimport-easystud-grouping__name');
                    if (name) {
                        name.textContent = response.grouping.name || '';
                    }
                    grouping.setAttribute('data-search-text', normalise(response.grouping.name || ''));
                    grouping.setAttribute('data-easystud-advanced-name', response.grouping.name || '');
                    nameinput.value = response.grouping.rawname || response.grouping.name || '';
                }
            }

            rehydrateParticipantMembershipDetails(root);
            setRenameEditing(form, false);

            showNotification(root, response.message || '', 'success');
        }).catch(error => {
            showNotification(root, error.message || '', 'error');
        });
    });
};

// Bind direct group email paste and member removal actions.
export const bindGroupMemberActions = (root, courseId) => {
    const labels = JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');
    const knownIdentifiers = lazyKnownUserIdentifiers(root);

    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-toggle-group-email]');
        if (toggle && root.contains(toggle)) {
            const groupid = toggle.getAttribute('data-easystud-toggle-group-email');
            const group = toggle.closest('[data-easystud-group-id]');
            const panel = ensureGroupEmailPanel(group, groupid, labels);
            if (panel) {
                const open = panel.hidden || !panel.classList.contains('is-open');
                const box = panel.querySelector('[data-easystud-group-email-box]');
                if (open && box) {
                    const result = panel.querySelector('[data-easystud-group-email-result="' + groupid + '"]');
                    renderIdentifierPreview(box, result, knownIdentifiers());
                }
                const transition = setInlinePanelOpen(panel, open);
                if (open && box) {
                    transition.then(completed => {
                        if (completed) {
                            box.focus({preventScroll: true});
                        }
                    });
                }
            }
            return;
        }

        const cancelButton = event.target.closest('[data-easystud-cancel-group-email]');
        if (cancelButton && root.contains(cancelButton)) {
            const panel = cancelButton.closest('[data-easystud-group-email-panel]');
            if (panel) {
                setInlinePanelOpen(panel, false);
            }
            return;
        }

        const addButton = event.target.closest('[data-easystud-add-group-emails]');
        if (addButton && root.contains(addButton)) {
            const groupid = addButton.getAttribute('data-easystud-add-group-emails');
            const group = addButton.closest('[data-easystud-group-id]');
            const panel = ensureGroupEmailPanel(group, groupid, labels);
            const box = panel ? panel.querySelector('[data-easystud-group-email-box="' + groupid + '"]') : null;
            const result = panel ? panel.querySelector('[data-easystud-group-email-result="' + groupid + '"]') : null;
            if (!group || !box) {
                return;
            }
            postAddEmailsInBatches(root, courseId, groupid, box.value).then(response => {
                appendUsersToGroupCopies(root, groupid, response.users || [], labels);
                if (result) {
                    const missing = response.missing && response.missing.length ? ' - ' + response.missing.join(', ') : '';
                    result.textContent = (response.message || '') + missing;
                    result.classList.toggle('text-danger', !!missing);
                }
                box.value = '';
                clearSelectionState(root);
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
            }).catch(error => handleActionError(root, error));
            return;
        }

        const removeButton = event.target.closest('[data-easystud-remove-member]');
        if (removeButton && root.contains(removeButton)) {
            const item = removeButton.closest('[data-easystud-member-id]');
            const selectedMembers = getSelectedItems(root, 'member');
            const members = item && item.classList.contains(selectedClass) && selectedMembers.indexOf(item) !== -1 &&
                selectedMembers.length > 1 ? selectedMembers : [item];
            removeMembers(root, courseId, members).then(response => {
                clearSelectionState(root);
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
                emitGuidedCompletion(root, 1, 'grouping');
            }).catch(error => handleActionError(root, error));
        }
    });

    root.addEventListener('input', event => {
        const box = event.target.closest('[data-easystud-group-email-box]');
        if (!box || !root.contains(box)) {
            return;
        }
        const groupid = box.getAttribute('data-easystud-group-email-box');
        const panel = box.closest('[data-easystud-group-email-panel]');
        const result = panel ? panel.querySelector('[data-easystud-group-email-result="' + groupid + '"]') : null;
        renderIdentifierPreview(box, result, knownIdentifiers());
    });

    root.addEventListener('paste', event => {
        const box = event.target.closest('[data-easystud-group-email-box]');
        if (!box || !root.contains(box)) {
            return;
        }
        window.setTimeout(() => {
            const groupid = box.getAttribute('data-easystud-group-email-box');
            const panel = box.closest('[data-easystud-group-email-panel]');
            const result = panel ? panel.querySelector('[data-easystud-group-email-result="' + groupid + '"]') : null;
            renderIdentifierPreview(box, result, knownIdentifiers());
        }, 0);
    });
};

// Bind direct grouping group paste actions.
export const bindGroupingGroupActions = (root, courseId) => {
    const renderGroupPreview = box => {
        const groupingid = box.getAttribute('data-easystud-grouping-groups-box');
        const grouping = box.closest('[data-easystud-grouping-id]');
        const result = grouping ? grouping.querySelector('[data-easystud-grouping-groups-result="' + groupingid + '"]') : null;
        renderSmartIdentifierPreview(box, result, getKnownGroupIdentifiers(root), /[\r\n,;|]+/u);
    };

    root.addEventListener('click', event => {
        const removeButton = event.target.closest('[data-easystud-remove-from-grouping]');
        if (removeButton && root.contains(removeButton)) {
            const groupid = removeButton.getAttribute('data-easystud-remove-from-grouping');
            postAction({
                courseid: courseId,
                action: 'movegroup',
                groupid,
                groupingid: 0,
            }).then(response => {
                moveGroupElementToGrouping(root, groupid, 0);
                clearSelectionState(root);
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
                emitGuidedCompletion(root, 1);
            }).catch(error => handleActionError(root, error));
            return;
        }

        const toggle = event.target.closest('[data-easystud-toggle-grouping-groups]');
        if (toggle && root.contains(toggle)) {
            const groupingid = toggle.getAttribute('data-easystud-toggle-grouping-groups');
            const grouping = toggle.closest('[data-easystud-grouping-id]');
            const panel = grouping ? grouping.querySelector('[data-easystud-grouping-groups-panel="' + groupingid + '"]') : null;
            if (panel) {
                const open = panel.hidden || !panel.classList.contains('is-open');
                const box = panel.querySelector('[data-easystud-grouping-groups-box]');
                if (open && box) {
                    renderGroupPreview(box);
                }
                const transition = setInlinePanelOpen(panel, open);
                if (open && box) {
                    transition.then(completed => {
                        if (completed) {
                            box.focus({preventScroll: true});
                        }
                    });
                }
            }
            return;
        }

        const cancelButton = event.target.closest('[data-easystud-cancel-grouping-groups]');
        if (cancelButton && root.contains(cancelButton)) {
            const panel = cancelButton.closest('[data-easystud-grouping-groups-panel]');
            if (panel) {
                setInlinePanelOpen(panel, false);
            }
            return;
        }

        const addButton = event.target.closest('[data-easystud-add-grouping-groups]');
        if (addButton && root.contains(addButton)) {
            const groupingid = addButton.getAttribute('data-easystud-add-grouping-groups');
            const grouping = addButton.closest('[data-easystud-grouping-id]');
            const box = grouping ? grouping.querySelector('[data-easystud-grouping-groups-box="' + groupingid + '"]') : null;
            const result = grouping ? grouping.querySelector('[data-easystud-grouping-groups-result="' + groupingid + '"]') : null;
            if (!box) {
                return;
            }

            postAction({
                courseid: courseId,
                action: 'addgroups',
                groupingid,
                groups: box.value,
            }).then(response => {
                (response.groups || []).forEach(group => {
                    moveGroupElementToGrouping(root, group.id, groupingid);
                });
                if (result) {
                    let details = '';
                    if (response.missing && response.missing.length) {
                        details += ' - ' + response.missing.join(', ');
                    }
                    if (response.ambiguous && response.ambiguous.length) {
                        details += ' - ' + response.ambiguous.join(', ');
                    }
                    result.textContent = (response.message || '') + details;
                    result.classList.toggle('text-danger', !!details);
                }
                box.value = '';
                clearSelectionState(root);
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
                emitGuidedCompletion(root, 1, 'grouping');
            }).catch(error => handleActionError(root, error));
        }
    });

    root.addEventListener('input', event => {
        const box = event.target.closest('[data-easystud-grouping-groups-box]');
        if (!box || !root.contains(box)) {
            return;
        }
        renderGroupPreview(box);
    });

    root.addEventListener('paste', event => {
        const box = event.target.closest('[data-easystud-grouping-groups-box]');
        if (!box || !root.contains(box)) {
            return;
        }
        window.setTimeout(() => renderGroupPreview(box), 0);
    });

};

export const bindBulkActions = (root, courseId) => {
    root.querySelectorAll('[data-easystud-delete-selected-groups]').forEach(deleteGroupsButton => {
        deleteGroupsButton.addEventListener('click', () => {
            const selectedGroups = getSelectedItems(root, 'group');
            const groupids = selectedGroups.map(group => group.getAttribute('data-selectable-id'));
            if (!groupids.length) {
                return;
            }

            const hasmembers = selectedGroups.some(group => group.querySelector('[data-easystud-member-id]'));
            const runDelete = () => {
                postDeleteGroupsInBatches(root, courseId, groupids, done => {
                    done.forEach(groupid => deleteGroupElement(root, groupid));
                }).then(response => {
                    clearSelectionState(root);
                    updateSelectionActions(root);
                    showNotification(root, response.message || '', 'success');
                }).catch(error => handleActionError(root, error));
            };

            if (hasmembers) {
                openConfirmModal(root, getLabels(root).confirmdeletegroups || '', runDelete);
                return;
            }

            runDelete();
        });
    });

    root.querySelectorAll('[data-easystud-delete-selected-groupings]').forEach(deleteGroupingsButton => {
        deleteGroupingsButton.addEventListener('click', () => {
            const selectedGroupings = getSelectedItems(root, 'grouping');
            const groupingids = selectedGroupings.map(grouping => grouping.getAttribute('data-selectable-id'));
            if (!groupingids.length) {
                return;
            }

            const hasgroups = selectedGroupings.some(grouping => {
                return grouping.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length > 0;
            });
            const runDelete = () => {
                postAction({
                    courseid: courseId,
                    action: 'deletegroupings',
                    groupingids,
                }).then(response => {
                    groupingids.forEach(groupingid => deleteGroupingElement(root, groupingid));
                    clearSelectionState(root);
                    updateSelectionActions(root);
                    showNotification(root, response.message || '', 'success');
                }).catch(error => handleActionError(root, error));
            };

            if (hasgroups) {
                openConfirmModal(root, getLabels(root).confirmdeletegroupings || '', runDelete);
                return;
            }

            runDelete();
        });
    });

    root.querySelectorAll('[data-easystud-delete-selected-members]').forEach(deleteMembersButton => {
        deleteMembersButton.addEventListener('click', () => {
            const selectedMembers = getSelectedItems(root, 'member');
            if (!selectedMembers.length) {
                return;
            }
            removeMembers(root, courseId, selectedMembers).then(response => {
                clearSelectionState(root);
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
            }).catch(error => handleActionError(root, error));
        });
    });

    root.querySelectorAll('[data-easystud-remove-selected-groups-from-groupings]').forEach(removeGroupsButton => {
        removeGroupsButton.addEventListener('click', () => {
            removeGroupsFromGroupings(root, courseId, getSelectedItems(root, 'group'))
                .catch(error => handleActionError(root, error));
        });
    });
};

export const bindParticipantMessaging = root => {
    root.querySelectorAll('[data-easystud-message-selected-participants]').forEach(button => {
        button.addEventListener('click', () => {
            openParticipantMessageModal(root, getSelectedMessageUserIds(root));
        });
    });
};

export const bindDuplicateActions = (root, courseId) => {
    root.addEventListener('click', event => {
        const groupButton = event.target.closest('[data-easystud-duplicate-group]');
        if (groupButton && root.contains(groupButton)) {
            event.preventDefault();
            postAction({
                courseid: courseId,
                action: 'duplicategroup',
                groupid: groupButton.getAttribute('data-easystud-duplicate-group'),
            }).then(response => {
                if (response.group) {
                    insertGroupData(root, response.group);
                }
                showNotification(root, response.message || '', 'success');
            }).catch(error => handleActionError(root, error));
            return;
        }

        const groupingButton = event.target.closest('[data-easystud-duplicate-grouping]');
        if (groupingButton && root.contains(groupingButton)) {
            event.preventDefault();
            postAction({
                courseid: courseId,
                action: 'duplicategrouping',
                groupingid: groupingButton.getAttribute('data-easystud-duplicate-grouping'),
            }).then(response => {
                if (response.grouping) {
                    insertGroupingData(root, response.grouping);
                }
                showNotification(root, response.message || '', 'success');
            }).catch(error => handleActionError(root, error));
        }
    });
};
