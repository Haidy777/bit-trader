"use strict";

const _ = require('lodash');
const moment = require('moment');

const KrakenWrapper = require('./kraken');

const krakenConfig = require('./config/kraken.json');
const strategyParams = krakenConfig.strategyParams;

const round = require('./helper').round;

const abs = Math.abs;

const kApi = new KrakenWrapper(krakenConfig.key, krakenConfig.secret);

let isInTrade = false;
let openOrder = {id: null, sellPrice: 0, sellAmount: 0};

function getTimestampFormatted() {
    return moment().format('YYYYMMDD HH:mm:ss');
}

setInterval(() => {
    kApi.getTickForPair(strategyParams.pair).then((tickData) => {
        tickData = _.get(tickData, strategyParams.pair);

        const low = tickData['l'].map(Number);
        const high = tickData['h'].map(Number);

        return {
            pair: strategyParams.pair,
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
            current: parseFloat(tickData['c'][0])
        };
    }).then((tickData) => {
        let current = tickData.current;
        let volatility = tickData.volatility['24h'];

        console.log(`${getTimestampFormatted()} ${tickData.pair}: V ${round(tickData.volatility.today, 2)}% C ${round(current)} L ${round(tickData.low.today)} H ${round(tickData.high.today)}`);

        if (isInTrade && openOrder.id) {
            kApi.getOrderInfo(openOrder.id).then((orderInfo) => {
                if (orderInfo.status === 'closed') {
                    if (orderInfo.type === 'sell') {
                        openOrder = {id: null, sellPrice: 0, sellAmount: 0};
                        isInTrade = false;

                        console.log(`${getTimestampFormatted()} finished microtrade cycle restarting`);
                    } else if (orderInfo.type === 'buy') {
                        kApi.execTrade(strategyParams.pair, 'sell', 'limit', openOrder.sellPrice, openOrder.sellAmount).then((oId) => {
                            openOrder = {id: oId};
                            console.log(`${getTimestampFormatted()} buy order executed, creating sell`);
                        });
                    }
                } else if (orderInfo.status === 'open') {
                    if (orderInfo.type === 'buy') {
                        if (abs(orderInfo.price - current) >= strategyParams.minDiff * 4) {
                            kApi.cancelOrder(openOrder.id).then(() => {
                                console.log(`${getTimestampFormatted()} canceled buy order because current price is to far, resetting`);
                                openOrder = {id: null, sellPrice: 0, sellAmount: 0};
                                isInTrade = false;
                            });
                        }
                    }
                    //console.log(`${getTimestampFormatted()} waiting for order to fulfill`);
                } else if (orderInfo.status === 'canceled') {
                    console.log(`${getTimestampFormatted()} order canceled resetting`);
                    openOrder = {id: null, sellPrice: 0, sellAmount: 0};
                    isInTrade = false;
                }
            });
        } else {
            let buyPrice = current - strategyParams.minDiff;
            let buyAmount = round(strategyParams.maxMoneyToUse / buyPrice, 5);
            let buyValue = buyPrice * buyAmount;
            let sellPrice = buyPrice + (strategyParams.multiplicator * strategyParams.minDiff);

            kApi.getTradableVolume().then((pairs) => {
                return _.get(pairs, strategyParams.pair.substr(-3));
            }).then((maxTradeableMoney) => {
                if (buyValue > maxTradeableMoney) {
                    buyAmount = round(maxTradeableMoney / buyPrice, 5);
                }

                let maxMinPrice = round(current - (buyPrice * volatility), 5);
                let maxMaxPrice = round(current + (buyPrice * volatility), 5);

                buyPrice = round(buyPrice, 5);
                sellPrice = round(sellPrice, 5);

                if (buyPrice >= maxMinPrice && sellPrice <= maxMaxPrice) {
                    isInTrade = true;
                    kApi.execTrade(strategyParams.pair, 'buy', 'limit', buyPrice, buyAmount).then((oId) => {
                        openOrder = {
                            id: oId,
                            sellPrice: sellPrice,
                            sellAmount: buyAmount
                        };

                        console.log(`${getTimestampFormatted()} creating buy order (b: ${buyPrice}, s: ${sellPrice}, p: ${round((sellPrice - buyPrice) * buyAmount, 5)})`);
                    });
                } else {
                    console.log(`${getTimestampFormatted()} no trade possible`);
                }
            });
        }
    });
}, strategyParams.checkInterval);
