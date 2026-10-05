/**
 * EasyEdu progressive sRGB picker. The named Hex field remains authoritative.
 * Presentation uses public Kit classes; dynamic variables carry colour only.
 * Native dialog owns modality, Escape, focus containment and background inertness.
 */
(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.EasyEduColourPicker = factory();
    }
}(typeof window === 'undefined' ? globalThis : window, function() {
    'use strict';
    var nextId = 0;
    var instances = new WeakMap();
    var validHex = /^#[0-9a-f]{6}$/i;
    var palette = ['#0F6CBF', '#198754', '#0DCAF0', '#0F3134', '#FFFFFF', '#000000'];
    var toHex = function(h, s, v) {
        var c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
        var rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] :
            h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
        return '#' + rgb.map(function(channel) {
            return Math.round((channel + m) * 255).toString(16).padStart(2, '0');
        }).join('').toUpperCase();
    };
    var toHsv = function(hex) {
        if (!validHex.test(hex)) { throw new TypeError('Expected six-digit sRGB Hex'); }
        var rgb = [1, 3, 5].map(function(i) { return parseInt(hex.slice(i, i + 2), 16) / 255; });
        var max = Math.max.apply(null, rgb), min = Math.min.apply(null, rgb), d = max - min, h = 0;
        if (d) {
            h = max === rgb[0] ? ((rgb[1] - rgb[2]) / d) % 6 :
                max === rgb[1] ? (rgb[2] - rgb[0]) / d + 2 : (rgb[0] - rgb[1]) / d + 4;
            h = (h * 60 + 360) % 360;
        }
        return [h, max ? d / max : 0, max];
    };
    /** Enhance one native swatch/Hex pair, or retain fallback if unsupported. */
    var enhance = function(control, labels) {
        if (instances.has(control)) { return instances.get(control); }
        var doc = control.ownerDocument, win = doc.defaultView;
        var native = control.querySelector('.easyedu-color-picker__swatch');
        var hex = control.querySelector('.easyedu-color-picker__hex');
        if (!native || !hex || !win.HTMLDialogElement || !win.HTMLDialogElement.prototype.showModal ||
                hex.disabled || hex.readOnly || native.disabled) { return null; }
        ['title', 'hue', 'saturation', 'brightness', 'palette', 'hex', 'invalid', 'cancel', 'apply'].forEach(function(key) {
            if (!labels || typeof labels[key] !== 'string' || !labels[key]) {
                throw new TypeError('Missing translated picker label: ' + key);
            }
        });
        var id = 'easyedu-colour-panel-' + (++nextId), removers = [];
        var el = function(tag, cls, text, parent) {
            var n = doc.createElement(tag);
            if (cls) { n.className = cls; }
            if (text) { n.textContent = text; }
            if (parent) { parent.appendChild(n); }
            return n;
        };
        var on = function(node, type, handler) {
            node.addEventListener(type, handler);
            removers.push(function() { node.removeEventListener(type, handler); });
        };
        var trigger = el('button', 'easyedu-color-picker__trigger');
        trigger.type = 'button';
        trigger.setAttribute('aria-label', labels.title);
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute('aria-controls', id);
        var host = el('div', 'easyedu-ui', null, doc.body);
        var dialog = el('dialog', 'easyedu-color-panel', null, host);
        dialog.id = id;
        if (control.classList.contains('easyedu-color-picker--small')) { dialog.classList.add('easyedu-color-panel--small'); }
        if (control.classList.contains('easyedu-color-picker--large')) { dialog.classList.add('easyedu-color-panel--large'); }
        var title = el('h2', 'easyedu-color-panel__title', labels.title, dialog);
        title.id = id + '-title';
        dialog.setAttribute('aria-labelledby', title.id);
        var plane = el('div', 'easyedu-color-panel__plane', null, dialog);
        plane.setAttribute('aria-hidden', 'true');
        el('span', 'easyedu-color-panel__handle', null, plane);
        var sliders = el('div', 'easyedu-color-panel__sliders', null, dialog);
        var ranges = ['hue', 'saturation', 'brightness'].map(function(key, index) {
            var row = el('label', 'easyedu-color-panel__slider', null, sliders);
            el('span', '', labels[key], row);
            var range = el('input', '', null, row);
            range.type = 'range'; range.min = '0'; range.max = index ? '100' : '359'; range.step = '1';
            range.setAttribute('data-easyedu-color-axis', key);
            return range;
        });
        el('p', 'easyedu-color-panel__palette-title', labels.palette, dialog);
        var presets = el('div', 'easyedu-color-panel__palette', null, dialog);
        palette.forEach(function(value) {
            var button = el('button', 'easyedu-color-panel__preset', null, presets);
            button.type = 'button';
            button.style.setProperty('--easyedu-color-current', value);
            button.setAttribute('aria-label', value);
            on(button, 'click', function() { setDraft(value); });
        });
        var hexLabel = el('label', 'easyedu-color-panel__hex', labels.hex, dialog);
        var draft = el('input', '', null, hexLabel);
        draft.type = 'text'; draft.maxLength = 7; draft.autocomplete = 'off'; draft.spellcheck = false;
        draft.setAttribute('aria-describedby', id + '-error');
        var error = el('p', 'easyedu-color-panel__error', labels.invalid, dialog);
        error.id = id + '-error'; error.setAttribute('role', 'status'); error.hidden = true;
        var footer = el('div', 'easyedu-dialog-actions', null, dialog);
        var cancel = el('button', 'easyedu-button--secondary', labels.cancel, footer);
        var apply = el('button', 'easyedu-button', labels.apply, footer);
        cancel.type = apply.type = 'button';
        var hsv = [0, 0, 0], pointer = null;
        var setInvalid = function(invalid) {
            draft.setAttribute('aria-invalid', invalid ? 'true' : 'false');
            error.hidden = !invalid; apply.disabled = invalid;
        };
        var paint = function() {
            var value = toHex(hsv[0], hsv[1], hsv[2]);
            dialog.style.setProperty('--easyedu-color-current', value);
            dialog.style.setProperty('--easyedu-color-hue', toHex(hsv[0], 1, 1));
            dialog.style.setProperty('--easyedu-color-saturation', (hsv[1] * 100) + '%');
            dialog.style.setProperty('--easyedu-color-value', ((1 - hsv[2]) * 100) + '%');
            Array.prototype.forEach.call(presets.children, function(button) {
                button.setAttribute('aria-pressed', button.getAttribute('aria-label') === value ? 'true' : 'false');
            });
            ranges.forEach(function(range, i) { range.value = String(Math.round(hsv[i] * (i ? 100 : 1))); });
        };
        var setDraft = function(value) {
            draft.value = value.toUpperCase(); hsv = toHsv(value); setInvalid(false); paint();
        };
        var syncTrigger = function() {
            var value = validHex.test(hex.value) ? hex.value : native.value;
            trigger.style.setProperty('--easyedu-color-current', value);
            trigger.disabled = hex.disabled || hex.readOnly || native.disabled;
        };
        var close = function() { if (dialog.open) { dialog.close(); } };
        var pointerUpdate = function(event) {
            var r = plane.getBoundingClientRect();
            hsv[1] = Math.max(0, Math.min(1, (event.clientX - r.left) / r.width));
            hsv[2] = 1 - Math.max(0, Math.min(1, (event.clientY - r.top) / r.height));
            draft.value = toHex(hsv[0], hsv[1], hsv[2]); setInvalid(false); paint();
        };
        on(plane, 'pointerdown', function(event) {
            if (!event.isPrimary || event.button !== 0) { return; }
            event.preventDefault(); pointer = event.pointerId; plane.setPointerCapture(pointer); pointerUpdate(event);
        });
        on(plane, 'pointermove', function(event) { if (pointer === event.pointerId) { pointerUpdate(event); } });
        on(plane, 'lostpointercapture', function() { pointer = null; });
        on(plane, 'pointerup', function(event) { if (pointer === event.pointerId) { plane.releasePointerCapture(pointer); } });
        ranges.forEach(function(range, i) {
            on(range, 'input', function() {
                hsv[i] = Number(range.value) / (i ? 100 : 1);
                draft.value = toHex(hsv[0], hsv[1], hsv[2]); setInvalid(false); paint();
            });
        });
        on(draft, 'input', function() {
            var valid = validHex.test(draft.value); setInvalid(!valid);
            if (valid) { hsv = toHsv(draft.value); paint(); }
        });
        on(dialog, 'keydown', function(event) {
            // This dialog can be physically inside a native admin form in later adapters.
            // Enter in Hex must apply the draft, never submit the underlying settings.
            if (event.key === 'Enter' && event.target === draft) {
                event.preventDefault(); if (!apply.disabled) { apply.click(); }
            }
        });
        on(cancel, 'click', close);
        on(apply, 'click', function() {
            if (!validHex.test(draft.value)) { setInvalid(true); draft.focus(); return; }
            if (hex.disabled || hex.readOnly || native.disabled) { close(); return; }
            hex.value = draft.value.toUpperCase();
            hex.dispatchEvent(new win.Event('input', {bubbles: true}));
            hex.dispatchEvent(new win.Event('change', {bubbles: true}));
            syncTrigger(); close();
        });
        on(dialog, 'close', function() {
            trigger.setAttribute('aria-expanded', 'false');
            if (trigger.isConnected && !trigger.disabled) { trigger.focus(); }
        });
        var open = function() {
            if (dialog.open || trigger.disabled || hex.disabled || hex.readOnly || native.disabled) { return; }
            var motionRoot = control.closest('[data-easyedu-motion-policy]');
            if (motionRoot) { host.setAttribute('data-easyedu-motion-policy', motionRoot.getAttribute('data-easyedu-motion-policy')); }
            else { host.removeAttribute('data-easyedu-motion-policy'); }
            setDraft(validHex.test(hex.value) ? hex.value : native.value);
            dialog.showModal(); trigger.setAttribute('aria-expanded', 'true'); draft.focus();
        };
        on(trigger, 'click', open);
        on(hex, 'input', syncTrigger); on(hex, 'change', syncTrigger); on(native, 'input', syncTrigger);
        var originalHidden = native.hidden;
        native.before(trigger); native.hidden = true; syncTrigger();
        var api = {open: open, destroy: function() {
            close(); removers.forEach(function(remove) { remove(); });
            trigger.remove(); host.remove(); native.hidden = originalHidden; instances.delete(control);
        }};
        instances.set(control, api);
        return api;
    };
    return {enhance: enhance, toHex: toHex, toHsv: toHsv};
}));
