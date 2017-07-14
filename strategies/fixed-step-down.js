"use strict";

const BaseStrategie = require('./base-strategie');

module.exports = class FixedStepDownStrategie extends BaseStrategie {
    analyze(low, high, current, volatility) {
        const currentOrders = this.getCurrentOrders();
        const orders = [];

        //TODO

        return orders;
    }

    executeOrders(orders) {
        if (!this._emulateOrders) {
            //TODO display orders
        } else {
            //TODO
        }
    }

    getCurrentOrders () {
        return this._api.getOpenOrders().then((orders)=>{
            console.log(orders);
        });
    }
};