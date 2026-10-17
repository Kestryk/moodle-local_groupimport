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
 * The single EasyEdu Kit bubble (K-BUBBLE): one controller behind every EasyStud and Guide hover bubble.
 *
 * Callers own their event wiring and decide when a trigger deserves a bubble; this module owns the
 * markup, placement, WCAG 1.4.13 grace period and fade. Motion is injected so the file has no import
 * and stays byte-identical in the Kit and in each plugin.
 *
 * @module     local_groupimport/easyedu_bubble
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

export const BUBBLE_CLASS = 'local-groupimport-easystud-hover-popover';
// WCAG 1.4.13 grace period: the pointer may cross the gap between a trigger and its bubble.
export const GRACE_MS = 220;
const LONG_TEXT = 110;
const MARGIN = 8;
const GAP = 10;

/**
 * Place a mounted bubble above its trigger, or below it when there is no room above, inside the viewport.
 *
 * @param {HTMLElement} bubble Mounted bubble.
 * @param {HTMLElement} node Trigger.
 */
const place = (bubble, node) => {
    const view = bubble.ownerDocument.defaultView;
    const anchor = node.getBoundingClientRect();
    bubble.style.position = 'fixed';
    // The width (hence the wrapped height) depends on the left offset of a fixed box: settle the horizontal
    // position first, then measure the real size before choosing the side.
    const alignLeft = () => {
        const width = bubble.getBoundingClientRect().width;
        bubble.style.left = Math.max(MARGIN, Math.min(anchor.left + (anchor.width - width) / 2,
            view.innerWidth - width - MARGIN)) + 'px';
    };
    bubble.style.top = '0px';
    alignLeft();
    alignLeft();
    const size = bubble.getBoundingClientRect();
    // Visible top of the surface: the viewport, or the full-screen / mount container when it starts lower.
    const host = bubble.parentElement;
    const isRoot = !host || host === bubble.ownerDocument.body || host === bubble.ownerDocument.documentElement;
    const floor = Math.max(0, isRoot ? 0 : host.getBoundingClientRect().top) + MARGIN;
    const below = anchor.top - size.height - GAP < floor;
    bubble.classList.toggle(BUBBLE_CLASS + '--top', !below);
    bubble.classList.toggle(BUBBLE_CLASS + '--bottom', below);
    bubble.style.top = (below ? anchor.bottom + GAP : anchor.top - size.height - GAP) + 'px';
};

/**
 * Create the bubble controller of one surface. A single bubble is ever visible in the document.
 *
 * @param {Object} options
 * @param {Object} options.Motion The EasyEdu Motion module (enter, exit, cancel, timing).
 * @param {Function} options.mount Returns the element that receives the bubble for a trigger
 *     (the fullscreen element when there is one, so the bubble stays visible).
 * @param {Function} [options.decorate] Called with each new bubble before it is mounted.
 * @return {Object} show(node, text), hide(immediate), scheduleHide(), cancelGrace(), isOpen(), isActive(node),
 *     contains(node).
 */
export const createBubbleController = ({Motion, mount, decorate = null}) => {
    let tip = null;
    let anchor = null;
    let graceTimer = null;

    const cancelGrace = () => {
        if (graceTimer !== null) {
            window.clearTimeout(graceTimer);
        }
        graceTimer = null;
    };

    // A leaving bubble is inert and fades out (instant at the Minimal motion level).
    const hide = (immediate = true) => {
        cancelGrace();
        const leaving = tip;
        tip = null;
        anchor = null;
        if (!leaving) {
            return;
        }
        if (immediate || leaving.hasAttribute('data-easystud-leaving')) {
            Motion.cancel(leaving);
            leaving.remove();
            return;
        }
        leaving.setAttribute('data-easystud-leaving', '1');
        leaving.style.pointerEvents = 'none';
        void Motion.exit(leaving, {distance: '0rem', duration: Motion.timing.normal}).then(() => leaving.remove());
    };

    // The bubble stays while it is hovered; it leaves shortly after the pointer leaves both it and its trigger.
    const scheduleHide = () => {
        cancelGrace();
        graceTimer = window.setTimeout(() => hide(false), GRACE_MS);
    };

    const show = (node, text) => {
        const copy = String(text || '').trim();
        if (tip && anchor === node) {
            cancelGrace();
            return;
        }
        hide();
        if (!copy || !node) {
            return;
        }
        const host = mount(node);
        const document = host.ownerDocument;
        document.querySelectorAll('.' + BUBBLE_CLASS + '[data-easystud-leaving]').forEach(old => {
            Motion.cancel(old);
            old.remove();
        });
        const bubble = document.createElement('div');
        bubble.className = 'popover ' + BUBBLE_CLASS + ' ' + BUBBLE_CLASS + '--top show';
        bubble.classList.toggle(BUBBLE_CLASS + '--long', copy.length > LONG_TEXT);
        bubble.setAttribute('role', 'tooltip');
        const arrow = document.createElement('div');
        arrow.className = 'popover-arrow';
        const body = document.createElement('div');
        body.className = 'popover-body';
        body.textContent = copy;
        bubble.append(arrow, body);
        // WCAG 1.4.13: the pointer may move onto the bubble, which then stays visible.
        bubble.addEventListener('pointerenter', cancelGrace);
        bubble.addEventListener('pointerleave', event => {
            if (!(event.relatedTarget instanceof document.defaultView.Node) || !node.contains(event.relatedTarget)) {
                scheduleHide();
            }
        });
        if (decorate) {
            decorate(bubble);
        }
        tip = bubble;
        anchor = node;
        host.appendChild(bubble);
        place(bubble, node);
        void Motion.enter(bubble, {distance: '0rem', duration: Motion.timing.normal});
    };

    return {
        show,
        hide,
        scheduleHide,
        cancelGrace,
        isOpen: () => tip !== null,
        isActive: node => tip !== null && anchor === node,
        contains: node => tip !== null && node instanceof tip.ownerDocument.defaultView.Node && tip.contains(node),
    };
};
