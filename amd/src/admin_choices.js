// Native Moodle settings own storage and validation; the Kit owns choice UI.
import {enhanceSelect, enhanceMultipleSelect} from './searchable_choices';

export const init = labels => {
    const form = document.querySelector('#page-admin-setting-local_groupimport #adminsettings');
    if (!form || form.dataset.easyeduAdminChoices === 'ready') {
        return;
    }
    form.dataset.easyeduAdminChoices = 'ready';
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
        const controller = enhance(select, {...labels, label});
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
