"use strict";

const micro = require('micro');
const request = require('request');
const hostname = require('os').hostname();

const postRequest = async (url, payload) => {
    return request({
        method: 'post',
        body: payload,
        json: true,
        url: url
    });
};

const getPort = async () => {
    return await require('get-port')();
};

const {router, post} = require('microrouter');

let currentNonce = Date.now() * 1000;

const server = micro(
    router(
        post('/',
            async (req, res) => {
                currentNonce = currentNonce + 1;

                micro.send(res, 200, {
                    nonce: currentNonce
                });
            }
        )
    )
);

const main = async () => {
    const port = await getPort();

    await postRequest('http://localhost:3000/register', { //TODO make servicemaster configurable
        serviceName: 'nonceGenerator',
        url: `http://${hostname}:${port}`
    });

    console.log(`hostname: ${hostname}, port: ${port}`);

    server.listen(port);
};

main();
