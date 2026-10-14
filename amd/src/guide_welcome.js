// Moodle adapter only: shared Guide owns all welcome presentation and Motion.
define([], function() {
    const destroy = rootOrSelector => {
        const root = typeof rootOrSelector === 'string' ? document.querySelector(rootOrSelector) : rootOrSelector;
        root?.easyeduWelcomeAdapter?.abort();
        if (root) delete root.easyeduWelcomeAdapter;
    };

    const init = (rootOrSelector, config) => {
        const root = typeof rootOrSelector === 'string' ? document.querySelector(rootOrSelector) : rootOrSelector;
        if (!root || !config?.eligible || root.easyeduWelcomeAdapter) return;
        const lifecycle = new AbortController();
        root.easyeduWelcomeAdapter = lifecycle;
        let acknowledged = false;
        let pending = false;
        document.addEventListener('easyedu:guide-opened', async event => {
            if (event.detail?.root !== root || acknowledged || pending) return;
            pending = true;
            try {
                const response = await fetch(config.endpoint, {
                    method: 'POST', credentials: 'same-origin', signal: lifecycle.signal,
                    body: new URLSearchParams({courseid: config.courseid, generation: config.generation, sesskey: config.sesskey})
                });
                if (!response.ok) return;
                const result = await response.json();
                if (result.acknowledged === true) {
                    acknowledged = true;
                    root.dataset.easyeduWelcomeAcknowledged = '1';
                }
                // A stale generation remains eligible on the next server page.
            } catch (error) {
                // Preference failure never interrupts the guide or course work.
                // Do not log request/configuration data; a later opening retries.
            } finally { pending = false; }
        }, {signal: lifecycle.signal});
        // "Later" hides the invitation until the next login (session only, the guide stays unseen).
        // The shared Guide owns the button; the adapter only listens to its click.
        root.addEventListener('click', event => {
            if (!event.target.closest?.('[data-easyedu-guide-welcome-dismiss]') || acknowledged) return;
            fetch(config.endpoint, {
                method: 'POST', credentials: 'same-origin', signal: lifecycle.signal,
                body: new URLSearchParams({courseid: config.courseid, generation: config.generation, sesskey: config.sesskey,
                    action: 'later'})
            }).catch(() => {
                // A failed postponement only means the invitation comes back on the next page.
            });
        }, {signal: lifecycle.signal});
        window.addEventListener('pagehide', () => destroy(root), {once: true, signal: lifecycle.signal});
    };
    return {destroy: destroy, init: init};
});
