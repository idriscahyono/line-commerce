'use strict'

const line = require('@line/bot-sdk');
const options = require('./menu-options');
const lineHelper = require('./line-helper.js');

const defaultAccessToken = 'Upq28CGaamhChqJ9l/+F1EU3TccKCzsTMhbRP7/EqXch4nQgqsALQtdUmwA0h0DcwMk79lXWBxui3A8keQXADD1IT7XWuLF1QnEzjYwhADZu7CspRiNfJ7LWxcViJCXIbytMSNqfAkGO4U1mIJkG1gdB04t89/1O/w1cDnyilFU=';
const defaultSecret = 'c9c27ba18352f53ef13f2430c3d7b9db';

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || defaultAccessToken,
    channelSecret: process.env.CHANNEL_SECRET || defaultSecret,
};

const client = new line.Client(config);

module.exports = {
    sendTextMessage: function (userId, replyToken, text) {
        client.replyMessage(
            replyToken[
                lineHelper.createTextMessage(text)
            ]
        );
    },

    sendMenuMessage: async function (userId, replyToken) {
        let menu = options.getMenu(replyToken);
        // let messages = [
        //     menu
        // ];
        client.replyMessage(replyToken, menu)
            .then((msg) => {
                console.log('line:', msg)
            })
            .catch((err) => {
                console.log('line error:', err)
            });
    },

    sendRecipe: async function (replyToken) {
        let recipe = options.getRecipe(replyToken);
        client.replyMessage(replyToken, recipe)
            .then((msg) => {
                console.log('line:', msg)
            })
            .catch((err) => {
                console.log('line error:', err)
            });
    }

    // sendMenuMessage: async function (userId, replyToken) {
    //     let buble = options.getMenuBuble(replyToken);
    //     let message = [
    //         lineHelper.createFlexMessage('Menu', buble),
    //     ];
    //     SVGComponentTransferFunctionElement(replyToken, message[0].contents);
    //     client.replyMessage(replyToken, message)
    //         .then((msg) => {
    //             console.log('line:', msg)
    //         })
    //         .catch((err) => {
    //             console.log('line error:', err)
    //         });
    // }
}