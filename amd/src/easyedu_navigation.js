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

// K22-05 identity rail progressive fit (replaces the K21-51/K21-53 fixed container
// thresholds). Every label is shown while the rail fits; otherwise controls collapse
// to icon capsules one by one, only as far as needed: utilities from the end, then
// inactive destinations from the end, then the Guide. The active view never collapses.
// K22-13 (replaces the K22-06 overlay): a collapsed control unfolds IN THE FLOW on
// hover/keyboard focus. The rail re-runs the fit logic for that state: the unfolded
// control takes its natural width (--easyedu-rail-item-full) and, while the rail
// overflows, neighbours fold temporarily (those after it first, in fit priority), so
// nothing is ever covered. The target layout is measured with transitions frozen,
// then animated from what is on screen. Accessible names are unchanged.
const RAIL_COLLAPSED = 'is-rail-collapsed';
const RAIL_FITTED = 'is-rail-fitted';
const RAIL_UNFOLDED = 'is-rail-unfolded';
const RAIL_YIELDED = 'is-rail-yielded';
const RAIL_REFLOWING = 'is-rail-reflowing';
const RAIL_MEASURING = 'is-rail-measuring';
const RAIL_TIGHT = 'is-rail-tight';
const RAIL_READY = 'is-rail-ready';
const RAIL_SETTLE_MS = 400;
// Below this width an unfolded capsule would show no useful part of its label.
const RAIL_MIN_ROOM = 72;

