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
 * EasyStud course manager: group and participant drag and drop.
 *
 * @module     local_groupimport/local/cm/drag_drop
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Guide from '../../guide_api';
import {
    responsiveWorkspaceQuery,
    draggingClass, dropTargetClass, structureFocusClass, participantFocusClass, requestGuideHighlightRefresh,
    formatCountMessage, formatMoveSummary, getLabels, showNotification, escapeHtml,
} from './shared';
import {hideEasyStudModal} from './modal';
import {
    removeDragPreview, setStackedDragImage, moveDragPreview, dragAutoScroll, isResponsiveDragSuppressed,
    isDragInteractiveTarget, syncResponsiveDragAvailability, getGroupingDropIdForGroup,
} from './drag_support';
import {getSelectedItems, clearSelectionState} from './selection';
import {
    emitGuidedCompletion, getActivityGuideRoot, emitTryActionsCompletion, highlightActiveTryActionsStep,
} from './guide_hooks';
import {applyFilters, updateSelectionActions} from './workspace';
import {
    handleActionError, postAction, postAddUsersInBatches,
    moveGroupElementToGrouping, copyGroupElementToGrouping, appendUsersToGroupCopies,
} from './actions';

export const bindResponsiveDragGuard = root => {
    const guard = event => {
        const card = event.target.closest('[data-easystud-user], [data-easystud-group-id]');
        if (!card || !root.contains(card)) {
            return;
        }
        if (isDragInteractiveTarget(event.target)) {
            card.setAttribute('draggable', 'false');
            return;
        }
        if (!isResponsiveDragSuppressed()) {
            return;
        }
        syncResponsiveDragAvailability(root);
        card.setAttribute('draggable', 'false');
    };

    // The drag mode follows the viewport (1024 px, pointer type): keep the classes and hints in step.
    if (window.matchMedia) {
        window.matchMedia(`(hover: none), (pointer: coarse), ${responsiveWorkspaceQuery}`).addEventListener('change',
            () => syncResponsiveDragAvailability(root));
    }
    root.addEventListener('pointerdown', guard, true);
    // The guard never cancels the touch: a passive listener lets the browser start scrolling at once.
    root.addEventListener('touchstart', guard, {capture: true, passive: true});
    root.addEventListener('focusin', guard, true);
    root.addEventListener('focusout', event => {
        if (!isDragInteractiveTarget(event.target)) {
            return;
        }
        window.requestAnimationFrame(() => syncResponsiveDragAvailability(root));
    }, true);
};

const openGroupDropModeModal = (root, oncopy, onmove) => {
    const labels = getLabels(root);
    const modal = document.createElement('div');
    modal.className = 'local-groupimport-easystud-modal easyedu-modal-layer';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML =
        '<div class="local-groupimport-easystud-modal__dialog easyedu-confirmation-dialog">' +
            '<div class="local-groupimport-easystud-modal__header easyedu-confirmation-dialog__header">' +
                '<h3 class="easyedu-modal-title">' + escapeHtml(labels.groupdropmode || '') + '</h3>' +
                '<button type="button" class="local-groupimport-easystud-modal__close" data-easystud-choice-close="1">' +
                    '<span aria-hidden="true">&times;</span>' +
                '</button>' +
            '</div>' +
            '<div class="local-groupimport-easystud-modal__body easyedu-confirmation-dialog__body">' +
                '<p class="easyedu-dialog-description">' + escapeHtml(labels.groupdropmodedesc || '') + '</p>' +
                '<div class="local-groupimport-easystud-modal__footer easyedu-confirmation-dialog__actions">' +
                    '<button type="button" class="easyedu-button easyedu-button--secondary" data-easystud-choice-copy="1">' +
                        escapeHtml(labels.groupdropcopy || '') +
                    '</button>' +
                    '<button type="button" class="easyedu-button" data-easystud-choice-move="1">' +
                        escapeHtml(labels.groupdropmove || '') +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';

    const close = () => hideEasyStudModal(modal, () => modal.remove());
    modal.addEventListener('click', event => {
        if (event.target === modal || event.target.closest('[data-easystud-choice-close]')) {
            close();
            return;
        }
        if (event.target.closest('[data-easystud-choice-copy]')) {
            close();
            oncopy();
            return;
        }
        if (event.target.closest('[data-easystud-choice-move]')) {
            close();
            onmove();
        }
    });
    root.appendChild(modal);
};

