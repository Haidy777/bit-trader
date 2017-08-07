"use strict";

const _ = require('lodash');
const {abs} = Math;

module.exports = function getTickerInformation(api, nonce, pairs) {
    pairs = _.castArray(pairs);

    let params = {
        nonce,
        pair: pairs.join(',')
    };

    return api('Ticker', params).then((data) => {
        const ticks = [];

        pairs.forEach((pair) => {
            let pairData = data[pair];
            let preparedData = {
                id: pair,
                today: {
                    low: parseFloat(pairData.l[0]),
                    high: parseFloat(pairData.h[0]),
                    avg: parseFloat(pairData.p[0])
                },
                '24h': {
                    low: parseFloat(pairData.l[1]),
                    high: parseFloat(pairData.h[1]),
                    avg: parseFloat(pairData.p[1])
                }
            };

            preparedData.today.volatility = abs((preparedData.today.high - preparedData.today.low) / preparedData.today.low) * 100;
            preparedData['24h'].volatility = abs((preparedData['24h'].high - preparedData['24h'].low) / preparedData['24h'].low) * 100;

            ticks.push(preparedData);
        });

        return ticks;
    });
};
