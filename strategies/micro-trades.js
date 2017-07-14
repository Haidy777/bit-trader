"use strict";

const _ = require('lodash');

const helper = require('../helper');
const sendMessage = helper.ipc.sendMessage;
const round = helper.round;

const KrakenWrapper = require('../kraken');

const MAX_DECIMAL_ACCURACY = 5;
let LOG_PREFIX = '<bit-trader:trader/micro-trades>';

//TODO cleanup logging
//TODO add statistics over trade-yes-no calculation-time

let api = null;
let pair = '';
let options = {};
let openOrder = {id: null, sellPrice: 0, sellAmount: 0};
let isInTrade = false;
let cumulativeProfit = 0;

function trade(current, volatility) {
    if (isInTrade && openOrder.id) {
        api.getOrderInfo(openOrder.id).then((orderInfo) => {
            if (orderInfo.status === 'closed') {
                if (orderInfo.type === 'sell') {
                    openOrder = {id: null, sellPrice: 0, sellAmount: 0};
                    isInTrade = false;

                    sendMessage('fin', `${LOG_PREFIX} sell fulfilled`);
                } else if (orderInfo.type === 'buy') {
                    api.execTrade(pair, 'sell', 'limit', openOrder.sellPrice, openOrder.sellAmount).then((oId) => {
                        openOrder = {id: oId};
                        sendMessage('sell', `${LOG_PREFIX} buy order fulfilled`);
                    });
                }
            } else if (orderInfo.status === 'open') {
                sendMessage('waiting', `${LOG_PREFIX} waiting for orders to fulfill`);
            }
        });
    } else {
        let buyPrice = current - options.minDiff;
        let buyAmount = round(options.maxMoneyToUse / buyPrice, MAX_DECIMAL_ACCURACY);
        let buyValue = buyPrice * buyAmount;
        let sellPrice = buyPrice + (options.multiplicator * options.minDiff);

        api.getTradableVolume().then((pairs) => {
            return _.get(pairs, pair.substr(-3));
        }).then((maxTradeableMoney) => {
            if (buyValue > maxTradeableMoney) {
                buyAmount = round(maxTradeableMoney / buyPrice, MAX_DECIMAL_ACCURACY);
            }

            let maxMinPrice = round(current - (buyPrice * volatility), MAX_DECIMAL_ACCURACY);
            let maxMaxPrice = round(current + (buyPrice * volatility), MAX_DECIMAL_ACCURACY);

            buyPrice = round(buyPrice, MAX_DECIMAL_ACCURACY);
            sellPrice = round(sellPrice, MAX_DECIMAL_ACCURACY);

            if (buyPrice >= maxMinPrice && sellPrice <= maxMaxPrice) {
                isInTrade = true;
                api.execTrade(pair, 'buy', 'limit', buyPrice, buyAmount).then((oId) => {
                    openOrder = {
                        id: oId,
                        sellPrice: sellPrice,
                        sellAmount: buyAmount
                    };

                    let profit = round((sellPrice - buyPrice) * buyAmount, MAX_DECIMAL_ACCURACY);
                    cumulativeProfit = cumulativeProfit + profit;

                    sendMessage('buy', `${LOG_PREFIX} creating buy order (b:${buyPrice}, s:${sellPrice}, p: ${profit}, cP: ${cumulativeProfit})`, openOrder);
                });
            } else {
                sendMessage('noTrade', `${LOG_PREFIX} not enough volatility for trade (buy: ${buyPrice}, sell: ${sellPrice})`);
            }
        });
    }
}

process.on('message', (message) => {
    const data = message.data;

    switch (message.type) {
        case 'startup':
            api = new KrakenWrapper(data.key, data.secret);
            pair = data.pair;
            options = data.options;

            LOG_PREFIX = `${LOG_PREFIX} ${pair}`;

            sendMessage('ready', `${LOG_PREFIX} ready`);

            break;
        case 'analyze':
            trade(data.current, data.volatility);
            break;
    }
});