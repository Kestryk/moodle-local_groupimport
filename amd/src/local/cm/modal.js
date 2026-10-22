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
 * EasyStud course manager: dialog helpers (show/hide, keyboard containment, confirmation).
 *
 * @module     local_groupimport/local/cm/modal
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';

// Focus-only state: owned modal listeners and native caller restoration.
const modalKeyboardState = new WeakMap();
const modalFocusVisible = node => !!node?.isConnected && !node.disabled && !node.matches(':disabled') &&
    !node.closest('[hidden], [inert], [aria-hidden="true"]') && node.getClientRects().length > 0 &&
    getComputedStyle(node).visibility === 'visible';
const modalTabStops = modal => Array.from(modal.querySelectorAll(
    'button, a[href], input, select, textarea, summary, [tabindex]'
)).filter(node => node.tabIndex >= 0 && modalFocusVisible(node));

// Inline disclosures stay in document Tab order. Escape reuses native Cancel;
// only the panel-owned focus is returned after the existing close animation.
const inlineKeyboardState = new WeakMap();
export const prepareInlinePanelFocus = panel => {
    let state = inlineKeyboardState.get(panel);
    if (!state) {
        state = {};
        inlineKeyboardState.set(panel, state);
        panel.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || event.defaultPrevented || panel.hidden) {
                return;
            }
            const cancel = panel.querySelector('[data-easystud-group-member-search-cancel], ' +
                '[data-easystud-container-search-cancel], [data-easystud-cancel-group-email], ' +
                '[data-easystud-cancel-grouping-groups], [data-easystud-rename-cancel]');
            if (modalFocusVisible(cancel)) {
                event.preventDefault();
                event.stopPropagation();
                cancel.click();
            }
        });
    }
    if (!panel.contains(document.activeElement)) {
        let opener = document.activeElement;
        // Reduced disclosure preparation can synchronously reinsert the owning
        // card and drop focus before this hook. Recover its actual visible action.
        if (opener === document.body || !modalFocusVisible(opener)) {
            const owner = panel.closest('[data-easystud-group-id], [data-easystud-grouping-id]');
            const actions = [
                ['[data-easystud-group-member-search-panel]', '[data-easystud-group-member-search-toggle]'],
                ['[data-easystud-container-search-panel]', '[data-easystud-container-search-toggle]'],
                ['[data-easystud-group-email-panel]', '[data-easystud-toggle-group-email]'],
                ['[data-easystud-grouping-groups-panel]', '[data-easystud-toggle-grouping-groups]'],
            ];
            const action = actions.find(([selector]) => panel.matches(selector));
            const selector = action ? action[1] : '[data-easystud-rename-toggle]';
            opener = owner && (Array.from(owner.querySelectorAll(selector)).find(modalFocusVisible) ||
                Array.from(owner.querySelectorAll('[data-easystud-card-menu]')).find(modalFocusVisible));
        }
        state.opener = opener;
    }
};
export const restoreInlinePanelFocus = panel => {
    const opener = inlineKeyboardState.get(panel)?.opener;
    // Let queued card normalization finish before returning focus, including
    // reduced Motion's synchronous close. A reopened panel owns its new focus.
    window.requestAnimationFrame(() => {
        const active = document.activeElement;
        if (panel.hidden && modalFocusVisible(opener) && (panel.contains(active) ||
                active === document.body || !modalFocusVisible(active))) {
            opener.focus({preventScroll: true});
        }
    });
};

export const showEasyStudModal = modal => {
    if (!modal) {
        return;
    }
    const state = modalKeyboardState.get(modal) || {};
    if (!modal.contains(document.activeElement)) {
        state.opener = document.activeElement;
    }
    modalKeyboardState.set(modal, state);
    const dialog = modal.querySelector('.local-groupimport-easystud-modal__dialog');
    if (dialog) {
        Motion.cancel(dialog);
    }
    modal.classList.remove('is-closing');
    modal.hidden = false;
};

