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
 * EasyStud course manager: move dialog.
 *
 * @module     local_groupimport/local/cm/move_modal
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Log from 'core/log';
import * as Motion from '../../motion';
import {enhanceSelect} from '../../searchable_choices';
import {snapshotMemberPairs} from '../../member_selection';
import {sortGroupIds} from '../sm/groups';
import {formatCountMessage, formatMoveSummary, showNotification} from './shared';
import {getOnDemandModel} from './state';
import {showEasyStudModal, hideEasyStudModal, bindCardModalKeyboard} from './modal';
import {
    getGroupElementsById, groupExists, isGuidePathOpen, getGroupsWithGroupingMembership,
    rehydrateParticipantMembershipDetails,
} from './cards';
import {getSelectedItems, clearSelectionState} from './selection';
import {
    emitGuidedCompletion, emitNativePathCompletion, emitPracticeCompletion, emitMemberPathCompletion,
    captureActivityGroupingConfirmation, commitActivityGroupingConfirmation,
    captureTryActionsMoveToken, emitTryActionsMoveCompletion,
} from './guide_hooks';
import {syncGroupMembersState} from './group_cards';
import {applyFilters, updateSelectionActions, scheduleOnDemandStateRefresh} from './workspace';
import {
    handleActionError, postAction, postAddUsersInBatches,
    moveGroupElementToGrouping, copyGroupElementToGrouping, appendUsersToGroupCopies,
} from './actions';