// Return selected users, defaulting to the dragged user when needed.
const getSelectedUsersForDrag = (root, draggedUser) => {
    const selected = getSelectedItems(root, 'participant');
    if (selected.indexOf(draggedUser) === -1) {
        return [draggedUser];
    }
    return selected;
};

// Return selected groups, defaulting to the dragged group when needed.
const getSelectedGroupsForDrag = (root, draggedGroup) => {
    const selected = getSelectedItems(root, 'group');
    if (selected.indexOf(draggedGroup) === -1) {
        return [draggedGroup];
    }
    return selected;
};

const isParticipantCatalogGroup = (root, group) => {
    return !!(root.classList.contains(participantFocusClass) &&
        group &&
        group.closest('.local-groupimport-easystud-participant-groups__list'));
};

// Bind group drag and drop between groupings.
export const bindGroupDragDrop = (root, courseId) => {
    let draggedGroups = [];
    let dragPreview = null;
    const labels = getLabels(root);

    const moveGroups = (groups, dropTarget, removefromorigin) => {
        const groupingid = dropTarget.getAttribute('data-easystud-grouping-drop') || '0';
        return Promise.all(groups.map(group => {
            const groupid = group.getAttribute('data-easystud-group-id');
            return postAction({
                courseid: courseId,
                action: 'movegroup',
                groupid,
                groupingid,
                removefromorigin: removefromorigin ? 1 : 0,
            }).then(response => {
                if (removefromorigin || groupingid === '0') {
                    moveGroupElementToGrouping(root, groupid, groupingid);
                } else if (!response.existing) {
                    copyGroupElementToGrouping(root, group, groupingid);
                }
                return response;
            });
        })).then(responses => {
            if (groupingid === '0') {
                return formatCountMessage(labels.groupsremovedfromgroupingscount || '', groups.length);
            }
            emitGuidedCompletion(root, 1, 'grouping');
            const added = responses.filter(response => !response.existing).length;
            const existing = responses.filter(response => response.existing).length;
            return formatMoveSummary(labels.groupsmovesummary || '', added, existing);
        });
    };

    root.addEventListener('dragstart', event => {
        if (isResponsiveDragSuppressed()) {
            event.preventDefault();
            return;
        }
        const group = event.target.closest('[data-easystud-group-id]');
        if (!group || !root.contains(group)) {
            return;
        }
        if (isParticipantCatalogGroup(root, group)) {
            event.preventDefault();
            return;
        }
        draggedGroups = getSelectedGroupsForDrag(root, group);
        root.classList.add('is-dragging-groups');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedGroups.map(item => item.getAttribute('data-easystud-group-id')).join(','));
        dragPreview = setStackedDragImage(event, draggedGroups, 'group');
        const groupsToHide = draggedGroups.slice();
        window.requestAnimationFrame(() => {
            if (draggedGroups.length) {
                groupsToHide.forEach(item => item.classList.add(draggingClass));
            }
        });
    });

    root.addEventListener('dragend', () => {
        const wasDragging = draggedGroups.length > 0;
        dragAutoScroll.stop();
        draggedGroups.forEach(item => item.classList.remove(draggingClass));
        draggedGroups = [];
        root.classList.remove('is-dragging-groups');
        removeDragPreview(dragPreview);
        dragPreview = null;
        root.querySelectorAll('.' + dropTargetClass).forEach(target => target.classList.remove(dropTargetClass));
        if (wasDragging) {
            // The Guide may have measured its next target while the dragged cards were masked.
            requestGuideHighlightRefresh(root);
        }
    });

    root.addEventListener('dragover', event => {
        moveDragPreview(dragPreview, event);
        if (draggedGroups.length) {
            dragAutoScroll.update(event);
        }
        const dropTarget = event.target.closest('[data-easystud-grouping-drop]');
        if (!draggedGroups.length || !dropTarget || !root.contains(dropTarget)) {
            return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        dropTarget.classList.add(dropTargetClass);
    });

    root.addEventListener('dragleave', event => {
        const dropTarget = event.target.closest('[data-easystud-grouping-drop]');
        if (dropTarget && !dropTarget.contains(event.relatedTarget)) {
            dropTarget.classList.remove(dropTargetClass);
        }
    });

    root.addEventListener('drop', event => {
        const dropTarget = event.target.closest('[data-easystud-grouping-drop]');
        if (!draggedGroups.length || !dropTarget || !root.contains(dropTarget)) {
            return;
        }
        event.preventDefault();
        root.classList.remove('is-dragging-groups');
        dropTarget.classList.remove(dropTargetClass);
        const groupsToMove = draggedGroups.slice();
        const targetGroupingId = dropTarget.getAttribute('data-easystud-grouping-drop') || '0';
        const groupsChangingGrouping = groupsToMove.filter(group => getGroupingDropIdForGroup(group) !== targetGroupingId);
        if (!groupsChangingGrouping.length) {
            draggedGroups.forEach(group => group.classList.remove(draggingClass));
            draggedGroups = [];
            removeDragPreview(dragPreview);
            dragPreview = null;
            return;
        }
        const hasGroupingOrigin = groupsChangingGrouping.some(group => getGroupingDropIdForGroup(group) !== '0');
        const runChangingMove = removefromorigin => moveGroups(groupsChangingGrouping, dropTarget, removefromorigin)
            .then(message => {
            clearSelectionState(root);
            updateSelectionActions(root);
            showNotification(root, message, 'success');
        }).catch(error => handleActionError(root, error));

        if (!root.classList.contains(participantFocusClass) && targetGroupingId !== '0' && hasGroupingOrigin) {
            openGroupDropModeModal(root, () => runChangingMove(false), () => runChangingMove(true));
            return;
        }

        // Groups dragged from the dedicated catalog do not represent one
        // specific origin grouping, so adding them remains non-destructive.
        // A nested group card has a concrete origin and is handled by the
        // copy-or-move modal above in every management view.
        if (root.classList.contains(structureFocusClass) && targetGroupingId !== '0') {
            runChangingMove(false);
            return;
        }

        runChangingMove(true);
    });
};

