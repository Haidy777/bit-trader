"use strict";

const EventEmitter = require('events');
const Pact = require('bluebird');
const _ = require('lodash');

const fork = require('child_process').fork;
const join = require('path').join;

const LOG_PREFIX = '<bit-trader:watcher>';

module.exports = class Watcher extends EventEmitter {
    constructor(key = '', secret = '') {
        super();

        if (key && secret) {
            this._apiKey = key;
            this._apiSecret = secret;
            this._workers = {};
        } else {
            throw `${LOG_PREFIX} can not create watcher without api credentials!`;
        }
    }

    createWatcherWorkerForPair(pair, interval = 1000) {
        if (pair) {
            this._workers[pair] = this._createWorker(pair, interval);
        } else {
            throw `${LOG_PREFIX} can not create worker without crypto-pair!`;
        }
    }

    _createWorker(pair, interval) {
        return new Pact((resolve) => {
            const worker = fork(join(__dirname, 'worker'), [], {execArgv: []});

            worker.once('message', (data) => {
                if (data.type === 'ready') {
                    resolve(worker);
                }
            });
            worker.on('message', this._messageHandler.bind(this));
            worker.on('error', (err) => {
                this._childErrorHandler(err, pair, interval);
            });
            worker.on('exit', (code) => {
                this._childExitHandler(code, pair, interval);
            });

            worker.send({
                type: 'startup',
                data: {key: this._apiKey, secret: this._apiSecret, pair: pair, interval: interval}
            });

            this._workers[pair] = worker;
        });
    }

    _messageHandler(message) {
        switch (message.type) {
            case 'error':
                console.error(message.message);
                console.error(message.data);
                break;
            case'data':
                // console.info(message.message);
                this.emit('data', message.data);
                break;
            default:
                // console.info(message.message);
                break;
        }
    }

    _childErrorHandler(err, pair, interval) {
        console.error(`${LOG_PREFIX} child died for pair ${pair}`);
        console.error(err);
        console.error(`${LOG_PREFIX} reviving ${pair} worker`);

        this._workers[pair] = this._createWorker(pair, interval);
        this.startWatching(pair);
    }

    _childExitHandler(code, pair, interval) {
        if (code !== 0) {
            console.error(`${LOG_PREFIX} child (${pair}) exited unexpected, reviving`);

            this._workers[pair] = this._createWorker(pair, interval);
            this.startWatching(pair);
        } else {
            console.info(`${LOG_PREFIX} child (${pair}) exited`);
        }
    }

    startWatching(pair = 'all') {
        if (pair === 'all') {
            Pact.props(this._workers)
                .then((workers) => {
                    _.forEach(workers, (worker) => {
                        worker.send({
                            type: 'startWatching'
                        });
                    });
                });
        } else {
            this._workers[pair].then((worker) => {
                worker.send({
                    type: 'startWatching'
                });
            });
        }
    }

    stopWatching(pair = 'all') {
        if (pair === 'all') {
            Pact.props(this._workers)
                .then((workers) => {
                    _.forEach(workers, (worker) => {
                        worker.send({
                            type: 'stopWatching'
                        });
                    });
                });
        } else {
            this._workers[pair].then((worker) => {
                worker.send({
                    type: 'stopWatching'
                });
            });
        }
    }
};