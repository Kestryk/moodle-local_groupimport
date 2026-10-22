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
 * Mass Import Guide adapter (GMI-C4): compact launcher, "mi:*" interface openers and the
 * milestones of the guided path "Check a file without importing anything".
 *
 * Presentation only: no opener or milestone submits a form, and nothing here ever targets
 * "Run import" (the path ends on Cancel, K18-07). Student Management modules are
 * not loaded: only the dependency-free shared launcher is.
 *
 * @module     local_groupimport/local/mi/guide
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {init as initNavigation} from '../../easyedu_navigation';
import {bindGuideLauncher} from '../cm/guide_launcher';

const PATH = 'mi-review-without-importing';
const NAVIGATION = '#local-groupimport-import-navigation';
// Same breakpoint as the compact navigation of this page (navigation component, 64rem).
const COMPACT_QUERY = '(max-width: 64rem)';
const CHECKLIST = '[data-easyedu-guide-checklist]';
const ROW_TOGGLE = 'input[name^="rowenabled["]';

// Same guard as emitNativePathCompletion (local/cm/guide_hooks): only the next unfinished
// milestone of the visible checklist of this path is completed, never a later or locked one.
const emitNativePathCompletion = (root, path, step) => {
    const checklist = document.querySelector(
        '[data-easyedu-guide-checklist][data-easyedu-guide-path="' + path + '"]'
    );
    if (!checklist || checklist.hidden || !root.isConnected) {
        return;
    }
    const next = checklist.querySelector('[data-easyedu-guide-step-id]:not(.is-complete)');
    if (!next || next.disabled || next.getAttribute('data-easyedu-guide-step-id') !== step) {
        return;
    }
    root.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
        bubbles: true,
        detail: {path, step},
    }));
};

// The Moodle file picker certifies a file only through its completed filename callback
// (same contract as isImportFileReady in csv_import): an allocated draft or an upload
// still in progress is not a file.
const isImportFileReady = deposit => {
    const filename = deposit ? deposit.querySelector('.filepicker-filename a') : null;
    return Boolean(filename && filename.textContent.trim() &&
        !deposit.querySelector('.dndupload-inprogress'));
};

const isPathChecklistOpen = checklist => !!checklist && !checklist.hidden &&
    checklist.getAttribute('data-easyedu-guide-path') === PATH;

const navigationController = () => {
    const navigation = document.querySelector(NAVIGATION);
    return navigation ? initNavigation(navigation) : null;
};

const isCompactNavigation = () => {
    const trigger = document.querySelector(NAVIGATION + ' [data-easyedu-navigation-open]');
    return !!trigger && trigger.getClientRects().length > 0 && window.getComputedStyle(trigger).display !== 'none';
};

const closeNavigation = () => {
    const panel = document.querySelector(NAVIGATION + ' [data-easyedu-navigation-panel]');
    const controller = panel && panel.classList.contains('is-open') ? navigationController() : null;
    if (controller) {
        controller.close(false);
    }
};

const historyModal = () => document.querySelector('[data-local-groupimport-history-modal]');

// Openers named in the slide and step data (cahier section 1.14). Each one only reveals a
// container; the shared Guide then resolves, scrolls to and highlights the target itself.
const openers = {
    'mi:open-navigation': () => {
        const controller = isCompactNavigation() ? navigationController() : null;
        if (controller) {
            controller.open();
        }
    },
    'mi:close-navigation': closeNavigation,
    'mi:expand-upload': root => {
        closeNavigation();
        const toggle = root.querySelector('[data-local-groupimport-upload-toggle]');
        if (toggle && toggle.getAttribute('aria-expanded') === 'false') {
            toggle.click();
        }
    },
    'mi:open-history': () => {
        closeNavigation();
        const modal = historyModal();
        const opener = document.querySelector(NAVIGATION + ' [data-easyedu-navigation-action="mass-import-history"]');
        if (modal && modal.hidden && opener) {
            // The history dialog owns its opening (focus, Motion); the hidden desktop entry
            // stays a valid programmatic opener in compact, without passing through the drawer.
            opener.click();
        }
    },
    'mi:close-history': () => {
        const modal = historyModal();
        const dismiss = modal && !modal.hidden ? modal.querySelector('[data-local-groupimport-history-dismiss]') : null;
        if (dismiss) {
            dismiss.click();
        }
    },
};

