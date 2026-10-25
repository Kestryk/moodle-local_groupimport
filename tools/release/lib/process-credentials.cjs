/* eslint-env node */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// The authenticated supervisor owns these values and clears them after its child.
module.exports = secretFile => {
    const username = process.env.EASYEDU_MOODLE_USERNAME;
    const password = process.env.EASYEDU_MOODLE_PASSWORD;
    if (username && password) {
        return {username, password};
    }
    assert.ok(secretFile && path.isAbsolute(secretFile), 'Absolute credential file or supervised process credentials');
    return {username: 'admin', password: fs.readFileSync(secretFile, 'utf8').trim()};
};
