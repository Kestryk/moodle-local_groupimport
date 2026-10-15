// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Cancellable EasyStud motion orchestration.
 *
 * @module     local_groupimport/motion
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const activeAnimations = new WeakMap();
const reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const durations = {
    fast: 100,
    normal: 160,
    slow: 220,
};
const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
const disclosureEasing = 'cubic-bezier(0.4, 0, 0.2, 1)';

const getDisclosureDuration = (startHeight, endHeight, baseDuration) => {
    const distance = Math.abs(endHeight - startHeight);
    const extraDuration = Math.min(40, Math.max(0, distance - 240) * 0.1);
    const distanceDuration = durations.fast + Math.min(120, distance * 0.35);
    return Math.round(Math.min(baseDuration + extraDuration, distanceDuration));
};

const levels = ['full', 'reduced', 'minimal'];
const levelSelector = '[data-easyedu-motion-level]';
const policySelector = '[data-easyedu-motion-policy]';
const reducedFadeDuration = 120;

const closestRoot = (element, selector) => {
    if (element && element.closest) {
        const found = element.closest(selector);
        if (found) {
            return found;
        }
    }
    return document.querySelector(selector);
};

/**
 * Whether the visitor's system "reduce motion" preference is honoured. It is NOT by default (product
 * decision: only the level chosen in EasyStud counts); a root may opt in with
 * data-easyedu-respect-system-motion="1" (future admin option). When honoured, the system preference
 * caps the level at 'reduced'.
 *
 * @param {HTMLElement} element Element, or nothing for the page.
 * @returns {Boolean}
 */
export const respectsSystemMotion = element => {
    const root = closestRoot(element, '[data-easyedu-respect-system-motion]');
    return !!root && root.getAttribute('data-easyedu-respect-system-motion') === '1';
};

const readLevel = element => {
    const levelRoot = closestRoot(element, levelSelector);
    const attribute = levelRoot ? levelRoot.getAttribute('data-easyedu-motion-level') : null;
    if (levels.includes(attribute)) {
        return attribute;
    }
    const policyRoot = element && element.closest ? element.closest(policySelector) : null;
    const body = document.body;
    if ((policyRoot && policyRoot.getAttribute('data-easyedu-motion-policy') === 'disabled') ||
            (body && body.classList.contains('easyedu-motion-disabled'))) {
        return 'minimal';
    }
    return body && body.classList.contains('easyedu-motion-reduced') ? 'reduced' : 'full';
};

/**
 * Animation level of an element: 'full', 'reduced' (opacity fades of 120 ms at most, no translate, no
 * scale, no stagger) or 'minimal' (no animation at all, also without Web Animations support).
 * Read from data-easyedu-motion-level on the closest root, else data-easyedu-motion-policy="disabled"
 * (minimal), else the body classes easyedu-motion-disabled (minimal) / easyedu-motion-reduced.
 *
 * @param {HTMLElement} element Element to animate (optional).
 * @returns {String} 'full' | 'reduced' | 'minimal'
 */
export const getLevel = element => {
    if (element && typeof element.animate !== 'function') {
        return 'minimal';
    }
    const level = readLevel(element);
    if (level === 'full' && respectsSystemMotion(element) && reducedMotionQuery && reducedMotionQuery.matches) {
        return 'reduced';
    }
    return level;
};

export const isEnabled = element => getLevel(element) !== 'minimal';

/**
 * Value for scrollIntoView / scrollTo / scrollBy: 'smooth' only at the 'full' level.
 *
 * @param {HTMLElement} element Element, or nothing for the page.
 * @returns {String} 'smooth' | 'auto'
 */
export const scrollBehavior = element => getLevel(element) === 'full' ? 'smooth' : 'auto';

/**
 * Change the animation level at once, without reload: root attribute, compatibility policy attribute and
 * body classes. Does not store any preference. Other level/policy roots of the page follow.
 *
 * @param {HTMLElement} root Root (.easyedu-ui) to update.
 * @param {String} level 'full' | 'reduced' | 'minimal'
 * @returns {String|null} The applied level, null when invalid.
 */
