"use strict";

const request = require('request');

const HelperFunctions = {
    getPort: async () => {
        return await require('get-port')();
    },

    postRequest: async (url, payload) => {
        return new Promise((resolve, reject) => {
            request({
                method: 'post',
                body: payload,
                json: true,
                url: url
            }, (error, response, body) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            });
        });
    },

    getServiceUrl: async (url, serviceName) => {
        const urls = await HelperFunctions.postRequest(`${url}/get`, {serviceName});
        return urls[0];
    },

    getNonce: async (url) => {
        const response = await HelperFunctions.postRequest(url);
        return response.nonce;
    }
};

module.exports = HelperFunctions;
