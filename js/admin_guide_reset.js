// This file is part of Moodle - https://moodle.org/
// Moodle is distributed under the GNU GPL v3 or later.

/**
 * Opens the guide welcome reset confirmation in place on the EasyStud settings page.
 * The link keeps working without JavaScript (standalone confirmation page).
 */
(function() {
    'use strict';

    var bind = function() {
        var opener = document.querySelector('[data-local-groupimport-welcome-reset-open]');
        var dialog = document.getElementById('easyedu-welcome-reset');
        if (!opener || !dialog || typeof dialog.showModal !== 'function') {
            return;
        }
        opener.addEventListener('click', function(event) {
            event.preventDefault();
            dialog.showModal();
            dialog.setAttribute('aria-modal', 'true');
            var cancel = dialog.querySelector('.easyedu-confirmation-dialog__actions [data-local-groupimport-welcome-reset-close]');
            if (cancel) {
                cancel.focus({preventScroll: true});
            }
        });
        // The settings page is itself a form: keep the dialog out of it and post a
        // separate form on confirmation.
        document.body.appendChild(dialog.parentNode);
        dialog.addEventListener('click', function(event) {
            if (event.target.closest('[data-local-groupimport-welcome-reset-close]')) {
                event.preventDefault();
                dialog.close();
                return;
            }
            var confirm = event.target.closest('[data-local-groupimport-welcome-reset-confirm]');
            var body = dialog.querySelector('[data-local-groupimport-welcome-reset-action]');
            if (!confirm || !body) {
                return;
            }
            event.preventDefault();
            confirm.disabled = true;
            var form = document.createElement('form');
            form.method = 'post';
            form.action = body.getAttribute('data-local-groupimport-welcome-reset-action');
            [['sesskey', body.getAttribute('data-local-groupimport-welcome-reset-sesskey')], ['confirm', '1']]
                .forEach(function(field) {
                    var input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = field[0];
                    input.value = field[1];
                    form.appendChild(input);
                });
            document.body.appendChild(form);
            form.submit();
        });
        // Escape closes the native dialog; return focus to the opener either way.
        dialog.addEventListener('close', function() {
            dialog.removeAttribute('aria-modal');
            opener.focus({preventScroll: true});
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind, {once: true});
    } else {
        bind();
    }
})();
