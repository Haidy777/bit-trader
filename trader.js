"use strict";

const _ = require('lodash');

const join = require('path').join;

const Watcher = require('./watcher');
const reporter = require('./reporter');
const StrategySpawner = require('./strategies');
const KrakenWrapper = require('./kraken');

const krakenConfig = require('./config/kraken.json');
const telegramConfig = require('./config/telegram.json');

const LOG_PREFIX = '<bit-trader:trader>';

const watcher = new Watcher(krakenConfig.key, krakenConfig.secret);
const consoleReporter = new reporter.console(watcher);
// const jsonfileReporter = new reporter.jsonFile(watcher, join(__dirname, 'json-storage'));
const telegramReporter = new reporter.telegram(watcher, telegramConfig.key, telegramConfig.userId);

_.forEach(krakenConfig.pairs, (pair) => {
	watcher.createWatcherWorkerForPair(pair, 60000);
});

watcher.startWatching();

// const strateger = new StrategySpawner(krakenConfig.key, krakenConfig.secret);
//
// strateger.createTrader('EOSEUR', 'micro-trades', {
// 	minDiff: 0.05,
// 	multiplicator: 2,
// 	maxMoneyToUse: 5
// });
//
// watcher.on('data', (data) => {
// 	strateger.sendDataToWorker('EOSEUR', 'micro-trades', {
// 		current: data.data.current,
// 		volatility: data.data.volatility['24h']
// 	});
// });