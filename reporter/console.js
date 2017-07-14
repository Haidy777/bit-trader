"use strict";

const BaseReporter = require('./base');

module.exports = class ConsoleReporter extends BaseReporter {
    handleData(data) {
        const pairData = data.data;
        console.log(`${data.pair}: VOLATILITY ${pairData.volatility.today.toFixed(2)}% CURRENT ${pairData.current.toFixed(5)} LOW ${pairData.low.today.toFixed(5)} HIGH ${pairData.high.today.toFixed(5)}`);
    }
};