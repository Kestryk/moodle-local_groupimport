/*
 * EasyStud administration settings loading state.
 *
 * Moodle builds the settings form from PHP after the plugin settings file is
 * evaluated. This small classic bootstrap keeps the server-rendered skeleton
 * visible while native dependency/show-hide controls settle, then fails open.
 */
(function() {
    'use strict';

    var bodyLoadingClass = 'local-groupimport-admin-settings-page--loading';
    var loadingStateAttribute = 'data-easystud-loading-state';
    var quietPeriod = 240;
    var minimumVisiblePeriod = 1200;
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
            var validHex = /^#[0-9a-f]{6}$/i;
            if (!swatch || !hex) {
                return;
            }

            var setValidity = function(valid) {
                control.classList.toggle('is-invalid', !valid);
                control.setAttribute('aria-invalid', valid ? 'false' : 'true');
                hex.setAttribute('aria-invalid', valid ? 'false' : 'true');
                if (contrastNote) {
                    contrastNote.hidden = !valid || contrastAgainstWhite(hex.value) >= minimumContrast;
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
        });
    };
    var initialise = function() {
        initialiseColourPickers();
        initialiseColourReset();
        var root = document.querySelector('#page-admin-setting-local_groupimport');
        var form = document.querySelector('#adminsettings');
        var skeleton = root ? root.querySelector('[data-easystud-loading-skeleton]') : null;
        if (!root || !form || !skeleton) {
            document.body.classList.remove(bodyLoadingClass);
            return;
        }

        var content = form.querySelector('.settingsform') || form;
        var skeletonHeading = skeleton.closest('.formsettingheading');
        var skeletonFieldset = skeletonHeading ? skeletonHeading.parentElement : null;
        var nativeDisplayStates = [];
        var label = skeleton.getAttribute('data-easyedu-action-busy-label') || '';
        var quietTimer = null;
        var deadlineTimer = null;
        var observer = null;
        var cleared = false;
        var revealDuration = function() {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                return 0;
            }
            return 180;
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

        if (skeletonFieldset) {
            Array.prototype.forEach.call(skeletonFieldset.children, function(node) {
                if (node === skeletonHeading) {
                    return;
                }
                nativeDisplayStates.push({
                    node: node,
                    display: node.style.getPropertyValue('display'),
                    priority: node.style.getPropertyPriority('display')
                });
            });
        }

        var enforceNativeHidden = function() {
            nativeDisplayStates.forEach(function(state) {
                var display = state.node.style.getPropertyValue('display');
                var priority = state.node.style.getPropertyPriority('display');
                if (display !== 'none' || priority !== 'important') {
                    state.display = display;
                    state.priority = priority;
                    state.node.style.setProperty('display', 'none', 'important');
                }
            });
        };

        var restoreNativeDisplay = function() {
            nativeDisplayStates.forEach(function(state) {
                if (state.display) {
                    state.node.style.setProperty('display', state.display, state.priority);
                } else {
                    state.node.style.removeProperty('display');
                }
            });
        };

        enforceNativeHidden();

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
                window.requestAnimationFrame(function() {
                    var duration = revealDuration();
                    var revealContent = function() {
                        root.classList.remove('is-easystud-loading-skeleton-exiting');
                        root.classList.add('is-easystud-loading-content-entering');
                        root.classList.remove(bodyLoadingClass);
                        document.body.classList.remove(bodyLoadingClass);
                        restoreNativeDisplay();
                        skeleton.hidden = true;
                        skeleton.setAttribute('aria-hidden', 'true');
                        window.requestAnimationFrame(function() {
                            window.requestAnimationFrame(function() {
                                root.classList.add('is-easystud-loading-content-entered');
                                window.setTimeout(function() {
                                    root.setAttribute(loadingStateAttribute, reason === 'deadline' ? 'degraded' : 'ready');
                                    root.setAttribute('aria-busy', 'false');
                                    root.classList.remove('is-action-busy');
                                    root.classList.remove('is-easystud-loading-content-entering');
                                    root.classList.remove('is-easystud-loading-content-entered');
                                    root.setAttribute('data-easyedu-loading-ready', '1');
                                }, duration);
                            });
                        });
                    };
                    if (duration > 0) {
                        root.classList.add('is-easystud-loading-skeleton-exiting');
                        window.setTimeout(revealContent, duration);
                    } else {
                        revealContent();
                    }
                });
            });
        };

        var scheduleReveal = function() {
            if (cleared) {
                return;
            }
            if (quietTimer !== null) {
                window.clearTimeout(quietTimer);
            }
            enforceNativeHidden();
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
        }, 1500);
        scheduleReveal();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialise, {once: true});
    } else {
        initialise();
    }
})();