export const init = rootId => {
    const root = document.getElementById(rootId);
    const navigation = document.querySelector(NAVIGATION);
    if (!root || root.dataset.localGroupimportGuideAdapter === '1') {
        return;
    }
    root.dataset.localGroupimportGuideAdapter = '1';

    // Compact screens: the launcher moves into the navigation drawer and the Guide surfaces
    // to body, exactly as on Student Management.
    if (navigation) {
        bindGuideLauncher(navigation, COMPACT_QUERY);
    }

    document.addEventListener('easyedu:guide-open-target', event => {
        const request = event.detail;
        const key = request && typeof request.target === 'string' ? request.target : '';
        if (!Object.prototype.hasOwnProperty.call(openers, key)) {
            return;
        }
        // Always claimed: the Guide must never click an unresolved "mi:*" key itself.
        request.handled = true;
        openers[key](root);
    });

    const deposit = root.querySelector('#local_groupimport-form .easyedu-file-deposit');
    const warning = root.querySelector('[data-local-groupimport-guide-path-warning]');
    let checklistWasOpen = false;

    // Milestones that depend on the page state rather than on one click.
    const syncPath = () => {
        const checklist = document.querySelector(CHECKLIST);
        const open = isPathChecklistOpen(checklist);
        if (warning) {
            warning.hidden = !open || checklist.classList.contains('is-complete');
        }
        if (open && isImportFileReady(deposit)) {
            emitNativePathCompletion(root, PATH, 'add-file');
        }
        // The preview reloads the page: the milestone is the reopened checklist ("Resume the
        // guided path") on a page that now shows the preview, never the submit click itself.
        if (open && !checklistWasOpen && root.classList.contains('has-preview')) {
            emitNativePathCompletion(root, PATH, 'preview-file');
        }
        checklistWasOpen = open;
    };

    const checklist = document.querySelector(CHECKLIST);
    if (checklist) {
        new MutationObserver(syncPath).observe(checklist, {
            attributes: true,
            attributeFilter: ['hidden', 'class', 'data-easyedu-guide-path'],
        });
    }
    if (deposit) {
        new MutationObserver(syncPath).observe(deposit, {childList: true, subtree: true, characterData: true});
    }
    // Compact: Moodle's file picker dialog opens under the docked checklist, whose step card would
    // cover the picker's own Upload button. Hide the checklist (paint only: its state, progress and
    // listeners stay untouched) while that native dialog is shown, then give it back.
    root.addEventListener('click', event => {
        const list = document.querySelector(CHECKLIST);
        if (!event.target.closest || !event.target.closest('.fp-btn-choose') || !isPathChecklistOpen(list) ||
                !window.matchMedia(COMPACT_QUERY).matches || list.dataset.localGroupimportPickerYield === '1') {
            return;
        }
        list.dataset.localGroupimportPickerYield = '1';
        list.style.visibility = 'hidden';
        let seen = false;
        let ticks = 0;
        const watch = window.setInterval(() => {
            const picker = Array.from(document.querySelectorAll('.file-picker')).some(node => node.getClientRects().length > 0);
            seen = seen || picker;
            ticks++;
            // Restore when the dialog closes, or if it never opened within 10 seconds.
            if ((seen && !picker) || (!seen && ticks > 40)) {
                window.clearInterval(watch);
                list.style.visibility = '';
                delete list.dataset.localGroupimportPickerYield;
            }
        }, 250);
    }, true);
    root.addEventListener('change', event => {
        if (event.target.matches && event.target.matches(ROW_TOGGLE) && !event.target.checked) {
            emitNativePathCompletion(root, PATH, 'exclude-row');
        }
    });
    syncPath();
};
