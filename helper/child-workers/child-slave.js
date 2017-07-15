"use strict";

const EventEmitter = require('events');

module.exports = class ChildSlave extends EventEmitter {
	constructor(options = {}, params = {}) {
		super();
		//TODO
		this.emit('ready');
	}

	handleData(data) {
		//TODO
	}

	control(data) {
		const action = data.action;

		switch (action) {
			case 'start':
				//TODO
				break;
			case 'stop':
				//TODO
				break;
			case 'teardown':
				//TODO
				this.emit('teardown');
				break;
		}
	}
};