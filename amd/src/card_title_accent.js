// Decorative card-title accent: snap the actual text edge to whole CSS pixels.
// No labels, selection, animation policy or business state belongs here.
export const init = (root, bindings) => {
    if (!root || root.easyeduCardTitleAccent) {
        return;
    }
    const bars = new Map();
    let frame = null;
    let destroyed = false;
    const paint = () => {
        frame = null;
        bars.forEach((bar, title) => {
            if (!root.contains(title) || !bar.isConnected) {
                bar.remove();
                bars.delete(title);
            }
        });
        const targets = bindings.flatMap(binding => Array.from(root.querySelectorAll(binding.title), title =>
            ({title, host: title.closest(binding.host)}))).filter(target => target.host);
        targets.forEach(({host}) => {
            if (!host.classList.contains('easyedu-card-accent-host')) {
                host.classList.add('easyedu-card-accent-host');
            }
        });
        // Read every geometry before writing any position: one layout pass per refresh.
        const positions = targets.map(({title, host}) => {
            if (!title.getClientRects().length) {
                return {title, host, hidden: true};
            }
            const range = document.createRange();
            range.selectNodeContents(title);
            const text = range.getBoundingClientRect();
            const origin = host.getBoundingClientRect();
            return {title, host, left: Math.round(text.left - 4) - origin.left - host.clientLeft,
                top: Math.round(text.bottom + 3) - origin.top - host.clientTop,
                color: getComputedStyle(title).getPropertyValue('--easyedu-card-title-accent-color')};
        });
        positions.forEach(({title, host, hidden, left, top, color}) => {
            let bar = bars.get(title);
            if (!bar || !bar.isConnected) {
                if (hidden) {
                    return;
                }
                bar = document.createElement('span');
                bar.className = 'easyedu-card-title-accent';
                bar.setAttribute('aria-hidden', 'true');
                host.appendChild(bar);
                bars.set(title, bar);
            }
            bar.hidden = !!hidden;
            if (!hidden) {
                bar.style.left = left + 'px';
                bar.style.top = top + 'px';
                bar.style.setProperty('--easyedu-card-title-accent-color', color);
            }
        });
    };
    const schedule = () => {
        if (!destroyed && frame === null) {
            frame = requestAnimationFrame(paint);
        }
    };
    const observer = new MutationObserver(records => {
        if (records.some(record => !record.target.closest?.('.easyedu-card-title-accent'))) {
            schedule();
        }
    });
    observer.observe(root, {subtree: true, childList: true, characterData: true,
        attributes: true, attributeFilter: ['class', 'hidden', 'style']});
    window.addEventListener('resize', schedule);
    root.addEventListener('transitionend', schedule, true);
    root.addEventListener('animationend', schedule, true);
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    document.fonts.ready.then(schedule);
    schedule();
    root.easyeduCardTitleAccent = {destroy: () => {
        destroyed = true;
        observer.disconnect();
        resize.disconnect();
        window.removeEventListener('resize', schedule);
        root.removeEventListener('transitionend', schedule, true);
        root.removeEventListener('animationend', schedule, true);
        if (frame !== null) {
            cancelAnimationFrame(frame);
        }
        root.querySelectorAll('.easyedu-card-title-accent').forEach(bar => bar.remove());
        root.querySelectorAll('.easyedu-card-accent-host').forEach(host => host.classList.remove('easyedu-card-accent-host'));
        delete root.easyeduCardTitleAccent;
    }};
};
