"use strict";

const micro = require('micro');
const mri = require('mri');
const io = require('socket.io');
const _ = require('lodash');
const hostname = require('os').hostname();
const logger = require('pino')({name: '<bit-trader:watcher>'});
const CONFIG = require('../../config/config.json');
const SocketHelper = require('./socket');

const args = mri(process.argv.slice(2));

const {getPort, postRequest, getServiceUrl} = require('../helper');

const SERVICE_NAME = 'watcher';
const SERVICE_MASTER_URL = `http://${args.master || 'localhost:3000'}`; //TODO docu serviceMaster can be configured through --master=XXXX:XXXX argument

let serviceId = null;
let exchangeUrl = '';
let availablePairs = [];
let mappedPairs = [];

const server = micro((req, res) => {
    micro.send(res, 405);
});
const socketServer = io(server, {
    path: '/',
    serveClient: false
});

const loop = async () => {
    logger.info('starting loop');
    const pairsToCheck = await SocketHelper.getTickPairsToCheck(socketServer, mappedPairs);

    logger.info(`got ${pairsToCheck.length} pairs to check`);
    logger.debug(`pairs: ${pairsToCheck.join(', ')}`);

    pairsToCheck.forEach(async (pair) => {
        logger.debug(`requesting pair ${pair}`);

        const pairName = _.find(availablePairs, {id: pair});

        const tickData = await postRequest(`${exchangeUrl}/ticker`, {pairs: pairName});

        socketServer.to(pair).emit('data', tickData);
    });

    logger.info('finishing loop');

    setTimeout(loop, 60000);//TODO make configurable
};

const main = async () => {
    exchangeUrl = await getServiceUrl(SERVICE_MASTER_URL, `exchange${CONFIG.exchange}`);

    if (exchangeUrl) {
        availablePairs = await postRequest(`${exchangeUrl}/pairs`);

        if (availablePairs && availablePairs.length) {
            mappedPairs = _.map(availablePairs, 'name');

            const port = await getPort();
            const response = await postRequest(`${SERVICE_MASTER_URL}/register`, {
                serviceName: SERVICE_NAME,
                url: `http://${hostname}:${port}`
            });

            serviceId = response.id;

            logger.info(`listening at ${hostname}:${port}`);

            socketServer.on('connection', SocketHelper.onConnection);

            setTimeout(loop, 1000);

            server.listen(port);
        } else {
            logger.error(`exchange does not have any pairs`);
        }
    } else {
        logger.error(`could not find an exchange-service for exchange ${CONFIG.exchange}`);
    }
};

process.on('exit', async () => {
    await postRequest(`${SERVICE_MASTER_URL}/unregister`, {
        serviceName: SERVICE_NAME,
        id: serviceId
    })
});

main();