export const setLevel = (root, level) => {
    if (!root || !levels.includes(level)) {
        return null;
    }
    const targets = new Set([root]);
    document.querySelectorAll(levelSelector + ', ' + policySelector).forEach(node => targets.add(node));
    targets.forEach(node => {
        node.setAttribute('data-easyedu-motion-level', level);
        node.setAttribute('data-easyedu-motion-policy', level === 'minimal' ? 'disabled' : 'enabled');
        node.classList.toggle('is-easyedu-motion-off', level === 'minimal');
    });
    if (document.body) {
        document.body.classList.toggle('easyedu-motion-reduced', level === 'reduced');
        document.body.classList.toggle('easyedu-motion-disabled', level === 'minimal');
        document.body.classList.toggle('local-groupimport-motion-disabled', level === 'minimal');
    }
    if (level === 'minimal' && typeof root.getAnimations === 'function') {
        root.getAnimations({subtree: true}).forEach(animation => {
            try {
                animation.cancel();
            } catch (error) {
                // Already finished.
            }
        });
    }
    root.dispatchEvent(new CustomEvent('easyedu:motionlevelchange', {bubbles: true, detail: {level}}));
    return level;
};

/**
 * Opacity-only version of keyframes (every frame must carry a different opacity), or null when there is
 * nothing to fade.
 *
 * @param {Array} keyframes Keyframes.
 * @returns {Array|null}
 */
const fadeOnly = keyframes => {
    const frames = keyframes.map(frame => frame.opacity === undefined ? null : {opacity: frame.opacity});
    if (frames.length < 2 || frames.includes(null) ||
            Number(frames[0].opacity) === Number(frames[frames.length - 1].opacity)) {
        return null;
    }
    return frames;
};

const expandFromOpacity = options => options.fromOpacity === undefined ? 0.35 : options.fromOpacity;

const setWillChange = (element, level, value) => {
    if (level === 'full') {
        element.style.willChange = value;
    } else if (level === 'reduced') {
        element.style.willChange = 'opacity';
    }
};

export const cancel = element => {
    const current = element ? activeAnimations.get(element) : null;
    if (!current) {
        return;
    }
    activeAnimations.delete(element);
    current.animation.cancel();
    if (current.cleanup) {
        current.cleanup(false);
    }
};

const play = (element, keyframes, options, cleanup, level, reducedFrames) => {
    cancel(element);
    const effective = level || getLevel(element);
    if (effective === 'minimal' || typeof element.animate !== 'function') {
        cleanup(true);
        return Promise.resolve(true);
    }
    let frames = keyframes;
    let timing = options;
    if (effective === 'reduced') {
        frames = reducedFrames || fadeOnly(keyframes);
        if (!frames) {
            cleanup(true);
            return Promise.resolve(true);
        }
        timing = Object.assign({}, options, {
            duration: Math.min(reducedFadeDuration, options.duration || durations.normal),
            delay: 0,
        });
    }

    const animation = element.animate(frames, Object.assign({
        duration: durations.normal,
        easing,
        fill: 'both',
    }, timing));
    const record = {animation, cleanup};
    activeAnimations.set(element, record);

    return animation.finished.catch(() => undefined).then(() => {
        if (activeAnimations.get(element) !== record) {
            return false;
        }
        activeAnimations.delete(element);
        cleanup(true);
        animation.cancel();
        return true;
    });
};

const clearDisclosureStyles = element => {
    element.style.removeProperty('height');
    element.style.removeProperty('opacity');
    element.style.removeProperty('overflow');
    element.style.removeProperty('transform');
    element.style.removeProperty('will-change');
};

