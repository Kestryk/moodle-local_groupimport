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
 * EasyStud course manager: drag previews, auto-scroll and responsive drag availability.
 *
 * @module     local_groupimport/local/cm/drag_support
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

export const removeDragPreview = preview => {
    if (preview && preview.parentNode) {
        preview.parentNode.removeChild(preview);
    }
};

const getBlankDragImage = () => {
    let blank = document.getElementById('local-groupimport-easystud-blank-drag-canvas');
    if (!blank) {
        blank = document.createElement('canvas');
        blank.id = 'local-groupimport-easystud-blank-drag-canvas';
        blank.width = 1;
        blank.height = 1;
        blank.style.cssText = 'position:fixed;left:-1000px;top:-1000px;width:1px;height:1px;opacity:0;pointer-events:none;';
        document.body.appendChild(blank);
    }
    return blank;
};

// Portals live outside the EasyStud root. Relay resolved public theme tokens,
// not hard-coded component paint, so native dialogs and drag previews share
// the same Kit theme. Their ordinary geometry stays in canonical SCSS.
export const relayWorkspaceTheme = (workspace, portal) => {
    if (!workspace || !portal) {
        return;
    }
    const theme = window.getComputedStyle(workspace);
    // These opt-in tokens disappear on Restore defaults. A reused portal must
    // not retain its previous custom tint when the root no longer supplies it.
    portal.style.removeProperty('--easyedu-dialog-palette-primary-header');
    portal.style.removeProperty('--easyedu-dialog-palette-success-header');
    for (let index = 0; index < theme.length; index++) {
        const property = theme[index];
        if (property.startsWith('--easyedu-') || property.startsWith('--local-groupimport-')) {
            portal.style.setProperty(property, theme.getPropertyValue(property));
        }
    }
    portal.style.setProperty('--easyedu-font-family-ui', theme.fontFamily);
    portal.style.setProperty('--easyedu-drag-font-family', theme.fontFamily);
};

export const setStackedDragImage = (event, items, type) => {
    if (!event.dataTransfer || !items.length) {
        return null;
    }

    const source = items[0];
    const preview = document.createElement('div');
    preview.className = 'local-groupimport-easystud-drag-preview easyedu-drag-preview easyedu-drag-preview--' + type;
    // The fixed preview is portalled to body. Relay the workspace's resolved
    // Kit/theme tokens instead of recreating visual values in plugin code.
    const workspace = source.closest('#local-groupimport-easystud');
    relayWorkspaceTheme(workspace, preview);
    preview.setAttribute('aria-hidden', 'true');
    preview.setAttribute('inert', '');
    preview.style.left = Math.max(event.clientX - 24, 0) + 'px';
    preview.style.top = Math.max(event.clientY - 18, 0) + 'px';

    const card = document.createElement('div');
    card.className = 'easyedu-drag-preview__summary';
    const identity = document.createElement('span');
    identity.className = 'easyedu-drag-preview__identity';
    const title = document.createElement('span');
    title.className = 'easyedu-drag-preview__title';
    const sourceTitle = source.querySelector(type === 'participant' ?
        '.local-groupimport-easystud-user__name' : '.local-groupimport-easystud-group__name');
    title.textContent = sourceTitle?.textContent.trim() || '';
    card.append(identity, title);
    preview.appendChild(card);

    // Decorative movement state; its geometry belongs to the canonical Kit.
    const moving = document.createElement('span');
    moving.className = 'local-groupimport-easystud-drag-preview__moving';
    const movingIcon = document.createElement('span');
    movingIcon.className = 'local-groupimport-easystud-drag-preview__moving-icon';
    const movingLabel = document.createElement('span');
    movingLabel.textContent = workspace?.getAttribute('data-easystud-drag-moving-label') || '';
    moving.append(movingIcon, movingLabel);
    preview.appendChild(moving);

    if (items.length > 1) {
        preview.classList.add('has-stack');
        const badge = document.createElement('span');
        badge.className = 'local-groupimport-easystud-drag-preview__badge';
        badge.textContent = '+' + (items.length - 1);
        preview.appendChild(badge);
    }

    document.body.appendChild(preview);
    event.dataTransfer.setDragImage(getBlankDragImage(), 0, 0);
    return preview;
};

export const moveDragPreview = (preview, event) => {
    if (!preview) {
        return;
    }
    preview.style.left = Math.max(event.clientX - 24, 0) + 'px';
    preview.style.top = Math.max(event.clientY - 18, 0) + 'px';
};

/**
 * R10-23: scroll the real scroller (Moodle 5.1 scrolls #page, not the window) while a card is
 * dragged near its top or bottom edge, earlier than the browser does (a few pixels only). The
 * activation zone is 96 px (a quarter of a small scroller at most) and the speed grows towards
 * the edge. The dragged ghost follows the pointer in fixed position, so it stays in step.
 */
