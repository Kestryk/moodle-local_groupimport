/* eslint-env node */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Offline fixtures request the same ordered page sheets as the PHP producer.
module.exports = (root, page = 'manage.php') => {
    const source = fs.readFileSync(path.join(root, page), 'utf8');
    const sheets = [...source.matchAll(/\$PAGE->requires->css\('\/local\/groupimport\/([^']+)'\);/g)]
        .map(match => match[1]);
    assert.ok(sheets.length, 'Actual page must declare its style sheets: ' + page);
    return sheets.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
};
