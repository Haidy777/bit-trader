"use strict";

//TODO https://www.npmjs.com/package/telebot

const TeleBot = require('telebot');
const moment = require('moment');

const helper = require('../../helper');

const sendMessage = helper.ipc.sendMessage;
const round = helper.round;

let LOG_PREFIX = '<bit-trader:reporter/telegram/worker>';
const MAX_DECIMAL_ACCURACY = 5;

let bot = null;
let chatId = null;

function handleBotMessage(msg) {
    sendMessage('botReply', `${LOG_PREFIX} bot got message`, msg);
}

function prepareInfoMessage(data) {
    const pairData = data.data;
    return `${moment().format('HH:mm')}\n*${data.pair}* *C* ${round(pairData.current, MAX_DECIMAL_ACCURACY)} *V* ${pairData.volatility.today.toFixed(2)}% *L* ${round(pairData.low.today, MAX_DECIMAL_ACCURACY)} *H* ${round(pairData.high.today, MAX_DECIMAL_ACCURACY)}`;
}

process.on('message', (message) => {
    const data = message.data;

    switch (message.type) {
        case 'startup':
            bot = new TeleBot({
                token: data.botKey
            });

            bot.on('text', handleBotMessage);

            bot.start();

            chatId = data.chatId;

            sendMessage('ready', `${LOG_PREFIX} ready`);

            break;
        case 'data':
            bot.sendMessage(chatId, prepareInfoMessage(data), {parseMode: 'Markdown'});
            break;
    }
});
