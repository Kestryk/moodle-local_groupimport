// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Shared EasyEdu desktop/responsive navigation controller.
 *
 * Consumers copy this module into their Moodle component namespace while
 * retaining the public data-attribute contract.
 *
 * @module     local_groupimport/easyedu_navigation
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {slideDrawer} from './motion';

const roots = new WeakMap();
const focusableSelector = [
    'a[href]:not([aria-disabled="true"])',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusable = panel => Array.from(panel.querySelectorAll(focusableSelector))
    .filter(element => !element.hidden && element.getClientRects().length > 0);

const setInert = (element, inert) => {
    if ('inert' in element) {
        element.inert = inert;
    }
    if (inert) {
        element.setAttribute('inert', '');
    } else {
        element.removeAttribute('inert');
    }
};

const resolveRoot = target => {
    if (target && target.nodeType === Node.ELEMENT_NODE) {
        return target;
    }
    if (typeof target === 'string') {
        return document.querySelector(target);
    }
    return document.querySelector('[data-easyedu-navigation]');
};

const bindDisclosure = root => {
    const rootId = root.id || 'easyedu-navigation';
    root.querySelectorAll('[data-easyedu-navigation-disclosure]').forEach(trigger => {
        const entry = trigger.closest('[data-easyedu-navigation-item-id]');
        const controlled = entry ? Array.from(entry.children)
            .find(element => element.matches('[data-easyedu-navigation-children]')) : null;
        if (!controlled) {
            return;
        }
        const presentation = trigger.closest('[data-easyedu-navigation-desktop]') ? 'desktop' : 'compact';
        const itemId = entry.getAttribute('data-easyedu-navigation-item-id');
        controlled.id = `${rootId}-${presentation}-${itemId}-children`;
        trigger.setAttribute('aria-controls', controlled.id);
    });

    root.addEventListener('click', event => {
        const trigger = event.target.closest('[data-easyedu-navigation-disclosure]');
        if (!trigger || !root.contains(trigger)) {
            return;
        }
        const entry = trigger.closest('[data-easyedu-navigation-item-id]');
        const controlled = entry ? Array.from(entry.children)
            .find(element => element.matches('[data-easyedu-navigation-children]')) : null;
        if (!controlled) {
            return;
        }
        const expanded = trigger.getAttribute('aria-expanded') !== 'true';
        trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        controlled.hidden = !expanded;
    });
};

const bindLabelReveal = root => {
    const entries = Array.from(root.querySelectorAll('[data-easyedu-navigation-label-reveal]'));
    const navigation = root.querySelector('[data-easyedu-navigation-desktop]');
    const navigationWrapper = root.closest('.local-groupimport-easystud__navigation');
    const overlaps = (first, second) => first.left < second.right && first.right > second.left &&
        first.top < second.bottom && first.bottom > second.top;
    const isVisible = element => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const placeLabel = entry => {
        const label = entry.querySelector('.easyedu-guide__launcher-label');
        if (!label || !navigation || !isVisible(entry)) {
            return;
        }
        entry.classList.remove('is-guide-label-top', 'is-guide-label-top-end');
        const rightRect = label.getBoundingClientRect();
        const navigationItems = Array.from(navigation.querySelectorAll('[data-easyedu-navigation-item-id]'))
            .filter(item => isVisible(item))
            .map(item => item.getBoundingClientRect());
        const viewportMargin = 8;
        const fitsViewport = rightRect.left >= viewportMargin && rightRect.right <= window.innerWidth - viewportMargin;
        const overlapsNavigation = navigationItems.some(itemRect => overlaps(rightRect, itemRect));
        if (fitsViewport && !overlapsNavigation) {
            return;
        }

        entry.classList.add('is-guide-label-top');
        const topRect = label.getBoundingClientRect();
        if (topRect.right > window.innerWidth - viewportMargin) {
            entry.classList.add('is-guide-label-top-end');
        }
        const previousContent = navigationWrapper ? Array.from(
            navigationWrapper.parentElement ? navigationWrapper.parentElement.children : []
        ).filter(sibling => sibling !== navigationWrapper && isVisible(sibling)) : [];
        const overlapsPreviousContent = previousContent.some(content => overlaps(topRect, content.getBoundingClientRect()));
        if (topRect.top < viewportMargin || overlapsPreviousContent) {
            entry.classList.add('is-guide-label-top-end');
        }
    };
    const reveal = entry => entries.forEach(candidate => {
        candidate.classList.toggle('is-label-revealed', candidate === entry);
    });
    const clear = (entry, event) => {
        if (!entry.contains(event.relatedTarget)) {
            entry.classList.remove('is-label-revealed');
            if (!entry.querySelector('[data-easyedu-guide-modal].is-open')) {
                entry.classList.remove('is-guide-label-suppressed');
            }
        }
    };
    entries.forEach(entry => {
        const trigger = entry.querySelector('[data-easyedu-guide-open]');
        if (!trigger) {
            return;
        }
        trigger.addEventListener('pointerenter', () => {
            placeLabel(entry);
            reveal(entry);
        });
        trigger.addEventListener('focusin', () => {
            placeLabel(entry);
            reveal(entry);
        });
        trigger.addEventListener('click', () => {
            // The guide modal must not leave the hover capsule above its panel.
            entry.classList.add('is-guide-label-suppressed');
            entry.classList.remove('is-label-revealed');
        });
        trigger.addEventListener('pointerleave', event => clear(entry, event));
        trigger.addEventListener('focusout', event => clear(entry, event));
    });
    let resizeFrame = 0;
    const onResize = () => {
        if (resizeFrame) {
            return;
        }
        resizeFrame = window.requestAnimationFrame(() => {
            resizeFrame = 0;
            entries.forEach(placeLabel);
        });
    };
    window.addEventListener('resize', onResize, {passive: true});
};

// K21-51 identity rail: narrow rails show some destinations (and the Guide) as
// icon-only capsules through a container query. Only those collapsed controls
// opt into the shared Kit hover/focus bubble, which reads their aria-label.
const bindIdentityRailTooltips = root => {
    const navigation = root.classList.contains('easyedu-navigation--identity') ?
        root.querySelector('[data-easyedu-navigation-desktop]') : null;
    if (!navigation || typeof window.ResizeObserver !== 'function') {
        return;
    }
    let frame = 0;
    const sync = () => {
        frame = 0;
        navigation.querySelectorAll('.easyedu-navigation__item, .easyedu-guide__launcher').forEach(control => {
            const label = control.querySelector('.easyedu-navigation__item-label, .easyedu-guide__launcher-short');
            const collapsed = !!label && control.hasAttribute('aria-label') &&
                window.getComputedStyle(label).display === 'none';
            if (control.hasAttribute('data-easyedu-display-tooltip') !== collapsed) {
                control.toggleAttribute('data-easyedu-display-tooltip', collapsed);
            }
        });
    };
    new window.ResizeObserver(() => {
        if (!frame) {
            frame = window.requestAnimationFrame(sync);
        }
    }).observe(navigation);
    sync();
};

const bindRoot = root => {
    if (!root || roots.has(root)) {
        return roots.get(root) || null;
    }

    const trigger = root.querySelector('[data-easyedu-navigation-open]');
    const panel = root.querySelector('[data-easyedu-navigation-panel]');
    const backdrop = root.querySelector('[data-easyedu-navigation-backdrop]');
    const closeButton = root.querySelector('[data-easyedu-navigation-close]');
    if (!trigger || !panel || !backdrop || !closeButton) {
        return null;
    }

    const anchorSelector = root.getAttribute('data-easyedu-navigation-anchor-selector');
    let positionFrame = 0;
    const isCompactAvailable = () => window.getComputedStyle(trigger).display !== 'none' &&
        trigger.getClientRects().length > 0;

    const syncTriggerPosition = () => {
        positionFrame = 0;
        if (anchorSelector) {
            try {
                const anchor = document.querySelector(anchorSelector);
                if (anchor && anchor.getClientRects().length) {
                    const edge = Math.max(0, Math.ceil(anchor.getBoundingClientRect().bottom));
                    root.style.setProperty('--easyedu-navigation-native-trigger-edge', `${edge}px`);
                    return;
                }
            } catch (error) {
                // Keep the compact control available if a theme provides an
                // invalid drawer-toggle selector.
            }
        }
        root.style.removeProperty('--easyedu-navigation-native-trigger-edge');
    };

    const scheduleTriggerPosition = () => {
        if (!positionFrame) {
            positionFrame = window.requestAnimationFrame(syncTriggerPosition);
        }
    };

    const finishClose = completed => {
        if (completed === false) {
            return;
        }
        panel.classList.remove('is-closing');
        if (!panel.classList.contains('is-open')) {
            backdrop.hidden = true;
        }
    };

    const setOpen = (open, restoreFocus = true, force = false, animate = true) => {
        if (open && !force && !isCompactAvailable()) {
            return;
        }
        const wasOpen = panel.classList.contains('is-open');
        panel.classList.toggle('is-open', open);
        panel.setAttribute('aria-hidden', open ? 'false' : 'true');
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        setInert(panel, !open);
        document.documentElement.classList.toggle('easyedu-navigation-open', open);
        if (open) {
            panel.classList.remove('is-closing');
            backdrop.hidden = false;
        } else if (wasOpen && animate) {
            // Keep the drawer and its scrim painted while they leave.
            panel.classList.add('is-closing');
        } else {
            panel.classList.remove('is-closing');
            backdrop.hidden = true;
        }
        if (open || (wasOpen && animate)) {
            slideDrawer(panel, backdrop, open).then(completed => (open ? completed : finishClose(completed)))
                .catch(() => finishClose(true));
        }

        if (open) {
            const focusable = getFocusable(panel);
            const current = focusable.find(element => element.matches('[aria-current="page"]')) || closeButton ||
                focusable[0];
            if (current) {
                current.focus({preventScroll: true});
            }
        } else if (restoreFocus && document.documentElement.contains(trigger)) {
            trigger.focus({preventScroll: true});
        }
    };

    trigger.addEventListener('click', () => setOpen(true, true, true));
    trigger.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') {
            return;
        }
        event.preventDefault();
        setOpen(true, true, true);
    });
    closeButton.addEventListener('click', () => setOpen(false));
    backdrop.addEventListener('click', () => setOpen(false));
    panel.addEventListener('click', event => {
        if (event.target.closest('a[href]')) {
            setOpen(false, false);
            return;
        }
        if (event.target.closest('[data-easyedu-navigation-action]')) {
            window.setTimeout(() => {
                const focusMovedOutside = document.activeElement &&
                    !panel.contains(document.activeElement);
                setOpen(false, !focusMovedOutside);
            }, 0);
        }
    });
    panel.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
            return;
        }
        if (event.key !== 'Tab') {
            return;
        }
        const focusable = getFocusable(panel);
        if (!focusable.length) {
            event.preventDefault();
            closeButton.focus();
            return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && panel.classList.contains('is-open') && !panel.contains(event.target)) {
            event.preventDefault();
            setOpen(false);
        }
    });
    document.addEventListener('easyedu:guide-interface-transition', () => {
        // Guide interactions leave the compact navigation context. Keep the
        // normal trigger usable for a later return to the navigation panel.
        setOpen(false, false);
    });

    const onViewportChange = () => {
        if (!isCompactAvailable()) {
            setOpen(false, false, false, false);
        }
        scheduleTriggerPosition();
    };

    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', scheduleTriggerPosition, {passive: true});
    bindDisclosure(root);
    bindLabelReveal(root);
    bindIdentityRailTooltips(root);
    syncTriggerPosition();
    setOpen(false, false, false, false);

    const controller = {
        close: restoreFocus => setOpen(false, restoreFocus !== false),
        open: () => setOpen(true),
        syncPosition: syncTriggerPosition,
    };
    roots.set(root, controller);
    return controller;
};

export const init = target => {
    const root = resolveRoot(target);
    return bindRoot(root);
};
