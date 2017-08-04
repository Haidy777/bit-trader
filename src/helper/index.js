"use strict";

const request = require('request');

module.exports = {
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
    }
};