/**
 * Disclose a framed Search/Add panel without padding, border or margin snaps.
 *
 * Opt-in only: existing expand/collapse/resize recipes retain their timing.
 * Captures in-flight paint before cancellation, then restores original inline
 * declarations. Natural ancestors follow one direct-region animation.
 *
 * @param {HTMLElement} element Direct panel, never its card ancestor.
 * @param {boolean} open Requested state.
 * @param {Object} options Completion hook and optional shared timing override.
 * @returns {Promise<boolean>} False when superseded by another transition.
 */
export const disclosePanel = (element, open, options = {}) => {
    if (!element) {
        return Promise.resolve(false);
    }
    const wasHidden = element.hidden;
    const rect = element.getBoundingClientRect();
    const before = getComputedStyle(element);
    const properties = [
        'height', 'opacity', 'overflow', 'transform', 'will-change', 'transition', 'min-height',
        'padding-block-start', 'padding-block-end', 'border-block-start-width', 'border-block-end-width',
        'margin-block-start', 'margin-block-end',
    ];
    const frameProperties = [
        'paddingBlockStart', 'paddingBlockEnd', 'borderBlockStartWidth', 'borderBlockEndWidth',
        'marginBlockStart', 'marginBlockEnd',
    ];
    const start = {height: wasHidden ? '0px' : before.height, opacity: wasHidden ? 0 : before.opacity};
    frameProperties.forEach(property => {
        start[property] = wasHidden ? '0px' : before[property];
    });
    if (!wasHidden && before.boxSizing !== 'border-box') {
        const insets = ['paddingBlockStart', 'paddingBlockEnd', 'borderBlockStartWidth', 'borderBlockEndWidth']
            .reduce((sum, property) => sum + (parseFloat(before[property]) || 0), 0);
        start.height = Math.max(0, rect.height - insets) + 'px';
    }
    cancel(element);
    const level = getLevel(element);
    const originalStyles = properties.map(property => ({
        property, value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property),
    }));
    element.style.transition = 'none';
    element.hidden = false;
    element.classList.add('is-open');
    const natural = getComputedStyle(element);
    const end = {height: natural.height, opacity: 1};
    frameProperties.forEach(property => {
        end[property] = natural[property];
    });
    const endHeight = element.getBoundingClientRect().height;
    element.classList.toggle('is-open', open);
    if (!open) {
        const closed = getComputedStyle(element);
        end.height = '0px';
        end.opacity = 0;
        frameProperties.forEach(property => {
            // A hidden in-flow list owns no outside spacing. Opt-in choices
            // collapse that margin with the frame instead of dropping it at hide.
            end[property] = property.startsWith('margin') && !options.collapseMargins ? closed[property] : '0px';
        });
    }
    element.classList.add('is-easyedu-disclosing');
    if (level === 'full') {
        element.style.minHeight = '0';
        element.style.overflow = 'hidden';
    }
    element.style.transform = 'none';
    setWillChange(element, level, 'height, opacity');
    const distance = Math.abs((wasHidden ? 0 : rect.height) - (open ? endHeight : 0));
    const openDuration = options.duration || Math.round(320 + Math.min(100, distance * 0.15));
    // Closing a dropdown-like panel is faster than opening it (optional closeDuration).
    const duration = !open && options.closeDuration ? options.closeDuration : openDuration;
    return play(element, [start, end], {
        duration,
        easing: options.easing || easing,
    }, completed => {
        if (completed) {
            element.hidden = !open;
        }
        originalStyles.forEach(({property, value, priority}) => {
            if (value) {
                element.style.setProperty(property, value, priority);
            } else {
                element.style.removeProperty(property);
            }
        });
        element.classList.remove('is-easyedu-disclosing');
        if (completed && options.onComplete) {
            options.onComplete();
        }
    }, level, [{opacity: start.opacity}, {opacity: end.opacity}]);
};

