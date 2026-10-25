/*
 * EasyStud administration settings loading state (K18-18).
 *
 * The real page (title, sections, labels, descriptions, actions) is painted from
 * the first frame. Only the field controls that wait for Moodle's dependency
 * logic and the choice enhancement sit behind component skeletons, exactly as
 * the Student Management lists do; there is no page-wide placeholder or mask.
 * This small classic bootstrap releases those skeletons once the form has been
 * quiet, then fails open.
 */
(function() {
    'use strict';

    var bodyLoadingClass = 'local-groupimport-admin-settings-page--loading';
    var loadingStateAttribute = 'data-easystud-loading-state';
    var quietPeriod = 240;
    var minimumVisiblePeriod = 400;
    var deadlinePeriod = 1500;
    var initialiseColourReset = function() {
        var form = document.querySelector('#adminsettings');
        var button = form && form.querySelector('[data-easystud-restore-colours]');
        if (!button || button.dataset.initialised === 'true') {
            return;
        }
        button.dataset.initialised = 'true';
        button.hidden = false;
        button.addEventListener('click', function() {
            var changed = false;
            form.querySelectorAll('[data-easyedu-color-default]').forEach(function(control) {
                var hex = control.querySelector('.easyedu-color-picker__hex');
                var value = control.getAttribute('data-easyedu-color-default');
                if (!hex || hex.readOnly || hex.disabled || !/^#[0-9a-f]{6}$/i.test(value)) {
                    return;
                }
                hex.value = value;
                // Native dirty-state and swatch sync; never submit settings.
                hex.dispatchEvent(new Event('input', {bubbles: true}));
                hex.dispatchEvent(new Event('change', {bubbles: true}));
                changed = true;
            });
            var status = form.querySelector('[data-easystud-restore-colours-status]');
            if (changed && status) {
                status.textContent = status.getAttribute('data-easystud-restore-colours-status');
            }
        });
    };
    var initialiseColourPickers = function() {
        Array.prototype.forEach.call(document.querySelectorAll('[data-easyedu-color-picker]'), function(control) {
            var swatch = control.querySelector('.easyedu-color-picker__swatch');
            var hex = control.querySelector('.easyedu-color-picker__hex');
            var contrastNote = control.parentElement.querySelector('[data-easyedu-colour-contrast-note]');
            var minimumContrast = Number(control.getAttribute('data-easyedu-color-contrast'));
            var softShare = Number(control.getAttribute('data-easyedu-color-soft-share'));
            var defaultHex = (control.getAttribute('data-easyedu-color-default') || '').toLowerCase();
            var validHex = /^#[0-9a-f]{6}$/i;
            if (!swatch || !hex) {
                return;
            }

            var setValidity = function(valid) {
                control.classList.toggle('is-invalid', !valid);
                control.setAttribute('aria-invalid', valid ? 'false' : 'true');
                hex.setAttribute('aria-invalid', valid ? 'false' : 'true');
                if (contrastNote) {
                    contrastNote.hidden = !valid || hex.value.toLowerCase() === defaultHex ||
                        contrastAgainstWhite(hex.value) >= requiredWhiteContrast(hex.value);
                }
            };

            var contrastAgainstWhite = function(value) {
                var luminance = [1, 3, 5].reduce(function(total, offset, index) {
                    var channel = parseInt(value.substr(offset, 2), 16) / 255;
                    var linear = channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
                    return total + linear * [0.2126, 0.7152, 0.0722][index];
                }, 0);
                return 1.05 / (luminance + 0.05);
            };

            var requiredWhiteContrast = function(value) {
                var background = '#' + [1, 3, 5].map(function(offset) {
                    var channel = Math.floor(parseInt(value.substr(offset, 2), 16) * softShare + 255 * (1 - softShare));
                    return channel.toString(16).padStart(2, '0');
                }).join('');
                return minimumContrast * contrastAgainstWhite(background);
            };

            swatch.addEventListener('input', function() {
                hex.value = swatch.value.toUpperCase();
                setValidity(true);
                hex.dispatchEvent(new Event('input', {bubbles: true}));
            });

            hex.addEventListener('input', function() {
                var valid = validHex.test(hex.value);
                setValidity(valid);
                if (valid) {
                    swatch.value = hex.value;
                }
            });

            hex.addEventListener('change', function() {
                if (validHex.test(hex.value)) {
                    hex.value = hex.value.toUpperCase();
                    swatch.value = hex.value;
                    setValidity(true);
                }
            });
            // Kit enhancement owns drafts/focus only; existing named Hex,
            // validation, contrast notes, Restore and Moodle Save remain native.
            if (window.EasyEduColourPicker) {
                window.EasyEduColourPicker.enhance(control,
                    JSON.parse(control.getAttribute('data-easyedu-color-panel-labels')));
            }
        });
    };
    var initialise = function() {
        initialiseColourPickers();
        initialiseColourReset();
        var root = document.querySelector('#page-admin-setting-local_groupimport');
        var form = document.querySelector('#adminsettings');
        if (!root || !form || !document.body.classList.contains(bodyLoadingClass)) {
            document.body.classList.remove(bodyLoadingClass);
            return;
        }

        var content = form.querySelector('.settingsform') || form;
        var identity = root.querySelector('[data-easyedu-action-busy-label]');
        var label = identity ? identity.getAttribute('data-easyedu-action-busy-label') || '' : '';
        var quietTimer = null;
        var deadlineTimer = null;
        var observer = null;
        var cleared = false;
        var revealDuration = function() {
            var body = document.body;
            if (body.classList.contains('easyedu-motion-disabled') || body.classList.contains('is-easyedu-motion-off') ||
                (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
                return 0;
            }
            return 320;
        };
        var now = function() {
            return window.performance && typeof window.performance.now === 'function' ?
                window.performance.now() : Date.now();
        };
        var startedAt = now();

        root.setAttribute(loadingStateAttribute, 'loading');
        root.setAttribute('aria-busy', 'true');
        root.setAttribute('data-easyedu-action-busy-label', label);
        root.classList.add('is-action-busy');

        var clearTimers = function() {
            if (quietTimer !== null) {
                window.clearTimeout(quietTimer);
                quietTimer = null;
            }
            if (deadlineTimer !== null) {
                window.clearTimeout(deadlineTimer);
                deadlineTimer = null;
            }
            if (observer) {
                observer.disconnect();
                observer = null;
            }
        };

        var reveal = function(reason) {
            if (cleared) {
                return;
            }
            cleared = true;
            clearTimers();
            window.requestAnimationFrame(function() {
                var duration = revealDuration();
                // The pending controls leave their skeletons and fade in once.
                if (duration > 0) {
                    root.classList.add('is-easystud-admin-entering');
                }
                document.body.classList.remove(bodyLoadingClass);
                root.setAttribute(loadingStateAttribute, reason === 'deadline' ? 'degraded' : 'ready');
                root.setAttribute('aria-busy', 'false');
                root.classList.remove('is-action-busy');
                root.setAttribute('data-easyedu-loading-ready', '1');
                window.setTimeout(function() {
                    root.classList.remove('is-easystud-admin-entering');
                }, duration);
            });
        };

        var scheduleReveal = function() {
            if (cleared) {
                return;
            }
            if (quietTimer !== null) {
                window.clearTimeout(quietTimer);
            }
            var elapsed = Math.max(0, now() - startedAt);
            var delay = Math.max(quietPeriod, minimumVisiblePeriod - elapsed);
            quietTimer = window.setTimeout(function() {
                reveal('quiet');
            }, delay);
        };

        observer = new MutationObserver(scheduleReveal);
        observer.observe(content, {
            attributes: true,
            attributeFilter: ['aria-expanded', 'aria-hidden', 'class', 'hidden', 'style'],
            childList: true,
            subtree: true
        });
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(scheduleReveal, scheduleReveal);
        }
        deadlineTimer = window.setTimeout(function() {
            reveal('deadline');
        }, deadlinePeriod);
        scheduleReveal();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialise, {once: true});
    } else {
        initialise();
    }
})();
