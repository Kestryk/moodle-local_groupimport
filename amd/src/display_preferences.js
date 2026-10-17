// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Personal animation choice (G1 / K17-05), using the shared M1 policy.
 *
 * @module     local_groupimport/display_preferences
 * @copyright  2026 Kevin Jarniac
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define(['core/templates', 'core_user/repository', 'core/notification', 'local_groupimport/motion'],
function(Templates, UserRepository, Notification, Motion) {
    const levels = ['full', 'reduced', 'minimal'];
    let initialized = false;

    const init = (defaultLevel, preference) => {
        if (initialized || !levels.includes(defaultLevel)) {
            return;
        }
        initialized = true;
        let current = levels.includes(preference) ? preference : 'default';
        let pending = null;
        let opener = null;
        let saving = false;
        let selected = current;
        const effective = value => levels.includes(value) ? value : defaultLevel;
        let tooltip = null;
        let tooltipTimer = null;
        const hideTooltip = () => {
            if (tooltip) {
                tooltip.remove();
                tooltip = null;
            }
        };
        const showTooltip = event => {
            window.clearTimeout(tooltipTimer);
            if (tooltip && tooltip.contains(event.target)) {
                return;
            }
            const trigger = event.target.closest('[data-easyedu-display-tooltip]');
            if (!trigger || trigger.matches(':active')) {
                return;
            }
            hideTooltip();
            tooltip = document.createElement('div');
            tooltip.className = 'easyedu-control-tooltip';
            tooltip.setAttribute('role', 'tooltip');
            tooltip.textContent = trigger.getAttribute('aria-label');
            document.querySelector('.easyedu-ui').append(tooltip);
            const rect = trigger.getBoundingClientRect();
            const width = tooltip.getBoundingClientRect().width;
            tooltip.style.left = `${Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))}px`;
            tooltip.style.top = `${rect.bottom + 8}px`;
        };
        document.addEventListener('pointerover', showTooltip);
        document.addEventListener('focusin', showTooltip);
        document.addEventListener('pointerout', () => {
            tooltipTimer = window.setTimeout(hideTooltip, 150);
        });
        document.addEventListener('focusout', hideTooltip);
        window.addEventListener('resize', hideTooltip);
        window.addEventListener('scroll', hideTooltip, true);
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                hideTooltip();
            }
        });

        const create = async() => {
            const root = document.querySelector('.easyedu-ui');
            if (!root) {
                throw new Error('EasyStud display preference root is missing.');
            }
            const {html, js} = await Templates.renderForPromise('local_groupimport/display_preferences', {});
            Templates.appendNodeContents(root, html, js);
            const dialog = root.querySelector('[data-easyedu-display-dialog]');
            const form = dialog.querySelector('form');
            const controls = Array.from(form.elements);
            const status = dialog.querySelector('[data-easyedu-display-status]');
            const defaultName = dialog.querySelector(`[data-easyedu-display-level="${defaultLevel}"]`).textContent;
            dialog.querySelector('[data-easyedu-display-default-name]').textContent = defaultName;
            const reset = dialog.querySelector('[data-easyedu-display-reset]');
            const sync = () => {
                dialog.querySelector(`[value="${effective(selected)}"]`).checked = true;
                reset.setAttribute('aria-pressed', selected === 'default' ? 'true' : 'false');
            };
            const close = () => {
                if (!saving) {
                    Motion.exit(dialog, {duration: 140, distance: '8px'})
                        .then(() => dialog.close())
                        .catch(Notification.exception);
                }
            };
            dialog.addEventListener('keydown', event => {
                // The underlying Guide/drawer must keep its own state when this dialog closes.
                if (event.key === 'Escape') {
                    event.stopPropagation();
                    if (saving) {
                        event.preventDefault();
                    }
                }
            });
            dialog.addEventListener('cancel', event => {
                event.preventDefault();
                close();
            });
            dialog.addEventListener('close', () => {
                const target = opener && opener.getClientRects().length ? opener :
                    document.querySelector('[data-easyedu-navigation-open]');
                if (target) {
                    target.focus();
                }
            });
            dialog.querySelectorAll('[data-easyedu-display-close]').forEach(button => button.addEventListener('click', close));
            const selectLevel = event => {
                if (event.target.name === 'easyedu_motion_level') {
                    selected = event.target.value;
                    sync();
                }
            };
            form.addEventListener('change', selectLevel);
            // An explicit choice also overrides the default when that radio is already checked.
            form.addEventListener('click', selectLevel);
            reset.addEventListener('click', () => {
                selected = 'default';
                sync();
            });
            form.addEventListener('submit', async event => {
                event.preventDefault();
                if (saving) {
                    return;
                }
                saving = true;
                controls.forEach(control => {
                    control.disabled = true;
                });
                dialog.setAttribute('aria-busy', 'true');
                status.hidden = true;
                try {
                    await UserRepository.setUserPreference('easyedu_motion_level', selected);
                    current = selected;
                    Motion.setLevel(root, effective(current));
                    saving = false;
                    close();
                } catch (error) {
                    status.hidden = false;
                    status.focus();
                } finally {
                    saving = false;
                    controls.forEach(control => {
                        control.disabled = false;
                    });
                    dialog.removeAttribute('aria-busy');
                }
            });
            return {dialog, sync, status};
        };

        document.addEventListener('click', async event => {
            const trigger = event.target.closest('[data-easyedu-display-open]');
            if (!trigger || saving) {
                return;
            }
            event.preventDefault();
            hideTooltip();
            opener = trigger;
            // Serialize initial rendering so rapid clicks cannot create duplicate dialogs.
            pending = pending || create().catch(error => {
                pending = null;
                throw error;
            });
            try {
                const {dialog, sync, status} = await pending;
                if (dialog.open) {
                    return;
                }
                selected = current;
                sync();
                status.hidden = true;
                dialog.showModal();
                Motion.enter(dialog, {duration: 180, distance: '8px'});
                dialog.querySelector('input:checked').focus();
            } catch (error) {
                Notification.exception(error);
            }
        });
    };
    return {init};
});
