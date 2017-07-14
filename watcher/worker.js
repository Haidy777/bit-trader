"use strict";

const _ = require('lodash');

const abs = Math.abs;

const sendMessage = require('../helper').ipc.sendMessage;

const KrakenWrapper = require('../kraken');

let LOG_PREFIX = '<bit-trader:watcher/worker>';

let api = null;
let pair = '';
let interval = null;
let watchInterval = null;

function prepareData (data) {
    data = _.get(data, pair);

    const low = data['l'].map(Number);
    const high = data['h'].map(Number);

    const preparedData = {
        low: {
            today: low[0],
            "24h": low[1]
        },
        high: {
            today: high[0],
            "24h": high[1]
        },
        volatility: {
            today: abs(((high[0] - low[0]) / low[0]) * 100),
            "24h": abs(((high[1] - low[1]) / low[1]) * 100)
        },
        current: Number(data['c'][0])
    };

    return preparedData;
}

function watch() {
    api.getTickForPair(pair)
        .then((data) => {
            sendMessage('data', `${LOG_PREFIX} got data`, {pair: pair, data: prepareData(data)});
        })
        .catch((err) => {
        console.log(err);
            sendMessage('error', `${LOG_PREFIX} got error`, err);
        });
}

process.on('message', (message) => {
    const data = message.data;

    switch (message.type) {
        case 'startup':
            api = new KrakenWrapper(data.key, data.secret);
            interval = data.interval;
            pair = data.pair;

            LOG_PREFIX = `${LOG_PREFIX} ${pair}`;

            sendMessage('ready', `${LOG_PREFIX} ready`);

            break;
        case 'startWatching':
            watchInterval = setInterval(watch.bind(this), interval);

            sendMessage('generic', `${LOG_PREFIX} started watching`);

            break;
        case 'stopWatching':
            clearInterval(watchInterval);

            sendMessage('generic', `${LOG_PREFIX} stopped watching`);

            break;
    }
});