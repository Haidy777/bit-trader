"use strict";

// const EventEmitter = require('events');

const sendLogMessage = require('../ipc-helper').sendLogMessage;

module.exports = (EventEmitter) => class extends EventEmitter {
    constructor(options = {}, params = {}) {
        super();

        this._options = options;
        this._params = params;
    }

    startup() {
        this.emit('ready');
    }

    handleData(data) {
        sendLogMessage('info', 'got data to handle');
    }

    start(params) {
        sendLogMessage('info', 'starting my work', params);
    }

    stop(params) {
        sendLogMessage('info', 'stopping my work', params);
    }

    teardown() {
        this.emit('teardown');
    }

    control(data) {
        const action = data.action;

        switch (action) {
            case 'start':
                this.start(data.params);
                break;
            case 'stop':
                this.stop(data.params);
                break;
            case 'teardown':
                this.teardown();
                break;
        }
    }
};
