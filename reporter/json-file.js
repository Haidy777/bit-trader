"use strict";

const fse = require('fs-extra');

const join = require('path').join;

const BaseReporter = require('./base');

const LOG_PREFIX = '<bit-trader:reporter/json-file>';

module.exports = class JsonFileReporter extends BaseReporter {
    constructor(watcher, directory) {
        super(...arguments);

        this._dir = directory;

        if (directory) {
            fse.ensureDir(directory, (err) => {
                if (err) {
                    throw `${LOG_PREFIX} could not ensure dir (${directory}) ${err}`;
                }
            });
        } else {
            throw `${LOG_PREFIX} no directory for json-files specified`;
        }
    }

    _appendToPair(pair, data) {
        data.timestamp = Date.now();
        const filePath = join(this._dir, `${pair}.json`);

        fse.ensureFile(filePath, (err) => {
            if (err) {
                throw `${LOG_PREFIX} could not ensure file (${filePath}) ${err}`;
            }

            fse.writeJson(filePath, data, {flag: 'a'}, (err) => {
                if (err) {
                    throw `${LOG_PREFIX} could not append file (${filePath}) ${err}`;
                }
            });
        });
    }

    handleData(data) {
        this._appendToPair(data.pair, data.data);
    }
};