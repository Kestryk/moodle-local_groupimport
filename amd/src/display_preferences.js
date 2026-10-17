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

define(['core/templates', 'core_user/repository', 'core/notification', 'local_groupimport/motion',
    'local_groupimport/easyedu_bubble'],
function(Templates, UserRepository, Notification, Motion, Bubble) {
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
        // K17-74 / K-BUBBLE: the nav icon uses the one Kit bubble (the same controller as every other hover
        // bubble), never a local tooltip style. It is mounted in the EasyStud root so it keeps the palette.
        const bubble = Bubble.createBubbleController({Motion, mount: () => document.querySelector('.easyedu-ui')});
        const triggerOf = target => target instanceof Element ? target.closest('[data-easyedu-display-tooltip]') : null;
        const showTooltip = event => {
            const trigger = triggerOf(event.target);
            if (!trigger || (event.type === 'pointerover' && trigger.contains(event.relatedTarget)) ||
                    trigger.matches(':active') || (event.type === 'focusin' && !trigger.matches(':focus-visible'))) {
                return;
            }
            bubble.show(trigger, trigger.getAttribute('aria-label'));
        };
        document.addEventListener('pointerover', showTooltip);
        document.addEventListener('focusin', showTooltip);
        document.addEventListener('pointerout', event => {
            const trigger = triggerOf(event.target);
            if (trigger && bubble.isActive(trigger) && !trigger.contains(event.relatedTarget) &&
                    !bubble.contains(event.relatedTarget)) {
                bubble.scheduleHide();
            }
        });
        document.addEventListener('focusout', () => {
            bubble.release();
            bubble.hide(false);
        });
        document.addEventListener('click', () => bubble.hide());
        window.addEventListener('resize', () => bubble.hide());
        window.addEventListener('scroll', () => bubble.hide(), true);
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && bubble.isOpen()) {
                bubble.dismiss();
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

        // Render the dialog once the page is idle so the first click costs the same as a reopening (K17-75).
        const prefetch = () => {
            if (pending || !document.querySelector('.easyedu-ui')) {
                return;
            }
            pending = create().catch(() => {
                // A failed background render is retried by the first real click.
                pending = null;
            });
        };
        const schedulePrefetch = () => {
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(prefetch, {timeout: 4000});
            } else {
                window.setTimeout(prefetch, 1500);
            }
        };
        if (document.readyState === 'complete') {
            schedulePrefetch();
        } else {
            window.addEventListener('load', () => window.setTimeout(schedulePrefetch, 300), {once: true});
        }

        document.addEventListener('click', async event => {
            const trigger = event.target.closest('[data-easyedu-display-open]');
            if (!trigger || saving) {
                return;
            }
            event.preventDefault();
            bubble.hide();
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
