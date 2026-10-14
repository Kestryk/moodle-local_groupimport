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
 * EasyStud course manager: Complete view list alignment and panel action overflow.
 *
 * @module     local_groupimport/local/cm/layout
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {
    structureFocusClass, participantFocusClass, panelActionOverflowClass, isResponsiveWorkspace, getLabels,
} from './shared';

const getFirstVisibleListEntry = (list, selector) => {
    if (!list) {
        return null;
    }
    return Array.from(list.querySelectorAll(selector)).find(item => !item.hidden && item.offsetParent !== null) || null;
};

const syncCompleteListAlignment = root => {
    const tree = root.querySelector('[data-easystud-tree]');
    if (!tree) {
        return;
    }

    tree.style.paddingTop = '';
    if (
        root.classList.contains(participantFocusClass) ||
        root.classList.contains(structureFocusClass) ||
        isResponsiveWorkspace()
    ) {
        return;
    }

    const participantList = root.querySelector('[data-easystud-participant-list]');
    const participantEntry = getFirstVisibleListEntry(
        participantList,
        '[data-easystud-user], [data-easystud-empty-state]'
    );
    const structureEntry = getFirstVisibleListEntry(
        tree,
        '.local-groupimport-easystud-tree__section--ungrouped, ' +
            '.local-groupimport-easystud-tree__section[data-easystud-grouping-id], ' +
            '[data-easystud-empty-state]'
    );
    if (!participantEntry || !structureEntry) {
        return;
    }

    const delta = participantEntry.getBoundingClientRect().top - structureEntry.getBoundingClientRect().top;
    if (Math.abs(delta) < 1) {
        return;
    }

    const currentPadding = parseFloat(window.getComputedStyle(tree).paddingTop) || 0;
    tree.style.paddingTop = Math.max(0, currentPadding + delta) + 'px';
};

export const scheduleCompleteListAlignment = root => {
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => syncCompleteListAlignment(root));
    });
};

// In Complete View the participant filter and the structure list are separate
// grid columns. Follow the live Motion height on every animation frame so the
// right-hand list moves with the same timing as the opening/closing filter,
// rather than jumping only when the transition has completed.
export const animateCompleteListAlignment = root => {
    if (root.easystudCompleteAlignmentFrame) {
        window.cancelAnimationFrame(root.easystudCompleteAlignmentFrame);
        root.easystudCompleteAlignmentFrame = null;
    }

    const tick = () => {
        syncCompleteListAlignment(root);
        const animating = root.querySelector(
            '.local-groupimport-easystud-advanced-filters.is-easyedu-disclosing'
        );
        if (animating) {
            root.easystudCompleteAlignmentFrame = window.requestAnimationFrame(tick);
            return;
        }
        root.easystudCompleteAlignmentFrame = null;
        syncCompleteListAlignment(root);
    };

    root.easystudCompleteAlignmentFrame = window.requestAnimationFrame(tick);
};

const ensurePanelActionOverflowControls = (root, actions) => {
    let toggle = actions.querySelector(':scope > [data-easystud-panel-actions-toggle]');
    let menu = actions.querySelector(':scope > [data-easystud-panel-actions-menu]');

    if (!toggle) {
        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'btn btn-outline-secondary btn-sm local-groupimport-easystud__panel-actions-more';
        toggle.setAttribute('data-easystud-panel-actions-toggle', '1');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', getLabels(root).moreactions || '');
        toggle.innerHTML = '<span class="local-groupimport-easystud-action-grip" aria-hidden="true"></span>';
        actions.appendChild(toggle);
    }
    if (!menu) {
        menu = document.createElement('div');
        menu.className = 'local-groupimport-easystud__panel-actions-menu';
        menu.setAttribute('data-easystud-panel-actions-menu', '1');
        menu.hidden = true;
        actions.appendChild(menu);
    }

    return {toggle, menu};
};

const getPanelActionButtons = actions => {
    return Array.from(actions.querySelectorAll(':scope > button')).filter(button => {
        return !button.matches('[data-easystud-panel-actions-toggle]');
    });
};

const cloneOverflowAction = (source, menu, toggle) => {
    const clone = source.cloneNode(true);
    clone.classList.remove(panelActionOverflowClass);
    clone.classList.remove('foundation-selection-action');
    clone.removeAttribute('id');
    clone.addEventListener('click', event => {
        event.preventDefault();
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        source.click();
    });
    menu.appendChild(clone);
};

const syncPanelActionOverflow = root => {
    root.querySelectorAll('.local-groupimport-easystud__panel-actions').forEach(actions => {
        const {toggle, menu} = ensurePanelActionOverflowControls(root, actions);
        const buttons = getPanelActionButtons(actions);
        const wasExpanded = toggle.getAttribute('aria-expanded') === 'true' && !menu.hidden;

        buttons.forEach(button => button.classList.remove(panelActionOverflowClass));
        toggle.hidden = true;
        menu.hidden = true;
        menu.innerHTML = '';

        if (!actions.offsetParent || !buttons.length) {
            return;
        }

        if (actions.scrollWidth <= actions.clientWidth + 1) {
            toggle.setAttribute('aria-expanded', 'false');
            return;
        }

        toggle.hidden = false;
        for (let index = buttons.length - 1; index >= 0 && actions.scrollWidth > actions.clientWidth + 1; index--) {
            buttons[index].classList.add(panelActionOverflowClass);
        }

        const hiddenButtons = buttons.filter(button => button.classList.contains(panelActionOverflowClass) && !button.hidden);
        hiddenButtons.forEach(button => cloneOverflowAction(button, menu, toggle));
        if (!hiddenButtons.length) {
            toggle.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
            return;
        }

        menu.hidden = !wasExpanded;
        toggle.setAttribute('aria-expanded', wasExpanded ? 'true' : 'false');
    });
};

export const schedulePanelActionOverflow = root => {
    window.requestAnimationFrame(() => syncPanelActionOverflow(root));
};
