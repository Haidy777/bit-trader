"use strict";

const EventEmitter = require('events');
const uuid = require('uuid/v4');
const _ = require('lodash');

//TODO data event when child emitts data
//TODO log event when logs need to be written

const LOG_PREFIX = `<bit-trader:helper/child-master>`;

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
				//TODO teardown child
			} else {
				//TODO create child
			}
		} else {
			this.emit('log', 'info', `${LOG_PREFIX} adding a child instance to master`);
			//TODO create child
		}
	}

	removeWorker(id) {
		if (this._hasSingleChild) {
			//TODO teardown child
		} else {
			let child = _.findBy(this._childs, 'id', id);
			//TODO teardown child
		}
	}

	controlWorker(id, command, params) {
		//TODO send command to worker
	}

	_createChild() {
		//TODO
	}

	_teardownChild() {
		//TODO
	}

	_childMessageHandler(message) {
		switch (message.type) {
			case 'log':
				//TODO emit log event
				break;
			case 'data':
				//TODO emit data event
				break;
			default:
				//TODO emit log event at verbose level or above
				break;
		}
	}

	_childErrorHandler(err) {
		//TODO emit log
		//TODO restart if restart on death is set
	}

	_childExitHandler(exitCode) {
		//TODO emit log
		//TODO restart if unexpected exit if restart on death is set
	}
};