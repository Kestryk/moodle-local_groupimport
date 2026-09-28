/*
 * EasyStud loading-state bootstrap.
 *
 * This classic script deliberately loads before RequireJS so the server-rendered
 * manager can fail open even when the AMD bundle cannot start.
 */
(function() {
    'use strict';

    var rootId = 'local-groupimport-easystud';
    var bootstrapAttribute = 'data-easyedu-loading-bootstrap';
    var loadingStateAttribute = 'data-easystud-loading-state';
    var diagnosticsQueryParameter = 'easystudloadingdiagnostics';
    var diagnosticsGlobalName = '__easyStudLoadingDiagnostics';
    var diagnosticsEventName = 'easyedu:loading-diagnostic';
    var failOpenDelay = 8000;

    var diagnosticsEnabled = function() {
        try {
            return new URL(window.location.href).searchParams.get(diagnosticsQueryParameter) === '1';
        } catch (error) {
            return false;
        }
    };

    var interactionRegions = function(root) {
        var regions = [
            root.querySelector('[data-easystud-real-content]'),
            root.querySelector('.local-groupimport-easystud__layout'),
            root.querySelector('.local-groupimport-easystud__layout-toggles'),
            root.querySelector('[data-easystud-mobile-view-switcher]')
        ].filter(Boolean);
        return regions.length ? regions : [root.querySelector('[data-easystud-real-content]')].filter(Boolean);
    };

    var isVisible = function(node) {
        if (!node) {
            return false;
        }
        var style = window.getComputedStyle(node);
        var box = node.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0;
    };

    var captureVisibility = function(root) {
        var regions = interactionRegions(root);
        return {
            rootVisible: isVisible(root),
            realContentVisible: isVisible(root.querySelector('[data-easystud-real-content]')),
            loadingSurfaceVisible: isVisible(root.querySelector('[data-easystud-loading-skeleton]')),
            booting: root.classList.contains('local-groupimport-easystud--booting'),
            loadingState: root.getAttribute(loadingStateAttribute),
            ariaBusy: root.getAttribute('aria-busy') === 'true',
            interactionRegionsInert: regions.length > 0 && regions.every(function(region) {
                return region.inert === true;
            })
        };
    };

    var createDiagnostics = function(root) {
        if (!diagnosticsEnabled()) {
            return null;
        }
        if (root.easystudLoadingDiagnostics) {
            return root.easystudLoadingDiagnostics;
        }

        var startedAt = window.performance && window.performance.now ? window.performance.now() : 0;
        var sequence = 0;
        var requestGeneration = 0;
        var events = [];
        var rootIdentifier = root.id || rootId;
        var diagnostics = {
            nextRequestGeneration: function() {
                requestGeneration += 1;
                return requestGeneration;
            },
            record: function(name, details, regionId) {
                var now = window.performance && window.performance.now ? window.performance.now() : startedAt;
                var event = Object.freeze({
                    sequence: ++sequence,
                    name: name,
                    rootId: rootIdentifier,
                    regionId: regionId || rootIdentifier,
                    elapsedMs: Math.round(Math.max(0, now - startedAt)),
                    details: Object.freeze(Object.assign({}, details || {}))
                });
                events.push(event);
                document.dispatchEvent(new CustomEvent(diagnosticsEventName, {detail: event}));
                return event;
            },
            snapshot: function() {
                return events.slice();
            }
        };
        var registry = window[diagnosticsGlobalName] && typeof window[diagnosticsGlobalName] === 'object' ?
            window[diagnosticsGlobalName] : {};
        registry[rootIdentifier] = diagnostics;
        window[diagnosticsGlobalName] = registry;
        root.easystudLoadingDiagnostics = diagnostics;
        root.setAttribute('data-easystud-loading-diagnostics', 'enabled');
        return diagnostics;
    };

    var installController = function(root) {
        if (!root || root.easystudLoadingController) {
            return root ? root.easystudLoadingController || null : null;
        }

        var diagnostics = createDiagnostics(root);
        var readyAttribute = root.getAttribute('data-easyedu-loading-ready-attribute') ||
            'data-easystud-manager-initialised';
        var timer = null;
        var managerReadyObserver = null;
        var managerReadyScheduled = false;
        var visualStabilityObserver = null;
        var visualStabilityTimer = null;
        var visualStabilityMaximumTimer = null;
        var transitionStarted = false;
        var revealDuration = function() {
            var configuredDuration = Number.parseInt(root.getAttribute('data-easystud-loading-reveal-duration'), 10);
            if (root.classList.contains('is-easyedu-motion-off') ||
                    (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
                return 0;
            }
            if (Number.isFinite(configuredDuration) && configuredDuration >= 0) {
                return configuredDuration;
            }
            return 180;
        };
        var clearVisualStabilityGate = function() {
            if (visualStabilityObserver) {
                visualStabilityObserver.disconnect();
                visualStabilityObserver = null;
            }
            if (visualStabilityTimer !== null) {
                window.clearTimeout(visualStabilityTimer);
                visualStabilityTimer = null;
            }
            if (visualStabilityMaximumTimer !== null) {
                window.clearTimeout(visualStabilityMaximumTimer);
                visualStabilityMaximumTimer = null;
            }
        };
        var setInteractionBlocked = function(blocked) {
            interactionRegions(root).forEach(function(region) {
                if (blocked) {
                    region.setAttribute('inert', '');
                }
                region.inert = blocked;
                if (!blocked) {
                    region.removeAttribute('inert');
                }
            });
        };
        var transition = function(state, reason) {
            if (state !== 'ready' && state !== 'degraded') {
                return false;
            }
            if (root.getAttribute(loadingStateAttribute) !== 'loading') {
                return false;
            }
            if (transitionStarted) {
                return false;
            }
            transitionStarted = true;
            if (timer !== null) {
                window.clearTimeout(timer);
                timer = null;
            }
            if (managerReadyObserver) {
                managerReadyObserver.disconnect();
                managerReadyObserver = null;
            }
            clearVisualStabilityGate();
            var content = root.querySelector('[data-easystud-real-content]');
            var skeleton = root.querySelector('[data-easystud-loading-skeleton]');
            var duration = revealDuration();
            var complete = function() {
                root.setAttribute(loadingStateAttribute, state);
                root.setAttribute('aria-busy', 'false');
                root.classList.remove('local-groupimport-easystud--booting');
                root.classList.remove('is-action-busy');
                root.classList.remove('is-easystud-loading-content-entering');
                root.classList.remove('is-easystud-loading-content-entered');
                setInteractionBlocked(false);
                if (diagnostics) {
                    diagnostics.record(state === 'ready' ? 'manager-ready' : 'manager-degraded',
                        Object.assign({reason: reason || 'unknown'}, captureVisibility(root)));
                }
            };
            var revealContent = function() {
                root.classList.remove('is-easystud-loading-skeleton-exiting');
                if (skeleton) {
                    skeleton.hidden = true;
                }
                if (!content) {
                    complete();
                    return;
                }
                root.classList.add('is-easystud-loading-content-entering');
                content.hidden = false;
                window.requestAnimationFrame(function() {
                    window.requestAnimationFrame(function() {
                        root.classList.add('is-easystud-loading-content-entered');
                        window.setTimeout(complete, duration);
                    });
                });
            };
            if (skeleton && duration > 0) {
                root.classList.add('is-easystud-loading-skeleton-exiting');
                window.setTimeout(revealContent, duration);
            } else {
                revealContent();
            }
            return true;
        };

        root.easystudLoadingController = Object.freeze({
            complete: transition,
            getDiagnostics: function() {
                return diagnostics;
            },
            getState: function() {
                return root.getAttribute(loadingStateAttribute);
            }
        });
        root.setAttribute('aria-busy', 'true');
        root.classList.add('is-action-busy');
        setInteractionBlocked(true);
        var waitForVisualStability = function() {
            var content = root.querySelector('[data-easystud-real-content]');
            var complete = function(reason) {
                clearVisualStabilityGate();
                window.requestAnimationFrame(function() {
                    window.requestAnimationFrame(function() {
                        transition('ready', reason);
                    });
                });
            };
            var reschedule = function() {
                if (visualStabilityTimer !== null) {
                    window.clearTimeout(visualStabilityTimer);
                }
                visualStabilityTimer = window.setTimeout(function() {
                    complete('amd-visual-stable');
                }, 240);
            };
            if (!content) {
                complete('amd-visual-stable-no-content');
                return;
            }
            visualStabilityObserver = new MutationObserver(reschedule);
            visualStabilityObserver.observe(content, {
                attributes: true,
                attributeFilter: ['aria-disabled', 'aria-expanded', 'class', 'hidden', 'style'],
                childList: true,
                subtree: true
            });
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(reschedule, reschedule);
            }
            visualStabilityMaximumTimer = window.setTimeout(function() {
                complete('amd-visual-stability-deadline');
            }, 1500);
            reschedule();
        };
        var scheduleManagerReady = function() {
            if (managerReadyScheduled || root.getAttribute(readyAttribute) !== '1') {
                return;
            }
            managerReadyScheduled = true;
            waitForVisualStability();
        };
        managerReadyObserver = new MutationObserver(scheduleManagerReady);
        managerReadyObserver.observe(root, {attributes: true, attributeFilter: [readyAttribute]});
        // AMD can finish between the initial root scan and observer setup. Read
        // the current value once so readiness is not lost when no later
        // attribute mutation occurs.
        scheduleManagerReady();
        timer = window.setTimeout(function() {
            transition('degraded', 'amd-timeout');
        }, failOpenDelay);
        return root.easystudLoadingController;
    };

    var initialise = function() {
        var roots = [];
        var managerRoot = document.getElementById(rootId);
        if (managerRoot && managerRoot.getAttribute(loadingStateAttribute) === 'loading') {
            roots.push(managerRoot);
        }
        document.querySelectorAll('[' + bootstrapAttribute + '="1"][' + loadingStateAttribute + '="loading"]')
            .forEach(function(root) {
                if (roots.indexOf(root) === -1) {
                    roots.push(root);
                }
            });
        roots.forEach(installController);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialise, {once: true});
    } else {
        initialise();
    }
})();
