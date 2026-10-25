/* eslint-env node */
'use strict';

const versions = require('./build-versions.json');

/**
 * Refuse a different Node version before a builder reads or writes assets.
 *
 * @param {string} actual Version to verify; defaults to the running Node version.
 */
function assertNode(actual = process.versions.node) {
    if (actual !== versions.node) {
        throw new Error('EasyStud build requires Node ' + versions.node + '; running ' + actual +
            '. Use the recorded portable Node executable. No dependencies were changed.');
    }
}

/**
 * Verify the loaded Sass compiler rather than a similarly named package directory.
 *
 * @param {Object} sass Loaded Sass module.
 */
function assertSass(sass) {
    assertNode();
    const match = /^dart-sass\s+([^\s]+)/m.exec(sass.info || '');
    const actual = match ? match[1] : 'unknown';
    if (actual !== versions.sass) {
        throw new Error('EasyStud build requires Dart Sass ' + versions.sass + '; loaded ' + actual +
            '. Pass the recorded Sass package path. No dependencies were changed.');
    }
}

module.exports = {assertNode, assertSass, versions};
