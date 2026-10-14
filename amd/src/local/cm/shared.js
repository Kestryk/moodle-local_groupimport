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
 * EasyStud course manager: shared constants and small helpers (labels, text, notifications).
 *
 * @module     local_groupimport/local/cm/shared
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import {countLabel} from '../sm/index';

export const selectedClass = 'is-selected';
export const disabledSelectionClass = 'is-selection-disabled';
export const draggingClass = 'is-dragging';
export const dropTargetClass = 'is-drop-target';
export const compactClass = 'local-groupimport-easystud--compact-users';
export const structureFocusClass = 'local-groupimport-easystud--structure-focus';
export const participantFocusClass = 'local-groupimport-easystud--participant-focus';
export const hoverPopoverClass = 'local-groupimport-easystud-hover-popover';
export const panelActionOverflowClass = 'local-groupimport-easystud__panel-action--overflow-hidden';
const guideRefreshEvent = 'easyedu:guide-refresh-highlight';
export const responsiveWorkspaceQuery = '(max-width: 1024px)';
export const filterChoiceControllers = new WeakMap();

export const isResponsiveWorkspace = () => {
    return !!(window.matchMedia && window.matchMedia(responsiveWorkspaceQuery).matches);
};

// The Guide only accepts a refresh addressed to its own root, never to the EasyStud
// workspace that contains it (or that it was portalled out of on compact screens).
export const requestGuideHighlightRefresh = (root, options = {}) => {
    if (!root) {
        return;
    }

    if (root.easystudGuideRefreshTimers) {
        root.easystudGuideRefreshTimers.forEach(timer => window.clearTimeout(timer));
    }

    const guideRoot = options.root || root.easystudGuideOwner || root.querySelector('[data-easyedu-guide-root]');
    if (!guideRoot) {
        root.easystudGuideRefreshTimers = [];
        return;
    }
    const detail = Object.assign({dock: true}, options, {root: guideRoot});
    root.easystudGuideRefreshTimers = [0, Motion.timing.slow + 20].map(delay => window.setTimeout(() => {
        // Without a target, a refresh only repositions the cue already painted. With no
        // current target the Guide could only clear, which would also cancel a step
        // highlight it has just queued.
        if (!detail.target && !guideRoot.easyeduGuideCurrentTarget) {
            return;
        }
        document.dispatchEvent(new CustomEvent(guideRefreshEvent, {detail}));
    }, delay));
};

export const onReady = callback => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, {once: true});
        return;
    }
    callback();
};

export const runSafely = callback => {
    try {
        callback();
    } catch (error) {
        if (window.console && window.console.error) {
            window.console.error('EasyStud initialisation step failed.', error);
        }
    }
};

// Normalise text for filtering.
export const normalise = value => (value || '').toString().toLowerCase();

export const formatCountMessage = (template, count) => {
    return countLabel(template, count)
        .replace('{}', count);
};

export const formatMoveSummary = (template, added, existing) => {
    return (template || '')
        .replace('__added__', added)
        .replace('__existing__', existing);
};

export const getLabels = root => JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');

export const showNotification = (root, message, type) => {
    const container = root.querySelector('[data-easystud-notifications]');
    if (!message) {
        return;
    }

    const toasttype = type === 'error' ? 'danger' : (type || 'success');
    const showFallback = () => {
        if (!container) {
            return;
        }

        const note = document.createElement('div');
        note.className = 'alert alert-' + toasttype + ' local-groupimport-easystud__notification';
        note.setAttribute('role', 'status');
        note.textContent = message;
        container.appendChild(note);

        window.setTimeout(() => {
            note.classList.add('is-leaving');
            window.setTimeout(() => note.remove(), 220);
        }, 3200);
    };

    if (typeof require === 'function') {
        try {
            require(['core/toast'], toast => {
                toast.add(message, {
                    type: toasttype,
                    delay: 4000,
                });
            }, showFallback);
            return;
        } catch (error) {
            showFallback();
            return;
        }
    }

    showFallback();
};

export const getSelectionInput = item => item.querySelector(':scope > .local-groupimport-easystud-selector [data-easystud-selector-input]');

export const areSelectionTypesCompatible = (activetype, type) => {
    return !activetype || activetype === type;
};
