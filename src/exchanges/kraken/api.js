"use strict";

const KrakenClient = require('kraken-api');

const pairs = require('./pairs');

module.exports = class KrakenAPI {
    constructor(key, secret) {
        this._api = new KrakenClient(key, secret).api;
    }

    getTradeablePairs(nonce, params = {}) {
        return pairs(this._api, nonce, params);
    }
};
