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
 * Light, static facade of the shared Guide engine (I10, K18-32).
 *
 * The engine (local_groupimport/easyedu_guide, about 150 KB) is only downloaded and parsed when
 * the Guide is really needed: the first activation of a Guide opener, or immediately when the
 * page must show Guide UI on load (first-visit opening, welcome invitation, resume offer of an
 * unfinished path). Before that, the path-context API answers exactly as the engine would for
 * a root it has not bound (no configuration, so no context, no token, no write).
 *
 * @module     local_groupimport/guide_api
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['require', 'core/log'], function(require, Log) {
    const ENGINE = 'local_groupimport/easyedu_guide';
    const OPEN = '[data-easyedu-guide-open]';
    // Same queries as the engine's guideModality (K15-30). The engine stays the authority as soon
    // as it is loaded; this copy only answers before that (test-guide-api-lazy.cjs pins parity).
    const GUIDE_NARROW_QUERY = '(max-width: 64rem)';
    const GUIDE_TOUCH_QUERY = '(pointer: coarse), (hover: none)';
    // Engine default (DEFAULTS.storageKey) when a consumer passes none.
    const DEFAULT_STORAGE_KEY = 'easyedu.guide.seen';

    let engine = null;
    let loading = null;

    const load = () => {
        if (!loading) {
            loading = new Promise((resolve, reject) => {
                require([ENGINE], Guide => {
                    engine = Guide;
                    resolve(Guide);
                }, error => {
                    loading = null;
                    reject(error);
                });
            });
        }
        return loading;
    };

    const resolveRoot = rootOrSelector => typeof rootOrSelector === 'string' ?
        document.querySelector(rootOrSelector) : rootOrSelector;

    const readStorage = key => {
        try {
            return window.localStorage ? window.localStorage.getItem(key) : null;
        } catch (error) {
            return null;
        }
    };

    // Read-only mirror of the engine's init decisions: does this page load show Guide UI?
    const needsEngineOnLoad = config => {
        const options = config || {};
        const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
        if (options.firstVisit && readStorage(storageKey) !== '1') {
            return true;
        }
        if (options.welcomeOffer) {
            return true;
        }
        const paths = options.paths && typeof options.paths === 'object' ? options.paths : {};
        let state = {};
        try {
            state = JSON.parse(readStorage(`${storageKey}.checklist`) || '{}') || {};
        } catch (error) {
            // A corrupt state never offers a resume in the engine either.
            return false;
        }
        const path = state.path;
        if (!path || !Object.prototype.hasOwnProperty.call(paths, path)) {
            return false;
        }
        const steps = Array.isArray(paths[path]) ? paths[path] : [];
        const completed = state.completed && Array.isArray(state.completed[path]) ? state.completed[path] : [];
        const complete = steps.length > 0 && steps.every((step, index) =>
            completed.includes(step && step.id ? step.id : String(index)));
        return !complete;
    };

    const startEngine = (root, config) => load().then(Guide => {
        Guide.init(root, config);
        return Guide;
    });

    // Defer the engine until the first real activation of an opener of this root. The opener
    // (launcher, compact launcher relay, welcome action) is replayed once the engine is bound,
    // so the engine's own click handler opens the Guide exactly as before.
    const deferUntilOpen = (root, config) => {
        let pending = false;
        const activate = event => {
            const trigger = event.target && event.target.closest ? event.target.closest(OPEN) : null;
            if (!trigger || !root.contains(trigger)) {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            if (pending) {
                return;
            }
            pending = true;
            root.setAttribute('aria-busy', 'true');
            startEngine(root, config).then(() => {
                root.removeEventListener('click', activate, true);
                root.removeAttribute('aria-busy');
                trigger.click();
                return null;
            }).catch(error => {
                pending = false;
                root.removeAttribute('aria-busy');
                Log.error(error);
            });
        };
        root.addEventListener('click', activate, true);
        root.easyeduGuideDeferredStop = () => {
            root.removeEventListener('click', activate, true);
            delete root.easyeduGuideDeferredStop;
        };
    };

    const init = (rootOrSelector, config) => {
        const root = resolveRoot(rootOrSelector);
        if (!root) {
            return;
        }
        if (root.easyeduGuideDeferredStop) {
            root.easyeduGuideDeferredStop();
        }
        if (engine || needsEngineOnLoad(config)) {
            startEngine(root, config).catch(error => Log.error(error));
            return;
        }
        deferUntilOpen(root, config);
    };

    const destroy = rootOrSelector => {
        const root = resolveRoot(rootOrSelector);
        if (root && root.easyeduGuideDeferredStop) {
            root.easyeduGuideDeferredStop();
        }
        if (engine) {
            engine.destroy(rootOrSelector);
        }
    };

    // K22-15: course facts for path prerequisites. Kept on the root before the engine binds it,
    // so the engine reads them on init; afterwards the engine re-renders the locked cards.
    const setPathFacts = (rootOrSelector, facts) => {
        const root = resolveRoot(rootOrSelector);
        if (!root) {
            return;
        }
        if (engine && typeof engine.setPathFacts === 'function') {
            engine.setPathFacts(root, facts);
            return;
        }
        root.easyeduGuidePathFacts = Object.assign({}, facts || {});
    };

    // Before the engine binds a root there is no configuration: the engine itself returns null
    // (context, token) and false (write) in that case.
    const getPathContext = (root, pathName) => engine ? engine.getPathContext(root, pathName) : null;
    const getPathContextToken = (root, pathName) => engine ? engine.getPathContextToken(root, pathName) : null;
    const setPathContext = (root, pathName, data, token) =>
        engine ? engine.setPathContext(root, pathName, data, token) : false;

    const guideModality = () => {
        if (engine) {
            return engine.guideModality();
        }
        const matches = query => !!(window.matchMedia && window.matchMedia(query).matches);
        const narrow = matches(GUIDE_NARROW_QUERY);
        const touch = narrow || matches(GUIDE_TOUCH_QUERY);
        return {touch, narrow, pointer: touch ? 'touch' : 'mouse'};
    };

    return {
        destroy: destroy,
        getPathContext: getPathContext,
        getPathContextToken: getPathContextToken,
        guideModality: guideModality,
        init: init,
        isLoaded: () => !!engine,
        load: load,
        setPathContext: setPathContext,
        setPathFacts: setPathFacts,
    };
});
