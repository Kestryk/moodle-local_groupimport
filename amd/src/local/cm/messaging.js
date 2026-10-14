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
 * EasyStud course manager: Moodle message dialog for selected participants.
 *
 * @module     local_groupimport/local/cm/messaging
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import {getLabels, showNotification} from './shared';
import {relayWorkspaceTheme} from './drag_support';
import {getParticipantItemsForContext, getSelectedItems} from './selection';

const decorateNativeMessageModalNode = node => {
    if (!node) {
        return null;
    }

    node.classList.add('local-groupimport-easystud-message-modal', 'easyedu-ui', 'easyedu-message-dialog', 'is-open');
    relayWorkspaceTheme(document.getElementById('local-groupimport-easystud'), node);
    node.classList.toggle('is-loading', !node.querySelector('#bulk-message'));

    const header = node.querySelector('.modal-header');
    if (header) {
        header.classList.add('easyedu-dialog-header-palette--primary');
    }

    const dialog = node.querySelector('.modal-dialog');
    if (dialog) {
        dialog.classList.add('local-groupimport-easystud-message-modal__dialog');
    }
    const content = node.querySelector('.modal-content');
    if (content) {
        content.classList.add('local-groupimport-easystud-message-modal__content');
    }
    const textarea = node.querySelector('#bulk-message');
    if (textarea) {
        textarea.classList.add('local-groupimport-easystud-message-modal__textarea', 'easyedu-message-dialog__field');
        textarea.setAttribute('rows', '10');
        textarea.removeAttribute('data-auto-rows');
        textarea.removeAttribute('data-max-rows');
        const wrapper = textarea.closest('p, .form-group, .mb-3');
        if (wrapper) {
            wrapper.classList.add('local-groupimport-easystud-message-modal__textarea-wrap', 'easyedu-message-dialog__field-wrap');
        }
        node.classList.remove('is-loading');
        if (node.easystudMessageContentObserver) {
            node.easystudMessageContentObserver.disconnect();
            node.easystudMessageContentObserver = null;
        }
    } else {
        if (!node.easystudMessageContentObserver && typeof MutationObserver === 'function') {
            node.easystudMessageContentObserver = new MutationObserver(() => {
                if (node.querySelector('#bulk-message')) {
                    decorateNativeMessageModalNode(node);
                }
            });
            node.easystudMessageContentObserver.observe(node, {childList: true, subtree: true});
        }
    }
    node.querySelectorAll('.modal-footer button').forEach(button => {
        button.classList.add('easyedu-button');
        const isCancel = ['cancel', 'hide'].includes(button.getAttribute('data-action')) ||
            button.classList.contains('btn-secondary');
        button.classList.toggle('easyedu-button--secondary', isCancel);
    });
    if (textarea || node.getAttribute('data-easystud-message-animation-played') === '1') {
        replayNativeMessageModalAnimation(node);
    }
    return node;
};

const replayNativeMessageModalAnimation = node => {
    if (!node || node.getAttribute('data-easystud-message-animation-played') === '1') {
        return;
    }
    const dialog = node.querySelector('.local-groupimport-easystud-message-modal__dialog');
    if (!dialog) {
        return;
    }

    const play = () => {
        if (node.getAttribute('data-easystud-message-animation-played') === '1') {
            return;
        }
        node.setAttribute('data-easystud-message-animation-played', '1');
        Motion.enter(dialog, {duration: Motion.timing.slow, distance: '0.45rem'});
    };
    const playWhenVisible = () => {
        const isvisible = node.classList.contains('show') || node.getAttribute('aria-hidden') === 'false' ||
            node.offsetParent !== null;
        if (!isvisible) {
            node.addEventListener('shown.bs.modal', play, {once: true});
            return;
        }
        play();
    };
    playWhenVisible();
};

const decorateNativeMessageModal = modal => {
    if (!modal || !modal.getRoot) {
        return modal;
    }
    const root = modal.getRoot();
    const node = root && root.get ? root.get(0) : null;
    decorateNativeMessageModalNode(node);
    return modal;
};

const watchNativeMessageModal = () => {
    if (typeof MutationObserver !== 'function' || !document.body) {
        return () => {};
    }

    let observer = null;
    let timeout = null;
    const inspectNode = node => {
        if (!node || node.nodeType !== 1) {
            return;
        }

        const candidates = [];
        if (node.matches && node.matches('.modal')) {
            candidates.push(node);
        }
        if (node.closest) {
            const closestModal = node.closest('.modal');
            if (closestModal) {
                candidates.push(closestModal);
            }
        }
        if (node.querySelectorAll) {
            node.querySelectorAll('.modal').forEach(candidate => candidates.push(candidate));
        }

        Array.from(new Set(candidates)).forEach(candidate => {
            if (!candidate.classList.contains('local-groupimport-easystud-modal')) {
                decorateNativeMessageModalNode(candidate);
            }
        });
    };

    observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(inspectNode);
        });
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
    document.body.querySelectorAll('.modal.show').forEach(inspectNode);

    const stop = () => {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        if (timeout) {
            window.clearTimeout(timeout);
            timeout = null;
        }
    };
    timeout = window.setTimeout(stop, 6000);
    return stop;
};

const getUniqueParticipantIds = items => {
    const seen = new Set();
    const ids = [];
    (items || []).forEach(item => {
        const id = item ? (item.getAttribute('data-user-id') || item.getAttribute('data-easystud-member-id') || '') : '';
        if (id && !seen.has(id)) {
            seen.add(id);
            ids.push(Number(id));
        }
    });
    return ids;
};

export const getSelectedMessageUserIds = (root, contextType = '', target = null) => {
    if (contextType) {
        return getUniqueParticipantIds(getParticipantItemsForContext(root, contextType, target));
    }

    const selectedUsers = getSelectedItems(root, 'participant');
    if (selectedUsers.length) {
        return getUniqueParticipantIds(selectedUsers);
    }
    return getUniqueParticipantIds(getSelectedItems(root, 'member'));
};

export const openParticipantMessageModal = (root, userids) => {
    const ids = (userids || []).filter(Boolean);
    if (!ids.length) {
        return Promise.resolve();
    }
    if (typeof require !== 'function') {
        showNotification(root, getLabels(root).messagesendunavailable || '', 'error');
        return Promise.resolve();
    }
    const stopWatchingMessageModal = watchNativeMessageModal();
    const stopWatchingSoon = () => {
        window.setTimeout(stopWatchingMessageModal, 5000);
    };
    return new Promise((resolve, reject) => {
        require(['core_user/local/participants/bulkactions'], bulkactions => {
            if (!bulkactions || !bulkactions.showSendMessage) {
                stopWatchingSoon();
                reject(new Error(getLabels(root).messagesendunavailable || ''));
                return;
            }
            bulkactions.showSendMessage(ids)
                .then(modal => {
                    stopWatchingSoon();
                    resolve(decorateNativeMessageModal(modal));
                })
                .catch(error => {
                    stopWatchingSoon();
                    reject(error);
                });
        }, error => {
            stopWatchingSoon();
            reject(error);
        });
    }).catch(error => {
        showNotification(root, error.message || getLabels(root).messagesendunavailable || '', 'error');
    });
};
