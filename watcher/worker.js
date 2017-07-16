"use strict";

const _ = require('lodash');
const EventEmitter = require('events');

const ChildSlave = require('../helper/child-workers/child-slave');
const KrakenWrapper = require('../kraken');

const ipcHelper = require('../helper/ipc-helper');
const sendMessage = ipcHelper.sendMessage;
const sendLogMessage = ipcHelper.sendLogMessage;

const abs = Math.abs;

module.exports = class WatcherWorker extends ChildSlave(EventEmitter) {
	constructor(options, params) {
		super(...arguments);

		this._api = new KrakenWrapper(options.key, options.secret);
		this._requestInterval = params.interval;
		this._pair = params.pair;
		this._interval = null;
	}

	start(params) {
		if (params) {
			let newInterval = params.interval;
			let newPair = params.pair;

			if (newInterval && newPair) {
				this._requestInterval = newInterval;
				this._pair = newPair;
			} else {
				sendLogMessage('error', 'cannot updated worker params, because of missing params');
			}
		} else {
			sendLogMessage('info', 'starting to work');
			this._interval = setInterval(this.requestData.bind(this), this._requestInterval);
		}
	}

	stop(params) {
		if (params) {
			sendLogMessage('error', `this worker doesn't support params within the stop action`);
		} else {
			clearInterval(this._interval);
		}
	}

	requestData() {
		this._api.getTickForPair(this._pair).then((data) => {
			return this.prepareData(data);
		}).then((data) => {
			this.emit('data', data);
		});
	}

	prepareData(data) {
		const pair = this._pair;
		data = _.get(data, pair);

		const low = data['l'].map(Number);
		const high = data['h'].map(Number);

		const preparedData = {
			pair: pair,
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
			current: Number(data['c'][0])
		};

		return preparedData;
	}
};