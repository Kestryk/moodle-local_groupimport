// Transport large page configuration separately from Moodle's AMD call arguments.
define(['local_groupimport/easyedu_guide', 'local_groupimport/course_manager'], function(Guide, CourseManager) {
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
    };
    return {init: init};
});
