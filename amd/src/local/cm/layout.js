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

import * as Motion from '../../motion';
import {
    structureFocusClass, participantFocusClass, panelActionOverflowClass, isResponsiveWorkspace, getLabels,
} from './shared';

const getFirstVisibleListEntry = (list, selector) => {
    if (!list) {
        return null;
    }
    return Array.from(list.querySelectorAll(selector)).find(item => !item.hidden && item.offsetParent !== null) || null;
};

// Below this layout width (container, not viewport) the two lists keep the historical alignment:
// the structure tree is pushed down to meet the first participant card.
const completeBarAlignmentMinWidth = 1400;

const getFirstVisibleBar = list => {
    return getFirstVisibleListEntry(list, ':scope > [data-easystud-pagination="top"]');
};

const clearCompleteListAlignment = (tree, participantList, bars) => {
    tree.style.paddingTop = '';
    participantList.style.marginTop = '';
    bars.forEach(bar => {
        bar.style.marginBottom = '';
    });
};

const syncCompleteListAlignment = root => {
    const tree = root.querySelector('[data-easystud-tree]');
    const participantList = root.querySelector('[data-easystud-participant-list]');
    if (!tree || !participantList) {
        return;
    }

    const treeGroupings = tree.querySelector('.local-groupimport-easystud-tree__groupings');
    const participantBar = getFirstVisibleBar(participantList);
    const structureBar = getFirstVisibleBar(tree) || getFirstVisibleBar(treeGroupings);

    // Write phase 0: drop the previous offsets so every position below is the natural one.
    clearCompleteListAlignment(tree, participantList, [participantBar, structureBar].filter(Boolean));
    if (
        root.classList.contains(participantFocusClass) ||
        root.classList.contains(structureFocusClass) ||
        isResponsiveWorkspace()
    ) {
        return;
    }

    // Read phase: one layout pass, no writes in between.
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

    const layout = root.querySelector('.local-groupimport-easystud__layout');
    const wide = !!layout && layout.clientWidth >= completeBarAlignmentMinWidth;
    const participantEntryTop = participantEntry.getBoundingClientRect().top;
    const structureEntryTop = structureEntry.getBoundingClientRect().top;
    const alignBars = wide && !!participantBar && !!structureBar;
    const participantBarTop = alignBars ? participantBar.getBoundingClientRect().top : 0;
    const structureBarTop = alignBars ? structureBar.getBoundingClientRect().top : 0;
    const treePadding = parseFloat(window.getComputedStyle(tree).paddingTop) || 0;
    const listMargin = parseFloat(window.getComputedStyle(participantList).marginTop) || 0;
    const participantBarMargin = alignBars ? (parseFloat(window.getComputedStyle(participantBar).marginBottom) || 0) : 0;
    const structureBarMargin = alignBars ? (parseFloat(window.getComputedStyle(structureBar).marginBottom) || 0) : 0;

    // Compute: shift the lower column's lead-in so that the bars share one row, then
    // balance the bar-to-first-entry gap so the first card and the first section also match.
    let treeShift = 0;
    let listShift = 0;
    let participantGap = 0;
    let structureGap = 0;
    if (alignBars) {
        const barDelta = participantBarTop - structureBarTop;
        treeShift = Math.max(0, barDelta);
        listShift = Math.max(0, -barDelta);
        const gapDelta = (participantEntryTop - participantBarTop) - (structureEntryTop - structureBarTop);
        structureGap = Math.max(0, gapDelta);
        participantGap = Math.max(0, -gapDelta);
    } else {
        const delta = participantEntryTop - structureEntryTop;
        treeShift = Math.max(0, delta);
        listShift = Math.max(0, -delta);
    }

    // Write phase.
    if (treeShift >= 1) {
        tree.style.paddingTop = (treePadding + treeShift) + 'px';
    }
    if (listShift >= 1) {
        participantList.style.marginTop = (listMargin + listShift) + 'px';
    }
    if (structureGap >= 1) {
        structureBar.style.marginBottom = (structureBarMargin + structureGap) + 'px';
    }
    if (participantGap >= 1) {
        participantBar.style.marginBottom = (participantBarMargin + participantGap) + 'px';
    }

    // Margins that collapsed before the offsets existed can leave a small residue: verify once,
    // fold the bar remainder into the outer offsets and the gap remainder into the bar margins.
    if (alignBars) {
        const barResidue = participantBar.getBoundingClientRect().top - structureBar.getBoundingClientRect().top;
        const entryResidue = participantEntry.getBoundingClientRect().top - structureEntry.getBoundingClientRect().top;
        const gapResidue = entryResidue - barResidue;
        if (Math.abs(barResidue) >= 1) {
            if (barResidue > 0) {
                tree.style.paddingTop = (parseFloat(tree.style.paddingTop) || treePadding) + barResidue + 'px';
            } else {
                participantList.style.marginTop = (parseFloat(participantList.style.marginTop) || listMargin) - barResidue + 'px';
            }
        }
        if (Math.abs(gapResidue) >= 1) {
            if (gapResidue > 0) {
                structureBar.style.marginBottom =
                    (parseFloat(structureBar.style.marginBottom) || structureBarMargin) + gapResidue + 'px';
            } else {
                participantBar.style.marginBottom =
                    (parseFloat(participantBar.style.marginBottom) || participantBarMargin) - gapResidue + 'px';
            }
        }
    }
};

