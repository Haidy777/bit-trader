"use strict";

const EventEmitter = require('events');
const uuid = require('uuid/v4');
const _ = require('lodash');
const Pact = require('bluebird');

const fork = require('child_process').fork;

const sendControlMessage = require('../ipc-helper').sendControlMessage;

const LOG_PREFIX = `<bit-trader:helper/child-workers/child-master>`;

module.exports = class ChildMaster extends EventEmitter {
	constructor(hasSingleChild = false, restartOnDeath = true, options = {}) {
		super();

		this.emit('log', 'info', `${LOG_PREFIX} creating new child-master`);

		this._options = options;
		this._hasSingleChild = hasSingleChild;
		this._restartOnDeath = restartOnDeath;

		if (hasSingleChild) {
			this._child = {};
		} else {
			this._childs = {};
		}
	}

	createWorker(params = {}) {
		if (this._hasSingleChild) {
			this.emit('log', 'info', `${LOG_PREFIX} creating single child instance for master`);
			let child = this._child;

			if (child.id) {
				this.emit('log', 'info', `${LOG_PREFIX} destroying old child instance`);

				child.once('exit', (exitCode) => {
					if (exitCode === 0) {
						this._child = this._createChild(uuid());
					}
				});

				this._teardownChild(child.id, params);
			} else {
				this._child = this._createChild(uuid());
			}
		} else {
			this.emit('log', 'info', `${LOG_PREFIX} adding a child instance to master`);
			let id = uuid();

			this._childs[id] = this._createChild(id);
		}
	}

	removeWorker(id) {
		this._teardownChild(id);
	}

	controlWorker(id, command, params) {
		sendControlMessage(this._getChild(id), command, params);
	}

	_getChild(id) {
		if (this._hasSingleChild) {
			return this._child;
		} else {
			return _.findBy(this._childs, 'id', id);
		}
	}

	_createChild(childId, params) {
		return new Pact((resolve, reject) => {
			const child = fork('./child', [], {execArgv: []});

			child.once('message', (data) => {
				if (data.type === 'ready') {
					//TODO emit log
					resolve({
						id: childId,
						child: child,
						params: params
					});
				} else {
					reject(`${LOG_PREFIX} could not create worker`);
					//TODO emit log
				}
			});

			child.on('message', (data) => {
				this._childMessageHandler(childId, data);
			});

			child.on('error', (err) => {
				this._childErrorHandler(childId, err);
			});

			child.on('exit', (exitCode) => {
				this._childExitHandler(childId, exitCode);
			});

			child.send({
				type: 'startup',
				data: {
					childOptions: this._options,
					childParams: params
				}
			});
		});
	}

	_teardownChild(childId) {
		const child = this._getChild(childId);
		//TODO emit log?
		child.once('exit', (exitCode) => {
			if (exitCode !== 0) {
				//TODO emit log?
			}
		});

		sendControlMessage(child, 'teardown');

		if (this._hasSingleChild) {
			this.child = null;
		} else {
			delete this._childs[childId];
		}
	}

	_childMessageHandler(childId, message) {
		const data = message.data;

		switch (message.type) {
			case 'log':
				this.emit('log', message.level, this._prepareChildLogMessage(childId, message.message), data);
				break;
			case 'data':
				this.emit('log', 'verbose', this._prepareChildLogMessage(childId, message.message), data);
				this.emit('data', data);
				break;
			default:
				this.emit('log', 'verbose', this._prepareChildLogMessage(childId, message.message), data);
				break;
		}
	}

	_childErrorHandler(childId, err) {
		//TODO emit log
		if (this._restartOnDeath) {
			this.createWorker(this._getChild(childId).params);
		} else {
			this._teardownChild(childId);
		}
	}

	_childExitHandler(childId, exitCode) {
		if (exitCode !== 0) {
			//Todo emit log
			if (this._restartOnDeath) {
				//Todo emit log
				this.createWorker(this._getChild(childId).params);
			}
		}
		//TODO emit log
	}

	_prepareChildLogMessage(childId, message) {
		return `${LOG_PREFIX} child(${childId}) ${message}`;
	}
};