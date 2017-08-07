"use strict";

const KrakenClient = require('kraken-api');

const pairs = require('./pairs');
const ticker = require('./ticker');

module.exports = class KrakenAPI {
    constructor(key, secret) {
        this._api = new KrakenClient(key, secret).api;
    }

    getTradeablePairs(nonce, params = {}) {
        return pairs(this._api, nonce, params);
    }

    getTickerInformation(nonce, pairs) {
        return ticker(this._api, nonce, pairs);
    }
};