export const bindMoveModal = (root, courseId) => {
    const modal = root.querySelector('[data-easystud-move-modal]');
    const openParticipants = root.querySelectorAll('[data-easystud-move-selected-participants]');
    const openGroups = root.querySelectorAll('[data-easystud-move-selected-groups]');
    const openMembers = root.querySelectorAll('[data-easystud-move-selected-members]');
    const closeButtons = root.querySelectorAll('[data-easystud-close-move-modal]');
    const confirmButton = root.querySelector('[data-easystud-confirm-move]');
    const destination = root.querySelector('[data-easystud-move-destination]');
    const removeOriginWrap = root.querySelector('[data-easystud-move-origin-wrap]');
    const removeOrigin = root.querySelector('[data-easystud-move-remove-origin]');
    const originLabel = removeOriginWrap?.querySelector('[data-easystud-move-origin-label]');
    const help = root.querySelector('[data-easystud-move-modal-help]');
    const label = root.querySelector('[data-easystud-move-modal-label]');
    const emptyState = root.querySelector('[data-easystud-move-empty]');
    const body = modal ? modal.querySelector('.local-groupimport-easystud-modal__body') : null;
    const labels = JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');

    if (!modal || !confirmButton || !destination || !help || !label || !body) {
        return;
    }

    // Progress reads must neither block the interface nor refresh the full course state.
    const readProgress = jobid => fetch(M.cfg.wwwroot + '/local/groupimport/ajax.php', {
        method: 'POST', credentials: 'same-origin',
        headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
        body: new URLSearchParams({courseid: courseId, action: 'movestatus', jobid: jobid || 0, sesskey: M.cfg.sesskey}),
    }).then(response => response.json()).then(response => {
        if (!response.success) {
            const failureMessage = response.error || labels.ajaxerror || '';
throw new Error(failureMessage);
        }
        return response;
    });
    const watches = new Map();
    const monitor = job => {
        if (watches.has(job.id)) {
            return;
        }
        const container = root.querySelector('[data-easystud-notifications]');
        const note = document.createElement('aside');
        note.className = 'easyedu-notice';
        note.setAttribute('role', 'status');
        note.setAttribute('data-easystud-move-job', String(job.id));
        container?.appendChild(note);
        let timer;
        const update = state => {
            note.textContent = state.message;
            if (state.status === 'completed' || state.status === 'cancelled') {
                watches.delete(job.id);
                note.classList.toggle('easyedu-notice--success', state.status === 'completed');
                if (state.status === 'completed') {
                    scheduleOnDemandStateRefresh(root);
                    emitMemberPathCompletion(root, 'confirm-member-move');
                }
                return;
            }
            note.classList.toggle('easyedu-notice--warning', state.status === 'retry');
            timer = window.setTimeout(() => {
                if (!root.isConnected) {
                    watches.delete(job.id);
                    return;
                }
                readProgress(job.id).then(response => {
                    if (response.jobs[0]) {
                        update(response.jobs[0]);
                    } else {
                        note.remove();
                        watches.delete(job.id);
                    }
                    return response;
                }).catch(error => {
                    // Retain the last confirmed progress; a visible page can retry after a network interruption.
                    note.textContent = error.message || labels.ajaxerror || '';
                    timer = window.setTimeout(() => update(state), 10000);
                });
            }, 3000);
        };
        watches.set(job.id, () => window.clearTimeout(timer));
        update(job);
    };
    // Restore running jobs after a page visit, without ever repeating the mutation.
    // K20-09: this passive read changes nothing, so a failure must never raise the
    // "your changes may not have been saved" banner on page load; log it and keep the page usable.
    readProgress().then(response => {
        (response.jobs || []).forEach(monitor);
        return response;
    }).catch(error => Log.debug('local_groupimport: move progress restore unavailable: ' + (error?.message || '')));

    let contextType = '';
    let memberSnapshot = [];
    let memberBusy = false;
    let returnFocus = null;
    // Guided path n°10, compact variant (C2-15-02): the Guide session in which this dialog opened.
    let tryActionsToken = null;
    const chooserLabels = () => ({
        label: label.textContent,
        search: labels.searchdestination || labels.searchgroupslabel || '',
        empty: labels.noresultsfiltered || '',
    });
    const chooser = enhanceSelect(destination, chooserLabels(), {motion: Motion});
    const title = modal.querySelector('.easyedu-modal-title');
    const moveTitle = title?.textContent || '';

    const closeModal = () => {
        // Cancel cannot undo an atomic command already in flight.
        if (memberBusy) {
            return Promise.resolve(false);
        }
        chooser.close();
        return hideEasyStudModal(modal, () => {
            contextType = '';
            modal.removeAttribute('data-easystud-move-context');
            memberSnapshot = [];
            if (returnFocus?.isConnected && returnFocus.getClientRects().length) {
                returnFocus.focus({preventScroll: true});
            }
            returnFocus = null;
        });
    };
    root.easystudCloseMoveDialog = closeModal;
    const focusMoveModal = bindCardModalKeyboard(modal, closeModal);

    const setMemberBusy = busy => {
        memberBusy = busy;
        modal.setAttribute('aria-busy', String(busy));
        closeButtons.forEach(button => {
            button.disabled = busy;
        });
        destination.disabled = busy;
        if (removeOrigin) {
            removeOrigin.disabled = busy;
        }
        chooser.refresh(chooserLabels());
        confirmButton.disabled = busy || !destination.options.length;
    };

    const buildOptions = type => {
        destination.innerHTML = '';
        let hasDestination = false;

        if (type === 'participant' || type === 'member') {
            const seen = new Set();
            const model = getOnDemandModel(root);
            // List every group from the state in the order of the Structure catalog: only one page is
            // rendered. No participant or member can be selected before the state has loaded.
            const structureList = root.querySelector('.local-groupimport-easystud-structure-groups__list');
            const entries = model ?
                sortGroupIds(model, model.raw.groups.map(group => group.id),
                    (structureList && structureList.getAttribute('data-easystud-sort')) || 'alpha')
                    .map(groupid => ({value: String(groupid), name: model.groups.get(groupid).name})) : [];
            // Moving members into the only group they come from would change nothing.
            const sources = type === 'member' ? new Set(memberSnapshot.map(pair => String(pair.groupid))) : new Set();
            const sourceOnly = sources.size === 1 ? Array.from(sources)[0] : null;
            entries.forEach(({value, name}) => {
                if (!value || seen.has(value) || value === sourceOnly) {
                    return;
                }
                seen.add(value);
                const option = document.createElement('option');
                option.value = value;
                option.textContent = name;
                destination.appendChild(option);
                hasDestination = true;
            });
            return hasDestination;
        }

        const seen = new Set();
        root.querySelectorAll('[data-easystud-grouping-id]').forEach(grouping => {
            const value = grouping.getAttribute('data-easystud-grouping-id') || '';
            if (!value || seen.has(value)) {
                return;
            }
            seen.add(value);
            const option = document.createElement('option');
            option.value = value;
            const name = grouping.querySelector('.local-groupimport-easystud-grouping__name');
            option.textContent = name ? name.textContent.trim() : '';
            destination.appendChild(option);
            hasDestination = true;
        });

        if (hasDestination && !isGuidePathOpen('prepare-activity-grouping')) {
            const ungrouped = root.querySelector(
                '.local-groupimport-easystud-tree__section--ungrouped .local-groupimport-easystud-tree__toggle');
            const ungroupedOption = document.createElement('option');
            ungroupedOption.value = '0';
            ungroupedOption.textContent = ungrouped ? ungrouped.textContent.trim() : (labels.groupswithoutgrouping || '');
            destination.insertBefore(ungroupedOption, destination.firstChild);
        }

        return hasDestination;
    };

    const openModal = (type, members = [], opener = document.activeElement) => {
        if (memberBusy) {
            return;
        }
        if (type === 'member') {
            try {
                memberSnapshot = snapshotMemberPairs(root, members);
            } catch (error) {
                // Never fail silently: tell the user the selection could not be used.
                memberSnapshot = [];
                showNotification(root, labels.ajaxerror || (error && error.message) || 'Invalid selected membership.', 'danger');
                return;
            }
            if (!memberSnapshot.length) {
                return;
            }
        }
        returnFocus = opener;
        tryActionsToken = type === 'participant' ? captureTryActionsMoveToken(root) : null;
        contextType = type;
        // One dialog serves three different native commands. Guide targets
        // must identify the opened context, not infer it from shared geometry.
        modal.setAttribute('data-easystud-move-context', type);
        const resolveMoveSelectionCount = () => {
            if (type === 'member') {
                return memberSnapshot.length;
            }
            if (type === 'participant') {
                return getSelectedItems(root, 'participant').length;
            }
            return getSelectedItems(root, 'group').length;
        };
        const selectedCount = resolveMoveSelectionCount();
        const resolveMoveHelpKey = () => {
            if (type === 'member') {
                return 'data-move-members-help';
            }
            if (type === 'participant') {
                return 'data-move-participants-help';
            }
            return 'data-move-groups-help';
        };
        help.textContent = body.getAttribute(resolveMoveHelpKey()) || '';
        label.textContent = body.getAttribute(type === 'participant' || type === 'member' ?
            'data-move-participants-label' : 'data-move-groups-label') || '';
        if (title) {
 title.textContent = type === 'participant' ? (labels.addparticipanttitle || moveTitle) : moveTitle;
}
        const resolveMoveConfirmLabel = () => {
            if (type === 'participant') {
                return labels.addparticipantconfirm || '';
            }
            if (selectedCount === 1) {
                return labels.moveconfirmone || '';
            }
            return labels.moveconfirmmany || '';
        };
        confirmButton.textContent = resolveMoveConfirmLabel();
        if (removeOriginWrap) {
            const selectedGroups = type === 'group' ? getSelectedItems(root, 'group') : [];
            removeOriginWrap.hidden = type !== 'member' &&
                (type !== 'group' || getGroupsWithGroupingMembership(root, selectedGroups).length === 0);
            if (originLabel) {
                originLabel.textContent = type === 'member' ? (labels.movememberskeeporigin || '') :
                    (labels.movegroupremoveorigin || '');
            }
        }
        if (removeOrigin) {
            removeOrigin.checked = false;
        }
        const hasDestination = buildOptions(type);
        chooser.refresh(chooserLabels());
        chooser.host.hidden = !hasDestination;
        confirmButton.disabled = !hasDestination;
        // The native select remains the authoritative value/no-JS fallback.
        destination.hidden = true;
        label.hidden = !hasDestination;
        if (emptyState) {
            emptyState.hidden = hasDestination;
            emptyState.textContent = type === 'participant' || type === 'member' ?
                (labels.nomovegroupsavailable || '') :
                (labels.nomovegroupingsavailable || '');
        }
        showEasyStudModal(modal);
        focusMoveModal();
        if (type === 'participant' && selectedCount > 0 && hasDestination) {
            emitPracticeCompletion(root, 'open-move');
        }
        if (type === 'member' && selectedCount > 0 && hasDestination) {
            emitMemberPathCompletion(root, 'open-member-move');
        }
        if (hasDestination) {
            emitDestinationSteps();
            chooser.trigger.focus();
        } else if (emptyState) {
            emptyState.focus();
        }
    };

    openParticipants.forEach(button => button.addEventListener('click', () => openModal('participant')));

    // The destination steps of the guided paths: on change, and for the destination the dialog
    // preselects (it counts as chosen when it is valid).
    const emitDestinationSteps = () => {
        if (contextType === 'group' && /^[1-9]\d*$/.test(destination.value) &&
                getSelectedItems(root, 'group').length &&
                Array.from(root.querySelectorAll('[data-easystud-grouping-id]'))
                    .some(grouping => grouping.getAttribute('data-easystud-grouping-id') === destination.value)) {
            emitNativePathCompletion(root, 'prepare-activity-grouping', 'choose-grouping');
        }
        if (contextType === 'participant' && destination.value && groupExists(root, destination.value)) {
            emitPracticeCompletion(root, 'choose-destination');
        }
        if (contextType === 'member' && destination.value && groupExists(root, destination.value) &&
                memberSnapshot.some(pair => pair.groupid !== destination.value)) {
            emitMemberPathCompletion(root, 'choose-member-destination');
        }
    };
    destination.addEventListener('change', emitDestinationSteps);

    openGroups.forEach(button => button.addEventListener('click', () => openModal('group')));

    openMembers.forEach(button => button.addEventListener('click', () => {
        // Mobile actions forward a click to a hidden desktop source; retain the real focused trigger.
        openModal('member', getSelectedItems(root, 'member'),
            document.activeElement === document.body ? button : document.activeElement);
    }));
    root.addEventListener('easystud:move-members', event => {
        openModal('member', event.detail?.members || [], event.detail?.opener);
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeModal();
        }
    });

    confirmButton.addEventListener('click', () => {
        const value = destination.value;
        if (!contextType || !value) {
            return;
        }

        // SM-11 member transfer begin. One immutable selection, one native transaction.
        if (contextType === 'member') {
            if (memberBusy || !memberSnapshot.length || !groupExists(root, value)) {
                return;
            }
            const pairs = memberSnapshot;
            const keepOrigin = Boolean(removeOrigin && removeOrigin.checked);
            const users = [...new Map(pairs.map(pair => [pair.userid, {
                id: pair.userid, fullname: pair.fullname,
            }])).values()];
            const payload = {
                courseid: courseId,
                action: 'movemembers',
                destinationid: value,
                groupids: pairs.map(pair => pair.groupid),
                userids: pairs.map(pair => pair.userid),
            };
            if (!keepOrigin) {
                // One JSON field avoids PHP max_input_vars truncating a large immutable selection.
                payload.membersjson = JSON.stringify(pairs.map(pair => ({groupid: pair.groupid, userid: pair.userid})));
                payload.requestid = Array.from(window.crypto.getRandomValues(new Uint32Array(4)),
                    part => part.toString(16).padStart(8, '0')).join('-');
                delete payload.groupids;
                delete payload.userids;
            }
            chooser.close();
            setMemberBusy(true);
            // Copying uses bounded requests; large moves use a resumable native task instead of optimistic DOM changes.
            (keepOrigin ?
                postAddUsersInBatches(root, courseId, value, users, done => appendUsersToGroupCopies(root, value, done, labels)) :
                postAction(payload)
            ).then(response => {
                if (response.background) {
                    setMemberBusy(false);
                    closeModal();
                    clearSelectionState(root);
                    updateSelectionActions(root);
                    monitor(response.job);
                    return response;
                }
                if (!keepOrigin) {
                    appendUsersToGroupCopies(root, value, users, labels, pairs.filter(pair => pair.groupid !== value));
                }
                pairs.forEach(pair => {
                    if (keepOrigin || pair.groupid === value) {
                        return;
                    }
                    getGroupElementsById(root, pair.groupid).forEach(group => {
                        group.querySelectorAll('[data-easystud-member-id="' + pair.userid + '"]').forEach(member => {
                            member.remove();
                        });
                        syncGroupMembersState(group, labels);
                    });
                });
                rehydrateParticipantMembershipDetails(root);
                applyFilters(root);
                setMemberBusy(false);
                closeModal();
                clearSelectionState(root);
                updateSelectionActions(root);
                const message = keepOrigin ?
                    formatMoveSummary(labels.memberscopiedsummary, response.added, response.existing) : response.message;
                showNotification(root, message || '', 'success');
                emitMemberPathCompletion(root, 'confirm-member-move');
                return response;
            }).catch(error => {
                setMemberBusy(false);
                handleActionError(root, error);
            });
            return;
        }
        // SM-11 member transfer end. Existing Participant/Group commands below are preserved.

        if (contextType === 'participant') {
            const users = getSelectedItems(root, 'participant');
            if (!users.length || !groupExists(root, value)) {
                return;
            }
            const moveToken = tryActionsToken;

            postAddUsersInBatches(root, courseId, value, users, done => {
                appendUsersToGroupCopies(root, value, done, labels);
                done.forEach(user => {
                    const groupids = (user.getAttribute('data-group-ids') || '').split(',').filter(Boolean);
                    if (groupids.indexOf(value) === -1) {
                        groupids.push(value);
                        user.setAttribute('data-group-ids', groupids.join(','));
                    }
                });
                applyFilters(root);
            }).then(response => {
                closeModal();
                clearSelectionState(root);
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
                emitGuidedCompletion(root, 1);
                emitPracticeCompletion(root, 'confirm-move');
                emitTryActionsMoveCompletion(root, moveToken);

return;
}).catch(error => handleActionError(root, error));
            return;
        }

        const groups = getSelectedItems(root, 'group');
        if (!groups.length) {
            return;
        }

        const activityEvidence = captureActivityGroupingConfirmation(root, value, groups);
        Promise.all(groups.map(group => {
            const groupid = group.getAttribute('data-easystud-group-id');
            return postAction({
                courseid: courseId,
                action: 'movegroup',
                groupid,
                groupingid: value,
                removefromorigin: removeOrigin && removeOrigin.checked ? 1 : 0,
            }).then(response => {
                if ((removeOrigin && removeOrigin.checked) || value === '0') {
                    moveGroupElementToGrouping(root, groupid, value);
                } else if (!response.existing) {
                    copyGroupElementToGrouping(root, group, value);
                }
                return response;
            });
        })).then(responses => {
            closeModal();
            clearSelectionState(root);
            updateSelectionActions(root);
            if (value === '0') {
                showNotification(root, formatCountMessage(labels.groupsremovedfromgroupingscount, groups.length), 'success');
                return;
            }
            const added = responses.filter(response => !response.existing).length;
            const existing = responses.filter(response => response.existing).length;
            showNotification(root, formatMoveSummary(labels.groupsmovesummary || '', added, existing), 'success');
            commitActivityGroupingConfirmation(root, activityEvidence, responses);
            emitGuidedCompletion(root, 1, 'grouping');

return;
}).catch(error => handleActionError(root, error));
    });
};
