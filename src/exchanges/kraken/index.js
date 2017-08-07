"use strict";

const micro = require('micro');
const mri = require('mri');
const hostname = require('os').hostname();
const KrakenApi = require('./api');
const KrakenConfig = require('../../../config/kraken.json');

const {router, post} = require('microrouter');
const {getPort, postRequest, getServiceUrl, getNonce} = require('../../helper');
const {send, json} = micro;

const args = mri(process.argv.slice(2));

const SERVICE_NAME = 'exchangeKRAKEN';
const SERVICE_MASTER_URL = `http://${args.master || 'localhost:3000'}`; //TODO docu serviceMaster can be configured through --master=XXXX:XXXX argument

let serviceId = null;
let nonceGenUrl = '';
let krakenApi = null;

const server = micro(
    router(
        post('/pairs',
            async (req, res) => {
                const response = await getNonce(nonceGenUrl);

                send(res, 200, await krakenApi.getTradeablePairs(response.nonce));
            }
        )
    )
);

const main = async () => {
    nonceGenUrl = await getServiceUrl(SERVICE_MASTER_URL, 'nonceGenerator'); //TODO extract "nonceGenerator"

    if (nonceGenUrl) {
        const port = await getPort();
        const response = await postRequest(`${SERVICE_MASTER_URL}/register`, {
            serviceName: SERVICE_NAME,
            url: `http://${hostname}:${port}`
        });

        serviceId = response.id;

        krakenApi = new KrakenApi(KrakenConfig.key, KrakenConfig.secret);

        console.log(`hostname: ${hostname}, port: ${port}`);

        server.listen(port);
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
