"use strict";

const LOG_PREFIX = '<bit-trader:reporter/base>';

module.exports = class BaseReporter {
    constructor(watcher) {
        watcher.on('data', this.handleData.bind(this));
    }

    handleData(data) {
        console.info(`${LOG_PREFIX} did not override 'handleData() in reporter'`);
        console.info(data);
    }
};