"use strict";

const micro = require('micro');
const mri = require('mri');
const io = require('socket.io');
const _ = require('lodash');
const hostname = require('os').hostname();
const CONFIG = require('../../config/config.json');
const SocketHelper = require('./socket');

const args = mri(process.argv.slice(2));

const {getPort, postRequest, getServiceUrl} = require('../helper');

const SERVICE_NAME = 'watcher'; //TODO extract
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
    const pairsToCheck = await SocketHelper.getTickPairsToCheck(socketServer, mappedPairs);

    console.log(`got clients for pairs: ${pairsToCheck.join(', ')}`);

    pairsToCheck.forEach(async (pair) => {
        const tickData = await postRequest(`${exchangeUrl}/ticker`, {pairs: pair});//TODO get tick id from availablePairs since this is only the name which could differ
        socketServer.to(pair).emit('data', tickData);
    });

    setTimeout(loop, 60000);//TODO
};

const main = async () => {
    exchangeUrl = await getServiceUrl(SERVICE_MASTER_URL, `exchange${CONFIG.exchange}`); //TODO extract "exchange"

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

            console.log(`hostname: ${hostname}, port: ${port}`);

            socketServer.on('connection', SocketHelper.onConnection);

            setTimeout(loop, 1000);

            server.listen(port);
        } else {
            //TODO
        }
    } else {
        //TODO
    }
};

process.on('exit', async () => {
    await postRequest(`${SERVICE_MASTER_URL}/unregister`, {
        serviceName: SERVICE_NAME,
        id: serviceId
    })
});

main();
