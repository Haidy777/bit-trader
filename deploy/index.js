"use strict";

const asyncToGen = require('async-to-gen');
const klaw = require('klaw');
const fs = require('fs-extra');

const join = require('path').join;

const basePath = join(__dirname, '..', 'src');
const outPath = join(__dirname, '..', 'build');

klaw(basePath).on('data', (item) => {
    let itemPath = item.path;

    if (itemPath.indexOf('.js') !== -1) {
        let fileContent = fs.readFileSync(itemPath, 'utf8');

        fileContent = asyncToGen(fileContent).toString();

        itemPath = itemPath.split('src')[1];
        itemPath = join(outPath, itemPath);

        fs.outputFileSync(itemPath, fileContent, {encoding: 'utf8'});
    }
}).on('end', () => {
    process.exit(0);
});
