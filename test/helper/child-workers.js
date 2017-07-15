"use strict";

import test from 'ava';

const join = require('path').join;

const ChildMaster = require('../../helper/child-workers/child-master');

let master = null;

test.beforeEach(() => {
	master = new ChildMaster(true);

	master.createWorker({slaveClass: join(__dirname, '..', '..', 'helper', 'child-workers', 'child-slave')});
});

test.afterEach(() => {
	master.removeAllWorkers();
	master = null;
});

test('master should be an instance of ChildMaster', (t) => {
	t.plan(1);

	t.true(master instanceof ChildMaster);
});

test('child should emit log events', (t) => {
	t.plan(1);

	return new Promise((resolve, reject) => {
		master.on('log', () => {
			console.log(...arguments);
			resolve();
		});
	});
});