// Re-align on anything that changes the geometry of the lead-in without a dedicated call site:
// window/container resize, filter panels opening or closing, creation row changing height.
const observeCompleteListAlignment = root => {
    if (root.easystudCompleteAlignmentObserved || typeof window.ResizeObserver === 'undefined') {
        return;
    }
    root.easystudCompleteAlignmentObserved = true;
    const observer = new window.ResizeObserver(() => scheduleCompleteListAlignment(root));
    [
        '.local-groupimport-easystud__layout',
        '.local-groupimport-easystud-create-row',
        '[data-easystud-filters]',
    ].forEach(selector => {
        const node = root.querySelector(selector);
        if (node) {
            observer.observe(node);
        }
    });
};

// One frame is enough: the callers run after their own DOM change, and several calls in the
// same frame collapse into a single read/write pass.
export const scheduleCompleteListAlignment = root => {
    observeCompleteListAlignment(root);
    if (root.easystudCompleteAlignmentQueued) {
        return;
    }
    root.easystudCompleteAlignmentQueued = true;
    window.requestAnimationFrame(() => {
        root.easystudCompleteAlignmentQueued = false;
        syncCompleteListAlignment(root);
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
        toggle.className = 'local-groupimport-easystud__panel-actions-more';
        toggle.setAttribute('data-easystud-panel-actions-toggle', '1');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', getLabels(root).moreactions || '');
        toggle.innerHTML = '<span class="fa fa-ellipsis" aria-hidden="true"></span>';
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
        Motion.hideMenu(menu, {anchor: toggle});
        toggle.setAttribute('aria-expanded', 'false');
        source.click();
    });
    menu.appendChild(clone);
};

/**
 * Visible content of every panel action bar (visible buttons plus the overflow toggle).
 *
 * @param {HTMLElement} root EasyStud root.
 * @returns {Map<HTMLElement, String>}
 */
export const snapshotPanelActions = root => {
    const snapshot = new Map();
    root.querySelectorAll('.local-groupimport-easystud__panel-actions').forEach(actions => {
        const visible = Array.from(actions.children).filter(child => child.offsetParent !== null);
        snapshot.set(actions, visible.map(child => child.textContent.trim()).join('|'));
    });
    return snapshot;
};

/**
 * Fade in the action bars whose content changed since the snapshot (one soft arrival together
 * with the layout swap; bars that did not change stay still).
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {Map<HTMLElement, String>} before Snapshot taken before the mutation.
 */
export const revealChangedPanelActions = (root, before) => {
    const after = snapshotPanelActions(root);
    after.forEach((signature, actions) => {
        if (signature && signature !== before.get(actions)) {
            Motion.reveal(actions);
        }
    });
};

