"use strict";

const micro = require('micro');
const uuid = require('uuid/v4');

const {router, post} = require('microrouter');
const {send, json} = micro;

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
                    send(res, 200, {
                        endpoints: services
                    });
                } else {
                    send(res, 404);
                }
            }
        ),
        post('/register',
            async (req, res) => {
                const {serviceName, url} = await json(req);
                let services = availableServices[serviceName];

                if (!services) {
                    services = {};
                }

                services[uuid()] = url;

                availableServices[serviceName] = services;

                send(res, 200, {
                    services: availableServices
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

server.listen(3000); //TODO make configurable
