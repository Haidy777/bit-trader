"use strict";

const micro = require('micro');
const request = require('request');
const mri = require('mri');
const hostname = require('os').hostname();

const args = mri(process.argv.slice(2));

const postRequest = async (url, payload) => {
    return request({
        method: 'post',
        body: payload,
        json: true,
        url: url
    });
}; //TODO extract

const getPort = async () => {
    return await require('get-port')();
}; //TODO extract

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

    await postRequest(`http://${args.master || 'localhost:3000'}/register`, { //TODO docu serviceMaster can be configured through --master=XXXX:XXXX argument
        serviceName: 'nonceGenerator',
        url: `http://${hostname}:${port}`
    });

    console.log(`hostname: ${hostname}, port: ${port}`);

    server.listen(port);
};

main();
