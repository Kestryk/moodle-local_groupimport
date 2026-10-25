// EasyEdu V3 notification (K18-16): the Kit V3 banner replaces toasts.
// Paint and the desktop/touch variants belong to the Kit SCSS (.easyedu-v3-banner);
// this module only builds the banner with text nodes, stacks it and dismisses it.
// Motion follows the EasyEdu levels through CSS: when reduced or minimal removes
// the transition, a dismissed banner leaves at once.
define([], function() {
    const STACK_ATTRIBUTE = 'data-easyedu-v3-banner-stack';

    const getStack = () => {
        let stack = document.querySelector('[' + STACK_ATTRIBUTE + ']');
        if (!stack) {
            stack = document.createElement('div');
            stack.className = 'easyedu-v3-banner-stack';
            stack.setAttribute(STACK_ATTRIBUTE, '1');
            document.body.appendChild(stack);
        }
        return stack;
    };

    const element = (tag, className, text) => {
        const node = document.createElement(tag);
        node.className = className;
        if (text) {
            node.textContent = text;
        }
        return node;
    };

    const dismiss = banner => {
        if (!banner || !banner.isConnected || banner.classList.contains('is-leaving')) {
            return;
        }
        window.clearTimeout(banner.easyeduV3Timer);
        banner.classList.add('is-leaving');
        const remove = () => banner.remove();
        const running = typeof banner.getAnimations === 'function' ? banner.getAnimations() : [];
        if (!running.length) {
            remove();
            return;
        }
        Promise.all(running.map(animation => animation.finished)).then(remove).catch(remove);
    };

    /**
     * Show one notification.
     *
     * @param {Object} options
     * @param {string} options.text Message, rendered as text.
     * @param {string} [options.type] success | error (any other tone shows no title).
     * @param {string} [options.eyebrow] Product eyebrow, e.g. EasyStud.
     * @param {string} [options.title] Title for this tone.
     * @param {string} [options.closeLabel] Accessible name of the Close control.
     * @param {number} [options.delay] Auto-dismiss delay in ms (paused on hover and focus).
     * @returns {HTMLElement|null}
     */
    const show = options => {
        const settings = Object.assign({type: 'success', eyebrow: '', title: '', closeLabel: '', delay: 4000}, options || {});
        if (!settings.text) {
            return null;
        }
        const banner = element('div', 'easyedu-v3-banner easyedu-v3-banner--notification');
        banner.dataset.easyeduV3Tone = settings.type;
        banner.setAttribute('role', settings.type === 'error' ? 'alert' : 'status');
        banner.setAttribute('aria-atomic', 'true');
        const panel = element('div', 'easyedu-v3-banner__panel');
        const content = element('div', 'easyedu-v3-banner__content');
        const heading = element('div', 'easyedu-v3-banner__heading');
        if (settings.eyebrow) {
            heading.appendChild(element('span', 'easyedu-v3-banner__eyebrow', settings.eyebrow));
        }
        if (settings.title) {
            heading.appendChild(element('strong', 'easyedu-v3-banner__title', settings.title));
        }
        content.appendChild(heading);
        content.appendChild(element('p', 'easyedu-v3-banner__text', settings.text));
        panel.appendChild(content);
        const close = element('button', 'easyedu-v3-banner__close');
        close.type = 'button';
        if (settings.closeLabel) {
            close.setAttribute('aria-label', settings.closeLabel);
        }
        close.appendChild(element('span', 'fa fa-times')).setAttribute('aria-hidden', 'true');
        close.addEventListener('click', () => dismiss(banner));
        panel.appendChild(close);
        banner.appendChild(panel);

        const schedule = () => {
            window.clearTimeout(banner.easyeduV3Timer);
            banner.easyeduV3Timer = window.setTimeout(() => dismiss(banner), settings.delay);
        };
        const pause = () => window.clearTimeout(banner.easyeduV3Timer);
        banner.addEventListener('mouseenter', pause);
        banner.addEventListener('focusin', pause);
        banner.addEventListener('mouseleave', () => {
            if (!banner.contains(document.activeElement)) {
                schedule();
            }
        });
        banner.addEventListener('focusout', event => {
            if (!banner.contains(event.relatedTarget) && !banner.matches(':hover')) {
                schedule();
            }
        });
        getStack().appendChild(banner);
        schedule();
        return banner;
    };

    return {show: show, dismiss: dismiss};
});
