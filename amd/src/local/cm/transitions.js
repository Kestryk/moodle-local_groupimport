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
 * EasyStud course manager: responsive micro-animations driven by the Web Animations API
 * (view switch, list arrival, sticky selection bar).
 *
 * No animation ever delays state, focus or keyboard behaviour: the DOM is updated first and the
 * motion is purely visual (no inline style is left behind). Under reduced motion only a 120 ms
 * fade runs; with the plugin animations disabled nothing runs.
 *
 * @module     local_groupimport/local/cm/transitions
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const easeOut = 'cubic-bezier(0.22, 1, 0.36, 1)';
const reducedDuration = 120;
const running = new WeakMap();
let arrivalSuppressed = 0;

/**
 * Motion level for an element: 'full', 'reduced' (fades only) or 'none'.
 *
 * @param {HTMLElement} element Element to animate.
 * @returns {String}
 */
const motionLevel = element => {
    if (!element || typeof element.animate !== 'function') {
        return 'none';
    }
    const policyRoot = element.closest ? element.closest('[data-easyedu-motion-policy]') : null;
    if ((policyRoot && policyRoot.getAttribute('data-easyedu-motion-policy') === 'disabled') ||
            (document.body && document.body.classList.contains('easyedu-motion-disabled'))) {
        return 'none';
    }
    const reduced = (document.body && document.body.classList.contains('easyedu-prefers-reduced-motion')) ||
        !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    return reduced ? 'reduced' : 'full';
};

/**
 * Cancel the transition running on an element, if any.
 *
 * @param {HTMLElement} element Element.
 */
const cancelRunning = element => {
    const current = running.get(element);
    if (current) {
        running.delete(element);
        current.cancel();
    }
};

/**
 * Play a transient animation on an element (cancelling the previous one on the same element).
 *
 * @param {HTMLElement} element Element.
 * @param {Object} from Keyframe at the start ({opacity, transform}).
 * @param {Object} options {duration, delay, to, fill, easing}.
 * @returns {Promise} Resolves when the animation ended or was cancelled.
 */
const run = (element, from, options = {}) => {
    cancelRunning(element);
    const level = motionLevel(element);
    if (level === 'none') {
        return Promise.resolve('none');
    }
    const start = Object.assign({}, from);
    const end = Object.assign({opacity: 1, transform: 'none'}, options.to || {});
    if (level === 'reduced') {
        delete start.transform;
        delete end.transform;
    }
    const animation = element.animate([start, end], {
        duration: level === 'reduced' ? reducedDuration : options.duration,
        delay: level === 'reduced' ? 0 : (options.delay || 0),
        easing: options.easing || easeOut,
        fill: options.fill || 'backwards',
    });
    running.set(element, animation);
    const settle = () => {
        if (running.get(element) === animation) {
            running.delete(element);
        }
        return level;
    };
    return animation.finished.then(settle, settle);
};

/**
 * Incoming compact view: fade plus an 8 px slide in the direction of the chosen tab (200 ms).
 *
 * @param {HTMLElement} panel Incoming panel (already visible).
 * @param {Number} direction 1 for a tab after the previous one, -1 for a tab before it.
 * @returns {Promise}
 */
export const animateViewIn = (panel, direction) => {
    const rtl = document.documentElement.dir === 'rtl' ? -1 : 1;
    return run(panel, {opacity: 0, transform: 'translateX(' + (8 * direction * rtl) + 'px)'}, {duration: 200});
};

/**
 * Run a view switch without list arrival animations (the view animation covers it).
 *
 * @param {Function} callback State change.
 */
export const withoutListArrival = callback => {
    arrivalSuppressed++;
    try {
        callback();
    } finally {
        arrivalSuppressed--;
    }
};

/**
 * Cards of a freshly changed list: fade plus 6 px rise, 30 ms stagger for the first six, the rest
 * together with the sixth (160 ms).
 *
 * Call it only when the page content really changed, never on a state refresh.
 *
 * @param {HTMLElement[]} cards New cards.
 */
export const animateListArrival = cards => {
    if (!cards || !cards.length || arrivalSuppressed) {
        return;
    }
    cards.forEach((card, index) => {
        run(card, {opacity: 0, transform: 'translateY(6px)'}, {
            duration: 160,
            delay: Math.min(index, 5) * 30,
        });
    });
};

/**
 * Remember the ids shown by a list and tell whether they differ from the previous page.
 *
 * @param {HTMLElement} list List.
 * @param {Array} pageIds Ids of the page about to be shown.
 * @returns {Boolean} True when the page content differs from the previous one.
 */
export const listPageChanged = (list, pageIds) => {
    const signature = pageIds.join(',');
    const changed = list.easystudArrivalSignature !== signature;
    list.easystudArrivalSignature = signature;
    return changed;
};

/**
 * Forget a list's page, so its next render counts as an arrival (the list was emptied).
 *
 * @param {HTMLElement} list List.
 */
export const resetListPage = list => {
    list.easystudArrivalSignature = null;
};

/**
 * Show or hide the sticky selection bar. The state is exposed as data-easystud-selection-bar
 * ("visible" or "hidden"); "hidden" is only set once the descent is over and the bar has its
 * hidden attribute.
 *
 * First selection: rise 16 px plus fade, 200 ms. Back to zero: descend 160 ms, then hide.
 *
 * @param {HTMLElement} bar Selection bar.
 * @param {Boolean} visible Whether something is selected.
 */
export const setSelectionBar = (bar, visible) => {
    bar.easystudBarWanted = visible;
    const finishHide = () => {
        bar.hidden = true;
        bar.setAttribute('data-easystud-selection-bar', 'hidden');
    };
    if (visible) {
        const wasShown = !bar.hidden;
        bar.setAttribute('data-easystud-selection-bar', 'visible');
        if (!wasShown) {
            bar.hidden = false;
            run(bar, {opacity: 0, transform: 'translateY(16px)'}, {duration: 200});
        } else if (bar.easystudBarHiding) {
            // Selected again during the descent: come back from where the bar is.
            bar.easystudBarHiding = false;
            run(bar, {opacity: 0.5, transform: 'translateY(8px)'}, {duration: 200});
        }
        return;
    }
    if (bar.hidden || bar.easystudBarHiding) {
        if (bar.hidden) {
            bar.setAttribute('data-easystud-selection-bar', 'hidden');
        }
        return;
    }
    if (!bar.getClientRects().length || motionLevel(bar) === 'none') {
        finishHide();
        return;
    }
    bar.easystudBarHiding = true;
    run(bar, {opacity: 1, transform: 'none'}, {
        duration: 160,
        fill: 'forwards',
        to: {opacity: 0, transform: 'translateY(16px)'},
    }).then(() => {
        if (!bar.easystudBarHiding) {
            return false;
        }
        bar.easystudBarHiding = false;
        if (!bar.easystudBarWanted) {
            finishHide();
            // Drop the forwards fill, or it would hide the bar the next time it is shown.
            bar.getAnimations().forEach(animation => animation.cancel());
        }
        return true;
    }).catch(() => undefined);
};
