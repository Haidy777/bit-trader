"use strict";

const LOG_PREFIX = '<bit-trader:base-strategie>';

module.exports = class BaseStrategie {
    constructor(watcher, api, pair, config, emulateOrders) {
        this._pair = pair;
        this._config = config;
        this._api = api;
        this._emulateOrders = emulateOrders;

        watcher.on('data', this.handleData.bind(this));
    }

    handleData(data) {
        if (data.pair === this._pair) {
            data = data.data;

            const orders = this.analyze(data.low.today, data.high.today, data.current, Number(data.volatility.today.toFixed(2)));
            this.executeOrders(orders);
        }
    }

    analyze(low, high, current, volatility) {
        console.log(`${LOG_PREFIX} did not override analyze(${low}, ${high}, ${current}, ${volatility})`);
    }

    executeOrders(orders) {
        console.log(`${LOG_PREFIX} did not override executeOrders(${orders})`);
    }

    getCurrentOrders() {
        return this._api.getOpenOrders();
    }
};