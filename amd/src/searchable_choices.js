// Progressive enhancement of a native single/multiple select. No product commands,
// HTML strings, network requests, global listeners or private style overrides.
const controls = new WeakMap();
let sequence = 0;

const normalise = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();

/**
 * Keep the original select as the authoritative value and no-JS fallback.
 * The disclosure contains a labelled search and native pressed choice buttons;
 * it is not an ARIA combobox/listbox pretending to own arrow-key semantics.
 *
 * @param {HTMLSelectElement} select Existing labelled single-select.
 * @param {Object} labels Localised label/search/empty strings, never HTML.
 * @param {Object} options Optional canonical Motion module for framed disclosure.
 * @returns {Object} Controller with host, trigger, refresh and close methods.
 */
export const enhanceSelect = (select, labels, options = {}) => enhanceNativeSelect(select, labels, false, options);

/**
 * Independent pressed options keep a native multiple-select authoritative.
 * Filtering must never clear selections outside the visible search result.
 *
 * @param {HTMLSelectElement} select Existing labelled multiple-select.
 * @param {Object} labels Plain label/search/empty/none strings and count template (__count__).
 * @param {Object} options Optional canonical Motion module for framed disclosure.
 * @returns {Object} Same disclosure lifecycle as the single-choice controller.
 */
export const enhanceMultipleSelect = (select, labels, options = {}) => enhanceNativeSelect(select, labels, true, options);

/**
 * Close every enhanced choice whose authoritative native select belongs to a
 * container that is itself being collapsed. This keeps nested disclosures in
 * one lifecycle without a document-level listener or synthetic outside click.
 *
 * @param {Element} container Enclosing panel that is about to become inert.
 * @param {boolean} returnFocus Whether the last closed choice returns focus.
 * @returns {number} Number of enhanced choice panels that were closed.
 */
export const closeChoicesWithin = (container, returnFocus = false) => {
    if (!container || typeof container.querySelectorAll !== 'function') {
        return 0;
    }
    const active = [...container.querySelectorAll('select')]
        .map(select => controls.get(select))
        .filter(controller => controller && controller.trigger.getAttribute('aria-expanded') === 'true');
    active.forEach((controller, index) => controller.close(returnFocus && index === active.length - 1));
    return active.length;
};