export const dragAutoScroll = (() => {
    const zone = 96;
    const maxStep = 18;
    let pointer = null;
    let frame = null;
    const scrollerOf = node => {
        for (let element = node instanceof Element ? node : null; element && element !== document.body;
            element = element.parentElement) {
            const overflow = window.getComputedStyle(element).overflowY;
            if ((overflow === 'auto' || overflow === 'scroll') && element.scrollHeight > element.clientHeight + 1) {
                return element;
            }
        }
        return document.scrollingElement || document.documentElement;
    };
    const step = () => {
        frame = null;
        // Browsers repeat dragover about every 50 ms while dragging: a silent pointer is stale.
        if (!pointer || window.performance.now() - pointer.time > 200) {
            return;
        }
        const scroller = pointer.scroller;
        const pageScroller = scroller === document.scrollingElement || scroller === document.documentElement;
        const bounds = pageScroller ? {top: 0, bottom: window.innerHeight} : scroller.getBoundingClientRect();
        const size = Math.min(zone, (bounds.bottom - bounds.top) / 4);
        let delta = 0;
        if (pointer.y < bounds.top + size) {
            delta = -maxStep * Math.min(1, (bounds.top + size - pointer.y) / size);
        } else if (pointer.y > bounds.bottom - size) {
            delta = maxStep * Math.min(1, (pointer.y - (bounds.bottom - size)) / size);
        }
        const before = scroller.scrollTop;
        if (delta) {
            const nextScrollTop = before + Math.round(delta);
            if (document.body?.classList.contains('local-groupimport-host-moodle53')) {
                // Moodle 5.3 can route this drag scroll to Boost's smooth-scrolling page root.
                // A deferred scrollTop write can leave the immediate read unchanged and stop this rAF loop.
                // Apply each 5.3 frame immediately instead of restarting scrolling in dragover pulses.
                scroller.scrollTo({top: nextScrollTop, behavior: 'instant'});
            } else {
                // Preserve the existing behavior on Moodle 4.5/5.1.
                scroller.scrollTop = nextScrollTop;
            }
        }
        if (delta && scroller.scrollTop !== before) {
            frame = window.requestAnimationFrame(step);
        }
    };
    const stop = () => {
        pointer = null;
        if (frame !== null) {
            window.cancelAnimationFrame(frame);
            frame = null;
        }
    };
    // A dropped card may be redrawn (on demand) before its dragend reaches the page: stop on the document.
    ['drop', 'dragend'].forEach(type => document.addEventListener(type, stop, true));
    return {
        update: event => {
            pointer = {y: event.clientY, scroller: scrollerOf(event.target), time: window.performance.now()};
            if (frame === null) {
                frame = window.requestAnimationFrame(step);
            }
        },
        stop,
    };
})();

export const isResponsiveDragSuppressed = () => {
    return window.matchMedia &&
        window.matchMedia('(hover: none), (pointer: coarse), (max-width: 1024px)').matches;
};

const dragInteractiveSelector =
    'button, a, input, textarea, select, form, [contenteditable="true"], .local-groupimport-easystud-selector';

export const isDragInteractiveTarget = target => {
    return !!(target && target.closest && target.closest(dragInteractiveSelector));
};

const hasFocusedDragControl = item => {
    const active = document.activeElement;
    return !!(active && item.contains(active) && isDragInteractiveTarget(active));
};

/**
 * Empty-state hint of a group or grouping card: the drag wording only while dragging is available.
 *
 * @param {HTMLElement} help Hint element (Kit empty-state help).
 * @param {String} dragText Text when dragging is enabled.
 * @param {String} touchText Text when dragging is disabled.
 */
export const setEmptyHelp = (help, dragText, touchText) => {
    help.setAttribute('data-easystud-empty-help', '');
    help.setAttribute('data-drag-text', dragText || '');
    help.setAttribute('data-touch-text', touchText || '');
    help.textContent = (isResponsiveDragSuppressed() && touchText ? touchText : dragText) || '';
};

export const syncResponsiveDragAvailability = root => {
    const disabled = isResponsiveDragSuppressed();
    root.classList.toggle('local-groupimport-easystud--touch-drag-disabled', disabled);
    root.querySelectorAll('[data-easystud-empty-help]').forEach(help => {
        const text = disabled && help.getAttribute('data-touch-text') ?
            help.getAttribute('data-touch-text') : help.getAttribute('data-drag-text');
        if (text && help.textContent !== text) {
            help.textContent = text;
        }
    });
    root.querySelectorAll('[data-easystud-user], [data-easystud-group-id]').forEach(item => {
        item.setAttribute('draggable', disabled || hasFocusedDragControl(item) ? 'false' : 'true');
    });
};

export const getGroupingDropIdForGroup = group => {
    const section = group ? group.closest('[data-easystud-grouping-drop]') : null;
    return section ? (section.getAttribute('data-easystud-grouping-drop') || '0') : '0';
};