export const expand = (element, options = {}) => {
    if (!element) {
        return Promise.resolve();
    }
    const currentHeight = element.getBoundingClientRect().height;
    cancel(element);
    element.hidden = false;
    element.classList.add('is-easyedu-disclosing');
    if (typeof options.prepare === 'function') {
        options.prepare();
    }
    const startHeight = currentHeight;
    const endHeight = Math.max(element.scrollHeight, element.getBoundingClientRect().height);
    const level = getLevel(element);
    if (level === 'full') {
        element.style.overflow = 'hidden';
    }
    setWillChange(element, level, 'height, opacity');

    return play(element, [
        {height: startHeight + 'px',
            opacity: options.fade === false ? 1 : expandFromOpacity(options)},
        {height: endHeight + 'px', opacity: 1},
    ], {
        duration: getDisclosureDuration(startHeight, endHeight, options.duration || durations.slow),
        easing: options.easing || disclosureEasing,
    }, completed => {
        if (completed) {
            element.hidden = false;
        }
        clearDisclosureStyles(element);
        element.classList.remove('is-easyedu-disclosing');
        if (completed && options.onComplete) {
            options.onComplete();
        }
    }, level, [{opacity: options.fade === false ? 0 : expandFromOpacity(options)}, {opacity: 1}]);
};

export const collapse = (element, options = {}) => {
    if (!element) {
        return Promise.resolve();
    }
    const currentHeight = element.getBoundingClientRect().height;
    cancel(element);
    const startHeight = currentHeight || element.scrollHeight;
    const level = getLevel(element);
    element.hidden = false;
    element.classList.add('is-easyedu-disclosing');
    if (level === 'full') {
        element.style.overflow = 'hidden';
    }
    setWillChange(element, level, 'height, opacity');

    return play(element, [
        {height: startHeight + 'px', opacity: 1},
        {height: '0px', opacity: options.fade === false ? 1 : 0},
    ], {
        duration: getDisclosureDuration(startHeight, 0, options.duration || durations.slow),
        easing: options.easing || disclosureEasing,
    }, completed => {
        if (completed && options.hideOnComplete !== false) {
            element.hidden = true;
        }
        clearDisclosureStyles(element);
        element.classList.remove('is-easyedu-disclosing');
        if (completed && options.onComplete) {
            options.onComplete();
        }
    }, level, [{opacity: 1}, {opacity: 0}]);
};

export const resize = (element, mutate, options = {}) => {
    if (!element || typeof mutate !== 'function') {
        return Promise.resolve();
    }
    const firstHeight = element.getBoundingClientRect().height;
    cancel(element);
    mutate();
    const lastHeight = element.getBoundingClientRect().height;
    const targetMaxHeight = element.style.maxHeight;
    const targetMinHeight = element.style.minHeight;
    // Height-only change: no fade to offer, so it is instant below the 'full' level.
    if (getLevel(element) !== 'full' || Math.abs(firstHeight - lastHeight) < 1) {
        if (options.onComplete) {
            options.onComplete();
        }
        return Promise.resolve(true);
    }
    element.style.maxHeight = 'none';
    element.style.minHeight = '0';
    element.style.overflow = 'clip';
    element.style.willChange = 'height';
    return play(element, [
        {height: firstHeight + 'px'},
        {height: lastHeight + 'px'},
    ], {
        duration: getDisclosureDuration(firstHeight, lastHeight, options.duration || durations.slow),
        easing: options.easing || disclosureEasing,
    }, completed => {
        clearDisclosureStyles(element);
        if (targetMaxHeight) {
            element.style.maxHeight = targetMaxHeight;
        } else {
            element.style.removeProperty('max-height');
        }
        if (targetMinHeight) {
            element.style.minHeight = targetMinHeight;
        } else {
            element.style.removeProperty('min-height');
        }
        if (completed && options.onComplete) {
            options.onComplete();
        }
    });
};

export const enter = (element, options = {}) => {
    if (!element) {
        return Promise.resolve();
    }
    element.hidden = false;
    setWillChange(element, getLevel(element), 'opacity, transform');
    return play(element, [
        {opacity: options.fromOpacity === undefined ? 0 : options.fromOpacity,
            transform: 'translateY(' + (options.distance || '0.22rem') + ')'},
        {opacity: 1, transform: 'translateY(0)'},
    ], {
        duration: options.duration || durations.normal,
        easing: options.easing || easing,
    }, () => clearDisclosureStyles(element));
};