/**
 * Give each column of the two focus views its own action bar (K16-69).
 *
 * The focus views use the Complete view's panel heading for every column: title, count badge
 * and the actions of that column. The existing buttons are moved, never copied, so their
 * listeners and every selector that reads them keep working. They return to their panel bar
 * in the Complete view and in the responsive workspace.
 *
 * @param {HTMLElement} root EasyStud root.
 */
export const placeColumnActions = root => {
    const responsive = isResponsiveWorkspace();
    const focus = {
        participants: !responsive && root.classList.contains(participantFocusClass),
        structure: !responsive && root.classList.contains(structureFocusClass),
    };
    const homeSelector = '.local-groupimport-easystud__panel-heading > .local-groupimport-easystud__panel-actions';
    root.querySelectorAll(homeSelector).forEach(home => {
        if (!home.easystudColumnActions) {
            home.easystudColumnActions = Array.from(home.querySelectorAll(':scope > [data-easystud-column-action]'));
        }
        const panel = home.closest('[data-easystud-participants-panel], [data-easystud-structure-panel]');
        const active = !!panel && (panel.hasAttribute('data-easystud-participants-panel') ?
            focus.participants : focus.structure);
        const placements = home.easystudColumnActions.map(button => {
            const column = button.getAttribute('data-easystud-column-action');
            const slot = active ? panel.querySelector(`[data-easystud-column-actions="${column}"]`) : null;
            return [button, slot || home];
        });
        if (placements.every(([button, target]) => button.parentElement === target)) {
            return;
        }
        // Re-insert in the original order, always before the bar's own overflow toggle.
        const focused = document.activeElement;
        placements.forEach(([button, target]) => {
            target.insertBefore(button, target.querySelector(':scope > [data-easystud-panel-actions-toggle]'));
        });
        if (focused && focused !== document.activeElement && placements.some(([button]) => button === focused)) {
            focused.focus({preventScroll: true});
        }
    });
};

export const syncPanelActionOverflow = root => {
    placeColumnActions(root);
    // P1: reset every panel, measure them all, then move the overflowing buttons one step at a time for all
    // the panels together: one style recalculation per step instead of one per panel and per moved button.
    const entries = Array.from(root.querySelectorAll('.local-groupimport-easystud__panel-actions')).map(actions => {
        const {toggle, menu} = ensurePanelActionOverflowControls(root, actions);
        const buttons = getPanelActionButtons(actions);
        const wasExpanded = toggle.getAttribute('aria-expanded') === 'true' && !menu.hidden;

        buttons.forEach(button => button.classList.remove(panelActionOverflowClass));
        toggle.hidden = true;
        menu.hidden = true;
        menu.innerHTML = '';
        return {actions, toggle, menu, buttons, wasExpanded};
    });
    const overflows = entry => entry.index >= 0 && entry.actions.scrollWidth > entry.actions.clientWidth + 1;
    // Reads only.
    entries.forEach(entry => {
        entry.index = entry.buttons.length - 1;
        entry.measured = !!entry.actions.offsetParent && entry.buttons.length > 0;
        entry.overflows = entry.measured && overflows(entry);
    });
    entries.filter(entry => entry.measured && !entry.overflows)
        .forEach(entry => entry.toggle.setAttribute('aria-expanded', 'false'));
    const pending = entries.filter(entry => entry.overflows);
    pending.forEach(entry => {
        entry.toggle.hidden = false;
    });
    let overflowing = pending.filter(overflows);
    while (overflowing.length) {
        overflowing.forEach(entry => {
            entry.buttons[entry.index].classList.add(panelActionOverflowClass);
            entry.index--;
        });
        overflowing = overflowing.filter(overflows);
    }

    pending.forEach(({toggle, menu, buttons, wasExpanded}) => {
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

// P1: requests made before the next frame share one measurement.
const panelOverflowFrames = new WeakSet();
export const schedulePanelActionOverflow = root => {
    if (panelOverflowFrames.has(root)) {
        return;
    }
    panelOverflowFrames.add(root);
    window.requestAnimationFrame(() => {
        panelOverflowFrames.delete(root);
        syncPanelActionOverflow(root);
    });
};
