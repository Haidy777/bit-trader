"use strict";

const Pact = require('bluebird');

const BaseReporter = require('../base');

const fork = require('child_process').fork;
const join = require('path').join;

const LOG_PREFIX = '<bit-trader:reporter/telegram>';

module.exports = class TelegramReporter extends BaseReporter {
	constructor(watcher, botKey, chatId) {
		super(...arguments);

		this._botKey = botKey;
		this._chatId = chatId;

		this._createBotWorker();
	}

	_createBotWorker() {
		this._worker = new Pact((resolve) => {
			const worker = fork(join(__dirname, 'worker'), [], {execArgv: []});

			worker.once('message', (data) => {
				if (data.type === 'ready') {
					resolve(worker);
				}
			});
			worker.on('message', this._messageHandler.bind(this));
			worker.on('error', (err) => {
				this._childErrorHandler(err);
			});
			worker.on('exit', (code) => {
				this._childExitHandler(code);
			});

			worker.send({
				type: 'startup',
				data: {botKey: this._botKey, chatId: this._chatId}
			});

			this._worker = worker;
		});
	}

	_messageHandler(message) {
		switch (message.type) {
			case 'error':
				console.error(message.message);
				console.error(message.data);
				break;
			case'data':
				console.info(message.message);
				break;
			default:
				console.info(message.message);
				break;
		}
	}

	_childErrorHandler(err) {
		console.error(`${LOG_PREFIX} child died`);
		console.error(err);

		this._worker = this._createWorker();
	}

	_childExitHandler(code) {
		if (code !== 0) {
			console.error(`${LOG_PREFIX} child exited unexpected, reviving`);

			this._worker = this._createWorker();
		} else {
			console.info(`${LOG_PREFIX} child (${pair}) exited`);
		}
	}

	handleData(data) {
		this._worker.then((worker) => {
			worker.send({type: 'data', data: data});
		});
	}
};