export const exit = (element, options = {}) => {
    if (!element) {
        return Promise.resolve();
    }
    setWillChange(element, getLevel(element), 'opacity, transform');
    return play(element, [
        {opacity: 1, transform: 'translateY(0)'},
        {opacity: options.toOpacity === undefined ? 0 : options.toOpacity,
            transform: 'translateY(' + (options.distance || '-0.12rem') + ')'},
    ], {
        duration: options.duration || durations.fast,
        easing: options.easing || easing,
    }, completed => {
        clearDisclosureStyles(element);
        if (completed && options.hide) {
            element.hidden = true;
        }
    });
};

export const swap = (element, mutate, options = {}) => {
    if (!element || typeof mutate !== 'function') {
        return Promise.resolve();
    }
    cancel(element);
    if (!isEnabled(element)) {
        mutate();
        return Promise.resolve(true);
    }
    if (options.exit === false) {
        mutate();
        return enter(element, {
            duration: options.enterDuration || durations.normal,
            distance: options.distance || '0.1rem',
            easing: disclosureEasing,
            fromOpacity: options.swapOpacity === undefined ? 0.55 : options.swapOpacity,
        });
    }
    const firstHeight = element.getBoundingClientRect().height;
    return exit(element, {
        duration: options.exitDuration || durations.fast,
        distance: options.exitDistance === undefined ? '-0.08rem' : options.exitDistance,
        easing: disclosureEasing,
        toOpacity: options.swapOpacity === undefined ? 0.35 : options.swapOpacity,
    }).then(completed => {
        if (!completed) {
            return false;
        }
        mutate();
        if (options.resize === false) {
            return enter(element, {
                duration: options.enterDuration || durations.normal,
                distance: options.distance === undefined ? '0.16rem' : options.distance,
                easing: disclosureEasing,
                fromOpacity: options.swapOpacity === undefined ? 0.35 : options.swapOpacity,
            });
        }
        const lastHeight = element.getBoundingClientRect().height;
        const distance = options.distance === undefined ? '0.16rem' : options.distance;
        const level = getLevel(element);
        if (level === 'full') {
            element.style.overflow = 'clip';
        }
        setWillChange(element, level, 'height, opacity, transform');
        return play(element, [
            {height: firstHeight + 'px',
                opacity: options.swapOpacity === undefined ? 0.35 : options.swapOpacity,
                transform: 'translateY(' + distance + ')'},
            {height: lastHeight + 'px', opacity: 1, transform: 'translateY(0)'},
        ], {
            duration: options.enterDuration || durations.normal,
            easing: disclosureEasing,
        }, () => clearDisclosureStyles(element));
    });
};

const closingMenus = new WeakSet();
const menuCloseEasing = 'cubic-bezier(0.4, 0, 1, 1)';
const menuOpenDuration = durations.normal;
const menuCloseDuration = 130;

/**
 * Transform origin of a floating menu: the side that faces its anchor.
 *
 * @param {HTMLElement} menu Menu (visible).
 * @param {HTMLElement|null} anchor Trigger the menu hangs from.
 * @returns {{x: String, y: String}}
 */
const getMenuOrigin = (menu, anchor) => {
    if (!anchor || !anchor.getBoundingClientRect) {
        return {x: 'left', y: 'top'};
    }
    const menuRect = menu.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const y = menuRect.bottom <= anchorRect.top + 2 ? 'bottom' : 'top';
    const x = Math.abs(menuRect.right - anchorRect.right) < Math.abs(menuRect.left - anchorRect.left) ? 'right' : 'left';
    return {x, y};
};

/**
 * Whether a floating menu is currently playing its closing animation (it is then still not hidden).
 *
 * @param {HTMLElement} menu Menu.
 * @returns {Boolean}
 */
export const isMenuClosing = menu => !!menu && closingMenus.has(menu);

