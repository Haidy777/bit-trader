"use strict";

module.exports = {
    sendMessage(type, message, data){
        process.send({
            type: type,
            message: message,
            data: data
        });
    }
};