// Transport large page configuration separately from Moodle's AMD call arguments.
define(['local_groupimport/easyedu_guide', 'local_groupimport/course_manager', 'local_groupimport/card_title_accent'],
function(Guide, CourseManager, CardTitleAccent) {
    const init = configId => {
        const element = document.getElementById(configId);
        if (!element) {
            throw new Error('EasyStud page configuration is missing.');
        }
        if (element.dataset.initialized === '1') {
            return;
        }
        const config = JSON.parse(element.textContent);
        if (!Array.isArray(config.guide) || !Array.isArray(config.manager)) {
            throw new Error('EasyStud page configuration is invalid.');
        }
        element.dataset.initialized = '1';
        Guide.init(...config.guide);
        CourseManager.init(...config.manager);
        CardTitleAccent.init(document.getElementById(config.manager[0]), [
            {title: '.local-groupimport-easystud-user__name', host: '[data-easystud-user]'},
            {title: '.local-groupimport-easystud-group__name', host: '[data-easystud-group-id]'},
            {title: '.local-groupimport-easystud-grouping__name', host: '[data-easystud-grouping-id]'},
            {title: '.local-groupimport-easystud-tree__section--ungrouped > .local-groupimport-easystud-tree__toggle > span:last-child',
                host: '.local-groupimport-easystud-tree__section--ungrouped'},
        ]);
    };
    return {init: init};
});