/**
 * Open a floating menu (dropdown, overflow or context menu) as one piece: container and items share
 * a single 160 ms animation, a fade plus a 5 px offset and a 0.98 to 1 scale from the anchor side.
 * Reduced level: 120 ms fade only. Minimal level: no animation. Re-opening a menu that is closing
 * resumes from its current opacity. No inline style remains afterwards.
 *
 * @param {HTMLElement} menu Menu element.
 * @param {Object} options anchor (trigger), origin ({x, y}).
 * @returns {Promise<boolean>} False when superseded.
 */
export const showMenu = (menu, options = {}) => {
    if (!menu) {
        return Promise.resolve(false);
    }
    const resumed = closingMenus.has(menu) && !menu.hidden;
    const startOpacity = resumed ? Math.min(0.9, parseFloat(getComputedStyle(menu).opacity) || 0) : 0;
    closingMenus.delete(menu);
    cancel(menu);
    menu.hidden = false;
    const level = getLevel(menu);
    if (level === 'minimal') {
        return Promise.resolve(true);
    }
    const origin = options.origin || getMenuOrigin(menu, options.anchor);
    const from = {opacity: startOpacity};
    const to = {opacity: 1};
    if (level === 'full') {
        from.transform = 'translateY(' + (origin.y === 'bottom' ? 5 : -5) + 'px) scale(0.98)';
        to.transform = 'none';
        from.transformOrigin = to.transformOrigin = origin.y + ' ' + origin.x;
    }
    return play(menu, [from, to], {
        duration: level === 'reduced' ? reducedFadeDuration : menuOpenDuration,
        easing,
    }, () => undefined, level);
};

/**
 * Close a floating menu: one faster animation (130 ms, 120 ms fade under reduced motion), then the
 * hidden attribute. The menu is inert while it leaves. Without animation it is hidden at once.
 *
 * @param {HTMLElement} menu Menu element.
 * @param {Object} options anchor (trigger), origin ({x, y}), onDone(completed).
 * @returns {Promise<boolean>} True when the menu is hidden, false when superseded.
 */
export const hideMenu = (menu, options = {}) => {
    if (!menu || menu.hidden) {
        return Promise.resolve(true);
    }
    if (closingMenus.has(menu)) {
        return Promise.resolve(false);
    }
    const level = getLevel(menu);
    const startOpacity = Math.min(1, parseFloat(getComputedStyle(menu).opacity) || 1);
    cancel(menu);
    if (level === 'minimal' || !menu.getClientRects().length) {
        menu.hidden = true;
        if (options.onDone) {
            options.onDone(true);
        }
        return Promise.resolve(true);
    }
    const origin = options.origin || getMenuOrigin(menu, options.anchor);
    const from = {opacity: startOpacity};
    const to = {opacity: 0};
    if (level === 'full') {
        from.transform = 'none';
        to.transform = 'translateY(' + (origin.y === 'bottom' ? 3 : -3) + 'px) scale(0.99)';
        from.transformOrigin = to.transformOrigin = origin.y + ' ' + origin.x;
    }
    closingMenus.add(menu);
    menu.inert = true;
    return play(menu, [from, to], {
        duration: level === 'reduced' ? reducedFadeDuration : menuCloseDuration,
        easing: menuCloseEasing,
    }, completed => {
        closingMenus.delete(menu);
        menu.inert = false;
        if (completed) {
            menu.hidden = true;
        }
        if (options.onDone) {
            options.onDone(completed);
        }
    }, level);
};

const drawerOpenDuration = 240;
const drawerCloseDuration = 180;
const drawerScrimDuration = 200;
const drawerOpenEasing = 'cubic-bezier(0, 0, 0.2, 1)';
const drawerCloseEasing = 'cubic-bezier(0.4, 0, 1, 1)';

