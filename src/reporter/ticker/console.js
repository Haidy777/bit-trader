"use strict";

const io = require('socket.io-client')('http://localhost:54819');//TODO get from servicemaster

io.on('connect', () => {
    console.log('joining');
    io.emit('pair', 'BCHEUR');//TODO get from config
});

io.on('disconnect', () => {
    process.exit();
});

io.on('data', (data) => {
    console.log(data);
});
