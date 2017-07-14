"use strict";

const EventEmitter = require('events');
const Pact = require('bluebird');

const fork = require('child_process').fork;
const join = require('path').join;

const LOG_PREFIX = '<bit-trader:trader>';

module.exports = class StrategySpawner extends EventEmitter {
    constructor(key, secret) {
        super();

        if (key && secret) {
            this._apiKey = key;
            this._apiSecret = secret;
            this._workers = {};
        } else {
            throw `${LOG_PREFIX} can not create watcher without api credentials!`;
        }
    }

    createTrader(pair, strategy, options) {
        if (pair && strategy && options) {
            this._workers[pair] = this._createWorker(pair, strategy, options);
        } else {
            throw `${LOG_PREFIX} can not create worker without options!`;
        }
    }

    _createWorker(pair, strategy, options) {
        return new Pact((resolve) => {
            const worker = fork(join(__dirname, `${strategy}.js`), [], {execArgv: []});

            worker.once('message', (data) => {
                if (data.type === 'ready') {
                    resolve(worker);
                }
            });
            worker.on('message', this._messageHandler.bind(this));
            worker.on('error', (err) => {
                this._childErrorHandler(err, pair, strategy, options);
            });
            worker.on('exit', (code) => {
                this._childExitHandler(code, pair, strategy, options);
            });

            worker.send({
                type: 'startup',
                data: {key: this._apiKey, secret: this._apiSecret, pair: pair, options: options}
            });

            this._workers[`${pair}-${strategy}`] = worker;
        });
    }

    sendDataToWorker(pair, strategy, data) {
        this._workers[`${pair}-${strategy}`].send({
            type: 'analyze',
            data: data
        });
    }

    _messageHandler(message) {
        switch (message.type) {
            case 'error':
                console.error(message.message);
                console.error(message.data);
                break;
            case'data':
                console.info(message.message);
                this.emit('data', message.data);
                break;
            default:
                console.info(message.message);
                break;
        }
    }

    _childErrorHandler(err, pair, strategy, options) {
        console.error(`${LOG_PREFIX} child died for pair ${pair}`);
        console.error(err);
        console.error(`${LOG_PREFIX} reviving ${pair} worker`);

        this._workers[`${pair}-${strategy}`] = this._createWorker(pair, strategy, options);
    }

    _childExitHandler(code, pair, strategy, options) {
        if (code !== 0) {
            console.error(`${LOG_PREFIX} child (${`${pair}-${strategy}`}) exited unexpected, reviving`);

            this._workers[`${pair}-${strategy}`] = this._createWorker(pair, strategy, options);
        } else {
            console.info(`${LOG_PREFIX} child (${`${pair}-${strategy}`}) exited`);
        }
    }
};