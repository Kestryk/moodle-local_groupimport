// Native Moodle settings own storage and validation; the Kit owns choice UI.
import {enhanceSelect, enhanceMultipleSelect} from './searchable_choices';
import * as Motion from './motion';

// Move the original Moodle nodes: names, dependencies, descriptions and save handlers stay native.
const arrangeSections = (form, labels) => {
    const headings = Array.from(form.querySelectorAll('.settingsform h3.main'));
    const compact = window.matchMedia('(max-width: 48rem)');
    const sections = [];
    headings.forEach((heading, index) => {
        const section = document.createElement('section');
        section.className = 'local-groupimport-admin-section';
        const body = document.createElement('div');
        body.className = 'local-groupimport-admin-section__body';
        body.id = 'easystud-admin-section-' + index;
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'local-groupimport-admin-section__toggle';
        toggle.setAttribute('aria-controls', body.id);
        const title = document.createElement('span');
        title.textContent = heading.textContent;
        const icon = document.createElement('span');
        icon.className = 'fa ' + ['fa-sliders', 'fa-eye', 'fa-palette', 'fa-address-card', 'fa-id-badge'][index];
        icon.setAttribute('aria-hidden', 'true');
        toggle.append(icon, title);
        heading.before(section);
        let next = heading.nextElementSibling;
        while (next && !next.matches('h3.main')) {
            // Moodle's final Save row stays outside the section.
            if (next.querySelector('button[type="submit"], input[type="submit"]')) {
                break;
            }
            const following = next.nextElementSibling;
            body.append(next);
            next = following;
        }
        heading.replaceChildren(toggle);
        section.append(heading, body);
        const setOpen = (open, animate) => {
            toggle.setAttribute('aria-expanded', String(open));
            if (!open && body.contains(document.activeElement)) {
                toggle.focus();
            }
            body.inert = !open;
            if (animate) {
                Motion.disclosePanel(body, open);
            } else {
                body.hidden = !open;
            }
        };
        toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true', true));
        setOpen(!compact.matches || index < 2, false);
        sections.push({body, setOpen, index});
    });
    compact.addEventListener('change', () => sections.forEach(s => s.setOpen(!compact.matches || s.index < 2, false)));
    form.addEventListener('invalid', event => {
        const section = sections.find(s => s.body.contains(event.target));
        if (section) {
            section.setOpen(true, false);
        }
    }, true);
    form.querySelectorAll('.form-item').forEach(row => {
        const label = row.querySelector('.form-label');
        if (label) {
            label.classList.remove('text-sm-end', 'text-sm-right');
        }
        const help = row.querySelector('.form-setting > .form-text, .form-setting > .form-description');
        if (label && help) {
            label.append(help);
        }
    });
    form.querySelectorAll('input[type="checkbox"][name^="s_local_groupimport_"]').forEach(input => {
        const wrapper = document.createElement('label');
        wrapper.className = 'local-groupimport-admin-settings__switch';
        const status = document.createElement('span');
        input.before(wrapper);
        wrapper.append(input, status);
        const refresh = () => {
            status.textContent = input.checked ? labels.enabled : labels.disabled;
        };
        input.addEventListener('change', refresh);
        form.addEventListener('reset', () => window.setTimeout(refresh, 0));
        refresh();
    });
    form.querySelectorAll('[data-easyedu-color-picker]').forEach(control => {
        const hex = control.querySelector('.easyedu-color-picker__hex');
        const value = control.getAttribute('data-easyedu-color-default');
        if (!hex || !value) {
            return;
        }
        const restore = document.createElement('button');
        restore.type = 'button';
        restore.className = 'easyedu-button--secondary local-groupimport-admin-settings__restore';
        restore.textContent = labels.restoreColour;
        restore.disabled = hex.readOnly || hex.disabled;
        restore.addEventListener('click', () => {
            hex.value = value;
            hex.dispatchEvent(new Event('input', {bubbles: true}));
            hex.dispatchEvent(new Event('change', {bubbles: true}));
        });
        control.append(restore);
    });
    const reset = form.querySelector('[data-local-groupimport-welcome-reset-open]');
    if (reset) {
        const row = reset.closest('.easyedu-ui');
        row.classList.add('local-groupimport-admin-settings__reset-row');
        const copy = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = labels.guideWelcome;
        copy.append(title);
        const help = row.querySelector('.easyedu-form-note');
        if (help) {
            copy.append(help);
        }
        row.prepend(copy);
        row.closest('.local-groupimport-admin-section__body').append(row);
    }
    const submit = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submit && submit.closest('.row')) {
        submit.closest('.row').classList.add('local-groupimport-admin-settings__actions');
    }
    form.dataset.easyeduAdminLayout = 'ready';
};

export const init = (labels, animationsEnabled = true) => {
    const form = document.querySelector('#page-admin-setting-local_groupimport #adminsettings');
    if (!form || form.dataset.easyeduAdminChoices === 'ready') {
        return;
    }
    form.dataset.easyeduAdminChoices = 'ready';
    form.setAttribute('data-easyedu-motion-policy', animationsEnabled ? 'enabled' : 'disabled');
    arrangeSections(form, labels);
    const controllers = [];
    form.querySelectorAll('select[name^="s_local_groupimport_"]').forEach(select => {
        // Keep a visible native fallback for browser-required validation until
        // the shared component explicitly supports that validation contract.
        if (select.required) {
            return;
        }
        const label = [...select.labels].map(node => node.textContent.trim()).join(' ') || select.name;
        select.parentElement.classList.add('easyedu-ui');
        const enhance = select.multiple ? enhanceMultipleSelect : enhanceSelect;
        const controller = enhance(select, {...labels, label}, {motion: Motion});
        controllers.push(controller);
        // Moodle dependencies may disable a setting after initialisation.
        // Observe native state only, never the generated Kit subtree.
        new MutationObserver(() => controller.refresh()).observe(select, {
            attributes: true,
            attributeFilter: ['disabled', 'selected', 'label'],
            childList: true,
            subtree: true,
        });
    });
    form.addEventListener('reset', () => {
        // Native reset restores values after the event dispatch completes.
        window.setTimeout(() => controllers.forEach(controller => controller.refresh()), 0);
    });
};