/**
 * Slide a side drawer and its scrim. Full: the drawer slides from its edge in 240 ms ease-out and the
 * scrim fades in 200 ms; closing takes 180 ms. Reduced: 120 ms fades only, no slide. Minimal: no
 * animation. The caller owns the final state; the promise resolves once the transition is over.
 *
 * @param {HTMLElement} drawer Drawer element (already visible).
 * @param {HTMLElement} scrim Scrim element (already visible) or null.
 * @param {Boolean} open True to open, false to close.
 * @param {Object} options edge ('start' or 'end', default 'start').
 * @returns {Promise<boolean>} False when superseded by another transition.
 */
export const slideDrawer = (drawer, scrim, open, options = {}) => {
    if (!drawer) {
        return Promise.resolve(false);
    }
    const level = getLevel(drawer);
    const sign = options.edge === 'end' ? 1 : -1;
    const rtl = document.documentElement.dir === 'rtl';
    const hidden = 'translateX(' + (sign * (rtl ? -1 : 1) * 100) + '%)';
    const fade = level === 'reduced';
    const easingName = open ? drawerOpenEasing : drawerCloseEasing;
    if (scrim) {
        cancel(scrim);
        play(scrim, open ? [{opacity: 0}, {opacity: 1}] : [{opacity: 1}, {opacity: 0}], {
            duration: fade ? reducedFadeDuration : drawerScrimDuration,
            easing: easingName,
        }, () => undefined, level);
    }
    let keyframes = [{transform: hidden}, {transform: 'none'}];
    if (fade) {
        keyframes = [{opacity: 0}, {opacity: 1}];
    }
    if (!open) {
        keyframes = keyframes.slice().reverse();
    }
    let duration = open ? drawerOpenDuration : drawerCloseDuration;
    if (fade) {
        duration = reducedFadeDuration;
    }
    return play(drawer, keyframes, {
        duration,
        easing: easingName,
    }, () => undefined, level);
};

/**
 * Soft arrival of controls that appear together (for example the panel action buttons after a
 * layout swap): one fade plus a 4 px rise, 160 ms. Reduced motion: 120 ms fade; disabled: nothing.
 *
 * @param {HTMLElement} element Element to reveal (already visible).
 * @param {Object} options duration, distance (px), delay.
 * @returns {Promise<boolean>}
 */
export const reveal = (element, options = {}) => {
    if (!element) {
        return Promise.resolve(false);
    }
    const level = getLevel(element);
    if (level === 'minimal') {
        return Promise.resolve(true);
    }
    const from = {opacity: 0};
    const to = {opacity: 1};
    if (level === 'full') {
        from.transform = 'translateY(' + (options.distance === undefined ? 4 : options.distance) + 'px)';
        to.transform = 'none';
    }
    return play(element, [from, to], {
        duration: level === 'reduced' ? reducedFadeDuration : (options.duration || durations.normal),
        delay: level === 'reduced' ? 0 : (options.delay || 0),
        easing,
    }, () => undefined, level);
};

export const scroll = (element, options = {}) => {
    if (!element || typeof element.scrollIntoView !== 'function') {
        return;
    }
    element.scrollIntoView({
        behavior: scrollBehavior(element),
        block: options.block || 'start',
        inline: options.inline || 'nearest',
    });
};

export const init = root => {
    if (!root) {
        return;
    }
    // The system "reduce motion" preference is ignored unless the root opts in
    // (data-easyedu-respect-system-motion="1"); the legacy body classes follow that opt-in only.
    const sync = () => {
        root.classList.toggle('is-easyedu-motion-off', !isEnabled(root));
        const system = respectsSystemMotion(root) && !!(reducedMotionQuery && reducedMotionQuery.matches);
        document.body.classList.toggle('local-groupimport-prefers-reduced-motion', system);
        document.body.classList.toggle('easyedu-prefers-reduced-motion', system);
    };
    sync();
    if (reducedMotionQuery && reducedMotionQuery.addEventListener) {
        reducedMotionQuery.addEventListener('change', sync);
    }
    root.addEventListener('easyedu:motionlevelchange', sync);
};

export const timing = durations;