const bindIdentityRailFit = root => {
    const navigation = root.classList.contains('easyedu-navigation--identity') ?
        root.querySelector('[data-easyedu-navigation-desktop]') : null;
    if (!navigation) {
        return;
    }
    const sections = navigation.querySelector('.easyedu-navigation__sections');
    const isActive = control => control.classList.contains('active') || control.getAttribute('aria-current') === 'page';
    const isUtility = control => !!control.closest('.easyedu-navigation__entry--utility');
    const candidates = () => {
        const items = Array.from(navigation.querySelectorAll('.easyedu-navigation__sections .easyedu-navigation__item'))
            .filter(item => !isActive(item));
        const guide = navigation.querySelector('.easyedu-navigation__utilities .easyedu-guide__launcher');
        return [
            ...items.filter(isUtility).reverse(),
            ...items.filter(item => !isUtility(item)).reverse(),
            ...(guide ? [guide] : []),
        ];
    };
    const overflows = () => navigation.scrollWidth > navigation.clientWidth + 1 ||
        (!!sections && sections.scrollWidth > sections.clientWidth + 1);
    let unfolded = null;
    let unfoldedRoom = null;
    let unfoldedTight = false;
    let yielded = [];
    let settleTimer = 0;
    let releaseFrame = 0;
    const isFolded = control => control.classList.contains(RAIL_COLLAPSED);
    // `tight` narrows the rail spacing and `room` caps the unfolded width (label
    // ellipsised), each only when folding every neighbour still leaves too little room.
    const applyUnfold = (target, yields, room = null, tight = false) => {
        navigation.classList.toggle(RAIL_TIGHT, tight);
        unfoldedTight = tight;
        if (unfolded) {
            unfolded.classList.remove(RAIL_UNFOLDED);
            unfolded.style.removeProperty('--easyedu-rail-item-open');
        }
        yielded.forEach(control => control.classList.remove(RAIL_COLLAPSED, RAIL_YIELDED));
        unfolded = target;
        unfoldedRoom = room;
        yielded = yields;
        if (target) {
            target.classList.add(RAIL_UNFOLDED);
            if (room !== null) {
                target.style.setProperty('--easyedu-rail-item-open', `${room}px`);
            }
        }
        yields.forEach(control => control.classList.add(RAIL_COLLAPSED, RAIL_YIELDED));
    };
    const excess = () => Math.max(navigation.scrollWidth - navigation.clientWidth,
        sections ? sections.scrollWidth - sections.clientWidth : 0);
    const settle = () => {
        window.clearTimeout(settleTimer);
        settleTimer = 0;
        if (unfolded || yielded.length) {
            navigation.classList.add(RAIL_REFLOWING);
            return;
        }
        // Explicit widths are only needed while capsules animate; afterwards the
        // rail returns to its natural (auto) widths, which are the same values.
        settleTimer = window.setTimeout(() => {
            settleTimer = 0;
            if (!unfolded && !yielded.length) {
                navigation.classList.remove(RAIL_REFLOWING);
            }
        }, RAIL_SETTLE_MS);
    };
    // Measure the layout where `target` shows its label, folding neighbours while the
    // rail overflows, then animate from the current state to it.
    const unfold = target => {
        window.cancelAnimationFrame(releaseFrame);
        releaseFrame = 0;
        if (target === unfolded) {
            return;
        }
        const previous = {target: unfolded, yields: yielded, room: unfoldedRoom, tight: unfoldedTight};
        navigation.classList.add(RAIL_REFLOWING, RAIL_MEASURING);
        applyUnfold(target, []);
        // Fold what follows the unfolding control first, in fit priority (destinations,
        // then the Guide, which stays reachable as an icon): the control then grows away
        // from its start edge and stays under the pointer. Preceding controls give way
        // last, since folding them slides the control toward its start.
        // eslint-disable-next-line no-bitwise
        const follows = control => !!(target.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING);
        const open = candidates().filter(control => control !== target && !isFolded(control));
        const queue = [...open.filter(follows), ...open.filter(control => !follows(control))];
        const yields = [];
        for (const control of queue) {
            if (!overflows()) {
                break;
            }
            control.classList.add(RAIL_COLLAPSED, RAIL_YIELDED);
            yields.push(control);
        }
        // Nothing left to fold: tighten the rail spacing, then open only as far as the
        // rail allows (never over a neighbour). With no useful room, stay folded.
        const tight = overflows();
        navigation.classList.toggle(RAIL_TIGHT, tight);
        let room = null;
        for (let pass = 0; pass < 3 && overflows(); pass++) {
            const current = target.getBoundingClientRect().width;
            room = Math.max(Math.floor(current - excess() - 1), 0);
            target.style.setProperty('--easyedu-rail-item-open', `${room}px`);
        }
        const next = room !== null && room < RAIL_MIN_ROOM ? [null, [], null, false] : [target, yields, room, tight];
        applyUnfold(previous.target, previous.yields, previous.room, previous.tight);
        void navigation.offsetWidth;
        navigation.classList.remove(RAIL_MEASURING);
        void navigation.offsetWidth;
        applyUnfold(...next);
        settle();
    };
    const release = control => {
        if (control !== unfolded || releaseFrame) {
            return;
        }
        // Deferred one frame so moving straight to another folded control re-plans
        // from the visible state instead of folding back first.
        releaseFrame = window.requestAnimationFrame(() => {
            releaseFrame = 0;
            if (unfolded === control) {
                applyUnfold(null, []);
                settle();
            }
        });
    };
    const matches = (control, selector) => {
        try {
            return control.matches(selector);
        } catch (error) {
            return false;
        }
    };
    const bound = new WeakSet();
    const bindUnfold = control => {
        if (bound.has(control)) {
            return;
        }
        bound.add(control);
        control.addEventListener('pointerenter', () => {
            if (isFolded(control) || control === unfolded) {
                unfold(control);
            }
        });
        control.addEventListener('focusin', () => {
            if ((isFolded(control) || control === unfolded) && matches(control, ':focus-visible')) {
                unfold(control);
            }
        });
        control.addEventListener('pointerleave', () => {
            if (!matches(control, ':focus-visible')) {
                release(control);
            }
        });
        control.addEventListener('focusout', () => {
            if (!matches(control, ':hover')) {
                release(control);
            }
        });
    };
    const fit = () => {
        const controls = candidates();
        window.cancelAnimationFrame(releaseFrame);
        releaseFrame = 0;
        window.clearTimeout(settleTimer);
        settleTimer = 0;
        applyUnfold(null, []);
        navigation.classList.remove(RAIL_FITTED, RAIL_REFLOWING);
        controls.forEach(control => {
            control.classList.remove(RAIL_COLLAPSED);
            control.removeAttribute('data-easyedu-display-tooltip');
            bindUnfold(control);
        });
        if (navigation.getClientRects().length === 0 || window.getComputedStyle(navigation).display === 'none') {
            return;
        }
        // Natural (labelled) widths, read before any collapse.
        controls.forEach(control => {
            const width = Math.max(control.scrollWidth, control.getBoundingClientRect().width);
            control.style.setProperty('--easyedu-rail-item-full', `${Math.ceil(width)}px`);
        });
        for (const control of controls) {
            if (!overflows()) {
                break;
            }
            control.classList.add(RAIL_COLLAPSED);
        }
        // A fitted rail no longer needs its scroll fallback (focus rings stay unclipped).
        navigation.classList.toggle(RAIL_FITTED, !overflows());
        // A refit (resize, late fonts) under a pointer or keyboard focus re-plans the unfold.
        const engaged = controls.find(control => isFolded(control) &&
            (matches(control, ':hover') || matches(control, ':focus-visible')));
        if (engaged) {
            unfold(engaged);
        }
    };
    // K22-21: the rail stays under its skeleton until this first fit. It is measured
    // with transitions frozen, so it is revealed already fitted, in one step.
    const firstFit = () => {
        navigation.classList.add(RAIL_MEASURING);
        try {
            fit();
        } finally {
            void navigation.offsetWidth;
            navigation.classList.remove(RAIL_MEASURING);
            window.requestAnimationFrame(() => navigation.classList.add(RAIL_READY));
        }
    };
    let frame = 0;
    const schedule = () => {
        if (!frame) {
            frame = window.requestAnimationFrame(() => {
                frame = 0;
                fit();
            });
        }
    };
    if (typeof window.ResizeObserver === 'function') {
        new window.ResizeObserver(schedule).observe(navigation);
    } else {
        window.addEventListener('resize', schedule, {passive: true});
    }
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(schedule).catch(() => undefined);
    }
    firstFit();
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
    bindIdentityRailFit(root);
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
