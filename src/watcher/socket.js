"use strict";

const _ = require('lodash');

const SocketFunctions = {
    onConnection(socket) {
        console.log('new connection');

        socket.on('disconnect', () => {
            console.log('lost connection');
        });

        socket.on('pair', (pairs) => {
            if (Array.isArray(pairs)) {
                pairs.forEach((pair) => {
                    socket.join(pair);
                });
            } else {
                socket.join(pairs);
            }
        });
    },

    getTickPairsToCheck: async (socket, rooms) => {
        const tickPairs = [];

        rooms.forEach((room) => {
            tickPairs.push(SocketFunctions._getClientsForRoom(socket, room));
        });

        return Promise.all(tickPairs).then((data) => {
            return _.chain(data)
                .filter('connections')
                .map('room')
                .value();
        });
    },

    _getClientsForRoom(socket, room) {
        return new Promise((resolve, reject) => {
            socket.in(room).clients((err, clients) => {
                if (err) {
                    reject(err);
                }

                resolve({room: room, connections: clients.length});
            });
        });
    }
};

module.exports = SocketFunctions;