export const hideEasyStudModal = (modal, callback = null) => {
    if (!modal || modal.hidden) {
        if (callback) {
            callback();
        }
        return Promise.resolve(true);
    }
    const dialog = modal.querySelector('.local-groupimport-easystud-modal__dialog') || modal;
    modal.classList.add('is-closing');
    // K16-41: one Kit exit for every dialog, the mirror of easyedu-modal-in (same keyframe as
    // easyedu-modal-out: 0.35rem down, 0.99 scale), Motion.timing.fast, which also times the backdrop fade.
    return Motion.exit(dialog, {duration: Motion.timing.fast, distance: '0.35rem', scale: '0.99'}).then(completed => {
        if (!completed) {
            return false;
        }
        modal.hidden = true;
        modal.classList.remove('is-closing');
        if (callback) {
            callback();
        }
        // Existing callbacks may deliberately focus a visible mobile proxy or
        // another dialog. Keep that native destination, never restore early.
        const state = modalKeyboardState.get(modal);
        const active = document.activeElement;
        if (modal.hidden && (!modalFocusVisible(active) || modal.contains(active) ||
                active === document.body) && modalFocusVisible(state?.opener)) {
            state.opener.focus({preventScroll: true});
        }
        return true;
    });
};

// Card dialogs reuse their native Close/Cancel and existing exit Motion.
// A nested control gets first refusal on Escape; never invent a Save action.
// Keep listeners on the owned dialog, so removed editors need no global cleanup.
export const bindCardModalKeyboard = (modal, closeModal) => {
    let state = modalKeyboardState.get(modal);
    if (!state) {
        state = {opener: document.activeElement};
        modalKeyboardState.set(modal, state);
    }
    state.close = closeModal;
    if (!state.bound) {
        state.bound = true;
        modal.addEventListener('keydown', event => {
            if (event.defaultPrevented || modal.hidden) {
                return;
            }
            if (event.key === 'Escape' && !modal.classList.contains('is-closing')) {
                event.preventDefault();
                event.stopPropagation();
                state.close();
            } else if (event.key === 'Tab') {
                const stops = modalTabStops(modal);
                const index = stops.indexOf(document.activeElement);
                if (!stops.length || index < 0 || (!event.shiftKey && index === stops.length - 1) ||
                        (event.shiftKey && index === 0)) {
                    event.preventDefault();
                    const target = event.shiftKey ? stops[stops.length - 1] : stops[0];
                    if (target) {
                        target.focus();
                    } else {
                        modal.setAttribute('tabindex', '-1');
                        modal.focus();
                    }
                }
            }
        });
    }
    return () => {
        const stops = modalTabStops(modal);
        const initial = stops.find(node => node.matches('.local-groupimport-easystud-modal__close')) || stops[0];
        if (initial) {
            initial.focus({preventScroll: true});
        } else {
            modal.setAttribute('tabindex', '-1');
            modal.focus();
        }
    };
};

// K22-31: the message is markup, not plain text, so a lang string can bold the segment that
// describes the action's real consequence (Kit rule for every confirmation modal going forward).
// Callers MUST escape any dynamic piece (a group/grouping name) before splicing it into that
// markup — only the fixed, developer-authored wording may carry raw tags such as <strong>.
export const openConfirmModal = (root, message, onconfirm) => {
    const modal = root.querySelector('[data-easystud-confirm-modal]');
    const messageNode = root.querySelector('[data-easystud-confirm-modal-message]');
    const confirmButton = root.querySelector('[data-easystud-confirm-modal-submit]');
    const closeButtons = root.querySelectorAll('[data-easystud-close-confirm-modal]');
    if (!modal || !messageNode || !confirmButton) {
        onconfirm();
        return;
    }

    const closeModal = () => {
        hideEasyStudModal(modal, () => {
            confirmButton.onclick = null;
        });
    };
    const focusModal = bindCardModalKeyboard(modal, closeModal);

    messageNode.innerHTML = message || '';
    showEasyStudModal(modal);
    focusModal();
    confirmButton.onclick = () => {
        hideEasyStudModal(modal, () => {
            confirmButton.onclick = null;
            onconfirm();
        });
    };

    closeButtons.forEach(button => {
        button.onclick = closeModal;
    });

    modal.onclick = event => {
        if (event.target === modal) {
            closeModal();
        }
    };
};
