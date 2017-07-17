"use strict";

module.exports = {
    sendMessage(type, message, data){
        process.send({
            type: type,
            message: message,
            data: data
        });
    },

    sendLogMessage(level = 'verbose', message = '', data = {}) {
        process.send({
            type: 'log',
            level: level,
            message: message,
            data: data
        });
    },

    sendControlMessage(child, action = '', params = null){
        child.send({
            type: 'control',
            data: {
                action: action,
                params: params
            }
        });
    }
};
