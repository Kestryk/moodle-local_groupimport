const {expect} = require('@playwright/test');

// Presentation-only paint probe. The product remains inert before and after it.
exports.assertModalLayer = async(target, rows) => {
    const record = await target.evaluate(element => {
        const guide = document.querySelector('[data-easyedu-guide-root]');
        const frame = document.querySelector('[data-easyedu-guide-highlight]');
        const dialog = element.closest('[role="dialog"][aria-modal="true"]');
        const panel = guide?.querySelector('[data-easyedu-guide-checklist]');
        const external = dialog && !dialog.matches('[data-easyedu-guide-modal]');
        const fs = getComputedStyle(frame), ps = getComputedStyle(panel);
        const data = {external: !!external, inDialog: frame.classList.contains('easyedu-guide-highlight--in-dialog'),
            marker: guide.hasAttribute('data-easyedu-guide-target-in-dialog'), pointer: fs.pointerEvents,
            frameZ: Number(fs.zIndex), panelZ: Number(ps.zIndex), shadow: fs.boxShadow,
            forced: matchMedia('(forced-colors: active)').matches, target: element.name || element.dataset.easystudCloseAdvancedSettings || element.tagName};
        if (external) {
            data.rawRole = getComputedStyle(guide).getPropertyValue('--easyedu-modal-layer').trim();
            // Public custom properties may retain calc() tokens. Resolve the
            // property in the real browser cascade, not Number()/parseInt().
            const probe = document.createElement('span');
            probe.hidden = true;
            probe.setAttribute('aria-hidden', 'true');
            probe.style.setProperty('z-index', 'var(--easyedu-modal-layer, 1070)');
            probe.style.setProperty('pointer-events', 'none');
            try {
                guide.appendChild(probe);
                data.role = Number(getComputedStyle(probe).zIndex);
            } finally {
                probe.remove();
            }
            const r = frame.getBoundingClientRect();
            const rect = n => {const b=n.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};};
            data.geometry = {frame:rect(frame),target:rect(element),panel:rect(panel),dialog:rect(dialog)};
            data.effects = frame.getAnimations().map(a=>({state:a.playState,duration:a.effect.getComputedTiming().duration,
                iterations:a.effect.getComputedTiming().iterations,transition:a.transitionProperty || null}));
            const points = [[r.left + 1, r.top + r.height / 2], [r.right - 1, r.top + r.height / 2],
                [r.left + r.width / 2, r.top + 1], [r.left + r.width / 2, r.bottom - 1]];
            const original = frame.style.getPropertyValue('pointer-events'), priority = frame.style.getPropertyPriority('pointer-events');
            try {
                frame.style.setProperty('pointer-events', 'auto', 'important');
                data.hits = points.map(([x,y])=>{const n=document.elementFromPoint(x,y);return {x,y,frame:n===frame,
                    tag:n?.tagName,className:typeof n?.className==='string'?n.className:null,z:n?getComputedStyle(n).zIndex:null};});
                data.edgePaint = data.hits.map(hit=>hit.x>=0 && hit.x<innerWidth && hit.y>=0 && hit.y<innerHeight && hit.frame);
            } finally {
                if (original) frame.style.setProperty('pointer-events', original, priority);
                else frame.style.removeProperty('pointer-events');
            }
            data.pointerRestored = getComputedStyle(frame).pointerEvents;
        }
        return data;
    });
    rows.push({layer: record}); // Retain diagnostic before any assertion.
    expect(record.pointer).toBe('none');
    if (record.external) {
        expect(record.inDialog && record.marker).toBeTruthy();
        expect(record.frameZ).toBe(record.role + 1);
        expect(record.panelZ).toBe(record.role + 2);
        expect(record.edgePaint).toEqual([true, true, true, true]);
        expect(record.pointerRestored).toBe('none');
        if (record.forced) expect(record.shadow).toBe('none');
    } else {
        expect(record.inDialog || record.marker).toBeFalsy();
        expect(record.frameZ).toBe(1020);
    }
};