const enhanceNativeSelect = (select, labels, multiple, options) => {
    if (!select || select.multiple !== multiple) {
        throw new Error('Searchable choices require the matching native select mode.');
    }
    if (controls.has(select)) {
        return controls.get(select);
    }
    // Opt-in dependency injection keeps standalone consumers and their existing
    // slow-token lifecycle unchanged. No private copy of the geometry engine.
    const motion = options.motion;
    if (motion && (typeof motion.disclosePanel !== 'function' || typeof motion.cancel !== 'function')) {
        throw new Error('Framed choices require the canonical Motion disclosure and cancellation API.');
    }
    const document = select.ownerDocument;
    const id = `easyedu-searchable-choice-${++sequence}`;
    const host = document.createElement('div');
    host.className = 'easyedu-searchable-choice';
    host.classList.toggle('easyedu-searchable-choice--multiple', multiple);
    host.classList.toggle('easyedu-searchable-choice--framed', !!motion);
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = `${id}-trigger`;
    trigger.className = 'easyedu-searchable-choice__trigger';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `${id}-panel`);
    const summary = document.createElement('span');
    summary.className = 'easyedu-searchable-choice__summary';
    const chevron = document.createElement('span');
    chevron.className = 'fa fa-chevron-down';
    chevron.setAttribute('aria-hidden', 'true');
    trigger.append(summary, chevron);
    const clear = multiple ? document.createElement('button') : null;
    if (clear) {
        clear.type = 'button';
        clear.className = 'easyedu-searchable-choice__clear';
        const clearIcon = document.createElement('span');
        clearIcon.className = 'fa fa-times';
        clearIcon.setAttribute('aria-hidden', 'true');
        clear.append(clearIcon);
    }
    const panel = document.createElement('div');
    panel.id = `${id}-panel`;
    panel.className = 'easyedu-searchable-choice__panel';
    panel.hidden = true;
    const searchLabel = document.createElement('label');
    searchLabel.className = 'easyedu-searchable-choice__search';
    const magnifier = document.createElement('span');
    magnifier.className = 'fa fa-search';
    magnifier.setAttribute('aria-hidden', 'true');
    const search = document.createElement('input');
    search.type = 'search';
    search.autocomplete = 'off';
    searchLabel.append(magnifier, search);
    const list = document.createElement('div');
    list.className = 'easyedu-searchable-choice__list';
    list.setAttribute('role', 'group');
    const empty = document.createElement('p');
    empty.className = 'easyedu-searchable-choice__empty';
    empty.setAttribute('role', 'status');
    empty.hidden = true;
    panel.append(searchLabel, list, empty);
    host.append(trigger);
    if (clear) {
        host.append(clear);
    }
    host.append(panel);
    const originalLabels = [...select.labels];
    const originalHidden = select.hidden;
    let rows = [];
    let panelAnimation = null;
    let outsidePointer = null;
    let dismissTimer = null;
    const view = document.defaultView;
    // An in-flow panel must not collapse between pointerdown and click on the
    // following control. Listen only while open, retaining keyboard blur.
    const onOutsidePointerDown = event => {
        outsidePointer = host.contains(event.target) ? null : event.pointerId;
        // A closing in-flow panel can still move the next control. Freeze its
        // geometry for the physical down/up/click sequence, including Escape
        // initiated closure, then resume the original animation.
        if (outsidePointer !== null && panelAnimation) {
            const pointerTime = panelAnimation.currentTime;
            panelAnimation.pause();
            panelAnimation.currentTime = pointerTime;
        }
    };
    const onOutsidePointerEnd = event => {
        if (outsidePointer !== event.pointerId) {
            return;
        }
        if (dismissTimer !== null) {
            view.clearTimeout(dismissTimer);
        }
        dismissTimer = view.setTimeout(() => {
            if (trigger.getAttribute('aria-expanded') === 'false' &&
                    panelAnimation && panelAnimation.playState === 'paused') {
                panelAnimation.play();
            } else {
                close();
            }
        }, 0);
    };
    const stopPointerTracking = () => {
        document.removeEventListener('pointerdown', onOutsidePointerDown, true);
        document.removeEventListener('pointerup', onOutsidePointerEnd, true);
        document.removeEventListener('pointercancel', onOutsidePointerEnd, true);
        outsidePointer = null;
        if (dismissTimer !== null) {
            view.clearTimeout(dismissTimer);
            dismissTimer = null;
        }
    };
    const startPointerTracking = () => {
        stopPointerTracking();
        document.addEventListener('pointerdown', onOutsidePointerDown, true);
        document.addEventListener('pointerup', onOutsidePointerEnd, true);
        document.addEventListener('pointercancel', onOutsidePointerEnd, true);
    };

    const reducedMotion = () => document.defaultView && document.defaultView.matchMedia &&
        document.defaultView.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const panelDuration = () => {
        const value = document.defaultView.getComputedStyle(panel)
            .getPropertyValue('--easyedu-choice-disclosure-duration').trim();
        if (value.endsWith('ms')) {
            return Number.parseFloat(value) || 0;
        }
        if (value.endsWith('s')) {
            return (Number.parseFloat(value) || 0) * 1000;
        }
        return 220;
    };
    const animatePanel = (expanded, complete) => {
        if (motion) {
            motion.disclosePanel(panel, expanded, {duration: Math.max(320, panelDuration()), collapseMargins: true,
                onComplete: () => {
                panelAnimation = null;
                complete();
            }});
            // Keep the actual shared effect available to the existing physical
            // pointer guard; static policy must not capture unrelated CSS effects.
            panelAnimation = panel.classList.contains('is-easyedu-disclosing') ?
                panel.getAnimations().find(animation => animation.effect && animation.effect.target === panel) || null : null;
            return;
        }
        if (panelAnimation) {
            panelAnimation.cancel();
            panelAnimation = null;
        }
        if (reducedMotion() || typeof panel.animate !== 'function') {
            complete();
            return;
        }
        const startHeight = panel.getBoundingClientRect().height;
        const endHeight = expanded ? panel.scrollHeight : 0;
        const startOpacity = Number.parseFloat(document.defaultView.getComputedStyle(panel).opacity) || 0;
        panelAnimation = panel.animate([
            {height: `${startHeight}px`, opacity: startOpacity,
                transform: expanded ? 'translateY(-0.25rem)' : 'translateY(0)'},
            {height: `${endHeight}px`, opacity: expanded ? 1 : 0,
                transform: expanded ? 'translateY(0)' : 'translateY(-0.25rem)'},
        ], {
            duration: panelDuration(),
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        });
        panelAnimation.addEventListener('finish', () => {
            panelAnimation = null;
            complete();
        }, {once: true});
    };

    const close = (returnFocus = false) => {
        stopPointerTracking();
        trigger.setAttribute('aria-expanded', 'false');
        if (panel.hidden) {
            if (returnFocus) {
                trigger.focus();
            }
            return;
        }
        panel.inert = true;
        startPointerTracking();
        animatePanel(false, () => {
            panel.hidden = true;
            panel.inert = false;
            stopPointerTracking();
        });
        panel.classList.remove('is-open');
        if (returnFocus) {
            trigger.focus();
        }
    };
    const syncValue = () => {
        const options = [...select.selectedOptions];
        summary.textContent = multiple ? (options.length === 0 ? labels.none || '' : options.length === 1 ?
            options[0].textContent : (labels.count || '__count__').replace('__count__', String(options.length))) :
            (options[0] ? options[0].textContent : '');
        trigger.setAttribute('aria-label', `${labels.label}: ${summary.textContent}`);
        trigger.disabled = select.disabled || !select.options.length;
        if (clear) {
            clear.hidden = options.length === 0;
            clear.disabled = select.disabled;
            clear.setAttribute('aria-label', labels.clear || labels.none || labels.label);
        }
        rows.forEach(row => {
            row.button.disabled = select.disabled || row.option.disabled ||
                (row.option.parentElement.tagName === 'OPTGROUP' && row.option.parentElement.disabled);
            row.button.setAttribute('aria-pressed', String(row.option.selected));
            row.check.hidden = !row.option.selected;
        });
    };
    const filter = () => {
        const term = normalise(search.value.trim());
        let visible = 0;
        rows.forEach(row => {
            row.button.hidden = !normalise(row.option.textContent).includes(term);
            visible += row.button.hidden ? 0 : 1;
        });
        empty.hidden = visible !== 0;
        // Searching never removes options or changes the current native value.
    };
    const refresh = (nextLabels = labels) => {
        labels = nextLabels;
        close();
        search.value = '';
        search.placeholder = labels.search;
        search.setAttribute('aria-label', labels.search);
        list.setAttribute('aria-label', labels.label);
        empty.textContent = labels.empty;
        rows = [...select.options].map(option => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'easyedu-searchable-choice__option';
            button.disabled = option.disabled || (option.parentElement.tagName === 'OPTGROUP' && option.parentElement.disabled);
            const text = document.createElement('span');
            text.textContent = option.textContent;
            const check = document.createElement('span');
            check.className = 'fa fa-check';
            check.setAttribute('aria-hidden', 'true');
            button.append(text, check);
            button.addEventListener('click', () => {
                // Native identity/state is never rebuilt from the filtered visible rows.
                if (multiple) {
                    option.selected = !option.selected;
                } else {
                    select.value = option.value;
                }
                select.dispatchEvent(new Event('change', {bubbles: true}));
                syncValue();
                if (!multiple) {
                    close(true);
                }
            });
            return {option, button, check};
        });
        list.replaceChildren(...rows.map(row => row.button));
        syncValue();
        filter();
    };
    trigger.addEventListener('click', () => {
        if (trigger.getAttribute('aria-expanded') === 'true') {
            close();
            return;
        }
        if (!motion) {
            panel.hidden = false;
        }
        panel.inert = false;
        trigger.setAttribute('aria-expanded', 'true');
        startPointerTracking();
        search.value = '';
        filter();
        animatePanel(true, () => panel.classList.add('is-open'));
        panel.classList.add('is-open');
        search.focus();
    });
    search.addEventListener('input', filter);
    if (clear) {
        clear.addEventListener('click', () => {
            const selected = [...select.selectedOptions];
            if (!selected.length) {
                return;
            }
            selected.forEach(option => {
                option.selected = false;
            });
            select.dispatchEvent(new Event('change', {bubbles: true}));
            syncValue();
            if (panel.hidden) {
                trigger.focus();
            } else {
                search.focus();
            }
        });
    }
    host.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !panel.hidden) {
            event.preventDefault();
            event.stopPropagation();
            close(true);
        }
    });
    host.addEventListener('focusout', event => {
        if (event.relatedTarget && !host.contains(event.relatedTarget) && outsidePointer === null) {
            close();
        }
    });
    select.addEventListener('change', syncValue);
    // Only hide the native control after the complete enhancement is ready.
    refresh();
    select.after(host);
    select.hidden = true;
    originalLabels.forEach(label => { label.htmlFor = trigger.id; });
    const controller = {
        host, trigger, clear, refresh, close,
        destroy: () => {
            stopPointerTracking();
            if (motion) {
                motion.cancel(panel);
            }
            if (panelAnimation) {
                panelAnimation.cancel();
                panelAnimation = null;
            }
            select.removeEventListener('change', syncValue);
            originalLabels.forEach(label => { label.htmlFor = select.id; });
            select.hidden = originalHidden;
            host.remove();
            controls.delete(select);
        },
    };
    controls.set(select, controller);
    return controller;
};
