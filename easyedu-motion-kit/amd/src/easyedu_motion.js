// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Cancellable EasyEdu motion orchestration for Moodle plugins.
 *
 * Consumers should copy this module into their AMD namespace and keep the
 * public data attribute and method contract unchanged.
 *
 * @module     easyedu_ui_kit/easyedu_motion
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const activeAnimations = new WeakMap();
const reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
const durations = {fast: 100, normal: 160, slow: 220};
const easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
const disclosureEasing = 'cubic-bezier(0.4, 0, 0.2, 1)';

const getDisclosureDuration = (startHeight, endHeight, baseDuration) => {
    const distance = Math.abs(endHeight - startHeight);
    const extraDuration = Math.min(40, Math.max(0, distance - 240) * 0.1);
    const distanceDuration = durations.fast + Math.min(120, distance * 0.35);
    return Math.round(Math.min(baseDuration + extraDuration, distanceDuration));
};

const getRoot = element => {
    if (!element) {
        return null;
    }
    if (element.matches && element.matches('[data-easyedu-motion-policy]')) {
        return element;
    }
    return element.closest ? element.closest('[data-easyedu-motion-policy]') : null;
};

export const isEnabled = element => {
    const root = getRoot(element);
    const bodyDisabled = !!(document.body && document.body.classList.contains('easyedu-motion-disabled'));
    return (!root || root.getAttribute('data-easyedu-motion-policy') !== 'disabled') && !bodyDisabled &&
        !(reducedMotionQuery && reducedMotionQuery.matches);
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

const play = (element, keyframes, options, cleanup) => {
    cancel(element);
    if (!isEnabled(element) || typeof element.animate !== 'function') {
        cleanup(true);
        return Promise.resolve(true);
    }
    const animation = element.animate(keyframes, Object.assign({
        duration: durations.normal,
        easing,
        fill: 'both',
    }, options));
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

const clearStyles = element => {
    ['height', 'opacity', 'overflow', 'transform', 'will-change'].forEach(property =>
        element.style.removeProperty(property));
};

export const expand = (element, options = {}) => {
    if (!element) {
        return Promise.resolve(false);
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
    element.style.overflow = 'hidden';
    element.style.willChange = 'height, opacity';
    return play(element, [
        {height: startHeight + 'px', opacity: options.fade === false ? 1 : 0.35},
        {height: endHeight + 'px', opacity: 1},
    ], {
        duration: getDisclosureDuration(startHeight, endHeight, options.duration || durations.slow),
        easing: options.easing || disclosureEasing,
    }, completed => {
        if (completed) {
            element.hidden = false;
        }
        clearStyles(element);
        element.classList.remove('is-easyedu-disclosing');
        if (completed && options.onComplete) {
            options.onComplete();
        }
    });
};

export const collapse = (element, options = {}) => {
    if (!element) {
        return Promise.resolve(false);
    }
    const currentHeight = element.getBoundingClientRect().height;
    cancel(element);
    const startHeight = currentHeight || element.scrollHeight;
    element.hidden = false;
    element.classList.add('is-easyedu-disclosing');
    element.style.overflow = 'hidden';
    element.style.willChange = 'height, opacity';
    return play(element, [
        {height: startHeight + 'px', opacity: 1},
        {height: '0px', opacity: options.fade === false ? 1 : 0},
    ], {
        duration: getDisclosureDuration(startHeight, 0, options.duration || durations.slow),
        easing: options.easing || disclosureEasing,
    }, completed => {
        if (completed) {
            element.hidden = true;
        }
        clearStyles(element);
        element.classList.remove('is-easyedu-disclosing');
        if (completed && options.onComplete) {
            options.onComplete();
        }
    });
};

export const resize = (element, mutate, options = {}) => {
    if (!element || typeof mutate !== 'function') {
        return Promise.resolve(false);
    }
    const firstHeight = element.getBoundingClientRect().height;
    cancel(element);
    mutate();
    const lastHeight = element.getBoundingClientRect().height;
    const targetMaxHeight = element.style.maxHeight;
    const targetMinHeight = element.style.minHeight;
    if (!isEnabled(element) || Math.abs(firstHeight - lastHeight) < 1) {
        if (options.onComplete) {
            options.onComplete();
        }
        return Promise.resolve(true);
    }
    element.style.maxHeight = 'none';
    element.style.minHeight = '0';
    element.style.overflow = 'clip';
    element.style.willChange = 'height';
    return play(element, [{height: firstHeight + 'px'}, {height: lastHeight + 'px'}],
        {
            duration: getDisclosureDuration(firstHeight, lastHeight, options.duration || durations.slow),
            easing: options.easing || disclosureEasing,
        }, completed => {
            clearStyles(element);
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
        return Promise.resolve(false);
    }
    element.hidden = false;
    element.style.willChange = 'opacity, transform';
    return play(element, [
        {opacity: options.fromOpacity === undefined ? 0 : options.fromOpacity,
            transform: 'translateY(' + (options.distance || '0.22rem') + ')'},
        {opacity: 1, transform: 'translateY(0)'},
    ], {
        duration: options.duration || durations.normal,
        easing: options.easing || easing,
    }, () => clearStyles(element));
};

export const exit = (element, options = {}) => {
    if (!element) {
        return Promise.resolve(false);
    }
    element.style.willChange = 'opacity, transform';
    return play(element, [
        {opacity: 1, transform: 'translateY(0)'},
        {opacity: options.toOpacity === undefined ? 0 : options.toOpacity,
            transform: 'translateY(' + (options.distance || '-0.12rem') + ')'},
    ], {
        duration: options.duration || durations.fast,
        easing: options.easing || easing,
    }, completed => {
        clearStyles(element);
        if (completed && options.hide) {
            element.hidden = true;
        }
    });
};

export const swap = (element, mutate, options = {}) => {
    if (!element || typeof mutate !== 'function') {
        return Promise.resolve(false);
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
        element.style.overflow = 'clip';
        element.style.willChange = 'height, opacity, transform';
        return play(element, [
            {height: firstHeight + 'px',
                opacity: options.swapOpacity === undefined ? 0.35 : options.swapOpacity,
                transform: 'translateY(' + distance + ')'},
            {height: lastHeight + 'px', opacity: 1, transform: 'translateY(0)'},
        ], {
            duration: options.enterDuration || durations.normal,
            easing: disclosureEasing,
        }, () => clearStyles(element));
    });
};

export const scroll = (element, options = {}) => {
    if (element && element.scrollIntoView) {
        element.scrollIntoView({
            behavior: isEnabled(element) ? 'smooth' : 'auto',
            block: options.block || 'start',
            inline: options.inline || 'nearest',
        });
    }
};

export const init = root => {
    if (!root) {
        return;
    }
    const sync = () => {
        root.classList.toggle('is-easyedu-motion-off', !isEnabled(root));
        document.body.classList.toggle('easyedu-prefers-reduced-motion',
            !!(reducedMotionQuery && reducedMotionQuery.matches));
    };
    sync();
    if (reducedMotionQuery && reducedMotionQuery.addEventListener) {
        reducedMotionQuery.addEventListener('change', sync);
    }
};

export const timing = durations;
