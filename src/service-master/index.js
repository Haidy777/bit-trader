"use strict";

const micro = require('micro');
const uuid = require('uuid/v4');
const mri = require('mri');
const _ = require('lodash');

const {router, post} = require('microrouter');
const {send, json} = micro;
const {assign} = Object;

const args = mri(process.argv.slice(2));
let availableServices = {};

//TODO round robin if multiple services are available per serviceName

const server = micro(
    router(
        post('/',
            async (req, res) => {
                send(res, 200, {
                    services: availableServices
                });
            }
        ),
        post('/get',
            async (req, res) => {
                const {serviceName} = await json(req);
                const services = availableServices[serviceName];

                if (services) {
                    send(res, 200, _.map(services));
                } else {
                    send(res, 404);
                }
            }
        ),
        post('/register',
            async (req, res) => {
                const {serviceName, url} = await json(req);
                const services = assign({}, availableServices[serviceName]);
                const id = uuid();

                services[id] = url;

                availableServices[serviceName] = services;

                send(res, 200, {
                    services: availableServices,
                    id
                });
            }
        ),
        post('/unregister',
            async (req, res) => {
                const {serviceName, id} = await json(req);
                const services = availableServices[serviceName];

                if (services) {
                    delete services[id];

                    send(res, 200, {
                        services: availableServices
                    });
                } else {
                    send(res, 404);
                }
            }
        )
    )
);

server.listen(args.port || 3000); //TODO docu port can be submitted through --port=XXXX parameter
