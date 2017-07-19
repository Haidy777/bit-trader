"use strict";

const KrakenClient = require('kraken-api');
const _ = require('lodash');

const PAIR_SPLIT_REGEX = /.{1,3}/g;

module.exports = class KrakenWrapper {
    constructor(key, secret) {
        this._api = new KrakenClient(key, secret, {timeout: 20000}).api;

        return this;
    }

    getTickForPair(pair) {
        return this._api('Ticker', {pair: pair});
    }

    getOpenOrders() {
        return this._api('OpenOrders').then((orders) => {
            const preparedOrders = [];
            orders = _.get(orders, 'open');

            _.forIn(orders, (order, key) => {
                const descr = order.descr;

                preparedOrders.push({
                    id: key,
                    cost: Number(order.cost),
                    description: descr.order,
                    pair: descr.pair,
                    price: Number(descr.price),
                    type: descr.type,
                    orderType: descr.orderType,
                    openAt: order.opentm,
                    amount: Number(order.vol)
                });
            });

            return preparedOrders;
        });
    }

    getAccountBalance() {
        return this._api('Balance').then((balances) => {
            return _.mapValues(balances, Number);
        }).then((balances) => {
            return _.mapKeys(balances, (idx, key) => {
                if (key.length === 4) {
                    return key.substr(1);
                } else {
                    return key;
                }
            });
        });
    }

    getOrderInfo(orderId) {
        return this._api('QueryOrders', {txid: orderId}).then((order) => {
            order = _.get(order, orderId);

            const descr = order.descr;

            return {
                id: orderId,
                status: order.status,
                cost: Number(order.cost),
                description: descr.order,
                pair: descr.pair,
                price: Number(descr.price),
                type: descr.type,
                orderType: descr.orderType,
                openAt: order.opentm,
                amount: Number(order.vol)
            };
        });
    }

    getTradableVolume() {
        let accountBalances = null;

        return this.getAccountBalance().then((balance) => {
            accountBalances = balance;

            return this.getOpenOrders();
        }).then((openOrders) => {
            _.forIn(openOrders, (order) => {
                const pairs = order.pair.match(PAIR_SPLIT_REGEX);
                const orderType = order.type;

                if (orderType === 'buy') {
                    accountBalances[pairs[1]] = accountBalances[pairs[1]] - (order.amount * order.price);
                } else if (orderType === 'sell') {
                    accountBalances[pairs[0]] = accountBalances[pairs[0]] - order.amount;
                }
            });

            return accountBalances;
        });
    }

    execTrade(pair, type, orderType, price, amount) {
        return this._api('AddOrder', {
            pair: pair,
            type: type,
            ordertype: orderType,
            price: price,
            volume: amount
        }).then((info) => {
            return info.txid[0];
        });
    }
};
