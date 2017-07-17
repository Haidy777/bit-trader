"use strict";

const moment = require('moment');

const BaseReporter = require('./base');

module.exports = class ConsoleReporter extends BaseReporter {
    handleData(data) {
        console.log(`${moment().format('YYYYMMDD HH:mm')} ${data.pair}: VOLATILITY ${data.volatility.today.toFixed(2)}% CURRENT ${data.current.toFixed(5)} LOW ${data.low.today.toFixed(5)} HIGH ${data.high.today.toFixed(5)}`);
    }
};
