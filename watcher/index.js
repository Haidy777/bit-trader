"use strict";

const EventEmitter = require('events');
const _ = require('lodash');

const ChildMaster = require('../helper/child-workers/child-master');

const join = require('path').join;
const keys = Object.keys;

module.exports = class Watcher extends EventEmitter {
    constructor(key, secret, pair, watchInterval = 60000) {
        super();

        let childMaster = null;
        this._workers = {};
        this._workerId = null;

        if (Array.isArray(pair)) {
            childMaster = new ChildMaster(false, true, {
                key: key,
                secret: secret
            });

            _.forEach(pair, (p) => {
                this._workers[p] = childMaster.createWorker({
                    slaveClass: join(__dirname, 'worker'),
                    pair: p,
                    interval: watchInterval
                });
            });

            this._isSingleWather = false;
        } else if (typeof pair === 'string') {
            childMaster = new ChildMaster(true, true, {
                key: key,
                secret: secret
            });

            this._workerId = childMaster.createWorker({
                slaveClass: join(__dirname, 'worker'),
                pair: pair,
                interval: watchInterval
            });

            this._isSingleWather = true;
        }

        childMaster.on('log', (level, message) => {
            console.log(`${level} ${message}`); //TODO pass to custom logger
        });

        childMaster.on('data', (data) => {
            this.emit('data', data);
        });

        this._childMaster = childMaster;
    }

    start(pair) {
        if (this._isSingleWather) {
            this._childMaster.controlWorker(this._workerId, 'start');
        } else if (pair) {
            this._childMaster.controlWorker(this._workers[pair], 'start');
        } else {
            this._childMaster.controlAllWorkers('start');
        }
    }

    stop(pair) {
        if (this._isSingleWather) {
            this._childMaster.controlWorker(this._workerId, 'stop');
        } else if (pair) {
            this._childMaster.controlWorker(this._workers[pair], 'stop');
        } else {
            this._childMaster.controlAllWorkers('stop');
        }
    }
};
