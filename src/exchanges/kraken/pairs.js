"use strict";

const _ = require('lodash');

module.exports = function getTradeableAssetPairs(api, nonce, params) {
    params.nonce = nonce;

    return api('AssetPairs', params).then((data) => {
        const pairs = [];

        _.forIn(data, (v, k) => {
            if (k.indexOf('.d') === -1) {
                let pair = {
                    maxVolumeDecimals: v.lot_decimals,
                    maxPairDecimals: v.pair_decimals
                };

                if (k !== v.altname) {
                    pair.name = v.altname;
                    pair.id = k;
                } else {
                    pair.name = pair.id = k;
                }

                pairs.push(pair);
            }
        });

        return pairs;
    });
};