// Bind participant drag and drop into groups.
export const bindUserDragDrop = (root, courseId) => {
    let draggedUsers = [];
    let dragPreview = null;
    const labels = JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');
    const emptyGroupingDropDisabledClass = 'is-user-drop-disabled';
    const deniedDropClass = 'is-drop-denied';

    const syncEmptyGroupingDropState = enabled => {
        root.querySelectorAll('[data-easystud-grouping-id]').forEach(grouping => {
            const children = grouping.querySelector(':scope > .local-groupimport-easystud-tree__children');
            const hasgroups = !!(children && children.querySelector(':scope > [data-easystud-group-id]'));
            grouping.classList.toggle(emptyGroupingDropDisabledClass, enabled && !hasgroups);
            if (!enabled) {
                grouping.classList.remove(deniedDropClass);
            }
        });
    };

    const addUsersToGroup = (users, dropTarget) => {
        const groupid = dropTarget.getAttribute('data-easystud-user-drop');
        return postAddUsersInBatches(root, courseId, groupid, users, done => {
            appendUsersToGroupCopies(root, groupid, done, labels);
            done.forEach(user => {
                const groupids = (user.getAttribute('data-group-ids') || '').split(',').filter(Boolean);
                if (groupids.indexOf(groupid) === -1) {
                    groupids.push(groupid);
                    user.setAttribute('data-group-ids', groupids.join(','));
                }
            });
            applyFilters(root);
        });
    };

    root.addEventListener('dragstart', event => {
        if (isResponsiveDragSuppressed()) {
            event.preventDefault();
            return;
        }
        const user = event.target.closest('[data-easystud-user]');
        if (!user || !root.contains(user)) {
            return;
        }
        draggedUsers = getSelectedUsersForDrag(root, user);
        root.classList.add('is-dragging-participants');
        syncEmptyGroupingDropState(true);
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('text/plain', draggedUsers.map(item => item.getAttribute('data-user-id')).join(','));
        dragPreview = setStackedDragImage(event, draggedUsers, 'participant');
        // Guided path n°10: starting the drag is enough to learn the
        // gesture; nothing is written unless the card is dropped on a group.
        emitTryActionsCompletion(root, 'try-drag', Guide.getPathContextToken(getActivityGuideRoot(root), 'try-actions'));
        const usersToHide = draggedUsers.slice();
        window.requestAnimationFrame(() => {
            if (draggedUsers.length) {
                usersToHide.forEach(item => item.classList.add(draggingClass));
            }
        });
    });

    root.addEventListener('dragend', () => {
        const wasDragging = draggedUsers.length > 0;
        dragAutoScroll.stop();
        draggedUsers.forEach(item => item.classList.remove(draggingClass));
        draggedUsers = [];
        root.classList.remove('is-dragging-participants');
        syncEmptyGroupingDropState(false);
        removeDragPreview(dragPreview);
        dragPreview = null;
        root.querySelectorAll('.' + dropTargetClass).forEach(target => target.classList.remove(dropTargetClass));
        if (wasDragging) {
            // N°10: the drag start completed "try-drag" while the dragged cards were masked, which
            // cleared the Guide highlight. Target the active step now that they are visible again.
            highlightActiveTryActionsStep(root);
        }
    });

    root.addEventListener('dragover', event => {
        moveDragPreview(dragPreview, event);
        if (draggedUsers.length) {
            dragAutoScroll.update(event);
        }
        const dropTarget = event.target.closest('[data-easystud-user-drop]');
        // Empty groupings cannot receive participants. Feedback mirrors the
        // existing eligibility rule; it never turns them into valid targets.
        const deniedTarget = draggedUsers.length && !dropTarget ?
            event.target.closest('[data-easystud-grouping-id].' + emptyGroupingDropDisabledClass) : null;
        root.querySelectorAll('.' + deniedDropClass).forEach(target => {
            if (target !== deniedTarget) {
                target.classList.remove(deniedDropClass);
            }
        });
        if (deniedTarget && root.contains(deniedTarget)) {
            deniedTarget.classList.add(deniedDropClass);
            event.dataTransfer.dropEffect = 'none';
            return;
        }
        if (!draggedUsers.length || !dropTarget || !root.contains(dropTarget)) {
            return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        dropTarget.classList.add(dropTargetClass);
    });

    root.addEventListener('dragleave', event => {
        const dropTarget = event.target.closest('[data-easystud-user-drop]');
        const deniedTarget = event.target.closest('.' + deniedDropClass);
        if (deniedTarget && !deniedTarget.contains(event.relatedTarget)) {
            deniedTarget.classList.remove(deniedDropClass);
        }
        if (dropTarget && !dropTarget.contains(event.relatedTarget)) {
            dropTarget.classList.remove(dropTargetClass);
        }
    });

    root.addEventListener('drop', event => {
        const dropTarget = event.target.closest('[data-easystud-user-drop]');
        if (!draggedUsers.length || !dropTarget || !root.contains(dropTarget)) {
            return;
        }
        event.preventDefault();
        root.classList.remove('is-dragging-participants');
        syncEmptyGroupingDropState(false);
        dropTarget.classList.remove(dropTargetClass);
        const tryActionsToken = Guide.getPathContextToken(getActivityGuideRoot(root), 'try-actions');
        addUsersToGroup(draggedUsers, dropTarget).then(response => {
            clearSelectionState(root);
            updateSelectionActions(root);
            showNotification(root, response.message || '', 'success');
            emitGuidedCompletion(root, 1);
            emitTryActionsCompletion(root, 'try-drag', tryActionsToken);
            highlightActiveTryActionsStep(root);
        }).catch(() => {
            showNotification(root, labels.ajaxerror || '', 'error');
        });
    });
};
