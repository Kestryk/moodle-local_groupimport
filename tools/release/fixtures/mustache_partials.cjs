/* eslint-env node */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Match Moodle's local partial resolution; missing templates must still fail.
module.exports = (renderer, root) => ({
    render(template, data, partials) {
        return renderer.render(template, data, partials || (name => {
            assert.match(name, /^local_groupimport\/[a-z0-9_-]+$/i, 'Expected a local Guide partial');
            return fs.readFileSync(path.join(root, 'templates', name.split('/')[1] + '.mustache'), 'utf8');
        }));
    },
});
