/* Native confirmation enhancement. Product owns form submission and return URLs. */
define([], function() {
    'use strict';
    const bindings = new WeakMap();
    const resolve = selector => typeof selector === 'string' ? document.querySelector(selector) : selector;

    const destroy = selector => {
        const dialog = resolve(selector);
        const cleanup = dialog && bindings.get(dialog);
        if (cleanup) {
            cleanup();
            bindings.delete(dialog);
        }
    };

    const init = selector => {
        const dialog = resolve(selector);
        if (!dialog || dialog.tagName !== 'DIALOG' || typeof dialog.showModal !== 'function' || bindings.has(dialog)) {
            return;
        }
        const cancelLink = dialog.querySelector('[data-easyedu-dialog-cancel]');
        if (!cancelLink) {
            return;
        }
        // Server-rendered open state stays usable without JavaScript. Upgrade it
        // to the browser top layer before attaching Escape/navigation behavior.
        if (dialog.open) {
            dialog.close();
        }
        try {
            dialog.showModal();
        } catch (error) {
            dialog.setAttribute('open', '');
            return;
        }
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('data-easyedu-dialog-modal', 'true');
        const cancel = event => {
            event.preventDefault();
            cancelLink.click();
        };
        dialog.addEventListener('cancel', cancel);
        cancelLink.focus({preventScroll: true});
        bindings.set(dialog, () => {
            dialog.removeEventListener('cancel', cancel);
            dialog.removeAttribute('aria-modal');
            dialog.removeAttribute('data-easyedu-dialog-modal');
            if (dialog.open) {
                dialog.close();
            }
        });
    };

    return {init: init, destroy: destroy};
});
